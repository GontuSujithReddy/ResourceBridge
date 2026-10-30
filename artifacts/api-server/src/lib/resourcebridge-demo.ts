import { db, resourceBridgeResources } from "@workspace/db";

const demoResources = [
  ["North Campus Media Studio", "space", "A sound-treated studio with lighting, backdrops, and a small control desk.", "Northfield College", "college", "Northfield, Building C", 8, false, false, "Free", "college-media"],
  ["Seminar Room 204", "space", "Flexible classroom with movable tables, display screen, and hybrid meeting equipment.", "Northfield College", "college", "Northfield, Academic Block", 24, false, false, "Free", "college-seminar"],
  ["Portable Projector Kit", "equipment", "Short-throw projector with HDMI adapters and carry case.", "Northfield College", "college", "Northfield, Library Desk", null, false, false, "Free", "college-projector"],
  ["Thermal Camera", "equipment", "Handheld thermal imager for supervised building and research surveys.", "Northfield College", "college", "Northfield, Engineering Lab", null, true, true, "Free", "college-thermal"],
  ["Digital Microscope Suite", "technical", "Shared microscope station with image capture and a trained lab supervisor.", "Arc Research Lab", "laboratory", "Arc Research Lab, Room 2.14", 2, true, true, "Sponsored access", "lab-microscope"],
  ["Benchtop Spectrometer", "equipment", "Visible-range spectrometer with standard cuvettes and calibration notes.", "Arc Research Lab", "laboratory", "Arc Research Lab, Instrument Bay", null, true, true, "Free", "lab-spectrometer"],
  ["GPU Workstation", "technical", "A high-memory workstation for approved research workloads and rendering.", "Arc Research Lab", "laboratory", "Arc Research Lab, Compute Room", 1, true, false, "Free", "lab-gpu"],
  ["Material Testing Bench", "technical", "Supervised tensile and hardness testing with an operator-led handover.", "Arc Research Lab", "laboratory", "Arc Research Lab, Test Hall", 4, true, true, "By arrangement", "lab-testing"],
  ["Workshop 3D Printer", "equipment", "Enclosed FDM printer, filament included, with a short setup orientation.", "OpenBench Makerspace", "makerspace", "OpenBench, Print Room", null, true, false, "Free", "maker-printer"],
  ["Laser Cutter", "equipment", "Enclosed laser cutter with approved materials list and operator supervision.", "OpenBench Makerspace", "makerspace", "OpenBench, Fabrication Bay", null, true, true, "Free", "maker-laser"],
  ["Woodworking Shop", "space", "Shared woodworking area with dust extraction and trained on-site supervision.", "OpenBench Makerspace", "makerspace", "OpenBench, Workshop", 6, true, true, "Sponsored access", "maker-woodshop"],
  ["Podcast Recording Booth", "space", "Quiet two-person booth with microphones, headphones, and basic audio interface.", "OpenBench Makerspace", "makerspace", "OpenBench, Media Corner", 2, false, false, "Free", "maker-podcast"],
  ["Community Hall", "space", "Bright, accessible hall for meetings, workshops, and neighborhood gatherings.", "Riverside Community Hub", "community", "Riverside, Main Hall", 60, false, false, "Free", "hub-hall"],
  ["Portable PA System", "equipment", "Battery-powered speaker pair with microphones and a rolling case.", "Riverside Community Hub", "community", "Riverside, Equipment Store", null, false, false, "Free", "hub-pa"],
  ["Product Photography Set", "space", "Tabletop sweep, continuous lights, reflectors, and a tethered camera stand.", "CommonGood Studio", "business", "CommonGood, Studio 1", 4, false, false, "Sponsored access", "business-photo"],
  ["Conference Room", "space", "A small meeting room with screen sharing, whiteboard, and step-free access.", "CommonGood Studio", "business", "CommonGood, Level 2", 10, false, false, "Free", "business-room"],
] as const;

// Separate demo identities and stable keys keep samples additive and repeatable.
const categorySamples = {
  space: ["Community Meeting Room", "Dance Practice Studio", "Quiet Study Room"],
  electronics: ["Laptop & Charger Kit", "Mirrorless Camera Kit", "Tablet & Digital Pen"],
  equipment: ["Cordless Drill Kit", "Garden Tool Set", "Folding Workbench"],
  technical: ["Website Help Session", "3D Design Consultation", "Device Setup Workshop"],
  learning: ["Science Experiment Kit", "Language Learning Books", "Beginner Robotics Kit"],
  sports: ["Badminton Set", "Camping Tent", "Yoga & Fitness Kit"],
  events: ["Event Decoration Set", "Community Notice Board", "Folding Event Tables"],
  mobility: ["City Bicycle", "Folding Scooter", "Utility Handcart"],
  household: ["Vacuum Cleaner", "Sewing Machine", "Home Repair Kit"],
  creative: ["Watercolor Painting Kit", "Podcast Microphone Kit", "Portable Lighting Set"],
  kitchen: ["Stand Mixer", "Large Cooking Pot Set", "Reusable Catering Set"],
  other: ["Portable Power Station", "Travel Organizer Kit", "Community Donation Crates"],
} as const;

export async function seedResourceBridgeDemoResources(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  await db.insert(resourceBridgeResources).values(
    demoResources.map(([name, category, description, organizationName, organizationType, location, capacity, requiresTraining, supervised, priceLabel, demoKey]) => ({
      ownerId: `resourcebridge-demo:${organizationType}`,
      name,
      category,
      description,
      organizationName,
      organizationType,
      location,
      capacity,
      visibility: "public",
      status: "active",
      requiresTraining,
      supervised,
      priceLabel,
      timezone: "Asia/Kolkata",
      demoKey,
    })),
  ).onConflictDoNothing({ target: resourceBridgeResources.demoKey });
  await db.insert(resourceBridgeResources).values(
    Object.entries(categorySamples).flatMap(([category, names]) => names.map((name, index) => ({
      ownerId: "resourcebridge-demo:category-samples",
      name: `[Sample] ${name}`,
      category,
      description: `Demonstration listing for ${name.toLowerCase()}. This is sample content for exploring ResourceBridge, not a real resource available to book.`,
      organizationName: "Sample Community Hub",
      organizationType: "community",
      location: "Demo community · Sample location",
      capacity: category === "space" ? [12, 8, 4][index] : null,
      visibility: "public",
      status: "active",
      requiresTraining: false,
      supervised: false,
      priceLabel: "Sample only",
      timezone: "Asia/Kolkata",
      demoKey: `category-sample:${category}:${index}`,
    }))),
  ).onConflictDoNothing({ target: resourceBridgeResources.demoKey });
}
