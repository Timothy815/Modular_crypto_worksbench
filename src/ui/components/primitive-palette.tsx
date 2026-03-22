import { useMemo, useState } from 'react';

import type { ModuleRegistry } from '../../engine/types';
import { getModuleCategory } from '../module-categories';
import {
  type ModuleLibraryDomainTab,
  getModuleLibrarySectionId,
  getModulePurpose,
  matchesModuleDomainTab,
  matchesModuleSearch,
  MODULE_LIBRARY_SECTIONS,
} from '../module-library';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  viewMode: 'compact' | 'expanded';
  onToggleViewMode: () => void;
  onAddModule: (defId: string) => void;
  onOpenComposite: (defId: string) => void;
  onExportCompositeLibrary: () => void;
  onRemoveComposite: (defId: string) => void;
  compositeUsageCountById: Record<string, number>;
}

export function PrimitivePalette({
  registry,
  viewMode,
  onToggleViewMode,
  onAddModule,
  onOpenComposite,
  onExportCompositeLibrary,
  onRemoveComposite,
  compositeUsageCountById,
}: PrimitivePaletteProps) {
  const [activeTab, setActiveTab] = useState<ModuleLibraryDomainTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedDefs = useMemo(() => Object.values(registry).sort((left, right) => {
    const leftIsComposite = 'kind' in left && left.kind === 'composite';
    const rightIsComposite = 'kind' in right && right.kind === 'composite';

    if (leftIsComposite === rightIsComposite) {
      return left.name.localeCompare(right.name);
    }

    return leftIsComposite ? 1 : -1;
  }), [registry]);

  const visibleDefs = sortedDefs.filter((def) => {
    return matchesModuleDomainTab(def, activeTab) && matchesModuleSearch(def, searchQuery);
  });

  const primitiveSections = useMemo(
    () =>
      MODULE_LIBRARY_SECTIONS.filter((section) => section.id !== 'composites')
        .map((section) => ({
          ...section,
          defs: visibleDefs.filter((def) => getModuleLibrarySectionId(def) === section.id),
        }))
        .filter((section) => section.defs.length > 0),
    [visibleDefs],
  );

  return (
    <aside className={viewMode === 'compact' ? 'panel palette-panel palette-panel-compact' : 'panel palette-panel'}>
      <div className="panel-head">
        <p className="panel-label">Palette</p>
        <h2>Module Library</h2>
        <div className="palette-tabs" role="tablist" aria-label="Module library domains">
          <button
            type="button"
            className={activeTab === 'all' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={activeTab === 'symbol' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('symbol')}
          >
            Symbol
          </button>
          <button
            type="button"
            className={activeTab === 'bit' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('bit')}
          >
            Bit
          </button>
          <button
            type="button"
            className={activeTab === 'bridge' ? 'palette-tab active' : 'palette-tab'}
            onClick={() => setActiveTab('bridge')}
          >
            Bridge
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
              onClick={onToggleViewMode}
            >
              {viewMode === 'compact' ? 'Expanded View' : 'Compact View'}
            </button>
            <button
              type="button"
              className="mini-action-button"
              onClick={onExportCompositeLibrary}
            >
              Export Library
            </button>
          </div>
        ) : (
          <div className="palette-toolbar">
            <button
              type="button"
              className="mini-action-button"
              onClick={onToggleViewMode}
            >
              {viewMode === 'compact' ? 'Expanded View' : 'Compact View'}
            </button>
          </div>
        )}
      </div>
      <label className="palette-search">
        <span className="meta-label">Search Library</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={
            activeTab === 'composites'
              ? 'Search composites by name or id'
              : 'Search by name, purpose, or keyword'
          }
        />
      </label>
      {activeTab !== 'composites' ? (
        <div className="primitive-sections">
          {primitiveSections.map((section) => (
            <section key={section.id} className="primitive-section">
              {viewMode === 'expanded' ? (
                <div className="primitive-section-head">
                  <p className="panel-label">{section.title}</p>
                  <p className="primitive-section-copy">{section.description}</p>
                </div>
              ) : (
                <div className="primitive-section-head">
                  <p className="panel-label">{section.title}</p>
                </div>
              )}
              <ul className="primitive-list">
                {section.defs.map((def) => (
                  <ModuleLibraryCard
                    key={def.id}
                    def={def}
                    viewMode={viewMode}
                    usageCount={compositeUsageCountById[def.id] ?? 0}
                    onAddModule={onAddModule}
                    onOpenComposite={onOpenComposite}
                    onRemoveComposite={onRemoveComposite}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="primitive-list">
          {visibleDefs.map((def) => (
            <ModuleLibraryCard
              key={def.id}
              def={def}
              viewMode={viewMode}
              usageCount={compositeUsageCountById[def.id] ?? 0}
              onAddModule={onAddModule}
              onOpenComposite={onOpenComposite}
              onRemoveComposite={onRemoveComposite}
            />
          ))}
        </ul>
      )}
      {visibleDefs.length === 0 ? (
        <p className="empty-state">
          {activeTab === 'composites'
            ? 'No composites in the library yet.'
            : 'No primitive modules match this search.'}
        </p>
      ) : null}
    </aside>
  );
}

interface ModuleLibraryCardProps {
  def: ModuleRegistry[string];
  viewMode: 'compact' | 'expanded';
  usageCount: number;
  onAddModule: (defId: string) => void;
  onOpenComposite: (defId: string) => void;
  onRemoveComposite: (defId: string) => void;
}

function ModuleLibraryCard({
  def,
  viewMode,
  usageCount,
  onAddModule,
  onOpenComposite,
  onRemoveComposite,
}: ModuleLibraryCardProps) {
  const isComposite = 'kind' in def && def.kind === 'composite';

  return (
    <li key={def.id} className={`primitive-card primitive-card-${getModuleCategory(def)}`}>
      <div className="primitive-main">
        <div className="primitive-meta">
          <strong className="primitive-title">{def.name}</strong>
          <p className="primitive-def-id">{def.id}</p>
          {viewMode === 'expanded' ? (
            <p className="primitive-purpose">{getModulePurpose(def)}</p>
          ) : null}
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
}
