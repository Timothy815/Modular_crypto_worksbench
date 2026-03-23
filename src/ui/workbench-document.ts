import type { Project } from '../engine/types';
import type { CompositeLibraryEntry } from '../engine/composites';
import type { GuidedChallenge } from './challenges';
import type { CryptanalysisMode } from './cryptanalysis-mode';
import type { GuidedTutorial } from './tutorials';
import type { WorkspaceMode } from './workspace-mode';

export interface WorkbenchPosition {
  x: number;
  y: number;
}

export interface WorkbenchAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface WorkbenchUiMetadata {
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
}

export interface WorkbenchDocument {
  version: 1;
  project: Project;
  ui: WorkbenchUiMetadata;
}

export interface ComparisonBaselineDocument {
  project: Project;
  capturedAt: string;
}

export interface CompositeLibraryDocument {
  version: 1;
  entries: CompositeLibraryEntry[];
}

export interface PersistedWorkspaceDocument {
  version: 1;
  activeProjectId: string;
  showPalette: boolean;
  showInspector: boolean;
  documentsByProjectId: Record<string, WorkbenchDocument>;
  comparisonBaselinesByProjectId: Record<string, ComparisonBaselineDocument | null>;
  activeChallengeIdByProjectId: Record<string, string | null>;
  activeTutorialIdByProjectId: Record<string, string | null>;
  activeTutorialStepByProjectId: Record<string, number>;
  completedTutorialsByProjectId: Record<string, string[]>;
  workspaceModeByProjectId?: Record<string, WorkspaceMode>;
  cryptanalysisModeByProjectId?: Record<string, CryptanalysisMode>;
  cryptanalysisInputByProjectId?: Record<string, string>;
  modernAnalysisBaselineByProjectId?: Record<string, string>;
  modernAnalysisFlipBitByProjectId?: Record<string, number>;
  tickedModeByProjectId?: Record<string, boolean>;
  currentTickByProjectId?: Record<string, number>;
  tickPlaybackSpeedMsByProjectId?: Record<string, number>;
  challengeLibrary: GuidedChallenge[];
  tutorialLibrary: GuidedTutorial[];
  compositeLibrary: CompositeLibraryDocument;
}
