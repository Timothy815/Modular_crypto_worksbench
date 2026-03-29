export interface QuickStartWorkflow {
  projectId: string;
  tutorialId: string;
  challengeId: string;
  manualEntryId: string;
  nextProjectId: string;
  nextTutorialId: string;
}

export interface QuickStartSurfaceGuide {
  id: string;
  title: string;
  description: string;
}

export const FIRST_SESSION_QUICK_START: QuickStartWorkflow = {
  projectId: 'bridge',
  tutorialId: 'bridge-walkthrough',
  challengeId: 'repair-bridge-key',
  manualEntryId: 'where-to-begin',
  nextProjectId: 'byte-round',
  nextTutorialId: 'byte-round',
};

export const QUICK_START_SURFACES: QuickStartSurfaceGuide[] = [
  {
    id: 'build',
    title: 'Build',
    description: 'Use Build when you want to wire modules, change parameters, and author the graph directly.',
  },
  {
    id: 'guide',
    title: 'Guide',
    description: 'Use Guide for tutorials and challenges when you want the product to teach by doing.',
  },
  {
    id: 'cryptanalysis',
    title: 'Cryptanalysis',
    description: 'Use Cryptanalysis after the basic loop when you want to inspect periods, frequency, or diffusion behavior.',
  },
  {
    id: 'verification',
    title: 'Verification / Compare',
    description: 'Use the Inspector Compare tab to capture a baseline, add known cases, and prove that the machine still behaves the way you intended.',
  },
  {
    id: 'export',
    title: 'Export',
    description: 'Use Import/Export after the machine works to save JSON or generate Python with parity support.',
  },
  {
    id: 'resources',
    title: 'Resources',
    description: 'Use Resources for the manual, AI toolkit, notes, and external reference links when you need context.',
  },
];
