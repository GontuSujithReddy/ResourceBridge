import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import {
  getListMyResourceBridgeOrganizationsQueryKey,
  getListResourceBridgeOrganizationsQueryKey,
  getListResourceBridgeOrganizationMembersQueryKey,
  getListPendingResourceBridgeOrganizationsQueryKey,
  getGetResourceBridgeOrganizationReviewerAccessQueryKey,
  useCreateResourceBridgeOrganization,
  useGetResourceBridgeOrganizationReviewerAccess,
  useListPendingResourceBridgeOrganizations,
  useListMyResourceBridgeOrganizations,
  useListResourceBridgeOrganizationMembers,
  useListResourceBridgeOrganizations,
  useRequestResourceBridgeOrganizationMembership,
  useReviewResourceBridgeOrganizationMembership,
  useReviewResourceBridgeOrganization,
} from "@workspace/api-client-react";
import type { ResourceBridgeOrganization, ResourceBridgeOrganizationMembership } from "@workspace/api-client-react";

const organizationTypes = ["college", "laboratory", "makerspace", "community", "business", "independent"] as const;
type OrganizationType = typeof organizationTypes[number];
type ReviewRole = "member" | "resource_manager" | "org_admin";

export function OrganizationMembershipDirectory() {
  const { isLoaded, user } = useUser();
  const queryClient = useQueryClient();
  const organizations = useListResourceBridgeOrganizations();
  const myMemberships = useListMyResourceBridgeOrganizations({
    query: { queryKey: getListMyResourceBridgeOrganizationsQueryKey(), enabled: isLoaded && !!user },
  });
  const request = useRequestResourceBridgeOrganizationMembership();
  const membershipsByOrganization = useMemo(
    () => new Map((myMemberships.data ?? []).map((membership) => [membership.organizationId, membership])),
    [myMemberships.data],
  );

  if (organizations.isLoading) return <div className="rb-card rb-panel">Loading verified organizations…</div>;
  if (organizations.isError) return <div className="rb-card rb-panel" role="alert">Verified organizations could not be loaded. Refresh and try again.</div>;
  if (!organizations.data?.length) {
    return <div className="rb-card rb-panel"><h2>Verified organization profiles</h2><p>No organization profiles are available yet.</p></div>;
  }

  return (
    <section className="rb-card rb-panel" aria-labelledby="rb-verified-organizations">
      <div className="rb-panel-head"><h2 id="rb-verified-organizations">Verified organization profiles</h2></div>
      <div className="rb-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        {organizations.data.map((organization: ResourceBridgeOrganization) => {
          const membership = membershipsByOrganization.get(organization.id);
          return (
            <article className="rb-info" key={organization.id} data-testid={`verified-organization-${organization.id}`}>
              <div className="rb-eyebrow">{organization.type}</div>
              <h3>{organization.name}</h3>
              <p>{organization.location}</p>
              <p>{organization.description}</p>
              {membership ? (
                <span className={`rb-badge ${membership.status === "active" ? "active" : "pending"}`}>
                  {membership.status === "active" ? "Member" : membership.status === "pending" ? "Request pending" : "Request declined"}
                </span>
              ) : user ? (
                <button
                  className="rb-btn"
                  type="button"
                  disabled={request.isPending}
                  onClick={() => request.mutate(
                    { id: organization.id },
                    { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getListMyResourceBridgeOrganizationsQueryKey() }) },
                  )}
                  data-testid={`button-request-org-${organization.id}`}
                >
                  {request.isPending ? "Sending…" : "Request membership"}
                </button>
              ) : <Link className="rb-small-link" href="/sign-in">Sign in to request membership <span aria-hidden="true">→</span></Link>}
              {request.isError && <p className="rb-role-error" role="alert">The membership request could not be sent.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function OrganizationVerificationReviewPanel() {
  const { isLoaded, user } = useUser();
  const queryClient = useQueryClient();
  const access = useGetResourceBridgeOrganizationReviewerAccess({
    query: {
      queryKey: getGetResourceBridgeOrganizationReviewerAccessQueryKey(),
      enabled: isLoaded && !!user,
    },
  });
  const queue = useListPendingResourceBridgeOrganizations({
    query: {
      queryKey: getListPendingResourceBridgeOrganizationsQueryKey(),
      enabled: isLoaded && !!user && access.data?.canReview === true,
    },
  });
  const review = useReviewResourceBridgeOrganization();
  const [message, setMessage] = useState("");

  if (!isLoaded || !user) return null;
  if (access.isLoading) return <section className="rb-card rb-panel">Checking organization review access…</section>;
  if (access.isError) {
    return <section className="rb-card rb-panel" role="alert">Organization review access could not be checked. Refresh and try again.</section>;
  }
  if (!access.data?.reviewerConfigured) {
    return (
      <section className="rb-info" data-testid="organization-review-not-configured">
        <strong>Organization profile review is not configured.</strong>
        <p>A workspace administrator must configure the verified reviewer email list before profiles can be reviewed.</p>
      </section>
    );
  }
  if (!access.data.canReview) return null;

  const decide = (id: number, verificationStatus: "verified" | "rejected") => {
    setMessage("");
    review.mutate(
      { id, data: { verificationStatus } },
      {
        onSuccess: () => {
          setMessage(verificationStatus === "verified" ? "Organization verified." : "Organization profile rejected.");
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: getListPendingResourceBridgeOrganizationsQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListResourceBridgeOrganizationsQueryKey() }),
          ]);
        },
        onError: () => setMessage("The verification decision could not be saved. Refresh and try again."),
      },
    );
  };

  return (
    <section className="rb-card rb-panel" aria-labelledby="rb-organization-review-heading" data-testid="organization-review-panel">
      <div className="rb-panel-head">
        <h2 id="rb-organization-review-heading">Organization profiles awaiting verification</h2>
      </div>
      <p>Review the submitted details before profiles appear in public discovery or can be linked to listings.</p>
      {message && <p role="status" className="rb-role-status">{message}</p>}
      {queue.isLoading ? <p>Loading profiles for review…</p> : queue.isError ? (
        <p role="alert">Pending organization profiles could not be loaded.</p>
      ) : queue.data?.length ? (
        <div className="rb-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {queue.data.map(({ organization, submittedByDisplayName }) => (
            <article className="rb-info" key={organization.id} data-testid={`organization-review-${organization.id}`}>
              <div className="rb-eyebrow">{organization.type} · Submitted {new Date(organization.createdAt).toLocaleDateString()}</div>
              <h3>{organization.name}</h3>
              <p><strong>Location:</strong> {organization.location}</p>
              <p><strong>Submitted by:</strong> {submittedByDisplayName || "ResourceBridge member"}</p>
              <p>{organization.description}</p>
              <div className="rb-rating-inputs">
                <button
                  className="rb-btn primary"
                  type="button"
                  disabled={review.isPending}
                  onClick={() => decide(organization.id, "verified")}
                  data-testid={`button-verify-organization-${organization.id}`}
                >
                  Verify profile
                </button>
                <button
                  className="rb-btn"
                  type="button"
                  disabled={review.isPending}
                  onClick={() => decide(organization.id, "rejected")}
                  data-testid={`button-reject-organization-${organization.id}`}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : <p>No organization profiles are waiting for review.</p>}
    </section>
  );
}

