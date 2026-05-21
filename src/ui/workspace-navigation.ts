import { MAX_WORKSPACE_ZOOM, clampWorkspaceZoom } from './workspace-viewport';
import type { WorkspaceSavedViewRegion } from './workbench-document';

export const MAX_WORKSPACE_SAVED_VIEW_REGIONS = 8;
const FRAME_PADDING = 80;

export interface WorkspaceViewState {
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
}

export interface WorkspaceFrameRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ComputeViewportForRectArgs {
  rect: WorkspaceFrameRect;
  viewportWidth: number;
  viewportHeight: number;
  maxZoom: number;
  padding?: number;
}

export function computeViewportForRect(args: ComputeViewportForRectArgs): WorkspaceViewState {
  const padding = args.padding ?? FRAME_PADDING;
  const rectWidth = Math.max(1, args.rect.right - args.rect.left);
  const rectHeight = Math.max(1, args.rect.bottom - args.rect.top);
  const availableWidth = Math.max(1, args.viewportWidth - padding);
  const availableHeight = Math.max(1, args.viewportHeight - padding);
  const zoom = clampWorkspaceZoom(
    Math.min(args.maxZoom, availableWidth / rectWidth, availableHeight / rectHeight),
  );
  const centerX = (args.rect.left + args.rect.right) / 2;
  const centerY = (args.rect.top + args.rect.bottom) / 2;
  return {
    zoom,
    scrollLeft: Math.max(0, centerX * zoom - args.viewportWidth / 2),
    scrollTop: Math.max(0, centerY * zoom - args.viewportHeight / 2),
  };
}

export function createWorkspaceSavedViewRegion(
  name: string,
  view: WorkspaceViewState,
): WorkspaceSavedViewRegion {
  return {
    id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    scrollLeft: view.scrollLeft,
    scrollTop: view.scrollTop,
    zoom: clampWorkspaceZoom(view.zoom),
  };
}

export function appendWorkspaceSavedViewRegion(
  regions: WorkspaceSavedViewRegion[],
  region: WorkspaceSavedViewRegion,
): WorkspaceSavedViewRegion[] {
  if (regions.length >= MAX_WORKSPACE_SAVED_VIEW_REGIONS) {
    return regions;
  }
  return [...regions, region];
}

export function isWorkspaceSavedViewRegion(value: unknown): value is WorkspaceSavedViewRegion {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as WorkspaceSavedViewRegion;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.scrollLeft === 'number' &&
    Number.isFinite(candidate.scrollLeft) &&
    typeof candidate.scrollTop === 'number' &&
    Number.isFinite(candidate.scrollTop) &&
    typeof candidate.zoom === 'number' &&
    Number.isFinite(candidate.zoom) &&
    candidate.zoom >= 0.1 &&
    candidate.zoom <= MAX_WORKSPACE_ZOOM
  );
}

export function cloneWorkspaceSavedViewRegions(
  regions: WorkspaceSavedViewRegion[],
): WorkspaceSavedViewRegion[] {
  return regions.map((region) => ({ ...region }));
}
