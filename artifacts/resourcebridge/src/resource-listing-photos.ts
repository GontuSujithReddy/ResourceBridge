import type { ResourceBridgeResource } from '@workspace/api-client-react';
import badmintonSet from './assets/sports/badminton-set.jpeg';
import campingTent from './assets/sports/camping-tent.jpeg';
import yogaFitnessKit from './assets/sports/yoga-fitness-kit.jpeg';
import communityNoticeBoard from './assets/events/community-notice-board.jpeg';
import eventDecorationSet from './assets/events/event-decoration-set.jpeg';
import foldingEventTables from './assets/events/folding-event-tables.jpeg';
import cityBicycle from './assets/mobility/city-bicycle.jpeg';
import foldingScooter from './assets/mobility/folding-scooter.jpeg';
import utilityHandcart from './assets/mobility/utility-handcart.jpeg';
import homeRepairKit from './assets/household/home-repair-kit.jpeg';
import sewingMachine from './assets/household/sewing-machine.jpeg';
import vacuumCleaner from './assets/household/vacuum-cleaner.jpeg';
import podcastMicrophoneKit from './assets/creative/podcast-microphone-kit.jpeg';
import portableLightingSet from './assets/creative/portable-lighting-set.jpeg';
import watercolorPaintingKit from './assets/creative/watercolor-painting-kit.jpeg';
import largeCookingPot from './assets/kitchen/large-cooking-pot.jpeg';
import reusableCateringSet from './assets/kitchen/reusable-catering-set.jpeg';
import standMixer from './assets/kitchen/stand-mixer.jpeg';
import communityDonationCrates from './assets/other/community-donation-crates.jpeg';
import portablePowerStation from './assets/other/portable-power-station.jpeg';
import travelOrganizerKit from './assets/other/travel-organizer-kit.jpeg';
import beginnerRoboticsKit from './assets/learning/beginner-robotics-kit.jpeg';
import languageLearningBooks from './assets/learning/language-learning-books.jpeg';
import scienceExperimentKit from './assets/learning/science-experiment-kit.jpeg';
import digitalMicroscopeSuite from './assets/technical/digital-microscope-suite.jpeg';
import deviceSetupWorkshop from './assets/technical/device-setup-workshop.jpeg';
import gpuWorkstation from './assets/technical/gpu-workstation.jpeg';
import materialTestingBench from './assets/technical/material-testing-bench.jpeg';
import threeDDesignConsultation from './assets/technical/3d-design-consultation.jpeg';
import websiteHelpSession from './assets/technical/website-help-session.jpeg';
import benchtopSpectrometer from './assets/equipment/benchtop-spectrometer.jpeg';
import cordlessDrillKit from './assets/equipment/cordless-drill-kit.jpeg';
import foldingWorkbench from './assets/equipment/folding-workbench.jpeg';
import gardenToolSet from './assets/equipment/garden-tool-set.jpeg';
import laserCutter from './assets/equipment/laser-cutter.jpeg';
import portablePaSystem from './assets/equipment/portable-pa-system.jpeg';
import portableProjectorKit from './assets/equipment/portable-projector-kit.jpeg';
import thermalCamera from './assets/equipment/thermal-camera.jpeg';
import workshop3dPrinter from './assets/equipment/workshop-3d-printer.jpeg';
import laptopChargerKit from './assets/electronics/laptop-charger-kit.jpeg';
import mirrorlessCameraKit from './assets/electronics/mirrorless-camera-kit.jpeg';
import tabletDigitalPen from './assets/electronics/tablet-digital-pen.jpeg';
import communityHall from './assets/spaces/community-hall.jpg';
import communityMeetingRoom from './assets/spaces/community-meeting-room.jpg';
import conferenceRoom from './assets/spaces/conference-room.jpg';
import dancePracticeStudio from './assets/spaces/dance-practice-studio.jpg';
import northCampusMediaStudio from './assets/spaces/north-campus-media-studio.jpg';
import podcastRecordingBooth from './assets/spaces/podcast-recording-booth.jpg';
import productPhotographySet from './assets/spaces/product-photography-set.jpg';
import quietStudyRoom from './assets/spaces/quiet-study-room.jpg';
import seminarRoom204 from './assets/spaces/seminar-room-204.jpg';
import woodworkingShop from './assets/spaces/woodworking-shop.jpg';