export function OrganizationWorkspacePanel() {
  const queryClient = useQueryClient();
  const memberships = useListMyResourceBridgeOrganizations();
  const create = useCreateResourceBridgeOrganization();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("community");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [reviewRoles, setReviewRoles] = useState<Record<number, ReviewRole>>({});
  const [message, setMessage] = useState("");

  const manageable = useMemo(
    () => (memberships.data ?? []).filter((membership) =>
      membership.status === "active" && ["org_owner", "org_admin"].includes(membership.role),
    ),
    [memberships.data],
  );
  useEffect(() => {
    if (!selectedOrganizationId && manageable.length) setSelectedOrganizationId(manageable[0].organizationId);
  }, [manageable, selectedOrganizationId]);

  const selectedMembership = manageable.find((membership) => membership.organizationId === selectedOrganizationId);
  const members = useListResourceBridgeOrganizationMembers(selectedOrganizationId ?? 0, {
    query: {
      queryKey: getListResourceBridgeOrganizationMembersQueryKey(selectedOrganizationId ?? 0),
      enabled: selectedOrganizationId !== null && selectedMembership !== undefined,
    },
  });
  const review = useReviewResourceBridgeOrganizationMembership();

  const submitOrganization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    create.mutate(
      { data: { name, type, description, location } },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setLocation("");
          setMessage("Organization submitted for verification. It will not appear publicly until verified.");
          void queryClient.invalidateQueries({ queryKey: getListMyResourceBridgeOrganizationsQueryKey() });
        },
        onError: () => setMessage("The organization could not be submitted. Check the fields and retry."),
      },
    );
  };

  const decide = (membership: ResourceBridgeOrganizationMembership, status: "active" | "rejected") => {
    if (!selectedOrganizationId) return;
    const role = status === "active" ? (reviewRoles[membership.id] ?? "member") : "member";
    review.mutate(
      { id: selectedOrganizationId, membershipId: membership.id, data: { status, role } },
      {
        onSuccess: () => {
          setMessage(status === "active" ? "Membership approved." : "Membership request declined.");
          void queryClient.invalidateQueries({ queryKey: getListMyResourceBridgeOrganizationsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getListResourceBridgeOrganizationMembersQueryKey(selectedOrganizationId) });
        },
        onError: () => setMessage("The membership decision could not be saved."),
      },
    );
  };

  return (
    <div className="rb-grid rb-panels">
      <section className="rb-card rb-panel">
        <div className="rb-panel-head"><h2>Create an organization profile</h2></div>
        <p>New profiles are private while pending verification. Creating one gives you owner access only to that organization.</p>
        <form onSubmit={submitOrganization} className="rb-form-card">
          <label className="rb-field">Organization name
            <input className="rb-input" required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="rb-field">Organization type
            <select className="rb-select" value={type} onChange={(event) => setType(event.target.value as OrganizationType)}>
              {organizationTypes.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
          <label className="rb-field">City or region
            <input className="rb-input" required minLength={2} maxLength={240} value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label className="rb-field">About the organization
            <textarea className="rb-textarea" required minLength={5} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <button className="rb-btn primary" type="submit" disabled={create.isPending} data-testid="button-create-organization">
            {create.isPending ? "Submitting…" : "Submit organization"}
          </button>
        </form>
        {message && <p role="status" className="rb-role-status">{message}</p>}
      </section>

      <section className="rb-card rb-panel">
        <div className="rb-panel-head"><h2>Your organization memberships</h2></div>
        {memberships.isLoading ? <p>Loading memberships…</p> : memberships.isError ? (
          <p role="alert">Memberships could not be loaded.</p>
        ) : memberships.data?.length ? (
          <div className="rb-table-wrap">
            <table className="rb-table">
              <thead><tr><th>Organization</th><th>Role</th><th>Membership</th><th>Profile review</th></tr></thead>
              <tbody>{memberships.data.map((membership) => (
                <tr key={membership.id} data-testid={`organization-membership-${membership.id}`}>
                  <td>{membership.organizationName}</td>
                  <td>{membership.role.replaceAll("_", " ")}</td>
                  <td>{membership.status === "active" ? "Active" : membership.status === "pending" ? "Pending" : "Declined"}</td>
                  <td>{membership.organizationVerificationStatus === "verified" ? "Verified" : membership.organizationVerificationStatus === "pending" ? "Awaiting review" : "Rejected"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p>You do not belong to an organization yet.</p>}

        {manageable.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <label className="rb-field">Manage membership requests
              <select className="rb-select" value={selectedOrganizationId ?? ""} onChange={(event) => setSelectedOrganizationId(Number(event.target.value))}>
                {manageable.map((membership) => <option key={membership.organizationId} value={membership.organizationId}>{membership.organizationName}</option>)}
              </select>
            </label>
            {members.isLoading ? <p>Loading members…</p> : members.isError ? <p role="alert">Members could not be loaded.</p> : (
              members.data?.filter((membership) => membership.status === "pending").length ? (
                <div className="rb-table-wrap">
                  <table className="rb-table">
                    <thead><tr><th>Person</th><th>Grant role</th><th>Review</th></tr></thead>
                    <tbody>{members.data.filter((membership) => membership.status === "pending").map((membership) => (
                      <tr key={membership.id}>
                        <td>{membership.displayName || "ResourceBridge member"}</td>
                        <td>
                          <select
                            className="rb-select"
                            value={reviewRoles[membership.id] ?? "member"}
                            onChange={(event) => setReviewRoles((current) => ({ ...current, [membership.id]: event.target.value as ReviewRole }))}
                            aria-label={`Role for ${membership.displayName || "member"}`}
                          >
                            <option value="member">Member</option>
                            <option value="resource_manager">Resource manager</option>
                            {selectedMembership?.role === "org_owner" && <option value="org_admin">Organization admin</option>}
                          </select>
                        </td>
                        <td>
                          <div className="rb-rating-inputs">
                            <button className="rb-btn primary" type="button" disabled={review.isPending} onClick={() => decide(membership, "active")}>Approve</button>
                            <button className="rb-btn" type="button" disabled={review.isPending} onClick={() => decide(membership, "rejected")}>Decline</button>
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <p>No pending membership requests.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
