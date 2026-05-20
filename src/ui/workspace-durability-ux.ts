import type {
  AutosaveSnapshotDocument,
  WorkspaceExportStatus,
  WorkspaceFileBinding,
  WorkbenchDocument,
} from './workbench-document';

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
  fileBinding,
}: {
  exportStatus: WorkspaceExportStatus | null | undefined;
  currentFingerprint: string | null;
  fileBinding?: WorkspaceFileBinding | null;
}) {
  if (!currentFingerprint) {
    return false;
  }

  if (fileBinding?.status === 'confirmed') {
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
  fileBinding,
}: {
  persistenceWarning: string | null;
  autosaveSnapshots: AutosaveSnapshotDocument[];
  exportStatus: WorkspaceExportStatus | null | undefined;
  currentFingerprint: string | null;
  fileBinding?: WorkspaceFileBinding | null;
}): WorkspaceDurabilitySummary {
  return {
    modeLabel: persistenceWarning ? 'Degraded local save mode' : 'Durable local save active',
    statusTone: persistenceWarning ? 'degraded' : 'healthy',
    latestRecoverySnapshot: autosaveSnapshots[0] ?? null,
    showExportReminder: shouldShowExportReminder({ exportStatus, currentFingerprint, fileBinding }),
  };
}
