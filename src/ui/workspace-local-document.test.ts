import { describe, expect, it } from 'vitest';

import { MemoryWorkspaceDocumentStore } from './workspace-durability';
import {
  openWorkspaceFromLocalFile,
  saveWorkspaceToBoundLocalFile,
  saveWorkspaceToLocalFileAs,
  type WorkspaceLocalDocumentFileHandle,
} from './workspace-local-document';
import type { WorkbenchDocument } from './workbench-document';

const document: WorkbenchDocument = {
  version: 1,
  project: { modules: [], connections: [] },
  ui: {
    layout: {},
    annotations: [],
  },
};

function createMockHandle({
  name = 'mark-2.mcw.json',
  rawValue = JSON.stringify(document),
  permission = 'granted' as PermissionState,
}: {
  name?: string;
  rawValue?: string;
  permission?: PermissionState;
} = {}): WorkspaceLocalDocumentFileHandle & { writes: string[] } {
  const writes: string[] = [];
  return {
    name,
    writes,
    async getFile() {
      return {
        async text() {
          return rawValue;
        },
      };
    },
    async createWritable() {
      return {
        async write(contents: string) {
          writes.push(contents);
        },
        async close() {
          return undefined;
        },
      };
    },
    async queryPermission() {
      return permission;
    },
    async requestPermission() {
      return permission;
    },
  };
}

describe('workspace local document workflow', () => {
  it('opens a valid workspace document through the picker boundary', async () => {
    const handle = createMockHandle();
    const result = await openWorkspaceFromLocalFile({
      async showOpenFilePicker() {
        return [handle];
      },
    });

    expect(result.kind).toBe('opened');
    expect(result.fileName).toBe('mark-2.mcw.json');
    expect(result.document?.project.modules).toHaveLength(0);
  });

  it('saves as a local file and stores the handle for later saves', async () => {
    const store = new MemoryWorkspaceDocumentStore();
    const handle = createMockHandle();
    const result = await saveWorkspaceToLocalFileAs({
      projectId: 'mark-2',
      document,
      suggestedName: 'mark-2',
      store,
      api: {
        async showSaveFilePicker() {
          return handle;
        },
      },
    });

    expect(result.kind).toBe('saved');
    expect(result.binding).toEqual({
      fileName: 'mark-2.mcw.json',
      status: 'confirmed',
    });
    expect(handle.writes[0]).toContain('"version": 1');
    expect(await store.loadWorkspaceFileHandle('mark-2')).not.toBeNull();
  });

  it('writes back to the bound file when a confirmed binding exists', async () => {
    const store = new MemoryWorkspaceDocumentStore();
    const handle = createMockHandle();
    await store.saveWorkspaceFileHandle('mark-2', handle as unknown as FileSystemFileHandle);

    const result = await saveWorkspaceToBoundLocalFile({
      projectId: 'mark-2',
      document,
      binding: {
        fileName: 'mark-2.mcw.json',
        status: 'needs-reconfirm',
      },
      store,
    });

    expect(result.kind).toBe('saved');
    expect(result.binding?.status).toBe('confirmed');
    expect(handle.writes).toHaveLength(1);
  });

  it('honestly reports unsupported direct-open/save on browsers without file APIs', async () => {
    const openResult = await openWorkspaceFromLocalFile({});
    const saveResult = await saveWorkspaceToLocalFileAs({
      projectId: 'demo',
      document,
      suggestedName: 'demo',
      store: null,
      api: {},
    });

    expect(openResult.kind).toBe('unsupported');
    expect(saveResult.kind).toBe('unsupported');
  });
});
