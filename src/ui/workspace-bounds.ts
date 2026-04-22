export interface WorkspaceBounds {
  width: number;
  height: number;
}

export interface ElasticWorkspaceWorldBoundsArgs {
  authoredWidth: number;
  authoredHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface MinimapViewportRectArgs {
  authoredWidth: number;
  authoredHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number;
  zoom: number;
}

const MIN_WORLD_HORIZONTAL_SLACK = 480;
const MIN_WORLD_VERTICAL_SLACK = 720;

export function getElasticWorkspaceWorldBounds(
  args: ElasticWorkspaceWorldBoundsArgs,
): WorkspaceBounds {
  const horizontalSlack = Math.max(MIN_WORLD_HORIZONTAL_SLACK, args.viewportWidth * 0.75);
  const verticalSlack = Math.max(MIN_WORLD_VERTICAL_SLACK, args.viewportHeight * 1.25);

  return {
    width: Math.max(args.authoredWidth, args.authoredWidth + horizontalSlack),
    height: Math.max(args.authoredHeight, args.authoredHeight + verticalSlack),
  };
}

export function getClampedMinimapViewportRect(args: MinimapViewportRectArgs): WorkspaceBounds & {
  left: number;
  top: number;
} {
  const safeZoom = args.zoom > 0 ? args.zoom : 1;
  const contentWidth = args.authoredWidth * args.scale;
  const contentHeight = args.authoredHeight * args.scale;
  const width = Math.min((args.clientWidth / safeZoom) * args.scale, contentWidth);
  const height = Math.min((args.clientHeight / safeZoom) * args.scale, contentHeight);
  const maxLeft = args.offsetX + Math.max(0, contentWidth - width);
  const maxTop = args.offsetY + Math.max(0, contentHeight - height);
  const rawLeft = args.offsetX + (args.scrollLeft / safeZoom) * args.scale;
  const rawTop = args.offsetY + (args.scrollTop / safeZoom) * args.scale;

  return {
    left: Math.min(maxLeft, Math.max(args.offsetX, rawLeft)),
    top: Math.min(maxTop, Math.max(args.offsetY, rawTop)),
    width,
    height,
  };
}
