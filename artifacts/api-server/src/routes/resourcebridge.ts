import { clerkClient, getAuth } from "@clerk/express";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { Router, type IRouter, type RequestHandler, type Response } from "express";
import {
  and,
  desc,
  eq,
  gt,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  db,
  resourceBridgeAuditEvents,
  resourceBridgeBookings,
  resourceBridgeOrganizationMemberships,
  resourceBridgeOrganizations,
  resourceBridgePhotoUploads,
  resourceBridgeProfiles,
  resourceBridgeRatings,
  resourceBridgeResources,
} from "@workspace/db";
import {
  CheckInResourceBridgeBookingBody,
  CheckInResourceBridgeBookingParams,
  CheckInResourceBridgeBookingResponse,
  ConfirmResourceBridgeReturnParams,
  ConfirmResourceBridgeReturnResponse,
  CreateResourceBridgeBookingBody,
  CreateResourceBridgeBookingResponse,
  CreateResourceBridgeResourceBody,
  CreateResourceBridgeResourceResponse,
  UpdateResourceBridgeResourceBody,
  CreateResourceBridgeOrganizationBody,
  CreateResourceBridgeOrganizationResponse,
  GetResourceBridgeOrganizationReviewerAccessResponse,
  GetResourceBridgeResourcePhotoParams,
  ListPendingResourceBridgeOrganizationsResponse,
  RequestResourceBridgePhotoUploadUrlBody,
  RequestResourceBridgePhotoUploadUrlResponse,
  DecideResourceBridgeBookingBody,
  DecideResourceBridgeBookingParams,
  DecideResourceBridgeBookingResponse,
  GetResourceBridgeProfileResponse,
  GetResourceBridgeDashboardResponse,
  GetResourceBridgeMyRatingsResponse,
  GetResourceBridgeResourceParams,
  GetResourceBridgeResourceResponse,
  ListMyResourceBridgeResourcesResponse,
  ListMyResourceBridgeOrganizationsResponse,
  ListResourceBridgeOrganizationsResponse,
  ListResourceBridgeOrganizationMembersParams,
  ListResourceBridgeOrganizationMembersResponse,
  ListResourceBridgeBookingsResponse,
  ListResourceBridgeResourcesQueryParams,
  ListResourceBridgeResourcesResponse,
  SetResourceBridgeProfileBody,
  SetResourceBridgeProfileResponse,
  SaveResourceBridgeProfileDetailsBody,
  SaveResourceBridgeProfileDetailsResponse,
  RateResourceBridgeBookingBody,
  RateResourceBridgeBookingParams,
  RateResourceBridgeBookingResponse,
  RequestResourceBridgeOrganizationMembershipParams,
  RequestResourceBridgeOrganizationMembershipResponse,
  ReviewResourceBridgeOrganizationMembershipParams,
  ReviewResourceBridgeOrganizationMembershipBody,
  ReviewResourceBridgeOrganizationMembershipResponse,
  ReviewResourceBridgeOrganizationBody,
  ReviewResourceBridgeOrganizationParams,
  ReviewResourceBridgeOrganizationResponse,
  SubmitResourceBridgeReturnBody,
  SubmitResourceBridgeReturnParams,
  SubmitResourceBridgeReturnResponse,
} from "@workspace/api-zod";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const publicRouter: IRouter = Router();
const privateRouter: IRouter = Router();
const resourceBridgeObjectStorage = new ObjectStorageService();
const resourceBridgeImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxResourceBridgePhotoBytes = 8 * 1024 * 1024;

class ResourcePhotoUploadConflict extends Error {}

function dateString(value: Date): string {
  return value.toISOString();
}

function presentResource(row: typeof resourceBridgeResources.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    organizationName: row.organizationName,
    organizationType: row.organizationType,
    organizationId: row.organizationId,
    photos: row.photoPaths.map((path, index) => ({
      url: `/api/resourcebridge/resources/${row.id}/photos/${index}?v=${createHash("sha256").update(path).digest("hex").slice(0,16)}`,
      altText: `${row.name} photo ${index + 1}`,
    })),
    location: row.location,
    capacity: row.capacity,
    visibility: row.visibility,
    status: row.status,
    requiresTraining: row.requiresTraining,
    supervised: row.supervised,
    priceLabel: row.priceLabel,
    ownerId: row.ownerId,
    timezone: row.timezone,
    createdAt: dateString(row.createdAt),
  };
}

function presentBooking(
  row: typeof resourceBridgeBookings.$inferSelect,
  resourceName: string,
) {
  return {
    ...row,
    resourceName,
    startAt: dateString(row.startAt),
    endAt: dateString(row.endAt),
    createdAt: dateString(row.createdAt),
  };
}

function userIdFrom(res: Response): string {
  return res.locals.resourceBridgeUserId as string;
}

const requireResourceBridgeAuth: RequestHandler = (req, res, next): void => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Please sign in to use your ResourceBridge workspace." });
    return;
  }
  res.locals.resourceBridgeUserId = userId;
  next();
};

