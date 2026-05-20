import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { demoProjects } from '../demo-projects';
import { WorkbenchProjectContext } from './workbench-project-context';

describe('WorkbenchProjectContext durability UX', () => {
  it('renders durability status, recovery, and export guidance from live state', () => {
    const activeProject = demoProjects[0]!;
    const markup = renderToStaticMarkup(
      <WorkbenchProjectContext
        isCompositeEditor={false}
        activeProject={activeProject}
        activeProjectGroup={activeProject.group ?? 'Foundations'}
        activeProjectStage={activeProject.stage ?? 'foundations'}
        activeProjectRecommendedAfter={[]}
        projects={demoProjects}
        projectGroups={[activeProject.group ?? 'Foundations']}
        projectCountByGroup={{ [activeProject.group ?? 'Foundations']: 1 }}
        visibleProjects={[activeProject]}
        showWorkspaceLandmarks={false}
        workspaceLandmarks={{ context: [], sources: [], outputs: [] }}
        workspaceVersions={[]}
        autosaveSnapshots={[
          {
            id: 'autosave-1',
            projectId: activeProject.id,
            savedAt: '2026-05-20T12:00:00.000Z',
            tickedMode: false,
            document: {
              version: 1,
              project: activeProject.project,
              ui: {
                layout: activeProject.layout,
                annotations: [],
              },
            },
          },
        ]}
        workspaceComparison={null}
        activeComparisonVersion={null}
        comparisonVersionId={null}
        persistenceWarning="Durable local storage is temporarily unavailable. MCW is using weaker local protection, and export is recommended now."
        lastDurableSaveAt="2026-05-20T12:05:00.000Z"
        exportStatus={{ lastExportedAt: null, exportedFingerprint: null }}
        currentDocumentFingerprint="fingerprint-1"
        onSwitchProject={() => undefined}
        onJumpToModule={() => undefined}
        onRequestRestoreVersion={() => undefined}
        onRequestRestoreAutosave={() => undefined}
        onSetComparisonVersionId={() => undefined}
        formatVersionTimestamp={(savedAt) => savedAt}
      />,
    );

    expect(markup).toContain('Workspace Durability');
    expect(markup).toContain('Degraded local save mode');
    expect(markup).toContain('Last durable save:');
    expect(markup).toContain('A local recovery snapshot is available');
    expect(markup).toContain('Open Snapshots (1)');
    expect(markup).toContain('This workspace has not been exported yet.');
    expect(markup).toContain('portable backup path');
    expect(markup).toContain('How local durability works');
    expect(markup).not.toContain('Recent Snapshots');
  });
});
