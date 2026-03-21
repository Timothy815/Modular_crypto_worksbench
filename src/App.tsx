import { useEffect, useReducer, useState } from 'react';

import './App.css';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult } from './engine/types';
import { ParameterInspector } from './ui/components/parameter-inspector';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';
import {
  downloadDocument,
  loadWorkspaceFromStorage,
  parseWorkbenchDocument,
  saveWorkspaceToStorage,
} from './ui/persistence';
import {
  createInitialUiState,
  getDraftValue,
  getSelectedModuleId,
  uiReducer,
} from './ui/store';

function App() {
  const [state, dispatch] = useReducer(
    uiReducer,
    demoProjects,
    (projects) => {
      const initialState = createInitialUiState(projects);
      if (typeof window === 'undefined') {
        return initialState;
      }

      const persistedWorkspace = loadWorkspaceFromStorage(projects);
      if (!persistedWorkspace) {
        return initialState;
      }

      return {
        ...initialState,
        activeProjectId: persistedWorkspace.activeProjectId,
        showPalette: persistedWorkspace.showPalette,
        showInspector: persistedWorkspace.showInspector,
        projectStates: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.documentsByProjectId[project.id]?.project ?? initialState.projectStates[project.id],
          ]),
        ),
        layoutByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.documentsByProjectId[project.id]?.ui.layout ?? initialState.layoutByProject[project.id],
          ]),
        ),
        annotationsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            persistedWorkspace.documentsByProjectId[project.id]?.ui.annotations ?? initialState.annotationsByProject[project.id],
          ]),
        ),
      };
    },
  );
  const [importError, setImportError] = useState<string | null>(null);

  const activeProjectDefinition =
    demoProjects.find((project) => project.id === state.activeProjectId) ?? demoProjects[0];
  const activeProjectState =
    state.projectStates[activeProjectDefinition.id] ?? activeProjectDefinition.project;
  const activeLayout =
    state.layoutByProject[activeProjectDefinition.id] ?? activeProjectDefinition.layout;
  const activeAnnotations =
    state.annotationsByProject[activeProjectDefinition.id] ?? [];
  const effectiveSelectedModuleId =
    getSelectedModuleId(state, activeProjectDefinition.id, activeProjectState);
  const selectedModule =
    activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === effectiveSelectedModuleId,
    ) ?? null;
  const selectedModuleDef = selectedModule
    ? V1_REGISTRY[selectedModule.defId]
    : null;

  let execution: ExecutionResult | null = null;
  let executionError: string | null = null;

  try {
    execution = runDemoProject(activeProjectState);
  } catch (error) {
    executionError = error instanceof Error ? error.message : 'Execution failed.';
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    saveWorkspaceToStorage(state);
  }, [state]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Modular Cryptography Workbench</p>
        <h1>Move from engine milestone to visible workbench.</h1>
        <p className="lede">
          This first UI slice uses the real engine to render a minimal workbench:
          primitive palette, demo graph, and execution trace. It is a stepping
          stone toward the node editor, not the final editor itself.
        </p>

        <div className="hero-actions">
          <a className="primary-link" href="./UI-KICKOFF.md">
            UI kickoff notes
          </a>
          <a
            className="secondary-link"
            href="https://github.com/Timothy815/Modular_crypto_worksbench"
            target="_blank"
            rel="noreferrer"
          >
            Repository
          </a>
        </div>

        <div className="layout-actions">
          <button
            type="button"
            className={state.showPalette ? 'layout-chip active' : 'layout-chip'}
            onClick={() => dispatch({ type: 'togglePalette' })}
          >
            {state.showPalette ? 'Hide Palette' : 'Show Palette'}
          </button>
          <button
            type="button"
            className={state.showInspector ? 'layout-chip active' : 'layout-chip'}
            onClick={() => dispatch({ type: 'toggleInspector' })}
          >
            {state.showInspector ? 'Hide Inspector' : 'Show Inspector'}
          </button>
        </div>
      </section>

      <section
        className={
          state.showPalette && state.showInspector
            ? 'workbench-grid'
            : state.showPalette
              ? 'workbench-grid workbench-grid-no-inspector'
              : state.showInspector
                ? 'workbench-grid workbench-grid-no-palette'
                : 'workbench-grid workbench-grid-workbench-only'
        }
      >
        {state.showPalette ? (
          <PrimitivePalette
            registry={V1_REGISTRY}
            onAddModule={(defId) => {
              const moduleDef = V1_REGISTRY[defId];
              if (!moduleDef) {
                return;
              }

              dispatch({
                type: 'addModule',
                projectId: activeProjectDefinition.id,
                moduleDef,
              });
            }}
          />
        ) : null}

        <WorkbenchPanel
          activeProject={activeProjectDefinition}
          activeProjectState={activeProjectState}
          layout={activeLayout}
          annotations={activeAnnotations}
          execution={execution}
          executionError={executionError}
          registry={V1_REGISTRY}
          selectedModuleId={effectiveSelectedModuleId}
          onMoveModule={(moduleId, x, y) =>
            dispatch({
              type: 'moveModule',
              projectId: activeProjectDefinition.id,
              moduleId,
              x,
              y,
            })
          }
          onAddAnnotation={() =>
            dispatch({
              type: 'addAnnotation',
              projectId: activeProjectDefinition.id,
            })
          }
          onMoveAnnotation={(annotationId, x, y) =>
            dispatch({
              type: 'moveAnnotation',
              projectId: activeProjectDefinition.id,
              annotationId,
              x,
              y,
            })
          }
          onUpdateAnnotationText={(annotationId, text) =>
            dispatch({
              type: 'updateAnnotationText',
              projectId: activeProjectDefinition.id,
              annotationId,
              text,
            })
          }
          onRemoveAnnotation={(annotationId) =>
            dispatch({
              type: 'removeAnnotation',
              projectId: activeProjectDefinition.id,
              annotationId,
            })
          }
          onSelectModule={(moduleId) =>
            dispatch({
              type: 'selectModule',
              projectId: activeProjectDefinition.id,
              moduleId,
            })
          }
          onAddConnection={(fromModuleId, fromPort, toModuleId, toPort) =>
            dispatch({
              type: 'addConnection',
              projectId: activeProjectDefinition.id,
              fromModuleId,
              fromPort,
              toModuleId,
              toPort,
            })
          }
          onRemoveConnection={(connectionIndex) =>
            dispatch({
              type: 'removeConnection',
              projectId: activeProjectDefinition.id,
              connectionIndex,
            })
          }
          onExportDocument={() => {
            downloadDocument(activeProjectDefinition.id, {
              version: 1,
              project: activeProjectState,
              ui: {
                layout: activeLayout,
                annotations: state.annotationsByProject[activeProjectDefinition.id] ?? [],
              },
            });
          }}
          onImportDocument={async (file) => {
            const rawValue = await file.text();
            const document = parseWorkbenchDocument(rawValue);
            if (!document) {
              setImportError('The selected file is not a valid MCW workbench document.');
              return;
            }

            dispatch({
              type: 'loadDocument',
              projectId: activeProjectDefinition.id,
              document,
            });
            setImportError(null);
          }}
          onSwitchProject={(projectId) =>
            dispatch({
              type: 'switchProject',
              projectId,
            })
          }
          projects={demoProjects}
        />

        {importError ? <p className="import-error-banner">{importError}</p> : null}

        {state.showInspector ? (
          <ParameterInspector
            execution={execution}
            executionError={executionError}
            moduleDef={selectedModuleDef}
            moduleInstance={selectedModule}
            getParamDraft={(moduleId, key) =>
              getDraftValue(state, activeProjectDefinition.id, moduleId, key)
            }
            onParamDraftChange={(moduleId, key, rawValue) =>
              dispatch({
                type: 'setParamDraft',
                projectId: activeProjectDefinition.id,
                moduleId,
                key,
                rawValue,
              })
            }
          onParamChange={(moduleId, key, value) =>
            dispatch({
              type: 'updateParam',
              projectId: activeProjectDefinition.id,
              moduleId,
              key,
              value,
            })
          }
          onDeleteModule={(moduleId) =>
            dispatch({
              type: 'removeModule',
              projectId: activeProjectDefinition.id,
              moduleId,
            })
          }
        />
      ) : null}
      </section>
    </main>
  );
}

export default App;