const suppliedListingPhotos: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  space: {
    'Community Hall': communityHall,
    'Community Meeting Room': communityMeetingRoom,
    'Conference Room': conferenceRoom,
    'Dance Practice Studio': dancePracticeStudio,
    'North Campus Media Studio': northCampusMediaStudio,
    'Podcast Recording Booth': podcastRecordingBooth,
    'Product Photography Set': productPhotographySet,
    'Quiet Study Room': quietStudyRoom,
    'Seminar Room 204': seminarRoom204,
    'Woodworking Shop': woodworkingShop,
  },
  electronics: {
    'Laptop & Charger Kit': laptopChargerKit,
    'Tablet & Digital Pen': tabletDigitalPen,
    'Mirrorless Camera Kit': mirrorlessCameraKit,
  },
  equipment: {
    'Benchtop Spectrometer': benchtopSpectrometer,
    'Cordless Drill Kit': cordlessDrillKit,
    'Folding Workbench': foldingWorkbench,
    'Garden Tool Set': gardenToolSet,
    'Laser Cutter': laserCutter,
    'Portable PA System': portablePaSystem,
    'Portable Projector Kit': portableProjectorKit,
    'Thermal Camera': thermalCamera,
    'Workshop 3D Printer': workshop3dPrinter,
  },
  technical: {
    '3D Design Consultation': threeDDesignConsultation,
    'Device Setup Workshop': deviceSetupWorkshop,
    'Digital Microscope Suite': digitalMicroscopeSuite,
    'GPU Workstation': gpuWorkstation,
    'Material Testing Bench': materialTestingBench,
    'Website Help Session': websiteHelpSession,
  },
  learning: {
    'Beginner Robotics Kit': beginnerRoboticsKit,
    'Language Learning Books': languageLearningBooks,
    'Science Experiment Kit': scienceExperimentKit,
  },
  sports: {
    'Badminton Set': badmintonSet,
    'Camping Tent': campingTent,
    'Yoga & Fitness Kit': yogaFitnessKit,
  },
  events: {
    'Community Notice Board': communityNoticeBoard,
    'Event Decoration Set': eventDecorationSet,
    'Folding Event Tables': foldingEventTables,
  },
  mobility: {
    'City Bicycle': cityBicycle,
    'Folding Scooter': foldingScooter,
    'Utility Handcart': utilityHandcart,
  },
  household: {
    'Home Repair Kit': homeRepairKit,
    'Sewing Machine': sewingMachine,
    'Vacuum Cleaner': vacuumCleaner,
  },
  creative: {
    'Podcast Microphone Kit': podcastMicrophoneKit,
    'Portable Lighting Set': portableLightingSet,
    'Watercolor Painting Kit': watercolorPaintingKit,
  },
  kitchen: {
    'Large Cooking Pot Set': largeCookingPot,
    'Reusable Catering Set': reusableCateringSet,
    'Stand Mixer': standMixer,
  },
  other: {
    'Community Donation Crates': communityDonationCrates,
    'Portable Power Station': portablePowerStation,
    'Travel Organizer Kit': travelOrganizerKit,
  },
};

export function getResourceCoverPhoto(
  resource: Pick<ResourceBridgeResource, 'photos' | 'category' | 'ownerId' | 'name'>,
) {
  if (resource.photos.length > 0) return resource.photos[0];
  // Supplied photos are for their exact demo listings, never real owner data.
  if (!resource.ownerId.startsWith('resourcebridge-demo:')) return undefined;
  const name = resource.name.replace(/^\[Sample\]\s*/, '');
  const url = suppliedListingPhotos[resource.category]?.[name];
  return url ? { url, altText: name } : undefined;
}