async function resourceBridgeProfileFor(userId: string) {
  const [profile] = await db.select().from(resourceBridgeProfiles)
    .where(eq(resourceBridgeProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

function presentResourceBridgeProfile(profile: NonNullable<Awaited<ReturnType<typeof resourceBridgeProfileFor>>>) {
  return {
    userId: profile.userId,
    accountType: profile.accountType,
    customerCareStatus: profile.customerCareStatus,
    displayName: profile.displayName,
    birthDate: profile.birthDate,
    cityRegion: profile.cityRegion,
    gender: profile.gender,
    detailsCompletedAt: profile.detailsCompletedAt ? dateString(profile.detailsCompletedAt) : null,
    createdAt: dateString(profile.createdAt),
    updatedAt: dateString(profile.updatedAt),
  };
}

function presentResourceBridgeRating(rating: typeof resourceBridgeRatings.$inferSelect) {
  return {
    id: rating.id,
    bookingId: rating.bookingId,
    stars: rating.stars,
    comment: rating.comment,
    createdAt: dateString(rating.createdAt),
  };
}

function presentOrganization(row: typeof resourceBridgeOrganizations.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    location: row.location,
    verificationStatus: row.verificationStatus,
    createdAt: dateString(row.createdAt),
  };
}

function presentOrganizationMembership(
  row: typeof resourceBridgeOrganizationMemberships.$inferSelect,
  organizationName: string,
  organizationVerificationStatus: string,
  displayName: string | null,
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    organizationName,
    organizationVerificationStatus,
    userId: row.userId,
    displayName,
    role: row.role,
    status: row.status,
    requestedAt: dateString(row.requestedAt),
  };
}

async function organizationMembershipFor(organizationId: number, userId: string) {
  const [membership] = await db.select().from(resourceBridgeOrganizationMemberships)
    .where(and(
      eq(resourceBridgeOrganizationMemberships.organizationId, organizationId),
      eq(resourceBridgeOrganizationMemberships.userId, userId),
      eq(resourceBridgeOrganizationMemberships.status, "active"),
    ))
    .limit(1);
  return membership ?? null;
}

async function canManageOrganization(organizationId: number, userId: string) {
  const membership = await organizationMembershipFor(organizationId, userId);
  return membership && ["org_owner", "org_admin"].includes(membership.role) ? membership : null;
}

function configuredOrganizationReviewerEmails(): string[] {
  return (process.env.RESOURCEBRIDGE_ORGANIZATION_REVIEWER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function organizationReviewerAccess(userId: string) {
  const configuredEmails = configuredOrganizationReviewerEmails();
  if (!configuredEmails.length) {
    return { reviewerConfigured: false, canReview: false, unavailable: false };
  }
  try {
    const user = await clerkClient.users.getUser(userId);
    const canReview = user.emailAddresses.some((address) =>
      address.verification?.status === "verified"
        && configuredEmails.includes(address.emailAddress.trim().toLowerCase()),
    );
    return { reviewerConfigured: true, canReview, unavailable: false };
  } catch {
    return { reviewerConfigured: true, canReview: false, unavailable: true };
  }
}

privateRouter.get("/resourcebridge/profile", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const profile = await resourceBridgeProfileFor(userIdFrom(res));
  res.json(GetResourceBridgeProfileResponse.parse({
    profile: profile ? presentResourceBridgeProfile(profile) : null,
  }));
});

privateRouter.put("/resourcebridge/profile", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const parsed = SetResourceBridgeProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = userIdFrom(res);
  const accountType = parsed.data.accountType;
  const existing = await resourceBridgeProfileFor(userId);
  if (existing) {
    if (existing.accountType !== accountType) {
      res.status(409).json({ error: "Your ResourceBridge account type has already been selected." });
      return;
    }
    res.json(SetResourceBridgeProfileResponse.parse({
      profile: presentResourceBridgeProfile(existing),
    }));
    return;
  }

  await db.insert(resourceBridgeProfiles).values({
    userId,
    accountType,
    customerCareStatus: accountType === "customer_care" ? "pending" : "not_requested",
  }).onConflictDoNothing({ target: resourceBridgeProfiles.userId });

  const saved = await resourceBridgeProfileFor(userId);
  if (!saved) {
    res.status(500).json({ error: "Your account type could not be saved." });
    return;
  }
  if (saved.accountType !== accountType) {
    res.status(409).json({ error: "Your ResourceBridge account type has already been selected." });
    return;
  }
  res.json(SetResourceBridgeProfileResponse.parse({
    profile: presentResourceBridgeProfile(saved),
  }));
});

privateRouter.put("/resourcebridge/profile/details", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const parsed = SaveResourceBridgeProfileDetailsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFrom(res);
  const existing = await resourceBridgeProfileFor(userId);
  if (!existing) {
    res.status(409).json({ error: "Choose an account type before saving profile details." });
    return;
  }
  const displayName = parsed.data.displayName.trim();
  const cityRegion = parsed.data.cityRegion?.trim() || null;
  if (displayName.length < 2) {
    res.status(400).json({ error: "Enter a name with at least two characters." });
    return;
  }
  const birthDate = parsed.data.birthDate?.toISOString().slice(0, 10) ?? null;
  if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) {
    res.status(400).json({ error: "Date of birth cannot be in the future." });
    return;
  }
  const [saved] = await db.update(resourceBridgeProfiles).set({
    displayName,
    birthDate,
    cityRegion,
    gender: parsed.data.gender,
    detailsCompletedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(resourceBridgeProfiles.userId, userId)).returning();
  res.json(SaveResourceBridgeProfileDetailsResponse.parse({
    profile: presentResourceBridgeProfile(saved),
  }));
});

publicRouter.get("/resourcebridge/organizations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(resourceBridgeOrganizations)
    .where(eq(resourceBridgeOrganizations.verificationStatus, "verified"))
    .orderBy(resourceBridgeOrganizations.name);
  res.json(ListResourceBridgeOrganizationsResponse.parse(rows.map(presentOrganization)));
});

privateRouter.post("/resourcebridge/organizations", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const parsed = CreateResourceBridgeOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFrom(res);
  const profile = await resourceBridgeProfileFor(userId);
  if (profile?.accountType !== "owner") {
    res.status(403).json({ error: "An owner account is required to create an organization profile." });
    return;
  }

  const organization = await db.transaction(async (tx) => {
    const [created] = await tx.insert(resourceBridgeOrganizations).values({
      ...parsed.data,
      createdBy: userId,
      verificationStatus: "pending",
    }).returning();
    await tx.insert(resourceBridgeOrganizationMemberships).values({
      organizationId: created.id,
      userId,
      role: "org_owner",
      status: "active",
      reviewedBy: userId,
      reviewedAt: new Date(),
    });
    return created;
  });
  res.status(201).json(CreateResourceBridgeOrganizationResponse.parse(presentOrganization(organization)));
});

privateRouter.get("/resourcebridge/organizations/reviewer-access", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const access = await organizationReviewerAccess(userIdFrom(res));
  if (access.unavailable) {
    res.status(503).json({ error: "Reviewer access could not be checked. Please retry." });
    return;
  }
  res.json(GetResourceBridgeOrganizationReviewerAccessResponse.parse({
    reviewerConfigured: access.reviewerConfigured,
    canReview: access.canReview,
  }));
});

