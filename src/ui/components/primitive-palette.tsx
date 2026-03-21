import type { ModuleRegistry } from '../../engine/types';
import { getModuleCategory } from '../module-categories';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  onAddModule: (defId: string) => void;
}

export function PrimitivePalette({ registry, onAddModule }: PrimitivePaletteProps) {
  const primitiveDefs = Object.values(registry).sort((left, right) => {
    const leftIsComposite = 'kind' in left && left.kind === 'composite';
    const rightIsComposite = 'kind' in right && right.kind === 'composite';

    if (leftIsComposite === rightIsComposite) {
      return left.name.localeCompare(right.name);
    }

    return leftIsComposite ? 1 : -1;
  });

  return (
    <aside className="panel palette-panel">
      <div className="panel-head">
        <p className="panel-label">Palette</p>
        <h2>Module Library</h2>
      </div>
      <ul className="primitive-list">
        {primitiveDefs.map((def) => (
          <li key={def.id} className={`primitive-card primitive-card-${getModuleCategory(def)}`}>
            <div>
              <strong>{def.name}</strong>
              <p>{def.id}</p>
              {'kind' in def && def.kind === 'composite' ? (
                <span className="module-kind-badge">Composite</span>
              ) : null}
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
