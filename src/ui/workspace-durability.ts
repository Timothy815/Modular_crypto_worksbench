import type { DemoProject } from './demo-projects';
import {
  buildPersistedWorkspace,
  loadWorkspaceFromStorage,
  WORKSPACE_STORAGE_KEY,
} from './persistence';
import type { UiState } from './store';
import type {
  AutosaveSnapshotDocument,
  PersistedWorkspaceDocument,
} from './workbench-document';
import type { VerificationCase } from './verification-workflow';
import { buildWorkbenchDocument } from './workspace-state-support';

const WORKSPACE_DATABASE_NAME = 'mcw-workspace-documents';
const WORKSPACE_DATABASE_VERSION = 1;
const WORKSPACE_DOCUMENT_STORE = 'workspace-documents';
const AUTOSAVE_STORE = 'workspace-autosaves';
const CURRENT_WORKSPACE_DOCUMENT_KEY = 'current-workspace';
const DEFAULT_AUTOSAVE_LIMIT = 5;

interface StoredWorkspaceDocumentRecord {
  key: string;
  document: PersistedWorkspaceDocument;
  savedAt: string;
}

export interface WorkspaceDurabilityWarning {
  level: 'warning';
  message: string;
}

export interface WorkspaceDocumentStore {
  loadCurrentWorkspace(): Promise<PersistedWorkspaceDocument | null>;
  saveCurrentWorkspace(document: PersistedWorkspaceDocument): Promise<void>;
  listAutosaves(projectId: string): Promise<AutosaveSnapshotDocument[]>;
  saveAutosave(
    snapshot: AutosaveSnapshotDocument,
    maxSnapshotsPerWorkspace: number,
  ): Promise<AutosaveSnapshotDocument[]>;
}

export interface DurableWorkspaceBootstrapResult {
  workspace: PersistedWorkspaceDocument | null;
  warning: WorkspaceDurabilityWarning | null;
}

export interface PersistWorkspaceDurablyResult {
  autosaves: AutosaveSnapshotDocument[];
  warning: WorkspaceDurabilityWarning | null;
}

export class MemoryWorkspaceDocumentStore implements WorkspaceDocumentStore {
  private currentWorkspace: PersistedWorkspaceDocument | null = null;

  private autosavesByProjectId = new Map<string, AutosaveSnapshotDocument[]>();

  async loadCurrentWorkspace(): Promise<PersistedWorkspaceDocument | null> {
    return this.currentWorkspace ? JSON.parse(JSON.stringify(this.currentWorkspace)) : null;
  }

  async saveCurrentWorkspace(document: PersistedWorkspaceDocument): Promise<void> {
    this.currentWorkspace = JSON.parse(JSON.stringify(document)) as PersistedWorkspaceDocument;
  }

  async listAutosaves(projectId: string): Promise<AutosaveSnapshotDocument[]> {
    return (this.autosavesByProjectId.get(projectId) ?? []).map(cloneAutosaveSnapshot);
  }

  async saveAutosave(
    snapshot: AutosaveSnapshotDocument,
    maxSnapshotsPerWorkspace: number,
  ): Promise<AutosaveSnapshotDocument[]> {
    const nextSnapshots = [
      ...(this.autosavesByProjectId.get(snapshot.projectId) ?? []).filter(
        (candidate) => candidate.id !== snapshot.id,
      ),
      cloneAutosaveSnapshot(snapshot),
    ]
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .slice(0, maxSnapshotsPerWorkspace);
    this.autosavesByProjectId.set(snapshot.projectId, nextSnapshots);
    return nextSnapshots.map(cloneAutosaveSnapshot);
  }
}

function cloneAutosaveSnapshot(snapshot: AutosaveSnapshotDocument): AutosaveSnapshotDocument {
  return JSON.parse(JSON.stringify(snapshot)) as AutosaveSnapshotDocument;
}

function createDurabilityWarning(message: string): WorkspaceDurabilityWarning {
  return {
    level: 'warning',
    message,
  };
}

function indexedDbIsAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== undefined;
}

function openWorkspaceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!indexedDbIsAvailable()) {
      reject(new Error('IndexedDB unavailable.'));
      return;
    }

    const request = window.indexedDB.open(WORKSPACE_DATABASE_NAME, WORKSPACE_DATABASE_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Unable to open workspace database.'));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(WORKSPACE_DOCUMENT_STORE)) {
        database.createObjectStore(WORKSPACE_DOCUMENT_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(AUTOSAVE_STORE)) {
        const autosaveStore = database.createObjectStore(AUTOSAVE_STORE, { keyPath: 'id' });
        autosaveStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.oncomplete = () => resolve();
  });
}

class BrowserWorkspaceDocumentStore implements WorkspaceDocumentStore {
  async loadCurrentWorkspace(): Promise<PersistedWorkspaceDocument | null> {
    const database = await openWorkspaceDatabase();
    try {
      const transaction = database.transaction(WORKSPACE_DOCUMENT_STORE, 'readonly');
      const store = transaction.objectStore(WORKSPACE_DOCUMENT_STORE);
      const record = await requestToPromise(
        store.get(CURRENT_WORKSPACE_DOCUMENT_KEY),
      ) as StoredWorkspaceDocumentRecord | undefined;
      await transactionDone(transaction);
      return record?.document ?? null;
    } finally {
      database.close();
    }
  }

