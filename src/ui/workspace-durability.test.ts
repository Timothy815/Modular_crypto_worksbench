import { describe, expect, it } from 'vitest';

import { demoProjects } from './demo-projects';
import { saveWorkspaceToStorage } from './persistence';
import { createInitialUiState, uiReducer } from './store';
import {
  bootstrapDurableWorkspace,
  MemoryWorkspaceDocumentStore,
  persistWorkspaceDurably,
} from './workspace-durability';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('workspace durability', () => {
  it('migrates legacy local storage into the durable workspace store', async () => {
    const storage = new MemoryStorage();
    const store = new MemoryWorkspaceDocumentStore();
    const initialState = createInitialUiState(demoProjects);
    const nextState = uiReducer(initialState, {
      type: 'setLayoutDirection',
      projectId: 'sequential',
      direction: 'vertical',
    });

    saveWorkspaceToStorage(nextState, {}, storage);

    const result = await bootstrapDurableWorkspace({
      projects: demoProjects,
      store,
      storage,
    });
    const persisted = await store.loadCurrentWorkspace();

    expect(result.warning).toBeNull();
    expect(result.savedAt).toMatch(/T/);
    expect(result.workspace?.documentsByProjectId.sequential?.ui.layoutDirection).toBe('vertical');
    expect(persisted?.documentsByProjectId.sequential?.ui.layoutDirection).toBe('vertical');
  });

  it('keeps a bounded autosave ring per workspace', async () => {
    const storage = new MemoryStorage();
    const store = new MemoryWorkspaceDocumentStore();
    let state = createInitialUiState(demoProjects);

    state = uiReducer(state, {
      type: 'setLayoutDirection',
      projectId: 'sequential',
      direction: 'vertical',
    });
    await persistWorkspaceDurably({
      state,
      verificationCasesByProjectId: {},
      activeProjectId: 'sequential',
      store,
      storage,
      maxAutosavesPerWorkspace: 2,
    });

    state = uiReducer(state, {
      type: 'setRoutingMode',
      projectId: 'sequential',
      mode: 'orthogonal',
    });
    await persistWorkspaceDurably({
      state,
      verificationCasesByProjectId: {},
      activeProjectId: 'sequential',
      store,
      storage,
      maxAutosavesPerWorkspace: 2,
    });

    state = uiReducer(state, {
      type: 'setWireColorMode',
      projectId: 'sequential',
      mode: 'high-contrast',
    });
    const result = await persistWorkspaceDurably({
      state,
      verificationCasesByProjectId: {},
      activeProjectId: 'sequential',
      store,
      storage,
      maxAutosavesPerWorkspace: 2,
    });

    expect(result.autosaves).toHaveLength(2);
    expect(result.savedAt).toMatch(/T/);
    expect(result.autosaves[0]?.document.ui.wireColorMode).toBe('high-contrast');
    expect(result.autosaves[1]?.document.ui.routingMode).toBe('orthogonal');
  });

  it('returns a clear warning when durable storage is unavailable', async () => {
    const storage = new MemoryStorage();
    const initialState = createInitialUiState(demoProjects);
    saveWorkspaceToStorage(initialState, {}, storage);

    const result = await bootstrapDurableWorkspace({
      projects: demoProjects,
      store: null,
      storage,
    });

    expect(result.workspace?.activeProjectId).toBe(initialState.activeProjectId);
    expect(result.savedAt).toBeNull();
    expect(result.warning?.message).toMatch(/Durable local storage is unavailable/i);
    expect(result.warning?.message).toMatch(/weaker local protection/i);
    expect(result.warning?.message).toMatch(/export is recommended now/i);
  });
});
