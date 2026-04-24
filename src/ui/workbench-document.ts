import type { Project } from '../engine/types';
import type { CompositeLibraryEntry } from '../engine/composites';
import type { GuidedChallenge } from './challenges';
import type { CryptanalysisMode } from './cryptanalysis-mode';
import type { GuidedTutorial } from './tutorials';
import type { VerificationCase } from './verification-workflow';
import type { WorkspaceMode } from './workspace-mode';

export interface WorkbenchPosition {
  x: number;
  y: number;
  orientation?: WorkbenchNodeOrientation;
  portLayoutPreset?: WorkbenchPortLayoutPreset;
  inputOrder?: string[];
  outputOrder?: string[];
  inputPortSides?: Record<string, WorkbenchPortSide>;
  outputPortSides?: Record<string, WorkbenchPortSide>;
}

export interface WorkbenchAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface WorkbenchStageLabel {
  id: string;
  x: number;
  y: number;
  text: string;
}

export type WorkbenchGroupBoxVariant = 'neutral' | 'stage' | 'feedback' | 'emphasis';

export interface WorkbenchGroupBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  variant?: WorkbenchGroupBoxVariant;
}

export type WorkbenchGuideRailAxis = 'horizontal' | 'vertical';

export interface WorkbenchGuideRail {
  id: string;
  axis: WorkbenchGuideRailAxis;
  position: number;
  title: string;
}

export type WorkbenchConnectionBendAxis = 'x' | 'y';
export type WorkbenchConnectionLanePreference = 'negative' | 'positive';
export type WorkbenchConnectionColorOverride =
  | 'red'
  | 'orange'
  | 'gold'
  | 'green'
  | 'teal'
  | 'blue'
  | 'violet'
  | 'rose';

export interface WorkbenchConnectionAnchor {
  x: number;
  y: number;
}

export interface WorkbenchConnectionLayout {
  orthogonalBend?: {
    axis: WorkbenchConnectionBendAxis;
    value: number;
  };
  orthogonalAnchors?: WorkbenchConnectionAnchor[];
  orthogonalLanePreference?: WorkbenchConnectionLanePreference;
  colorOverride?: WorkbenchConnectionColorOverride;
}

export type WorkbenchLayoutDirection = 'horizontal' | 'vertical';
export type WorkbenchNodeOrientation = 'east' | 'south' | 'west' | 'north';
export type WorkbenchPortLayoutPreset = 'horizontal' | 'vertical';
export type WorkbenchPortSide = 'left' | 'right' | 'top' | 'bottom';
export type WorkbenchRoutingMode = 'curved' | 'orthogonal';
export type WorkbenchWireColorMode = 'domain' | 'neutral' | 'high-contrast';

export interface WorkbenchUiMetadata {
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
  stageLabels?: WorkbenchStageLabel[];
  groupBoxes?: WorkbenchGroupBox[];
  guideRails?: WorkbenchGuideRail[];
  showFurniture?: boolean;
  showOverviewNavigator?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  snapToGuides?: boolean;
  layoutDirection?: WorkbenchLayoutDirection;
  routingMode?: WorkbenchRoutingMode;
  wireColorMode?: WorkbenchWireColorMode;
  connectionLayout?: Record<string, WorkbenchConnectionLayout>;
}

export interface WorkbenchDocument {
  version: 1;
  project: Project;
  ui: WorkbenchUiMetadata;
}

export interface WorkspaceVersionDocument {
  id: string;
  name: string;
  savedAt: string;
  tickedMode: boolean;
  document: WorkbenchDocument;
}

export interface ComparisonBaselineDocument {
  project: Project;
  capturedAt: string;
}

export interface ModernAnalysisCaseState {
  sourceModuleId: string | null;
  sinkModuleId: string | null;
  baselineInput: string;
  flipBit: number;
}

export interface RandomnessAnalysisCaseState {
  sinkModuleId: string | null;
}

export interface ClassicalAnalysisCaseState {
  ciphertext: string;
  selectedPeriod: number;
  selectedColumnIndex: number;
  selectedShiftsByColumnKey: Record<string, number>;
}

export type SavedAnalysisCase =
  | {
      id: string;
      name: string;
      projectId: string;
      mode: 'modern';
      state: ModernAnalysisCaseState;
    }
  | {
      id: string;
      name: string;
      projectId: string;
      mode: 'randomness';
      state: RandomnessAnalysisCaseState;
    }
  | {
      id: string;
      name: string;
      projectId: string;
      mode: 'classical';
      state: ClassicalAnalysisCaseState;
    };

export interface CompositeLibraryDocument {
  version: 1;
  entries: CompositeLibraryEntry[];
}

export interface UserWorkspaceMetadata {
  id: string;
  name: string;
  group?: string;
  summary: string;
  pipeline: string;
  defaultTickedMode?: boolean;
}

export interface PersistedWorkspaceDocument {
  version: 1;
  activeProjectId: string;
  defaultWorkspaceMode?: WorkspaceMode;
  showPalette: boolean;
  showInspector: boolean;
  documentsByProjectId: Record<string, WorkbenchDocument>;
  comparisonBaselinesByProjectId: Record<string, ComparisonBaselineDocument | null>;
  activeChallengeIdByProjectId: Record<string, string | null>;
  activeTutorialIdByProjectId: Record<string, string | null>;
  activeTutorialStepByProjectId: Record<string, number>;
  completedTutorialsByProjectId: Record<string, string[]>;
  tutorialNotesVisibleByProjectId?: Record<string, boolean>;
  workspaceModeByProjectId?: Record<string, WorkspaceMode>;
  cryptanalysisModeByProjectId?: Record<string, CryptanalysisMode>;
  cryptanalysisInputByProjectId?: Record<string, string>;
  modernAnalysisBaselineByProjectId?: Record<string, string>;
  modernAnalysisFlipBitByProjectId?: Record<string, number>;
  modernAnalysisSourceIdByProjectId?: Record<string, string | null>;
  modernAnalysisSinkIdByProjectId?: Record<string, string | null>;
  randomnessAnalysisSinkIdByProjectId?: Record<string, string | null>;
  classicalSelectedPeriodByProjectId?: Record<string, number>;
  classicalSelectedColumnIndexByProjectId?: Record<string, number>;
  classicalSelectedShiftsByProjectId?: Record<string, Record<string, number>>;
  savedAnalysisCasesByProjectId?: Record<string, SavedAnalysisCase[]>;
  tickedModeByProjectId?: Record<string, boolean>;
  currentTickByProjectId?: Record<string, number>;
  tickPlaybackSpeedMsByProjectId?: Record<string, number>;
  workspaceVersionsByProjectId?: Record<string, WorkspaceVersionDocument[]>;
  challengeLibrary: GuidedChallenge[];
  tutorialLibrary: GuidedTutorial[];
  compositeLibrary: CompositeLibraryDocument;
  userWorkspaceLibrary?: UserWorkspaceMetadata[];
  verificationCasesByProjectId?: Record<string, VerificationCase[]>;
}

export interface ShareableLabPack {
  version: 1;
  kind: 'mcw-shareable-lab-pack';
  metadata: {
    id: string;
    title: string;
    summary: string;
    author?: string;
    source?: string;
    exportedAt: string;
  };
  workspace: WorkbenchDocument;
  comparisonBaseline?: ComparisonBaselineDocument | null;
  verificationCases?: VerificationCase[];
  tutorial?: GuidedTutorial;
  challenge?: GuidedChallenge;
  teachingNotes?: string;
}