  async saveCurrentWorkspace(document: PersistedWorkspaceDocument): Promise<void> {
    const database = await openWorkspaceDatabase();
    try {
      const transaction = database.transaction(WORKSPACE_DOCUMENT_STORE, 'readwrite');
      const store = transaction.objectStore(WORKSPACE_DOCUMENT_STORE);
      store.put({
        key: CURRENT_WORKSPACE_DOCUMENT_KEY,
        document,
        savedAt: new Date().toISOString(),
      } satisfies StoredWorkspaceDocumentRecord);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  async listAutosaves(projectId: string): Promise<AutosaveSnapshotDocument[]> {
    const database = await openWorkspaceDatabase();
    try {
      const transaction = database.transaction(AUTOSAVE_STORE, 'readonly');
      const store = transaction.objectStore(AUTOSAVE_STORE);
      const index = store.index('projectId');
      const snapshots = (await requestToPromise(
        index.getAll(projectId),
      )) as AutosaveSnapshotDocument[];
      await transactionDone(transaction);
      return snapshots.sort((left, right) => right.savedAt.localeCompare(left.savedAt));
    } finally {
      database.close();
    }
  }

  async saveAutosave(
    snapshot: AutosaveSnapshotDocument,
    maxSnapshotsPerWorkspace: number,
  ): Promise<AutosaveSnapshotDocument[]> {
    const database = await openWorkspaceDatabase();
    try {
      const existingSnapshots = await this.listAutosaves(snapshot.projectId);
      const transaction = database.transaction(AUTOSAVE_STORE, 'readwrite');
      const store = transaction.objectStore(AUTOSAVE_STORE);
      store.put(snapshot);
      const retainedIds = new Set(
        [snapshot, ...existingSnapshots]
          .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
          .slice(0, maxSnapshotsPerWorkspace)
          .map((candidate) => candidate.id),
      );
      for (const candidate of existingSnapshots) {
        if (!retainedIds.has(candidate.id)) {
          store.delete(candidate.id);
        }
      }
      await transactionDone(transaction);
      return this.listAutosaves(snapshot.projectId);
    } finally {
      database.close();
    }
  }
}

let browserWorkspaceDocumentStore: WorkspaceDocumentStore | null = null;

export function getWorkspaceDocumentStore(): WorkspaceDocumentStore | null {
  if (!indexedDbIsAvailable()) {
    return null;
  }
  browserWorkspaceDocumentStore ??= new BrowserWorkspaceDocumentStore();
  return browserWorkspaceDocumentStore;
}

export async function bootstrapDurableWorkspace({
  projects,
  store,
  storage = typeof window === 'undefined' ? undefined : window.localStorage,
}: {
  projects: DemoProject[];
  store?: WorkspaceDocumentStore | null;
  storage?: Storage;
}): Promise<DurableWorkspaceBootstrapResult> {
  const workspaceStore = store ?? getWorkspaceDocumentStore();
  const legacyWorkspace = storage ? loadWorkspaceFromStorage(projects, storage) : null;
  if (!workspaceStore) {
    return {
      workspace: legacyWorkspace,
      warning: createDurabilityWarning(
        'Durable local recovery is unavailable in this browser session. Export remains the safest backup.',
      ),
    };
  }

  try {
    const persistedWorkspace = await workspaceStore.loadCurrentWorkspace();
    if (persistedWorkspace) {
      return { workspace: persistedWorkspace, warning: null };
    }
    if (legacyWorkspace) {
      await workspaceStore.saveCurrentWorkspace(legacyWorkspace);
      return { workspace: legacyWorkspace, warning: null };
    }
    return { workspace: null, warning: null };
  } catch {
    return {
      workspace: legacyWorkspace,
      warning: createDurabilityWarning(
        'Durable local recovery is temporarily unavailable. Work still saves in browser-local compatibility storage, but export remains important.',
      ),
    };
  }
}

export async function persistWorkspaceDurably({
  state,
  verificationCasesByProjectId,
  activeProjectId,
  store,
  storage = typeof window === 'undefined' ? undefined : window.localStorage,
  maxAutosavesPerWorkspace = DEFAULT_AUTOSAVE_LIMIT,
  skipAutosave = false,
}: {
  state: UiState;
  verificationCasesByProjectId: Record<string, VerificationCase[]>;
  activeProjectId: string;
  store?: WorkspaceDocumentStore | null;
  storage?: Storage;
  maxAutosavesPerWorkspace?: number;
  skipAutosave?: boolean;
}): Promise<PersistWorkspaceDurablyResult> {
  const persistedWorkspace = buildPersistedWorkspace(state, verificationCasesByProjectId);
  if (storage) {
    storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(persistedWorkspace));
  }

  const workspaceStore = store ?? getWorkspaceDocumentStore();
  if (!workspaceStore) {
    return {
      autosaves: [],
      warning: createDurabilityWarning(
        'Durable local recovery is unavailable in this browser session. Export remains the safest backup.',
      ),
    };
  }

  const document = buildWorkbenchDocument(state, activeProjectId);
  if (!document) {
    await workspaceStore.saveCurrentWorkspace(persistedWorkspace);
    return { autosaves: [], warning: null };
  }

  try {
    await workspaceStore.saveCurrentWorkspace(persistedWorkspace);
    if (skipAutosave) {
      return {
        autosaves: await workspaceStore.listAutosaves(activeProjectId),
        warning: null,
      };
    }
    const snapshot: AutosaveSnapshotDocument = {
      id: `${activeProjectId}-autosave-${Date.now()}`,
      projectId: activeProjectId,
      savedAt: new Date().toISOString(),
      tickedMode: state.tickedModeByProject[activeProjectId] ?? false,
      document,
    };
    const autosaves = await workspaceStore.saveAutosave(snapshot, maxAutosavesPerWorkspace);
    return { autosaves, warning: null };
  } catch {
    return {
      autosaves: [],
      warning: createDurabilityWarning(
        'Durable local recovery is temporarily unavailable. Work still saves in browser-local compatibility storage, but export remains important.',
      ),
    };
  }
}

export async function loadWorkspaceAutosaves(
  projectId: string,
  store?: WorkspaceDocumentStore | null,
): Promise<AutosaveSnapshotDocument[]> {
  const workspaceStore = store ?? getWorkspaceDocumentStore();
  if (!workspaceStore) {
    return [];
  }

  try {
    return await workspaceStore.listAutosaves(projectId);
  } catch {
    return [];
  }
}
