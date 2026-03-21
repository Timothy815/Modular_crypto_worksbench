import type { ModuleRegistry } from '../../engine/types';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
}

export function PrimitivePalette({ registry }: PrimitivePaletteProps) {
  const primitiveDefs = Object.values(registry);

  return (
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
  );
}
