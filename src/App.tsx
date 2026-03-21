import { useReducer } from 'react';

import './App.css';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult } from './engine/types';
import { ParameterInspector } from './ui/components/parameter-inspector';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';
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
    createInitialUiState,
  );

  const activeProjectDefinition =
    demoProjects.find((project) => project.id === state.activeProjectId) ?? demoProjects[0];
  const activeProjectState =
    state.projectStates[activeProjectDefinition.id] ?? activeProjectDefinition.project;
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
      </section>

      <section className="workbench-grid">
        <PrimitivePalette registry={V1_REGISTRY} />

        <WorkbenchPanel
          activeProject={activeProjectDefinition}
          activeProjectState={activeProjectState}
          execution={execution}
          executionError={executionError}
          registry={V1_REGISTRY}
          selectedModuleId={effectiveSelectedModuleId}
          onSelectModule={(moduleId) =>
            dispatch({
              type: 'selectModule',
              projectId: activeProjectDefinition.id,
              moduleId,
            })
          }
          onSwitchProject={(projectId) =>
            dispatch({
              type: 'switchProject',
              projectId,
            })
          }
          projects={demoProjects}
        />

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
        />
      </section>
    </main>
  );
}

export default App;
