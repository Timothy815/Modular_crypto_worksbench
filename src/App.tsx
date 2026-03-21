import { useEffect, useReducer, useState } from 'react';

import './App.css';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult } from './engine/types';
import { createCompositeFromSelection } from './ui/composite-authoring';
import { ParameterInspector } from './ui/components/parameter-inspector';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';
import {
  downloadDocument,
  downloadCompositeLibraryDocument,
  loadWorkspaceFromStorage,
  parseCompositeLibraryDocument,
  parseWorkbenchDocument,
  saveWorkspaceToStorage,
} from './ui/persistence';
import {
  createInitialUiState,
  getEffectiveRegistry,
  getDraftValue,
  getSelectedModuleId,
  getSelectedModuleIds,
  uiReducer,
} from './ui/store';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = window.localStorage.getItem('mcw:theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
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

      const restoredProjectStates = Object.fromEntries(
        projects.map((project) => [
          project.id,
          persistedWorkspace.documentsByProjectId[project.id]?.project ?? initialState.projectStates[project.id],
        ]),
      );

      return {
        ...initialState,
        activeProjectId: persistedWorkspace.activeProjectId,
        compositeLibrary:
          persistedWorkspace.compositeLibrary.entries.length > 0
            ? persistedWorkspace.compositeLibrary.entries
            : initialState.compositeLibrary,
        showPalette: persistedWorkspace.showPalette,
        showInspector: persistedWorkspace.showInspector,
        projectStates: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id],
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
        selectedModuleIdByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id ?? null,
          ]),
        ),
        selectedModuleIdsByProject: Object.fromEntries(
          projects.map((project) => [
            project.id,
            restoredProjectStates[project.id]?.modules[0]?.id
              ? [restoredProjectStates[project.id].modules[0].id]
              : [],
          ]),
        ),
      };
    },
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isCompositeDialogOpen, setIsCompositeDialogOpen] = useState(false);
  const [compositeName, setCompositeName] = useState('');
  const [compositeId, setCompositeId] = useState('');
  const [compositeDialogError, setCompositeDialogError] = useState<string | null>(null);

  const activeProjectDefinition =
    demoProjects.find((project) => project.id === state.activeProjectId) ?? demoProjects[0];
  const effectiveRegistry = getEffectiveRegistry(V1_REGISTRY, state.compositeLibrary);
  const activeProjectState =
    state.projectStates[activeProjectDefinition.id] ?? activeProjectDefinition.project;
  const activeLayout =
    state.layoutByProject[activeProjectDefinition.id] ?? activeProjectDefinition.layout;
  const activeAnnotations =
    state.annotationsByProject[activeProjectDefinition.id] ?? [];
  const effectiveSelectedModuleId =
    getSelectedModuleId(state, activeProjectDefinition.id, activeProjectState);
  const effectiveSelectedModuleIds =
    getSelectedModuleIds(state, activeProjectDefinition.id, activeProjectState);
  const selectedModule =
    activeProjectState.modules.find(
      (moduleInstance) => moduleInstance.id === effectiveSelectedModuleId,
    ) ?? null;
  const selectedModuleDef = selectedModule
    ? (effectiveRegistry[selectedModule.defId] ?? null)
    : null;
  const compositeUsageCountById = Object.values(state.projectStates).reduce<Record<string, number>>(
    (counts, project) => {
      for (const moduleInstance of project.modules) {
        if (!state.compositeLibrary.some((entry) => entry.id === moduleInstance.defId)) {
          continue;
        }

        counts[moduleInstance.defId] = (counts[moduleInstance.defId] ?? 0) + 1;
      }

      return counts;
    },
    {},
  );

  let execution: ExecutionResult | null = null;
  let executionError: string | null = null;

  try {
    execution = runDemoProject(activeProjectState, effectiveRegistry);
  } catch (error) {
    executionError = error instanceof Error ? error.message : 'Execution failed.';
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveWorkspaceToStorage(state);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('mcw:theme', theme);
  }, [theme]);

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
            className={theme === 'dark' ? 'layout-chip active' : 'layout-chip'}
            onClick={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
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
            registry={effectiveRegistry}
            compositeUsageCountById={compositeUsageCountById}
            onAddModule={(defId) => {
              const moduleDef = effectiveRegistry[defId] ?? null;
              if (!moduleDef) {
                return;
              }

              dispatch({
                type: 'addModule',
                projectId: activeProjectDefinition.id,
                moduleDef,
              });
            }}
            onExportCompositeLibrary={() =>
              downloadCompositeLibraryDocument({
                version: 1,
                entries: state.compositeLibrary,
              })
            }
            onRemoveComposite={(defId) =>
              dispatch({
                type: 'removeCompositeFromLibrary',
                compositeId: defId,
              })
            }
          />
        ) : null}

        <WorkbenchPanel
          activeProject={activeProjectDefinition}
          activeProjectState={activeProjectState}
          layout={activeLayout}
          annotations={activeAnnotations}
          execution={execution}
          executionError={executionError}
          registry={effectiveRegistry}
          selectedModuleId={effectiveSelectedModuleId}
          selectedModuleIds={effectiveSelectedModuleIds}
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
          onSelectModule={(moduleId, additive) =>
            dispatch({
              type: 'selectModule',
              projectId: activeProjectDefinition.id,
              moduleId,
              additive,
            })
          }
          onRequestCreateComposite={() => {
            setCompositeName('');
            setCompositeId('');
            setCompositeDialogError(null);
            setIsCompositeDialogOpen(true);
          }}
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
            const workbenchDocument = parseWorkbenchDocument(rawValue);
            if (workbenchDocument) {
              dispatch({
                type: 'loadDocument',
                projectId: activeProjectDefinition.id,
                document: workbenchDocument,
              });
              setImportError(null);
              return;
            }

            const libraryDocument = parseCompositeLibraryDocument(rawValue);
            if (libraryDocument) {
              dispatch({
                type: 'loadCompositeLibrary',
                document: libraryDocument,
              });
              setImportError(null);
              return;
            }

            setImportError('The selected file is not a valid MCW workbench or composite library document.');
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

      {isCompositeDialogOpen ? (
        <div
          className="dialog-backdrop"
          onClick={() => {
            setIsCompositeDialogOpen(false);
            setCompositeDialogError(null);
          }}
        >
          <div
            className="dialog-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-label">Composite Authoring</p>
            <h2>Create Reusable Composite</h2>
            <p className="dialog-copy">
              Capture the current selection as a reusable composite module. The
              selection stays in the workbench; this first version just adds the
              new composite to the library.
            </p>

            <p className="dialog-selection-summary">
              Selected modules: <strong>{effectiveSelectedModuleIds.length}</strong>
            </p>

            <label className="param-field">
              <span>Display Name</span>
              <input
                type="text"
                value={compositeName}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setCompositeName(nextName);
                  if (!compositeId) {
                    setCompositeId(createCompositeIdCandidate(nextName));
                  }
                }}
                placeholder="Round Trip Bridge"
              />
            </label>

            <label className="param-field">
              <span>Stable Id</span>
              <input
                type="text"
                value={compositeId}
                onChange={(event) => setCompositeId(event.target.value)}
                placeholder="RoundTripBridge"
              />
            </label>

            {compositeDialogError ? (
              <p className="field-error">{compositeDialogError}</p>
            ) : null}

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-dialog-button"
                onClick={() => {
                  setIsCompositeDialogOpen(false);
                  setCompositeDialogError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-dialog-button"
                onClick={() => {
                  const result = createCompositeFromSelection({
                    project: activeProjectState,
                    registry: effectiveRegistry,
                    name: compositeName,
                    id: compositeId,
                    selectedModuleIds: effectiveSelectedModuleIds,
                  });

                  if (!result.ok || !result.entry) {
                    setCompositeDialogError(result.error ?? 'Unable to create composite.');
                    return;
                  }

                  dispatch({
                    type: 'addCompositeToLibrary',
                    entry: result.entry,
                  });
                  setIsCompositeDialogOpen(false);
                  setCompositeDialogError(null);
                }}
              >
                Create Composite
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;

function createCompositeIdCandidate(name: string) {
  const stripped = name.replace(/[^A-Za-z0-9]+/g, ' ').trim();
  if (!stripped) {
    return '';
  }

  const words = stripped.split(/\s+/);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
