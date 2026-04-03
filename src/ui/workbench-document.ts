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
}

export interface WorkbenchAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export type WorkbenchLayoutDirection = 'horizontal' | 'vertical';
export type WorkbenchNodeOrientation = 'east' | 'south' | 'west' | 'north';
export type WorkbenchRoutingMode = 'curved' | 'orthogonal';

export interface WorkbenchUiMetadata {
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
  layoutDirection?: WorkbenchLayoutDirection;
  routingMode?: WorkbenchRoutingMode;
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