privateRouter.get("/resourcebridge/organizations/pending-review", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const access = await organizationReviewerAccess(userIdFrom(res));
  if (!access.reviewerConfigured) {
    res.status(503).json({ error: "Organization profile reviewers are not configured." });
    return;
  }
  if (access.unavailable) {
    res.status(503).json({ error: "Reviewer access could not be checked. Please retry." });
    return;
  }
  if (!access.canReview) {
    res.status(403).json({ error: "Organization reviewer access is required." });
    return;
  }
  const rows = await db.select({
    organization: resourceBridgeOrganizations,
    submittedByDisplayName: resourceBridgeProfiles.displayName,
  })
    .from(resourceBridgeOrganizations)
    .leftJoin(
      resourceBridgeProfiles,
      eq(resourceBridgeOrganizations.createdBy, resourceBridgeProfiles.userId),
    )
    .where(eq(resourceBridgeOrganizations.verificationStatus, "pending"))
    .orderBy(resourceBridgeOrganizations.createdAt);
  res.json(ListPendingResourceBridgeOrganizationsResponse.parse(rows.map((row) => ({
    organization: presentOrganization(row.organization),
    submittedByDisplayName: row.submittedByDisplayName,
  }))));
});

privateRouter.patch(
  "/resourcebridge/organizations/:id/verification",
  requireResourceBridgeAuth,
  async (req, res): Promise<void> => {
    const params = ReviewResourceBridgeOrganizationParams.safeParse(req.params);
    const body = ReviewResourceBridgeOrganizationBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const actorId = userIdFrom(res);
    const access = await organizationReviewerAccess(actorId);
    if (!access.reviewerConfigured || access.unavailable) {
      res.status(503).json({ error: "Organization reviewer access is not currently available." });
      return;
    }
    if (!access.canReview) {
      res.status(403).json({ error: "Organization reviewer access is required." });
      return;
    }

    const [target] = await db.select().from(resourceBridgeOrganizations)
      .where(eq(resourceBridgeOrganizations.id, params.data.id))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "This organization profile could not be found." });
      return;
    }
    if (target.createdBy === actorId) {
      res.status(403).json({ error: "Reviewers cannot decide on their own organization profiles." });
      return;
    }
    if (target.verificationStatus !== "pending") {
      res.status(409).json({ error: "This organization profile has already been reviewed." });
      return;
    }

    const [saved] = await db.update(resourceBridgeOrganizations).set({
      verificationStatus: body.data.verificationStatus,
      verificationReviewedBy: actorId,
      verificationReviewedAt: new Date(),
    }).where(and(
      eq(resourceBridgeOrganizations.id, params.data.id),
      eq(resourceBridgeOrganizations.verificationStatus, "pending"),
    )).returning();
    if (!saved) {
      res.status(409).json({ error: "This organization profile has already been reviewed." });
      return;
    }
    res.json(ReviewResourceBridgeOrganizationResponse.parse({
      organization: presentOrganization(saved),
      reviewedByUserId: actorId,
      reviewedAt: dateString(saved.verificationReviewedAt!),
    }));
  },
);

privateRouter.get("/resourcebridge/organizations/mine", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const rows = await db.select({
    membership: resourceBridgeOrganizationMemberships,
    organizationName: resourceBridgeOrganizations.name,
    organizationVerificationStatus: resourceBridgeOrganizations.verificationStatus,
    displayName: resourceBridgeProfiles.displayName,
  })
    .from(resourceBridgeOrganizationMemberships)
    .innerJoin(
      resourceBridgeOrganizations,
      eq(resourceBridgeOrganizationMemberships.organizationId, resourceBridgeOrganizations.id),
    )
    .leftJoin(
      resourceBridgeProfiles,
      eq(resourceBridgeOrganizationMemberships.userId, resourceBridgeProfiles.userId),
    )
    .where(eq(resourceBridgeOrganizationMemberships.userId, userId))
    .orderBy(desc(resourceBridgeOrganizationMemberships.requestedAt));
  res.json(ListMyResourceBridgeOrganizationsResponse.parse(rows.map((row) =>
    presentOrganizationMembership(row.membership, row.organizationName, row.organizationVerificationStatus, row.displayName),
  )));
});

privateRouter.post(
  "/resourcebridge/organizations/:id/membership-requests",
  requireResourceBridgeAuth,
  async (req, res): Promise<void> => {
    const params = RequestResourceBridgeOrganizationMembershipParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [organization] = await db.select().from(resourceBridgeOrganizations)
      .where(and(
        eq(resourceBridgeOrganizations.id, params.data.id),
        eq(resourceBridgeOrganizations.verificationStatus, "verified"),
      ))
      .limit(1);
    if (!organization) {
      res.status(404).json({ error: "This verified organization could not be found." });
      return;
    }

    const userId = userIdFrom(res);
    let [membership] = await db.insert(resourceBridgeOrganizationMemberships).values({
      organizationId: organization.id,
      userId,
      role: "member",
      status: "pending",
    }).onConflictDoNothing().returning();
    if (!membership) {
      const [existing] = await db.select().from(resourceBridgeOrganizationMemberships)
        .where(and(
          eq(resourceBridgeOrganizationMemberships.organizationId, organization.id),
          eq(resourceBridgeOrganizationMemberships.userId, userId),
        ))
        .limit(1);
      if (!existing || existing.status !== "rejected") {
        res.status(409).json({ error: "A membership request or active membership already exists." });
        return;
      }
      [membership] = await db.update(resourceBridgeOrganizationMemberships).set({
        role: "member",
        status: "pending",
        requestedAt: new Date(),
        reviewedBy: null,
        reviewedAt: null,
      }).where(eq(resourceBridgeOrganizationMemberships.id, existing.id)).returning();
    }

    const [profile] = await db.select({ displayName: resourceBridgeProfiles.displayName })
      .from(resourceBridgeProfiles)
      .where(eq(resourceBridgeProfiles.userId, userId))
      .limit(1);
    res.status(201).json(RequestResourceBridgeOrganizationMembershipResponse.parse(
      presentOrganizationMembership(membership, organization.name, organization.verificationStatus, profile?.displayName ?? null),
    ));
  },
);

