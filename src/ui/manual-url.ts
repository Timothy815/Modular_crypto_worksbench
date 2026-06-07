export type ManualThemeMode = 'light' | 'dark';

const USER_MANUAL_QUERY_KEY = 'manual';
const THEME_QUERY_KEY = 'theme';
const DETACHED_PANEL_QUERY_KEY = 'detachedPanel';
const DETACHED_PANEL_HOST_QUERY_KEY = 'hostId';
const DETACHED_PANEL_WINDOW_QUERY_KEY = 'panelWindowId';

export function createUserManualUrl(theme: ManualThemeMode) {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  url.searchParams.delete(DETACHED_PANEL_QUERY_KEY);
  url.searchParams.delete(DETACHED_PANEL_HOST_QUERY_KEY);
  url.searchParams.delete(DETACHED_PANEL_WINDOW_QUERY_KEY);
  url.searchParams.delete('print');
  url.searchParams.set(USER_MANUAL_QUERY_KEY, '1');
  url.searchParams.set(THEME_QUERY_KEY, theme);
  return url.toString();
}
