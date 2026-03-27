export const DEFAULT_WORKSPACE_ZOOM = 1;
export const MIN_WORKSPACE_ZOOM = 0.6;
export const MAX_WORKSPACE_ZOOM = 1.6;
export const WORKSPACE_ZOOM_STEP = 0.2;

export interface WorkspaceViewportPointArgs {
  clientX: number;
  clientY: number;
  canvasLeft: number;
  canvasTop: number;
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
}

export interface WorkspaceModuleFocusArgs {
  moduleX: number;
  moduleY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  nodeWidth: number;
  nodeHeight: number;
}

export interface WorkspaceFitZoomArgs {
  viewportWidth: number;
  viewportHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  padding?: number;
}

export function clampWorkspaceZoom(value: number): number {
  return Math.min(MAX_WORKSPACE_ZOOM, Math.max(MIN_WORKSPACE_ZOOM, Number(value.toFixed(2))));
}

export function getNextWorkspaceZoom(currentZoom: number, direction: 'in' | 'out'): number {
  return clampWorkspaceZoom(
    currentZoom + (direction === 'in' ? WORKSPACE_ZOOM_STEP : -WORKSPACE_ZOOM_STEP),
  );
}

export function getCanvasViewportPoint(args: WorkspaceViewportPointArgs): { x: number; y: number } {
  const safeZoom = args.zoom > 0 ? args.zoom : DEFAULT_WORKSPACE_ZOOM;
  return {
    x: (args.clientX - args.canvasLeft + args.scrollLeft) / safeZoom,
    y: (args.clientY - args.canvasTop + args.scrollTop) / safeZoom,
  };
}

export function getModuleFocusScrollPosition(
  args: WorkspaceModuleFocusArgs,
): { left: number; top: number } {
  const scaledNodeWidth = args.nodeWidth * args.zoom;
  const scaledNodeHeight = args.nodeHeight * args.zoom;
  const scaledX = args.moduleX * args.zoom;
  const scaledY = args.moduleY * args.zoom;

  return {
    left: Math.max(0, scaledX - Math.max(48, args.viewportWidth / 2 - scaledNodeWidth / 2)),
    top: Math.max(0, scaledY - Math.max(32, args.viewportHeight / 2 - scaledNodeHeight / 2)),
  };
}

export function getFitWorkspaceZoom(args: WorkspaceFitZoomArgs): number {
  const padding = args.padding ?? 64;
  const availableWidth = Math.max(1, args.viewportWidth - padding);
  const availableHeight = Math.max(1, args.viewportHeight - padding);
  const widthZoom = availableWidth / Math.max(1, args.canvasWidth);
  const heightZoom = availableHeight / Math.max(1, args.canvasHeight);
  return clampWorkspaceZoom(Math.min(DEFAULT_WORKSPACE_ZOOM, widthZoom, heightZoom));
}