privateRouter.get(
  "/resourcebridge/organizations/:id/members",
  requireResourceBridgeAuth,
  async (req, res): Promise<void> => {
    const params = ListResourceBridgeOrganizationMembersParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const organizationId = params.data.id;
    if (!await canManageOrganization(organizationId, userIdFrom(res))) {
      res.status(403).json({ error: "Organization administrator access is required." });
      return;
    }

    const rows = await db.select({
      membership: resourceBridgeOrganizationMemberships,
      organizationName: resourceBridgeOrganizations.name,
      organizationVerificationStatus: resourceBridgeOrganizations.verificationStatus,
      displayName: resourceBridgeProfiles.displayName,
    })
      .from(resourceBridgeOrganizationMemberships)
      .innerJoin(
        resourceBridgeOrganizations,
        eq(resourceBridgeOrganizationMemberships.organizationId, resourceBridgeOrganizations.id),
      )
      .leftJoin(
        resourceBridgeProfiles,
        eq(resourceBridgeOrganizationMemberships.userId, resourceBridgeProfiles.userId),
      )
      .where(eq(resourceBridgeOrganizationMemberships.organizationId, organizationId))
      .orderBy(desc(resourceBridgeOrganizationMemberships.requestedAt));
    res.json(ListResourceBridgeOrganizationMembersResponse.parse(rows.map((row) =>
      presentOrganizationMembership(row.membership, row.organizationName, row.organizationVerificationStatus, row.displayName),
    )));
  },
);

privateRouter.patch(
  "/resourcebridge/organizations/:id/members/:membershipId",
  requireResourceBridgeAuth,
  async (req, res): Promise<void> => {
    const params = ReviewResourceBridgeOrganizationMembershipParams.safeParse(req.params);
    const body = ReviewResourceBridgeOrganizationMembershipBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const actorId = userIdFrom(res);
    const administrator = await canManageOrganization(params.data.id, actorId);
    if (!administrator) {
      res.status(403).json({ error: "Organization administrator access is required." });
      return;
    }
    if (body.data.role === "org_admin" && administrator.role !== "org_owner") {
      res.status(403).json({ error: "Only an organization owner can grant administrator access." });
      return;
    }
    const [target] = await db.select().from(resourceBridgeOrganizationMemberships)
      .where(and(
        eq(resourceBridgeOrganizationMemberships.id, params.data.membershipId),
        eq(resourceBridgeOrganizationMemberships.organizationId, params.data.id),
      ))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "This organization membership could not be found." });
      return;
    }
    if (target.role === "org_owner" || target.userId === actorId) {
      res.status(403).json({ error: "Organization owners cannot be changed through membership review." });
      return;
    }

    const [saved] = await db.update(resourceBridgeOrganizationMemberships).set({
      role: body.data.status === "active" ? body.data.role : target.role,
      status: body.data.status,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    }).where(eq(resourceBridgeOrganizationMemberships.id, target.id)).returning();
    const [organization] = await db.select({
      name: resourceBridgeOrganizations.name,
      verificationStatus: resourceBridgeOrganizations.verificationStatus,
    })
      .from(resourceBridgeOrganizations)
      .where(eq(resourceBridgeOrganizations.id, params.data.id))
      .limit(1);
    const [profile] = await db.select({ displayName: resourceBridgeProfiles.displayName })
      .from(resourceBridgeProfiles)
      .where(eq(resourceBridgeProfiles.userId, saved.userId))
      .limit(1);
    res.json(ReviewResourceBridgeOrganizationMembershipResponse.parse(
      presentOrganizationMembership(saved, organization.name, organization.verificationStatus, profile?.displayName ?? null),
    ));
  },
);

privateRouter.post(
  "/resourcebridge/resource-photos/upload-url",
  requireResourceBridgeAuth,
  async (req, res): Promise<void> => {
    const parsed = RequestResourceBridgePhotoUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const ownerId = userIdFrom(res);
    const profile = await resourceBridgeProfileFor(ownerId);
    if (profile?.accountType !== "owner") {
      res.status(403).json({ error: "An owner account is required to upload resource photos." });
      return;
    }
    if (!resourceBridgeImageTypes.has(parsed.data.contentType) || parsed.data.size > maxResourceBridgePhotoBytes) {
      res.status(400).json({ error: "Upload a PNG, JPEG, or WebP image smaller than 8 MB." });
      return;
    }

    try {
      const uploadURL = await resourceBridgeObjectStorage.getObjectEntityUploadURL();
      const objectPath = resourceBridgeObjectStorage.normalizeObjectEntityPath(uploadURL);
      if (!objectPath.startsWith("/objects/uploads/")) {
        throw new Error("The storage service returned an unsupported photo path.");
      }
      await db.insert(resourceBridgePhotoUploads).values({
        ownerId,
        objectPath,
        contentType: parsed.data.contentType,
        byteSize: parsed.data.size,
      });
      res.json(RequestResourceBridgePhotoUploadUrlResponse.parse({ uploadURL, objectPath }));
    } catch (error) {
      req.log.error({ err: error }, "ResourceBridge photo upload URL could not be created");
      res.status(503).json({ error: "Photo storage is temporarily unavailable." });
    }
  },
);

privateRouter.get("/resourcebridge/ratings/me", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const [aggregate, received, given] = await Promise.all([
    db.select({
      count: sql<number>`count(*)::int`,
      average: sql<number | null>`avg(${resourceBridgeRatings.stars})::float`,
    }).from(resourceBridgeRatings).where(eq(resourceBridgeRatings.targetId, userId)),
    db.select().from(resourceBridgeRatings)
      .where(eq(resourceBridgeRatings.targetId, userId))
      .orderBy(desc(resourceBridgeRatings.createdAt))
      .limit(8),
    db.select({ bookingId: resourceBridgeRatings.bookingId }).from(resourceBridgeRatings)
      .where(eq(resourceBridgeRatings.raterId, userId))
      .orderBy(desc(resourceBridgeRatings.createdAt))
      .limit(500),
  ]);
  res.json(GetResourceBridgeMyRatingsResponse.parse({
    average: aggregate[0]?.average ?? null,
    count: aggregate[0]?.count ?? 0,
    ratedBookingIds: given.map((row) => row.bookingId),
    recent: received.map(presentResourceBridgeRating),
  }));
});

async function writeAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    actorId: string;
    ownerId: string;
    entityType: "resource" | "booking";
    entityId: number;
    entityName: string;
    action: string;
    reason?: string | null;
  },
): Promise<void> {
  await tx.insert(resourceBridgeAuditEvents).values({
    actorId: input.actorId,
    targetOwnerId: input.ownerId,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    action: input.action,
    reason: input.reason ?? null,
  });
}

