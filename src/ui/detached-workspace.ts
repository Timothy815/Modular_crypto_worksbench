import type { CompositeLibraryEntry } from '../engine/composites';
import type { ExecutionResult, Project, ValidationIssue } from '../engine/types';
import type {
  WorkbenchAnnotation,
  WorkbenchGuideRail,
  WorkbenchGroupBox,
  WorkbenchLayoutDirection,
  WorkbenchPosition,
  WorkbenchRoutingMode,
  WorkbenchStageLabel,
  WorkbenchWireColorMode,
} from './workbench-document';
import type { ThemeMode } from './multi-window';

export const DETACHED_WORKSPACE_CHANNEL_NAME = 'mcw-detached-workspace-v1';
export const DETACHED_WORKSPACE_QUERY_KEY = 'detachedWorkspace';
export const DETACHED_WORKSPACE_HOST_QUERY_KEY = 'hostId';
export const DETACHED_WORKSPACE_WINDOW_QUERY_KEY = 'workspaceWindowId';
export const DETACHED_WORKSPACE_PROJECT_QUERY_KEY = 'projectId';

export interface DetachedWorkspaceSnapshot {
  hostId: string;
  workspaceWindowId: string;
  projectId: string;
  projectName: string;
  projectGroup?: string;
  summary: string;
  pipeline: string;
  theme: ThemeMode;
  compositeLibrary: CompositeLibraryEntry[];
  project: Project;
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
  stageLabels: WorkbenchStageLabel[];
  groupBoxes: WorkbenchGroupBox[];
  guideRails: WorkbenchGuideRail[];
  showFurniture: boolean;
  showOverviewNavigator: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  layoutDirection: WorkbenchLayoutDirection;
  routingMode: WorkbenchRoutingMode;
  wireColorMode: WorkbenchWireColorMode;
  execution: ExecutionResult | null;
  executionError: string | null;
  validationIssues: ValidationIssue[];
}

export type DetachedWorkspaceMessage =
  | {
      type: 'requestSnapshot';
      hostId: string;
      workspaceWindowId: string;
      projectId: string;
    }
  | {
      type: 'snapshot';
      snapshot: DetachedWorkspaceSnapshot;
    }
  | {
      type: 'workspaceWindowClosed';
      hostId: string;
      workspaceWindowId: string;
    }
  | {
      type: 'hostClosed';
      hostId: string;
      workspaceWindowId: string;
    };

export function createDetachedWorkspaceUrl(
  currentHref: string,
  hostId: string,
  workspaceWindowId: string,
  projectId: string,
) {
  const url = new URL(currentHref);
  url.searchParams.delete('manual');
  url.searchParams.delete('instructorPilot');
  url.searchParams.delete('detachedPanel');
  url.searchParams.delete('panelWindowId');
  url.searchParams.set(DETACHED_WORKSPACE_QUERY_KEY, '1');
  url.searchParams.set(DETACHED_WORKSPACE_HOST_QUERY_KEY, hostId);
  url.searchParams.set(DETACHED_WORKSPACE_WINDOW_QUERY_KEY, workspaceWindowId);
  url.searchParams.set(DETACHED_WORKSPACE_PROJECT_QUERY_KEY, projectId);
  return url.toString();
}

export function createDetachedWorkspaceWindowName(
  workspaceWindowId: string,
  projectId: string,
) {
  return `mcw-workspace-${projectId}-${workspaceWindowId}`;
}
