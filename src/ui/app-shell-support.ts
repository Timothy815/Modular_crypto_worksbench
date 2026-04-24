import {
  DETACHED_PANEL_HOST_QUERY_KEY,
  DETACHED_PANEL_QUERY_KEY,
  DETACHED_PANEL_WINDOW_QUERY_KEY,
  isDetachedPanelKind,
} from './multi-window';
import {
  DETACHED_WORKSPACE_HOST_QUERY_KEY,
  DETACHED_WORKSPACE_PROJECT_QUERY_KEY,
  DETACHED_WORKSPACE_QUERY_KEY,
  DETACHED_WORKSPACE_WINDOW_QUERY_KEY,
} from './detached-workspace';

export function clampDockWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getDetachedPanelConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const kind = url.searchParams.get(DETACHED_PANEL_QUERY_KEY);
  const hostId = url.searchParams.get(DETACHED_PANEL_HOST_QUERY_KEY);
  const panelWindowId = url.searchParams.get(DETACHED_PANEL_WINDOW_QUERY_KEY);

  if (!isDetachedPanelKind(kind) || !hostId || !panelWindowId) {
    return null;
  }

  return { kind, hostId, panelWindowId };
}

export function getDetachedWorkspaceConfig() {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const detachedWorkspace = url.searchParams.get(DETACHED_WORKSPACE_QUERY_KEY);
  const hostId = url.searchParams.get(DETACHED_WORKSPACE_HOST_QUERY_KEY);
  const workspaceWindowId = url.searchParams.get(DETACHED_WORKSPACE_WINDOW_QUERY_KEY);
  const projectId = url.searchParams.get(DETACHED_WORKSPACE_PROJECT_QUERY_KEY);

  if (detachedWorkspace !== '1' || !hostId || !workspaceWindowId || !projectId) {
    return null;
  }

  return { hostId, workspaceWindowId, projectId };
}

function getQueryThemeParam(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const url = new URL(window.location.href);
  return url.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
}

export function getUserManualConfig(): { theme: 'light' | 'dark' } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const manual = url.searchParams.get('manual');
  if (manual !== '1') {
    return null;
  }

  return { theme: getQueryThemeParam() };
}

export function getInstructorPilotConfig(): { theme: 'light' | 'dark' } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const pilot = url.searchParams.get('instructorPilot');
  if (pilot !== '1') {
    return null;
  }

  return { theme: getQueryThemeParam() };
}