publicRouter.get("/resourcebridge/resources", async (req, res): Promise<void> => {
  const parsed = ListResourceBridgeResourcesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category, organizationType } = parsed.data;
  const conditions = [
    eq(resourceBridgeResources.status, "active"),
    eq(resourceBridgeResources.visibility, "public"),
  ];
  if (category) conditions.push(eq(resourceBridgeResources.category, category));
  if (organizationType) conditions.push(eq(resourceBridgeResources.organizationType, organizationType));
  if (search?.trim()) {
    const term = `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    conditions.push(sql`(${resourceBridgeResources.name} ILIKE ${term} OR ${resourceBridgeResources.description} ILIKE ${term} OR ${resourceBridgeResources.organizationName} ILIKE ${term} OR ${resourceBridgeResources.category} ILIKE ${term})`);
  }
  const rows = await db
    .select()
    .from(resourceBridgeResources)
    .where(and(...conditions))
    .orderBy(desc(resourceBridgeResources.createdAt))
    .limit(100);
  res.json(ListResourceBridgeResourcesResponse.parse(rows.map(presentResource)));
});

publicRouter.get("/resourcebridge/resources/:id", async (req, res): Promise<void> => {
  const params = GetResourceBridgeResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(resourceBridgeResources)
    .where(and(
      eq(resourceBridgeResources.id, params.data.id),
      eq(resourceBridgeResources.status, "active"),
      eq(resourceBridgeResources.visibility, "public"),
    ))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "This public resource could not be found." });
    return;
  }
  res.json(GetResourceBridgeResourceResponse.parse(presentResource(row)));
});

publicRouter.get(
  "/resourcebridge/resources/:id/photos/:index",
  async (req, res): Promise<void> => {
    const params = GetResourceBridgeResourcePhotoParams.safeParse(req.params);
    if (!params.success) {
      res.status(404).json({ error: "Image not found." });
      return;
    }
    const [resource] = await db.select().from(resourceBridgeResources)
      .where(and(
        eq(resourceBridgeResources.id, params.data.id),
        eq(resourceBridgeResources.status, "active"),
        eq(resourceBridgeResources.visibility, "public"),
      ))
      .limit(1);
    const objectPath = resource?.photoPaths[params.data.index];
    if (!objectPath || !objectPath.startsWith("/objects/uploads/")) {
      res.status(404).json({ error: "Image not found." });
      return;
    }

    try {
      const file = await resourceBridgeObjectStorage.getObjectEntityFile(objectPath);
      const [metadata] = await file.getMetadata();
      if (!resourceBridgeImageTypes.has(String(metadata.contentType))) {
        res.status(404).json({ error: "Image not found." });
        return;
      }
      const response = await resourceBridgeObjectStorage.downloadObject(file, 300);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (response.body) {
        Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Image not found." });
        return;
      }
      throw error;
    }
  },
);

const saveResourceBridgeResource: RequestHandler = async (req, res): Promise<void> => {
  const editing = req.method === "PUT";
  const parsed = (editing ? UpdateResourceBridgeResourceBody : CreateResourceBridgeResourceBody).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.visibility !== "public") {
    res.status(400).json({ error: "Organization and partner sharing requires a verified organization membership." });
    return;
  }
  const ownerId = userIdFrom(res);
  const resourceId = Number(req.params.id);
  if (editing && (!Number.isSafeInteger(resourceId) || resourceId < 1)) {
    res.status(400).json({ error: "Invalid resource ID." });
    return;
  }
  const [existing] = editing ? await db.select().from(resourceBridgeResources).where(eq(resourceBridgeResources.id, resourceId)).limit(1) : [];
  if (editing && !existing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }
  if (existing && existing.ownerId !== ownerId) {
    res.status(403).json({ error: "Only the listing owner can edit this resource." });
    return;
  }
  const retained = editing ? UpdateResourceBridgeResourceBody.parse(req.body).retainedPhotoIndexes : [];
  if (retained.some(index => !existing?.photoPaths[index]) || retained.length + (parsed.data.photoUploadPaths?.length ?? 0) > 5) {
    res.status(400).json({ error: "Choose up to five valid photos." });
    return;
  }
  const profile = await resourceBridgeProfileFor(ownerId);
  if (!profile) {
    res.status(409).json({ error: "Choose an account type before sharing a resource." });
    return;
  }
  if (!editing && profile.accountType !== "owner" && !parsed.data.organizationId) {
    res.status(403).json({ error: "An owner account or an active organization manager membership is required to publish a listing." });
    return;
  }
  const photoUploadPaths = parsed.data.photoUploadPaths ?? [];
  const { photoUploadPaths: _photoUploadPaths, ...resourceFields } = CreateResourceBridgeResourceBody.parse(parsed.data);
  let resourceInput = resourceFields;
  let verifiedPhotoPaths: string[] = [];
  if (photoUploadPaths.length) {
    if (photoUploadPaths.some((path) => !path.startsWith("/objects/uploads/"))) {
      res.status(400).json({ error: "One or more photo uploads are invalid." });
      return;
    }
    const uploadCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uploads = await db.select().from(resourceBridgePhotoUploads)
      .where(and(
        eq(resourceBridgePhotoUploads.ownerId, ownerId),
        inArray(resourceBridgePhotoUploads.objectPath, photoUploadPaths),
        gt(resourceBridgePhotoUploads.createdAt, uploadCutoff),
      ));
    if (uploads.length !== photoUploadPaths.length) {
      res.status(400).json({ error: "One or more photos are missing or no longer available. Upload them again." });
      return;
    }
    for (const upload of uploads) {
      if (!resourceBridgeImageTypes.has(upload.contentType) || upload.byteSize > maxResourceBridgePhotoBytes) {
        res.status(400).json({ error: "One or more photos are not a supported image." });
        return;
      }
      try {
        const file = await resourceBridgeObjectStorage.getObjectEntityFile(upload.objectPath);
        const [metadata] = await file.getMetadata();
        if (
          String(metadata.contentType) !== upload.contentType ||
          Number(metadata.size) !== upload.byteSize ||
          Number(metadata.size) > maxResourceBridgePhotoBytes
        ) {
          res.status(400).json({ error: "A photo did not match its upload details. Please upload it again." });
          return;
        }
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          res.status(400).json({ error: "One or more photos are missing. Upload them again." });
          return;
        }
        throw error;
      }
    }
    verifiedPhotoPaths = photoUploadPaths;
  }
  if (parsed.data.organizationId) {
    const [organization] = await db.select().from(resourceBridgeOrganizations)
      .where(eq(resourceBridgeOrganizations.id, parsed.data.organizationId))
      .limit(1);
    if (!organization || organization.verificationStatus !== "verified") {
      res.status(409).json({ error: "Only verified organizations can be attached to a public listing." });
      return;
    }
    const membership = await organizationMembershipFor(organization.id, ownerId);
    if (!membership || !["org_owner", "org_admin", "resource_manager"].includes(membership.role)) {
      res.status(403).json({ error: "An active organization manager membership is required for this listing." });
      return;
    }
    resourceInput = {
      ...resourceFields,
      organizationName: organization.name,
      organizationType: organization.type as typeof parsed.data.organizationType,
    };
  }
  let row: typeof resourceBridgeResources.$inferSelect;
  try {
    row = await db.transaction(async (tx) => {
      if (existing) {
        const [locked] = await tx.select().from(resourceBridgeResources).where(eq(resourceBridgeResources.id, existing.id)).for("update");
        if (!locked || locked.ownerId !== ownerId || JSON.stringify(locked.photoPaths) !== JSON.stringify(existing.photoPaths)) {
          throw new ResourcePhotoUploadConflict();
        }
      }
      if (photoUploadPaths.length) {
        const consumedUploads = await tx.delete(resourceBridgePhotoUploads)
          .where(and(
            eq(resourceBridgePhotoUploads.ownerId, ownerId),
            inArray(resourceBridgePhotoUploads.objectPath, photoUploadPaths),
          ))
          .returning({ objectPath: resourceBridgePhotoUploads.objectPath });
        if (consumedUploads.length !== photoUploadPaths.length) throw new ResourcePhotoUploadConflict();
      }
      const photoPaths = [...retained.map(index => existing!.photoPaths[index]), ...verifiedPhotoPaths];
      const [created] = existing ? await tx.update(resourceBridgeResources).set({
        ...resourceInput,
        photoPaths,
      }).where(and(eq(resourceBridgeResources.id, existing.id), eq(resourceBridgeResources.ownerId, ownerId))).returning() : await tx.insert(resourceBridgeResources).values({
        ...resourceInput,
        ownerId,
        photoPaths,
        status: "active",
      }).returning();
      await writeAudit(tx, {
        actorId: ownerId,
        ownerId,
        entityType: "resource",
        entityId: created.id,
        entityName: created.name,
        action: editing ? "updated" : "created",
      });
      return created;
    });
  } catch (error) {
    if (error instanceof ResourcePhotoUploadConflict) {
      res.status(409).json({ error: "One or more photos were already used. Please upload them again." });
      return;
    }
    throw error;
  }
  res.status(editing ? 200 : 201).json(CreateResourceBridgeResourceResponse.parse(presentResource(row)));
};
privateRouter.post("/resourcebridge/resources", requireResourceBridgeAuth, saveResourceBridgeResource);
privateRouter.put("/resourcebridge/resources/:id", requireResourceBridgeAuth, saveResourceBridgeResource);

privateRouter.get("/resourcebridge/my-resources", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const ownerId = userIdFrom(res);
  const rows = await db.select().from(resourceBridgeResources)
    .where(eq(resourceBridgeResources.ownerId, ownerId))
    .orderBy(desc(resourceBridgeResources.createdAt));
  res.json(ListMyResourceBridgeResourcesResponse.parse(rows.map(presentResource)));
});

privateRouter.get("/resourcebridge/bookings", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const rows = await db
    .select({ booking: resourceBridgeBookings, resourceName: resourceBridgeResources.name })
    .from(resourceBridgeBookings)
    .innerJoin(resourceBridgeResources, eq(resourceBridgeResources.id, resourceBridgeBookings.resourceId))
    .where(or(
      eq(resourceBridgeBookings.borrowerId, userId),
      eq(resourceBridgeBookings.ownerId, userId),
    ))
    .orderBy(desc(resourceBridgeBookings.createdAt))
    .limit(200);
  res.json(ListResourceBridgeBookingsResponse.parse(rows.map(({ booking, resourceName }) => presentBooking(booking, resourceName))));
});

privateRouter.get("/resourcebridge/dashboard", requireResourceBridgeAuth, async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const now = new Date();
  const [ownedRows, incomingRows, upcomingRows, activityRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(resourceBridgeResources)
      .where(eq(resourceBridgeResources.ownerId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(resourceBridgeBookings)
      .where(and(eq(resourceBridgeBookings.ownerId, userId), eq(resourceBridgeBookings.status, "pending_approval"))),
    db.select({ booking: resourceBridgeBookings, resourceName: resourceBridgeResources.name })
      .from(resourceBridgeBookings)
      .innerJoin(resourceBridgeResources, eq(resourceBridgeResources.id, resourceBridgeBookings.resourceId))
      .where(and(
        or(eq(resourceBridgeBookings.borrowerId, userId), eq(resourceBridgeBookings.ownerId, userId)),
        inArray(resourceBridgeBookings.status, ["approved", "checked_in", "return_submitted"]),
        gt(resourceBridgeBookings.endAt, now),
      ))
      .orderBy(resourceBridgeBookings.startAt)
      .limit(5),
    db.select().from(resourceBridgeAuditEvents)
      .where(or(
        eq(resourceBridgeAuditEvents.actorId, userId),
        eq(resourceBridgeAuditEvents.targetOwnerId, userId),
      ))
      .orderBy(desc(resourceBridgeAuditEvents.createdAt))
      .limit(8),
  ]);
  const result = {
    ownedResources: ownedRows[0]?.count ?? 0,
    incomingRequests: incomingRows[0]?.count ?? 0,
    upcomingBookings: upcomingRows.map(({ booking, resourceName }) => presentBooking(booking, resourceName)),
    recentActivity: activityRows.map((event) => ({
      id: event.id,
      action: event.action,
      entityName: event.entityName,
      actorLabel: event.actorId === userId ? "You" : "Resource participant",
      createdAt: dateString(event.createdAt),
    })),
  };
  res.json(GetResourceBridgeDashboardResponse.parse(result));
});

privateRouter.post("/resourcebridge/bookings", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const parsed = CreateResourceBridgeBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const borrowerId = userIdFrom(res);
  if (!await resourceBridgeProfileFor(borrowerId)) {
    res.status(409).json({ error: "Choose an account type before requesting access." });
    return;
  }
  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt || startAt <= new Date()) {
    res.status(400).json({ error: "Choose a future start time and an end time after it." });
    return;
  }
  const booking = await db.transaction(async (tx) => {
    const [resource] = await tx.select().from(resourceBridgeResources)
      .where(eq(resourceBridgeResources.id, parsed.data.resourceId))
      .for("update")
      .limit(1);
    if (!resource || resource.status !== "active" || resource.visibility !== "public") return { error: "not_found" as const };
    if (resource.ownerId === "resourcebridge-demo:category-samples") return { error: "sample" as const };
    if (resource.ownerId === borrowerId) return { error: "self_booking" as const };
    if (resource.requiresTraining || resource.supervised) return { error: "requirements" as const };
    const [conflict] = await tx.select({ id: resourceBridgeBookings.id })
      .from(resourceBridgeBookings)
      .where(and(
        eq(resourceBridgeBookings.resourceId, resource.id),
        inArray(resourceBridgeBookings.status, ["approved", "checked_in", "return_submitted"]),
        lt(resourceBridgeBookings.startAt, endAt),
        gt(resourceBridgeBookings.endAt, startAt),
      ))
      .limit(1);
    if (conflict) return { error: "conflict" as const };
    const [created] = await tx.insert(resourceBridgeBookings).values({
      resourceId: resource.id,
      borrowerId,
      ownerId: resource.ownerId,
      startAt,
      endAt,
      purpose: parsed.data.purpose,
      teamSize: parsed.data.teamSize,
      status: "pending_approval",
    }).returning();
    await writeAudit(tx, {
      actorId: borrowerId,
      ownerId: resource.ownerId,
      entityType: "booking",
      entityId: created.id,
      entityName: resource.name,
      action: "request_submitted",
    });
    return { booking: created, resourceName: resource.name };
  });
  if ("error" in booking) {
    const status = booking.error === "not_found" ? 404 : booking.error === "conflict" || booking.error === "requirements" ? 409 : 403;
    const error = booking.error === "not_found" ? "This resource is no longer available."
      : booking.error === "sample" ? "This is a sample listing for demonstration only and cannot be booked."
      : booking.error === "conflict" ? "That time now overlaps an approved booking. Choose another slot."
      : booking.error === "requirements" ? "This resource needs verified training or a supervisor. Those review steps are not configured yet."
      : "You cannot request a resource that you own.";
    res.status(status).json({ error });
    return;
  }
  res.status(201).json(CreateResourceBridgeBookingResponse.parse(presentBooking(booking.booking, booking.resourceName)));
});

privateRouter.patch("/resourcebridge/bookings/:id/decision", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const params = DecideResourceBridgeBookingParams.safeParse(req.params);
  const parsed = DecideResourceBridgeBookingBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const actorId = userIdFrom(res);
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(resourceBridgeBookings)
      .where(eq(resourceBridgeBookings.id, params.data.id))
      .for("update")
      .limit(1);
    if (!booking) return { error: "not_found" as const };
    if (booking.ownerId !== actorId) return { error: "forbidden" as const };
    if (booking.status !== "pending_approval") return { error: "invalid_state" as const };
    if (parsed.data.decision === "approved") {
      const [resource] = await tx.select({ id: resourceBridgeResources.id, status: resourceBridgeResources.status })
        .from(resourceBridgeResources)
        .where(eq(resourceBridgeResources.id, booking.resourceId))
        .for("update")
        .limit(1);
      if (!resource || resource.status !== "active") return { error: "unavailable" as const };
      const [conflict] = await tx.select({ id: resourceBridgeBookings.id })
        .from(resourceBridgeBookings)
        .where(and(
          eq(resourceBridgeBookings.resourceId, booking.resourceId),
          ne(resourceBridgeBookings.id, booking.id),
          inArray(resourceBridgeBookings.status, ["approved", "checked_in", "return_submitted"]),
          lt(resourceBridgeBookings.startAt, booking.endAt),
          gt(resourceBridgeBookings.endAt, booking.startAt),
        ))
        .limit(1);
      if (conflict) return { error: "conflict" as const };
    }
    const [updated] = await tx.update(resourceBridgeBookings)
      .set({ status: parsed.data.decision, ownerReason: parsed.data.reason })
      .where(eq(resourceBridgeBookings.id, booking.id))
      .returning();
    const [resource] = await tx.select({ name: resourceBridgeResources.name })
      .from(resourceBridgeResources).where(eq(resourceBridgeResources.id, booking.resourceId)).limit(1);
    await writeAudit(tx, {
      actorId,
      ownerId: actorId,
      entityType: "booking",
      entityId: booking.id,
      entityName: resource?.name ?? "Resource",
      action: parsed.data.decision,
      reason: parsed.data.reason,
    });
    return { booking: updated, resourceName: resource?.name ?? "Resource" };
  });
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
    const error = result.error === "not_found" ? "Booking not found."
      : result.error === "forbidden" ? "Only the resource owner can decide this request."
      : result.error === "conflict" ? "Another approved booking now uses this time."
      : result.error === "unavailable" ? "This resource is not currently available."
      : "This booking can no longer be changed.";
    res.status(status).json({ error });
    return;
  }
  res.json(DecideResourceBridgeBookingResponse.parse(presentBooking(result.booking, result.resourceName)));
});

privateRouter.post("/resourcebridge/bookings/:id/check-in", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const params = CheckInResourceBridgeBookingParams.safeParse(req.params);
  const parsed = CheckInResourceBridgeBookingBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const actorId = userIdFrom(res);
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(resourceBridgeBookings)
      .where(eq(resourceBridgeBookings.id, params.data.id)).for("update").limit(1);
    if (!booking) return { error: "not_found" as const };
    if (booking.borrowerId !== actorId) return { error: "forbidden" as const };
    if (booking.status !== "approved") return { error: "invalid_state" as const };
    const now = Date.now();
    const earliestCheckIn = booking.startAt.getTime() - 30 * 60 * 1000;
    const latestCheckIn = booking.startAt.getTime() + 60 * 60 * 1000;
    if (now < earliestCheckIn || now > latestCheckIn) return { error: "outside_window" as const };
    const [updated] = await tx.update(resourceBridgeBookings).set({
      status: "checked_in",
      checkInCondition: parsed.data.condition,
      checkInNotes: parsed.data.notes,
    }).where(eq(resourceBridgeBookings.id, booking.id)).returning();
    const [resource] = await tx.select({ name: resourceBridgeResources.name })
      .from(resourceBridgeResources).where(eq(resourceBridgeResources.id, booking.resourceId)).limit(1);
    await writeAudit(tx, {
      actorId,
      ownerId: booking.ownerId,
      entityType: "booking",
      entityId: booking.id,
      entityName: resource?.name ?? "Resource",
      action: "checked_in",
    });
    return { booking: updated, resourceName: resource?.name ?? "Resource" };
  });
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
    res.status(status).json({ error: result.error === "invalid_state" ? "Only an approved booking can be checked in."
      : result.error === "outside_window" ? "Check-in is available from 30 minutes before to 60 minutes after the booking start."
      : "Booking not found or unavailable." });
    return;
  }
  res.json(CheckInResourceBridgeBookingResponse.parse(presentBooking(result.booking, result.resourceName)));
});

privateRouter.post("/resourcebridge/bookings/:id/return", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const params = SubmitResourceBridgeReturnParams.safeParse(req.params);
  const parsed = SubmitResourceBridgeReturnBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const actorId = userIdFrom(res);
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(resourceBridgeBookings)
      .where(eq(resourceBridgeBookings.id, params.data.id)).for("update").limit(1);
    if (!booking) return { error: "not_found" as const };
    if (booking.borrowerId !== actorId) return { error: "forbidden" as const };
    if (booking.status !== "checked_in") return { error: "invalid_state" as const };
    const [updated] = await tx.update(resourceBridgeBookings).set({
      status: "return_submitted",
      returnCondition: parsed.data.condition,
      returnNotes: parsed.data.notes,
    }).where(eq(resourceBridgeBookings.id, booking.id)).returning();
    const [resource] = await tx.select({ name: resourceBridgeResources.name })
      .from(resourceBridgeResources).where(eq(resourceBridgeResources.id, booking.resourceId)).limit(1);
    await writeAudit(tx, {
      actorId,
      ownerId: booking.ownerId,
      entityType: "booking",
      entityId: booking.id,
      entityName: resource?.name ?? "Resource",
      action: "return_submitted",
    });
    return { booking: updated, resourceName: resource?.name ?? "Resource" };
  });
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
    res.status(status).json({ error: result.error === "invalid_state" ? "This booking is not ready for a return." : "Booking not found or unavailable." });
    return;
  }
  res.json(SubmitResourceBridgeReturnResponse.parse(presentBooking(result.booking, result.resourceName)));
});

privateRouter.post("/resourcebridge/bookings/:id/confirm-return", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const params = ConfirmResourceBridgeReturnParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const actorId = userIdFrom(res);
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(resourceBridgeBookings)
      .where(eq(resourceBridgeBookings.id, params.data.id)).for("update").limit(1);
    if (!booking) return { error: "not_found" as const };
    if (booking.ownerId !== actorId) return { error: "forbidden" as const };
    if (booking.status !== "return_submitted") return { error: "invalid_state" as const };
    const [updated] = await tx.update(resourceBridgeBookings).set({ status: "completed" })
      .where(eq(resourceBridgeBookings.id, booking.id)).returning();
    const [resource] = await tx.select({ name: resourceBridgeResources.name })
      .from(resourceBridgeResources).where(eq(resourceBridgeResources.id, booking.resourceId)).limit(1);
    await writeAudit(tx, {
      actorId,
      ownerId: actorId,
      entityType: "booking",
      entityId: booking.id,
      entityName: resource?.name ?? "Resource",
      action: "return_confirmed",
    });
    return { booking: updated, resourceName: resource?.name ?? "Resource" };
  });
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
    res.status(status).json({ error: result.error === "forbidden" ? "Only the resource owner can confirm a return." : result.error === "invalid_state" ? "The borrower has not submitted a return." : "Booking not found." });
    return;
  }
  res.json(ConfirmResourceBridgeReturnResponse.parse(presentBooking(result.booking, result.resourceName)));
});

privateRouter.post("/resourcebridge/bookings/:id/rating", requireResourceBridgeAuth, async (req, res): Promise<void> => {
  const params = RateResourceBridgeBookingParams.safeParse(req.params);
  const parsed = RateResourceBridgeBookingBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const raterId = userIdFrom(res);
  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(resourceBridgeBookings)
      .where(eq(resourceBridgeBookings.id, params.data.id))
      .for("update")
      .limit(1);
    if (!booking) return { error: "not_found" as const };
    if (booking.borrowerId !== raterId && booking.ownerId !== raterId) {
      return { error: "forbidden" as const };
    }
    if (booking.status !== "completed") return { error: "not_complete" as const };
    const [saved] = await tx.insert(resourceBridgeRatings).values({
      bookingId: booking.id,
      raterId,
      targetId: booking.borrowerId === raterId ? booking.ownerId : booking.borrowerId,
      stars: parsed.data.stars,
      comment: parsed.data.comment?.trim() || null,
    }).onConflictDoNothing({
      target: [resourceBridgeRatings.bookingId, resourceBridgeRatings.raterId],
    }).returning();
    if (!saved) return { error: "already_rated" as const };
    return { rating: saved };
  });
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
    const error = result.error === "not_found" ? "Booking not found."
      : result.error === "forbidden" ? "Only the booking participants can leave a rating."
      : result.error === "not_complete" ? "Ratings are available after the host confirms the return."
      : "You have already rated this completed booking.";
    res.status(status).json({ error });
    return;
  }
  res.status(201).json(RateResourceBridgeBookingResponse.parse(presentResourceBridgeRating(result.rating)));
});

export { publicRouter as resourceBridgePublicRouter, privateRouter as resourceBridgePrivateRouter };
