import type { AutosaveSnapshotDocument, WorkspaceExportStatus, WorkbenchDocument } from './workbench-document';

export interface WorkspaceDurabilitySummary {
  modeLabel: string;
  statusTone: 'healthy' | 'degraded';
  latestRecoverySnapshot: AutosaveSnapshotDocument | null;
  showExportReminder: boolean;
}

export const RESTORE_AUTOSAVE_CONFIRMATION_MESSAGE =
  'Restore this recent autosave? The current live workspace will be replaced by this local snapshot. This is not a remote backup.';

export function createWorkspaceDocumentFingerprint(document: WorkbenchDocument | null): string | null {
  return document ? JSON.stringify(document) : null;
}

export function shouldShowExportReminder({
  exportStatus,
  currentFingerprint,
}: {
  exportStatus: WorkspaceExportStatus | null | undefined;
  currentFingerprint: string | null;
}) {
  if (!currentFingerprint) {
    return false;
  }

  if (!exportStatus?.lastExportedAt || !exportStatus.exportedFingerprint) {
    return true;
  }

  return exportStatus.exportedFingerprint !== currentFingerprint;
}

export function buildWorkspaceDurabilitySummary({
  persistenceWarning,
  autosaveSnapshots,
  exportStatus,
  currentFingerprint,
}: {
  persistenceWarning: string | null;
  autosaveSnapshots: AutosaveSnapshotDocument[];
  exportStatus: WorkspaceExportStatus | null | undefined;
  currentFingerprint: string | null;
}): WorkspaceDurabilitySummary {
  return {
    modeLabel: persistenceWarning ? 'Degraded local save mode' : 'Durable local save active',
    statusTone: persistenceWarning ? 'degraded' : 'healthy',
    latestRecoverySnapshot: autosaveSnapshots[0] ?? null,
    showExportReminder: shouldShowExportReminder({ exportStatus, currentFingerprint }),
  };
}
