import type { ModuleRegistry } from '../../engine/types';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  onAddModule: (defId: string) => void;
}

export function PrimitivePalette({ registry, onAddModule }: PrimitivePaletteProps) {
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
            <div className="primitive-actions">
              <span className="port-count">
                {def.inputs.length} in / {def.outputs.length} out
              </span>
              <button
                type="button"
                className="primitive-add-button"
                onClick={() => onAddModule(def.id)}
              >
                Add
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
