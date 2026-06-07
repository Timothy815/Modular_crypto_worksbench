import type { ManualThemeMode } from './manual-url';

const INSTRUCTOR_PILOT_QUERY_KEY = 'instructorPilot';
const THEME_QUERY_KEY = 'theme';
const DETACHED_PANEL_QUERY_KEY = 'detachedPanel';
const DETACHED_PANEL_HOST_QUERY_KEY = 'hostId';
const DETACHED_PANEL_WINDOW_QUERY_KEY = 'panelWindowId';

export function createInstructorPilotUrl(theme: ManualThemeMode) {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(DETACHED_PANEL_QUERY_KEY);
  url.searchParams.delete(DETACHED_PANEL_HOST_QUERY_KEY);
  url.searchParams.delete(DETACHED_PANEL_WINDOW_QUERY_KEY);
  url.searchParams.delete('print');
  url.searchParams.set(INSTRUCTOR_PILOT_QUERY_KEY, '1');
  url.searchParams.set(THEME_QUERY_KEY, theme);
  return url.toString();
}
