import { parseWorkbenchDocument } from './persistence';
import type { WorkbenchDocument, WorkspaceFileBinding } from './workbench-document';
import type { WorkspaceDocumentStore } from './workspace-durability';

interface WorkspaceLocalDocumentFile {
  text(): Promise<string>;
}

interface WorkspaceLocalDocumentWritable {
  write(contents: string): Promise<void>;
  close(): Promise<void>;
}

export interface WorkspaceLocalDocumentFileHandle {
  name: string;
  getFile(): Promise<WorkspaceLocalDocumentFile>;
  createWritable(): Promise<WorkspaceLocalDocumentWritable>;
  queryPermission?: (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;
  isSameEntry?: (other: WorkspaceLocalDocumentFileHandle) => Promise<boolean>;
}

interface WorkspaceLocalDocumentApi {
  showOpenFilePicker?: (options?: unknown) => Promise<WorkspaceLocalDocumentFileHandle[]>;
  showSaveFilePicker?: (options?: unknown) => Promise<WorkspaceLocalDocumentFileHandle>;
}

export interface OpenWorkspaceFromLocalFileResult {
  kind: 'opened' | 'cancelled' | 'unsupported' | 'invalid';
  fileName?: string;
  document?: WorkbenchDocument;
  handle?: WorkspaceLocalDocumentFileHandle;
  error?: string;
}

export interface SaveWorkspaceToLocalFileResult {
  kind: 'saved' | 'cancelled' | 'unsupported' | 'needs-reconfirm';
  binding?: WorkspaceFileBinding;
  error?: string;
}

function getBrowserApi(api?: WorkspaceLocalDocumentApi): WorkspaceLocalDocumentApi | undefined {
  if (api) {
    return api;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return window as unknown as WorkspaceLocalDocumentApi;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function ensureReadWritePermission(
  handle: WorkspaceLocalDocumentFileHandle,
): Promise<boolean> {
  const descriptor = { mode: 'readwrite' as const };
  const permission =
    (await handle.queryPermission?.(descriptor)) ??
    (await handle.requestPermission?.(descriptor)) ??
    'granted';
  if (permission === 'granted') {
    return true;
  }

  const requested = await handle.requestPermission?.(descriptor);
  return requested === 'granted';
}

function serializeWorkbenchDocument(document: WorkbenchDocument) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function normalizeWorkspaceFileName(suggestedName: string) {
  const trimmed = suggestedName.trim() || 'workspace';
  if (trimmed.endsWith('.mcw.json') || trimmed.endsWith('.json')) {
    return trimmed;
  }

  return `${trimmed}.mcw.json`;
}

export function isLocalDocumentWorkflowSupported(api?: WorkspaceLocalDocumentApi) {
  const browserApi = getBrowserApi(api);
  return Boolean(browserApi?.showOpenFilePicker && browserApi?.showSaveFilePicker);
}

export async function openWorkspaceFromLocalFile(
  api?: WorkspaceLocalDocumentApi,
): Promise<OpenWorkspaceFromLocalFileResult> {
  const browserApi = getBrowserApi(api);
  if (!browserApi?.showOpenFilePicker) {
    return {
      kind: 'unsupported',
      error:
        'Direct local workspace opening is unavailable in this browser. Use Import Workspace or Export Workspace instead.',
    };
  }

  try {
    const [handle] = await browserApi.showOpenFilePicker({
      excludeAcceptAllOption: false,
      multiple: false,
      types: [
        {
          description: 'MCW Workspace',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });
    if (!handle) {
      return { kind: 'cancelled' };
    }

    const file = await handle.getFile();
    const parsed = parseWorkbenchDocument(await file.text());
    if (!parsed) {
      return {
        kind: 'invalid',
        error: 'Selected file is not a valid MCW workspace file.',
      };
    }

    return {
      kind: 'opened',
      fileName: handle.name,
      document: parsed,
      handle,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { kind: 'cancelled' };
    }
    return {
      kind: 'invalid',
      error: 'Unable to open the selected local workspace file.',
    };
  }
}

export async function saveWorkspaceToLocalFileAs({
  projectId,
  document,
  suggestedName,
  store,
  api,
}: {
  projectId: string;
  document: WorkbenchDocument;
  suggestedName: string;
  store: WorkspaceDocumentStore | null;
  api?: WorkspaceLocalDocumentApi;
}): Promise<SaveWorkspaceToLocalFileResult> {
  const browserApi = getBrowserApi(api);
  if (!browserApi?.showSaveFilePicker || !store) {
    return {
      kind: 'unsupported',
      error:
        'Direct local workspace saving is unavailable in this browser. Use Export Workspace for a portable file instead.',
    };
  }

  try {
    const handle = await browserApi.showSaveFilePicker({
      excludeAcceptAllOption: false,
      suggestedName: normalizeWorkspaceFileName(suggestedName),
      types: [
        {
          description: 'MCW Workspace',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });
    await writeWorkspaceDocumentToHandle(handle, document);
    await store.saveWorkspaceFileHandle(projectId, handle as unknown as FileSystemFileHandle);
    return {
      kind: 'saved',
      binding: {
        fileName: handle.name,
        status: 'confirmed',
      },
    };
  } catch (error) {
    if (isAbortError(error)) {
      return { kind: 'cancelled' };
    }
    return {
      kind: 'unsupported',
      error: 'Unable to write the workspace to the selected local file.',
    };
  }
}

async function writeWorkspaceDocumentToHandle(
  handle: WorkspaceLocalDocumentFileHandle,
  document: WorkbenchDocument,
) {
  const writable = await handle.createWritable();
  await writable.write(serializeWorkbenchDocument(document));
  await writable.close();
}

export async function saveWorkspaceToBoundLocalFile({
  projectId,
  document,
  binding,
  store,
}: {
  projectId: string;
  document: WorkbenchDocument;
  binding: WorkspaceFileBinding | null;
  store: WorkspaceDocumentStore | null;
}): Promise<SaveWorkspaceToLocalFileResult> {
  if (!store || !binding) {
    return {
      kind: 'unsupported',
      error:
        'This workspace is not currently file-bound. Use Save As... or Export Workspace instead.',
    };
  }

  const handle = (await store.loadWorkspaceFileHandle(projectId)) as
    | WorkspaceLocalDocumentFileHandle
    | null;
  if (!handle) {
    return { kind: 'needs-reconfirm' };
  }

  const hasPermission = await ensureReadWritePermission(handle);
  if (!hasPermission) {
    return { kind: 'needs-reconfirm' };
  }
  try {
    await writeWorkspaceDocumentToHandle(handle, document);
    return {
      kind: 'saved',
      binding: {
        fileName: binding.fileName || handle.name,
        status: 'confirmed',
      },
    };
  } catch {
    return {
      kind: 'unsupported',
      error: 'Unable to write the workspace to the bound local file.',
    };
  }
}
