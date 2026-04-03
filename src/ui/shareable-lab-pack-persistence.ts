import type { ShareableLabPack, WorkbenchDocument } from './workbench-document';

export function downloadShareableLabPack(
  fileNameStem: string,
  pack: ShareableLabPack,
): void {
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileNameStem}.labpack.mcw.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseShareableLabPack(rawValue: string): ShareableLabPack | null {
  try {
    const parsed = JSON.parse(rawValue);
    return isShareableLabPack(parsed) ? (parsed as ShareableLabPack) : null;
  } catch {
    return null;
  }
}

function isShareableLabPack(value: unknown): value is ShareableLabPack {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ShareableLabPack>;
  return (
    candidate.version === 1 &&
    candidate.kind === 'mcw-shareable-lab-pack' &&
    typeof candidate.metadata === 'object' &&
    candidate.metadata !== null &&
    typeof candidate.metadata.id === 'string' &&
    typeof candidate.metadata.title === 'string' &&
    typeof candidate.metadata.summary === 'string' &&
    (candidate.metadata.author === undefined || typeof candidate.metadata.author === 'string') &&
    (candidate.metadata.source === undefined || typeof candidate.metadata.source === 'string') &&
    typeof candidate.metadata.exportedAt === 'string' &&
    isWorkbenchDocument(candidate.workspace)
  );
}

function isWorkbenchDocument(value: unknown): value is WorkbenchDocument {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as WorkbenchDocument;
  return (
    candidate.version === 1 &&
    typeof candidate.project === 'object' &&
    candidate.project !== null &&
    Array.isArray(candidate.project.modules) &&
    Array.isArray(candidate.project.connections) &&
    typeof candidate.ui === 'object' &&
    candidate.ui !== null &&
    typeof candidate.ui.layout === 'object' &&
    candidate.ui.layout !== null &&
    Array.isArray(candidate.ui.annotations) &&
    (candidate.ui.layoutDirection === undefined ||
      candidate.ui.layoutDirection === 'horizontal' ||
      candidate.ui.layoutDirection === 'vertical') &&
    (candidate.ui.routingMode === undefined ||
      candidate.ui.routingMode === 'curved' ||
      candidate.ui.routingMode === 'orthogonal') &&
    isConnectionLayoutMap(candidate.ui.connectionLayout)
  );
}

function isConnectionLayoutMap(value: unknown) {
  return (
    value === undefined ||
    (typeof value === 'object' &&
      value !== null &&
      Object.values(value).every((layout) => {
        if (typeof layout !== 'object' || layout === null) {
          return false;
        }

        const bend = (layout as { orthogonalBend?: { axis?: unknown; value?: unknown } })
          .orthogonalBend;
        return (
          bend === undefined ||
          ((bend.axis === 'x' || bend.axis === 'y') && typeof bend.value === 'number')
        );
      }))
  );
}
