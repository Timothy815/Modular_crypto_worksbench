import { useState } from 'react';

import './App.css';
import { V1_REGISTRY } from './engine/modules';
import type { ExecutionResult, Project } from './engine/types';
import { ParameterInspector } from './ui/components/parameter-inspector';
import { PrimitivePalette } from './ui/components/primitive-palette';
import { WorkbenchPanel } from './ui/components/workbench-panel';
import { demoProjects, runDemoProject } from './ui/demo-projects';

function cloneProject(project: Project): Project {
  return {
    modules: project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    })),
    connections: project.connections.map((connection) => ({
      from: { ...connection.from },
      to: { ...connection.to },
    })),
  };
}

function App() {
  const [projectStates, setProjectStates] = useState<Record<string, Project>>(() =>
    Object.fromEntries(
      demoProjects.map((project) => [project.id, cloneProject(project.project)]),
    ),
  );
  const [activeProjectId, setActiveProjectId] = useState(demoProjects[0].id);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    demoProjects[0].project.modules[0]?.id ?? null,
  );

  const activeProjectDefinition =
    demoProjects.find((project) => project.id === activeProjectId) ?? demoProjects[0];
  const activeProjectState =
    projectStates[activeProjectDefinition.id] ?? activeProjectDefinition.project;
  const effectiveSelectedModuleId =
    activeProjectState.modules.some((moduleInstance) => moduleInstance.id === selectedModuleId)
      ? selectedModuleId
      : (activeProjectState.modules[0]?.id ?? null);
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

  function updateProjectParam(moduleId: string, key: string, value: unknown) {
    setProjectStates((current) => {
      const nextProject = cloneProject(current[activeProjectDefinition.id]);
      nextProject.modules = nextProject.modules.map((moduleInstance) =>
        moduleInstance.id === moduleId
          ? {
              ...moduleInstance,
              params: {
                ...moduleInstance.params,
                [key]: value,
              },
            }
          : moduleInstance,
      );

      return {
        ...current,
        [activeProjectDefinition.id]: nextProject,
      };
    });
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
          selectedModuleId={effectiveSelectedModuleId}
          onSelectModule={setSelectedModuleId}
          onSwitchProject={(projectId) => {
            setActiveProjectId(projectId);
            setSelectedModuleId(
              projectStates[projectId]?.modules[0]?.id ??
                demoProjects.find((project) => project.id === projectId)?.project.modules[0]?.id ??
                null,
            );
          }}
          projects={demoProjects}
        />

        <ParameterInspector
          execution={execution}
          executionError={executionError}
          moduleDef={selectedModuleDef}
          moduleInstance={selectedModule}
          onParamChange={updateProjectParam}
        />
      </section>
    </main>
  );
}

export default App;
