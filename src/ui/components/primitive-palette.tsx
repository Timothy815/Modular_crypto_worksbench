import { useMemo, useState } from 'react';

import type { ModuleRegistry } from '../../engine/types';
import { getModuleCategory } from '../module-categories';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  onAddModule: (defId: string) => void;
  onOpenComposite: (defId: string) => void;
  onExportCompositeLibrary: () => void;
  onRemoveComposite: (defId: string) => void;
  compositeUsageCountById: Record<string, number>;
}

export function PrimitivePalette({
  registry,
  onAddModule,
  onOpenComposite,
  onExportCompositeLibrary,
  onRemoveComposite,
  compositeUsageCountById,
}: PrimitivePaletteProps) {
  const [activeTab, setActiveTab] = useState<'primitives' | 'composites'>('primitives');

  const sortedDefs = useMemo(() => Object.values(registry).sort((left, right) => {
    const leftIsComposite = 'kind' in left && left.kind === 'composite';
    const rightIsComposite = 'kind' in right && right.kind === 'composite';

    if (leftIsComposite === rightIsComposite) {
      return left.name.localeCompare(right.name);
    }

    return leftIsComposite ? 1 : -1;
  }), [registry]);

  const visibleDefs = sortedDefs.filter((def) =>
    activeTab === 'primitives'
      ? !('kind' in def && def.kind === 'composite')
      : 'kind' in def && def.kind === 'composite',
  );

  return (
    <aside className="panel palette-panel">
      <div className="panel-head">
        <p className="panel-label">Palette</p>
        <h2>Module Library</h2>
        <div className="palette-tabs" role="tablist" aria-label="Module library sections">
          <button
            type="button"
            className={activeTab === 'primitives' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('primitives')}
          >
            Primitives
          </button>
          <button
            type="button"
            className={activeTab === 'composites' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('composites')}
          >
            Composites
          </button>
        </div>
        {activeTab === 'composites' ? (
          <div className="palette-toolbar">
            <button
              type="button"
              className="mini-action-button"
              onClick={onExportCompositeLibrary}
            >
              Export Library
            </button>
          </div>
        ) : null}
      </div>
      <ul className="primitive-list">
        {visibleDefs.map((def) => {
          const isComposite = 'kind' in def && def.kind === 'composite';
          const usageCount = compositeUsageCountById[def.id] ?? 0;

          return (
            <li key={def.id} className={`primitive-card primitive-card-${getModuleCategory(def)}`}>
              <div className="primitive-main">
                <div className="primitive-meta">
                  <strong className="primitive-title">{def.name}</strong>
                  <p className="primitive-def-id">{def.id}</p>
                  {isComposite ? (
                    <span className="module-kind-badge">Composite</span>
                  ) : null}
                </div>
                <div className="primitive-actions primitive-actions-below">
                  <span className="port-count">
                    {def.inputs.length} in / {def.outputs.length} out
                  </span>
                  <div className="primitive-button-row">
                    <button
                      type="button"
                      className="primitive-action-button"
                      onClick={() => onAddModule(def.id)}
                      title={`Add ${def.name}`}
                      aria-label={`Add ${def.name}`}
                    >
                      +
                    </button>
                    {isComposite ? (
                      <button
                        type="button"
                        className="primitive-action-button"
                        onClick={() => onOpenComposite(def.id)}
                        title={`Edit ${def.name}`}
                        aria-label={`Edit ${def.name}`}
                      >
                        ✎
                      </button>
                    ) : null}
                    {isComposite ? (
                      <button
                        type="button"
                        className="primitive-action-button primitive-action-button-danger"
                        onClick={() => onRemoveComposite(def.id)}
                        disabled={usageCount > 0}
                        title={
                          usageCount > 0
                            ? 'Remove composite instances from the workbench before deleting it from the library.'
                            : `Remove ${def.name}`
                        }
                        aria-label={`Remove ${def.name}`}
                      >
                        x
                      </button>
                    ) : null}
                  </div>
                  {isComposite ? (
                    <p className="primitive-composite-note">
                      {usageCount > 0
                        ? `In use ${usageCount} time${usageCount === 1 ? '' : 's'}`
                        : 'Reusable composite'}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {visibleDefs.length === 0 ? (
        <p className="empty-state">
          {activeTab === 'composites'
            ? 'No composites in the library yet.'
            : 'No primitive modules available.'}
        </p>
      ) : null}
    </aside>
  );
}
