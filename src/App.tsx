import './App.css';

const coreDecisions = [
  'Engine-first development with a pure TypeScript core',
  'Strict signal domains: symbol and bits',
  'Iterative topological execution',
  'No hidden coercions across module boundaries',
];

const workstreams = [
  'Architect-owned engine contracts, validation, and executor',
  'Primitive module implementation in src/engine/modules/',
  'Hybrid pipeline verification before UI complexity',
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Modular Cryptography Workbench</p>
        <h1>Build ciphers as visible machines.</h1>
        <p className="lede">
          MCW treats cryptography as a typed signal-processing system. Letters,
          bits, and transformations remain explicit so students can inspect how
          a machine actually works.
        </p>

        <div className="hero-actions">
          <a className="primary-link" href="./README.md">
            Project overview
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

      <section className="grid-section">
        <article className="info-card accent-card">
          <h2>Locked V1 Decisions</h2>
          <ul>
            {coreDecisions.map((decision) => (
              <li key={decision}>{decision}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h2>Immediate Engine Goal</h2>
          <p className="mono-line">
            TextInput -&gt; SymbolToBits -&gt; XOR -&gt; BitsToSymbol -&gt; Output
          </p>
          <p>
            This proves the general engine before the Enigma-derived symbol
            modules are layered on top.
          </p>
        </article>

        <article className="info-card">
          <h2>Agent Workflow</h2>
          <ul>
            {workstreams.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="info-card">
          <h2>Public Status</h2>
          <p>
            The repository is in the engine-first phase. The current website is
            a project status shell, not the final node editor.
          </p>
          <p>
            Next milestone: tested primitive modules plus hybrid pipeline
            coverage.
          </p>
        </article>
      </section>
    </main>
  );
}

export default App;
