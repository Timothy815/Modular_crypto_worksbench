import { describe, expect, it } from 'vitest';

import type { AutosaveSnapshotDocument, WorkspaceExportStatus } from './workbench-document';
import {
  buildWorkspaceDurabilitySummary,
  createWorkspaceDocumentFingerprint,
  RESTORE_AUTOSAVE_CONFIRMATION_MESSAGE,
  shouldShowExportReminder,
} from './workspace-durability-ux';

const snapshot: AutosaveSnapshotDocument = {
  id: 'autosave-1',
  projectId: 'demo',
  savedAt: '2026-05-20T12:00:00.000Z',
  tickedMode: false,
  document: {
    version: 1,
    project: { modules: [], connections: [] },
    ui: {
      layout: {},
      annotations: [],
    },
  },
};

describe('workspace durability UX', () => {
  it('shows the export reminder until a matching export fingerprint exists', () => {
    const fingerprint = createWorkspaceDocumentFingerprint(snapshot.document);
    const noExport: WorkspaceExportStatus = {
      lastExportedAt: null,
      exportedFingerprint: null,
    };
    const matchingExport: WorkspaceExportStatus = {
      lastExportedAt: '2026-05-20T12:10:00.000Z',
      exportedFingerprint: fingerprint,
    };
    const staleExport: WorkspaceExportStatus = {
      lastExportedAt: '2026-05-20T12:10:00.000Z',
      exportedFingerprint: `${fingerprint}-older`,
    };

    expect(shouldShowExportReminder({ exportStatus: noExport, currentFingerprint: fingerprint })).toBe(true);
    expect(shouldShowExportReminder({ exportStatus: staleExport, currentFingerprint: fingerprint })).toBe(true);
    expect(shouldShowExportReminder({ exportStatus: matchingExport, currentFingerprint: fingerprint })).toBe(false);
    expect(
      shouldShowExportReminder({
        exportStatus: noExport,
        currentFingerprint: fingerprint,
        fileBinding: { fileName: 'lab.mcw.json', status: 'confirmed' },
      }),
    ).toBe(false);
  });

  it('derives healthy and degraded durability summaries from live state', () => {
    const fingerprint = createWorkspaceDocumentFingerprint(snapshot.document);
    const healthy = buildWorkspaceDurabilitySummary({
      persistenceWarning: null,
      autosaveSnapshots: [snapshot],
      exportStatus: {
        lastExportedAt: '2026-05-20T12:10:00.000Z',
        exportedFingerprint: fingerprint,
      },
      currentFingerprint: fingerprint,
      fileBinding: { fileName: 'lab.mcw.json', status: 'confirmed' },
    });
    const degraded = buildWorkspaceDurabilitySummary({
      persistenceWarning:
        'Durable local storage is unavailable in this browser session. MCW is using weaker local protection, and export is recommended now.',
      autosaveSnapshots: [],
      exportStatus: {
        lastExportedAt: null,
        exportedFingerprint: null,
      },
      currentFingerprint: fingerprint,
    });

    expect(healthy.modeLabel).toBe('Durable local save active');
    expect(healthy.latestRecoverySnapshot?.id).toBe('autosave-1');
    expect(healthy.showExportReminder).toBe(false);

    expect(degraded.modeLabel).toBe('Degraded local save mode');
    expect(degraded.latestRecoverySnapshot).toBeNull();
    expect(degraded.showExportReminder).toBe(true);
  });

  it('keeps restore copy explicit about replacement and local scope', () => {
    expect(RESTORE_AUTOSAVE_CONFIRMATION_MESSAGE).toMatch(/replaced/i);
    expect(RESTORE_AUTOSAVE_CONFIRMATION_MESSAGE).toMatch(/local snapshot/i);
    expect(RESTORE_AUTOSAVE_CONFIRMATION_MESSAGE).toMatch(/not a remote backup/i);
  });
});
