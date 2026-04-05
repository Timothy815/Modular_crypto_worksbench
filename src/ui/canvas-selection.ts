export interface SelectionBoxRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const CANVAS_NODE_WIDTH = 144;
export const CANVAS_NODE_HEIGHT = 120;

export function normalizeSelectionBoxRect({
  startX,
  startY,
  currentX,
  currentY,
}: {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}): SelectionBoxRect {
  return {
    left: Math.min(startX, currentX),
    top: Math.min(startY, currentY),
    right: Math.max(startX, currentX),
    bottom: Math.max(startY, currentY),
  };
}

function rectsIntersect(a: SelectionBoxRect, b: SelectionBoxRect) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

export function getModulesInSelectionBox({
  moduleIds,
  layout,
  box,
}: {
  moduleIds: string[];
  layout: Record<string, { x: number; y: number }>;
  box: SelectionBoxRect;
}) {
  return moduleIds
    .filter((moduleId) => {
      const position = layout[moduleId];
      if (!position) {
        return false;
      }

      return rectsIntersect(box, {
        left: position.x,
        top: position.y,
        right: position.x + CANVAS_NODE_WIDTH,
        bottom: position.y + CANVAS_NODE_HEIGHT,
      });
    })
    .sort((leftId, rightId) => {
      const left = layout[leftId] ?? { x: 0, y: 0 };
      const right = layout[rightId] ?? { x: 0, y: 0 };
      if (left.x !== right.x) {
        return left.x - right.x;
      }
      return left.y - right.y;
    });
}
