import { describe, expect, it } from 'vitest';

import {
  createDetachedWorkspaceUrl,
  createDetachedWorkspaceWindowName,
} from './detached-workspace';

describe('detached-workspace helpers', () => {
  it('creates a detached workspace url with a locked project target', () => {
    const url = createDetachedWorkspaceUrl(
      'https://example.com/Modular_crypto_worksbench/?manual=1&theme=dark',
      'host-1',
      'workspace-window-1',
      'workspace-a',
    );

    const parsed = new URL(url);

    expect(parsed.searchParams.get('detachedWorkspace')).toBe('1');
    expect(parsed.searchParams.get('hostId')).toBe('host-1');
    expect(parsed.searchParams.get('workspaceWindowId')).toBe('workspace-window-1');
    expect(parsed.searchParams.get('projectId')).toBe('workspace-a');
    expect(parsed.searchParams.get('manual')).toBeNull();
  });

  it('creates a stable detached workspace window name', () => {
    expect(createDetachedWorkspaceWindowName('workspace-window-1', 'workspace-a')).toBe(
      'mcw-workspace-workspace-a-workspace-window-1',
    );
  });
});
