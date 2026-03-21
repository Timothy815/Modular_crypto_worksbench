import { useState } from 'react';

import './App.css';
import { V1_REGISTRY } from './engine/modules';
import { demoProjects, formatSignal, runDemoProject } from './ui/demo-projects';

function App() {
  const [activeProjectId, setActiveProjectId] = useState(demoProjects[0].id);
  const activeProject =
    demoProjects.find((project) => project.id === activeProjectId) ?? demoProjects[0];
  const execution = runDemoProject(activeProject.project);
  const outputTrace = execution.trace.at(-1);
  const primitiveDefs = Object.values(V1_REGISTRY);

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
        <aside className="panel palette-panel">
          <div className="panel-head">
            <p className="panel-label">Palette</p>
            <h2>V1 Primitives</h2>
          </div>
          <ul className="primitive-list">
            {primitiveDefs.map((def) => (
              <li key={def.id} className="primitive-card">
                <div>
                  <strong>{def.name}</strong>
                  <p>{def.id}</p>
                </div>
                <span className="port-count">
                  {def.inputs.length} in / {def.outputs.length} out
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel canvas-panel">
          <div className="panel-head">
            <p className="panel-label">Workbench</p>
            <h2>Demo Graphs</h2>
          </div>

          <div className="project-switcher">
            {demoProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={project.id === activeProject.id ? 'switch-chip active' : 'switch-chip'}
                onClick={() => setActiveProjectId(project.id)}
              >
                {project.name}
              </button>
            ))}
          </div>

          <p className="project-summary">{activeProject.summary}</p>
          <p className="mono-line">{activeProject.pipeline}</p>

          <div className="graph-strip">
            {activeProject.project.modules.map((moduleInstance) => (
              <div key={moduleInstance.id} className="graph-node">
                <span className="graph-node-type">{moduleInstance.defId}</span>
                <strong>{moduleInstance.id}</strong>
              </div>
            ))}
          </div>

          <div className="graph-meta">
            <div>
              <span className="meta-label">Modules</span>
              <strong>{activeProject.project.modules.length}</strong>
            </div>
            <div>
              <span className="meta-label">Connections</span>
              <strong>{activeProject.project.connections.length}</strong>
            </div>
            <div>
              <span className="meta-label">Execution Order</span>
              <strong>{execution.order.join(' -> ')}</strong>
            </div>
          </div>
        </section>

        <aside className="panel inspector-panel">
          <div className="panel-head">
            <p className="panel-label">Inspector</p>
            <h2>Execution Trace</h2>
          </div>

          <div className="trace-summary">
            <span className="meta-label">Final Input To Output</span>
            <strong>{formatSignal(outputTrace?.inputs.in)}</strong>
          </div>

          <ol className="trace-list">
            {execution.trace.map((entry) => (
              <li key={entry.moduleId} className="trace-card">
                <div className="trace-head">
                  <strong>{entry.moduleId}</strong>
                  <span>{entry.defId}</span>
                </div>
                <p>inputs: {Object.entries(entry.inputs).map(([, signal]) => formatSignal(signal)).join(' | ') || 'none'}</p>
                <p>outputs: {Object.entries(entry.outputs).map(([, signal]) => formatSignal(signal)).join(' | ') || 'none'}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}

export default App;
