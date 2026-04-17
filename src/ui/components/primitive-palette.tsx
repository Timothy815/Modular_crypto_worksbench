import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { ModuleRegistry } from '../../engine/types';
import { getModuleCategory } from '../module-categories';
import {
  getModuleChainsBefore,
  getModuleChainsAfter,
  getModuleDomainSignature,
  getModuleRole,
  getModuleRoleDetail,
  getModuleTypicalPath,
} from '../module-role-language';
import {
  type ModuleLibraryDomainTab,
  getModuleDetail,
  getModuleLibrarySectionId,
  getModuleLibrarySortOrder,
  getModulePurpose,
  matchesModuleDomainTab,
  matchesModuleSearch,
  MODULE_LIBRARY_SECTIONS,
} from '../module-library';
import { getPrimitiveMicroDemo } from '../primitive-micro-demos';
import { PIPELINE_STARTERS } from '../pipeline-starters';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  viewMode: 'compact' | 'expanded';
  onToggleViewMode: () => void;
  onAddModule: (defId: string) => void;
  onStartCanvasDrag?: (defId: string, clientX: number, clientY: number) => void;
  onInsertStarterChain: (starterId: string) => void;
  onOpenComposite: (defId: string) => void;
  onDuplicateReusable: (defId: string) => void;
  onOpenPrimitiveMicroDemo: (defId: string) => void;
  onExportCompositeLibrary: () => void;
  onRemoveComposite: (defId: string) => void;
  compositeUsageCountById: Record<string, number>;
  builtInReusableIds: string[];
  pendingConnectionSourceType?: string | null;
  onDropForPendingConnection?: (defId: string, toPort: string) => void;
}

function PaletteViewModeIcon({ viewMode }: { viewMode: 'compact' | 'expanded' }) {
  if (viewMode === 'compact') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M7 4.5H4.5V7M13 4.5h2.5V7M7 15.5H4.5V13M13 15.5h2.5V13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 8l-3 3M12 8l3 3M8 12l-3-3M12 12l3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M8 8l-3-3M12 8l3-3M8 12l-3 3M12 12l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 4.5H4.5V7M13 4.5h2.5V7M7 15.5H4.5V13M13 15.5h2.5V13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizePaletteSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

function getPaletteSearchCandidates(definition: ModuleRegistry[string]) {
  return {
    id: definition.id,
    name: definition.name,
    purpose: getModulePurpose(definition),
    detail: getModuleDetail(definition),
    role: getModuleRole(definition),
    roleDetail: getModuleRoleDetail(definition),
    section: getModuleLibrarySectionId(definition).replace(/-/g, ' '),
  };
}

function getPaletteSearchRank(definition: ModuleRegistry[string], query: string) {
  const normalized = normalizePaletteSearchQuery(query);
  if (!normalized) {
    return 0;
  }

  const { id, name, purpose, detail, role, roleDetail, section } = getPaletteSearchCandidates(definition);
  const normalizedId = id.toLowerCase();
  const normalizedName = name.toLowerCase();
  const normalizedPurpose = purpose.toLowerCase();
  const normalizedDetail = detail.toLowerCase();
  const normalizedRole = role.toLowerCase();
  const normalizedRoleDetail = roleDetail.toLowerCase();
  const normalizedSection = section.toLowerCase();

  if (normalizedId === normalized || normalizedName === normalized) {
    return 1000;
  }

  if (normalizedId.startsWith(normalized) || normalizedName.startsWith(normalized)) {
    return 800;
  }

  if (normalizedId.includes(normalized) || normalizedName.includes(normalized)) {
    return 600;
  }

  if (normalizedSection.includes(normalized)) {
    return 300;
  }

  if (normalizedPurpose.includes(normalized)) {
    return 200;
  }

  if (normalizedRole.includes(normalized) || normalizedRoleDetail.includes(normalized)) {
    return 150;
  }

  if (normalizedDetail.includes(normalized) || matchesModuleSearch(definition, normalized)) {
    return 100;
  }

  return 0;
}

export function PrimitivePalette({
  registry,
  viewMode,
  onToggleViewMode,
  onAddModule,
  onStartCanvasDrag,
  onInsertStarterChain,
  onOpenComposite,
  onDuplicateReusable,
  onOpenPrimitiveMicroDemo,
  onExportCompositeLibrary,
  onRemoveComposite,
  compositeUsageCountById,
  builtInReusableIds,
  pendingConnectionSourceType,
  onDropForPendingConnection,
}: PrimitivePaletteProps) {
  const [activeTab, setActiveTab] = useState<ModuleLibraryDomainTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const sortedDefs = useMemo(() => Object.values(registry).sort((left, right) => {
    const leftIsComposite = 'kind' in left && left.kind === 'composite';
    const rightIsComposite = 'kind' in right && right.kind === 'composite';

    if (leftIsComposite === rightIsComposite) {
      if (!leftIsComposite && !rightIsComposite) {
        const sectionComparison = getModuleLibrarySectionId(left).localeCompare(getModuleLibrarySectionId(right));
        if (sectionComparison !== 0) {
          return sectionComparison;
        }

        const sortComparison = getModuleLibrarySortOrder(left) - getModuleLibrarySortOrder(right);
        if (sortComparison !== 0) {
          return sortComparison;
        }
      }

      return left.name.localeCompare(right.name);
    }

    return leftIsComposite ? 1 : -1;
  }), [registry]);

  const normalizedSearchQuery = useMemo(() => normalizePaletteSearchQuery(searchQuery), [searchQuery]);
  const searchActive = normalizedSearchQuery.length > 0;
  const sortOrderIndex = useMemo(
    () => new Map(sortedDefs.map((definition, index) => [definition.id, index])),
    [sortedDefs],
  );

  const visibleDefs = sortedDefs.filter((def) => {
    return matchesModuleDomainTab(def, activeTab) && matchesModuleSearch(def, normalizedSearchQuery);
  });

  const rankedVisibleDefs = useMemo(
    () =>
      [...visibleDefs].sort((left, right) => {
        const rankDifference =
          getPaletteSearchRank(right, normalizedSearchQuery) - getPaletteSearchRank(left, normalizedSearchQuery);
        if (rankDifference !== 0) {
          return rankDifference;
        }

        return (sortOrderIndex.get(left.id) ?? 0) - (sortOrderIndex.get(right.id) ?? 0);
      }),
    [normalizedSearchQuery, sortOrderIndex, visibleDefs],
  );

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

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, []);

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      setSearchQuery('');
    }
  };

  return (
    <aside
      className={viewMode === 'compact' ? 'panel palette-panel palette-panel-compact' : 'panel palette-panel'}
      data-search-active={searchActive || undefined}
    >
      <div className="panel-head">
        <p className="panel-label">Palette</p>
        <h2>Module Library</h2>
        <label className="palette-search">
          <div className="palette-search-label-row">
            <span className="meta-label">Search</span>
            <kbd className="palette-search-shortcut" title="Press / to focus search">/</kbd>
          </div>
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              activeTab === 'composites'
                ? 'Name or id…'
                : 'Name, id, or keyword…'
            }
          />
        </label>
        <div className="palette-secondary-controls">
          <label className="palette-filter">
            <span className="meta-label">Filter</span>
            <select value={activeTab} onChange={(event) => setActiveTab(event.target.value as ModuleLibraryDomainTab)}>
              <option value="all">All Primitives</option>
              <option value="inputs">Inputs</option>
              <option value="outputs">Outputs</option>
              <option value="symbol">Symbol</option>
              <option value="bit">Bit</option>
              <option value="bridge">Bridges</option>
              <option value="composites">Composites</option>
            </select>
          </label>
          {activeTab === 'composites' ? (
            <div className="palette-toolbar">
              <button
                type="button"
                className="palette-view-toggle-button"
                title={viewMode === 'compact' ? 'Expanded View' : 'Compact View'}
                aria-label={viewMode === 'compact' ? 'Switch to expanded palette view' : 'Switch to compact palette view'}
                onClick={onToggleViewMode}
              >
                <PaletteViewModeIcon viewMode={viewMode} />
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
                className="palette-view-toggle-button"
                title={viewMode === 'compact' ? 'Expanded View' : 'Compact View'}
                aria-label={viewMode === 'compact' ? 'Switch to expanded palette view' : 'Switch to compact palette view'}
                onClick={onToggleViewMode}
              >
                <PaletteViewModeIcon viewMode={viewMode} />
              </button>
            </div>
          )}
        </div>
      </div>
      {viewMode !== 'compact' ? (
        <div className="palette-starters">
          <p className="palette-starters-label">Quick Start</p>
          <div className="palette-starters-chips">
            {PIPELINE_STARTERS.map((starter) => (
              <button
                key={starter.id}
                type="button"
                className="palette-starter-chip"
                title={starter.description}
                onClick={() => onInsertStarterChain(starter.id)}
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {searchActive ? (
        <div className="primitive-sections primitive-search-results" role="list" aria-label="Palette search results">
          <div className="primitive-search-summary">
            <p className="panel-label">Results</p>
            <p className="primitive-search-copy">
              {rankedVisibleDefs.length} match{rankedVisibleDefs.length === 1 ? '' : 'es'} for “{searchQuery.trim()}”
            </p>
          </div>
          <ul className="primitive-list">
            {rankedVisibleDefs.map((def) => (
              <ModuleLibraryCard
                key={def.id}
                def={def}
                viewMode={viewMode}
                usageCount={compositeUsageCountById[def.id] ?? 0}
                isBuiltInReusable={builtInReusableIds.includes(def.id)}
                  onAddModule={onAddModule}
                  onStartCanvasDrag={onStartCanvasDrag}
                  onOpenComposite={onOpenComposite}
                onDuplicateReusable={onDuplicateReusable}
                onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                onRemoveComposite={onRemoveComposite}
                pendingConnectionSourceType={pendingConnectionSourceType}
                onDropForPendingConnection={onDropForPendingConnection}
              />
            ))}
          </ul>
        </div>
      ) : activeTab !== 'composites' ? (
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
                    isBuiltInReusable={false}
                onAddModule={onAddModule}
                onStartCanvasDrag={onStartCanvasDrag}
                onOpenComposite={onOpenComposite}
                    onDuplicateReusable={onDuplicateReusable}
                    onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                    onRemoveComposite={onRemoveComposite}
                    pendingConnectionSourceType={pendingConnectionSourceType}
                    onDropForPendingConnection={onDropForPendingConnection}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="primitive-sections">
          {[
            {
              id: 'built-in-composites',
              title: 'Built-In Composites',
              description: 'Shipped composite architecture modules provided by the product.',
              defs: visibleDefs.filter(
                (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'composite',
              ),
            },
            {
              id: 'built-in-iterators',
              title: 'Built-In Iterators',
              description: 'Shipped bounded iterator architectures provided by the product.',
              defs: visibleDefs.filter(
                (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'iterator',
              ),
            },
            {
              id: 'built-in-conditionals',
              title: 'Built-In Conditionals',
              description: 'Shipped conditional branching modules — one control bit selects which branch definition runs.',
              defs: visibleDefs.filter(
                (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'conditional',
              ),
            },
            {
              id: 'user-conditionals',
              title: 'My Conditionals',
              description: 'Conditional modules you authored — one control bit selects which branch runs.',
              defs: visibleDefs.filter(
                (def) => !builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'conditional',
              ),
            },
            {
              id: 'user-multi-conditionals',
              title: 'My Multi-Conditionals',
              description: 'Multi-branch modules you authored — a multi-bit control word selects which branch runs.',
              defs: visibleDefs.filter(
                (def) => 'kind' in def && def.kind === 'multi-conditional',
              ),
            },
            {
              id: 'user-composites',
              title: 'My Composites',
              description: 'Editable composite modules you created yourself.',
              defs: visibleDefs.filter(
                (def) => !builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'composite',
              ),
            },
            {
              id: 'user-iterators',
              title: 'My Iterators',
              description: 'Editable bounded iterator modules you created yourself.',
              defs: visibleDefs.filter(
                (def) => !builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'iterator',
              ),
            },
          ]
            .filter((section) => section.defs.length > 0)
            .map((section) => (
              <section key={section.id} className="primitive-section">
                <div className="primitive-section-head">
                  <p className="panel-label">{section.title}</p>
                  {viewMode === 'expanded' ? (
                    <p className="primitive-section-copy">{section.description}</p>
                  ) : null}
                </div>
                <ul className="primitive-list">
                  {section.defs.map((def) => (
                    <ModuleLibraryCard
                      key={def.id}
                      def={def}
                      viewMode={viewMode}
                      usageCount={compositeUsageCountById[def.id] ?? 0}
                      isBuiltInReusable={builtInReusableIds.includes(def.id)}
                      onAddModule={onAddModule}
                      onStartCanvasDrag={onStartCanvasDrag}
                      onOpenComposite={onOpenComposite}
                      onDuplicateReusable={onDuplicateReusable}
                      onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                      onRemoveComposite={onRemoveComposite}
                      pendingConnectionSourceType={pendingConnectionSourceType}
                      onDropForPendingConnection={onDropForPendingConnection}
                    />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
      {visibleDefs.length === 0 ? (
        <p className="empty-state">
          {searchActive
            ? activeTab === 'composites'
              ? 'No composites or iterators match this search. Press Escape to clear and browse again.'
              : 'No modules match this search. Press Escape to clear and browse again.'
            : activeTab === 'composites'
              ? 'No built-in architectures or personal composites match this search.'
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
  isBuiltInReusable: boolean;
  onAddModule: (defId: string) => void;
  onStartCanvasDrag?: (defId: string, clientX: number, clientY: number) => void;
  onOpenComposite: (defId: string) => void;
  onDuplicateReusable: (defId: string) => void;
  onOpenPrimitiveMicroDemo: (defId: string) => void;
  onRemoveComposite: (defId: string) => void;
  pendingConnectionSourceType?: string | null;
  onDropForPendingConnection?: (defId: string, toPort: string) => void;
}

function ModuleLibraryCard({
  def,
  viewMode,
  usageCount,
  isBuiltInReusable,
  onAddModule,
  onStartCanvasDrag,
  onOpenComposite,
  onDuplicateReusable,
  onOpenPrimitiveMicroDemo,
  onRemoveComposite,
  pendingConnectionSourceType,
  onDropForPendingConnection,
}: ModuleLibraryCardProps) {
  const isComposite = 'kind' in def && def.kind === 'composite';
  const isIterator = 'kind' in def && def.kind === 'iterator';
  const isConditional = 'kind' in def && def.kind === 'conditional';
  const isMultiConditional = 'kind' in def && def.kind === 'multi-conditional';
  const isReusable = isComposite || isIterator || isConditional || isMultiConditional;
  const [showHelp, setShowHelp] = useState(false);
  const primitiveMicroDemo = getPrimitiveMicroDemo(def.id);

  const compatibleDropPort = pendingConnectionSourceType
    ? def.inputs.find((p) => p.type === pendingConnectionSourceType) ?? null
    : null;
  const isDropTarget = compatibleDropPort !== null;

  function handleDropMouseUp(event: React.MouseEvent) {
    if (!compatibleDropPort || !onDropForPendingConnection) return;
    event.stopPropagation();
    onDropForPendingConnection(def.id, compatibleDropPort.name);
  }

  function handleCardMouseDown(event: React.MouseEvent) {
    if (!onStartCanvasDrag || pendingConnectionSourceType || event.button !== 0) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest('button, input, textarea, select, a, [data-no-palette-drag="true"]')
    ) {
      return;
    }

    event.preventDefault();
    onStartCanvasDrag(def.id, event.clientX, event.clientY);
  }

  if (viewMode === 'compact') {
    return (
      <li
        className={`primitive-card primitive-compact-row primitive-card-${getModuleCategory(def)}${isDropTarget ? ' primitive-card-droppable' : pendingConnectionSourceType ? ' primitive-card-incompat' : ''}`}
        onMouseUp={isDropTarget ? handleDropMouseUp : undefined}
      >
        <div className="primitive-compact-main">
          <div className="primitive-compact-meta">
            <strong className="primitive-title">{def.name}</strong>
            {isDropTarget ? (
              <span className="primitive-drop-hint">→ {compatibleDropPort?.name}</span>
            ) : null}
            {isReusable ? (
              <span className={isComposite ? 'module-kind-badge' : 'module-kind-badge module-kind-badge-iterator'}>
                {isBuiltInReusable ? 'Architecture' : isComposite ? 'Composite' : 'Iterator'}
              </span>
            ) : null}
            {isReusable ? (
              <p className="primitive-reuse-summary">
                {def.inputs.length} in / {def.outputs.length} out
                {usageCount > 0 ? ` · In use ${usageCount} time${usageCount === 1 ? '' : 's'}` : ''}
              </p>
            ) : null}
          </div>
          <div className="primitive-compact-actions">
            <button
              type="button"
              className="primitive-action-button"
              onClick={() => onAddModule(def.id)}
              title={`Add ${def.name}`}
              aria-label={`Add ${def.name}`}
            >
              +
            </button>
            {isBuiltInReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onDuplicateReusable(def.id)}
                title={`Duplicate ${def.name} into My Reusables`}
                aria-label={`Duplicate ${def.name} into My Reusables`}
              >
                ⧉
              </button>
            ) : null}
            {primitiveMicroDemo ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onOpenPrimitiveMicroDemo(def.id)}
                title={`Try ${def.name} in a minimal example`}
                aria-label={`Try ${def.name} in a minimal example`}
              >
                ▶
              </button>
            ) : null}
            {isComposite && !isBuiltInReusable ? (
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
            {isReusable && !isBuiltInReusable ? (
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
        </div>
      </li>
    );
  }

  return (
    <li
      key={def.id}
      className={`primitive-card primitive-card-${getModuleCategory(def)}${isDropTarget ? ' primitive-card-droppable' : pendingConnectionSourceType ? ' primitive-card-incompat' : ''}`}
      onMouseUp={isDropTarget ? handleDropMouseUp : undefined}
    >
      <div className="primitive-main" onMouseDown={handleCardMouseDown}>
        <div className="primitive-meta">
          <strong className="primitive-title">{def.name}</strong>
          <p className="primitive-def-id">{def.id}</p>
          <div className="primitive-role-line">
            <span className="content-status-chip">Role: {getModuleRole(def)}</span>
            <span className="primitive-role-detail">{getModuleRoleDetail(def)}</span>
          </div>
          <p className="primitive-purpose">{getModulePurpose(def)}</p>
          {isDropTarget ? (
            <span className="primitive-drop-hint">Release to connect → {compatibleDropPort?.name}</span>
          ) : viewMode === 'expanded' ? (
            <span className="primitive-domain-sig">{getModuleDomainSignature(def)}</span>
          ) : null}
          {isReusable ? (
            <span className={isComposite ? 'module-kind-badge' : 'module-kind-badge module-kind-badge-iterator'}>
              {isBuiltInReusable ? 'Architecture' : isComposite ? 'Composite' : 'Iterator'}
            </span>
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
            {isBuiltInReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onDuplicateReusable(def.id)}
                title={`Duplicate ${def.name} into My Reusables`}
                aria-label={`Duplicate ${def.name} into My Reusables`}
              >
                ⧉
              </button>
            ) : null}
            {primitiveMicroDemo ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onOpenPrimitiveMicroDemo(def.id)}
                title={`Try ${def.name} in a minimal example`}
                aria-label={`Try ${def.name} in a minimal example`}
              >
                ▶
              </button>
            ) : null}
            {isComposite && !isBuiltInReusable ? (
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
            {viewMode === 'expanded' ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => setShowHelp((current) => !current)}
                title={`About ${def.name}`}
                aria-label={`About ${def.name}`}
              >
                ?
              </button>
            ) : null}
            {isReusable && !isBuiltInReusable ? (
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
          {isReusable ? (
            <p className="primitive-composite-note">
              {usageCount > 0
                ? `In use ${usageCount} time${usageCount === 1 ? '' : 's'}`
                : isComposite
                  ? 'Reusable composite'
                  : 'Reusable iterator chain'}
            </p>
          ) : null}
          {isReusable ? (
            <p className="primitive-reuse-summary">
              Inputs:{' '}
              <strong>{def.inputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
              {' · '}
              Outputs:{' '}
              <strong>{def.outputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
            </p>
          ) : null}
        </div>
      </div>
      {viewMode === 'expanded' && showHelp ? (
        <div className="primitive-help-card">
          <p className="primitive-help-role">
            <span className="meta-label">Role</span> <strong>{getModuleRole(def)}</strong> {'\u00b7'} {getModuleRoleDetail(def)}
          </p>
          <span className="meta-label">What It Does</span>
          <p>{getModuleDetail(def)}</p>
          {getModuleTypicalPath(def) ? (
            <p>
              <span className="meta-label">Typical path</span>{' '}
              {getModuleTypicalPath(def)}
            </p>
          ) : null}
          {primitiveMicroDemo ? (
            <p className="comparison-copy">
              <strong>Try Demo:</strong> Loads a tiny editable example focused on this primitive.
            </p>
          ) : null}
          <p className="primitive-help-ports">
            Inputs: <strong>{def.inputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
          </p>
          <p className="primitive-help-ports">
            Outputs: <strong>{def.outputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
          </p>
          {getModuleChainsBefore(def).length > 0 ? (
            <div className="primitive-chains-row">
              <span className="meta-label">Comes after</span>
              <span className="primitive-chains-chips">
                {getModuleChainsBefore(def).map((id) => (
                  <span key={id} className="primitive-chain-chip">{id}</span>
                ))}
              </span>
            </div>
          ) : null}
          {getModuleChainsAfter(def).length > 0 ? (
            <div className="primitive-chains-row">
              <span className="meta-label">Chains into</span>
              <span className="primitive-chains-chips">
                {getModuleChainsAfter(def).map((id) => (
                  <span key={id} className="primitive-chain-chip">{id}</span>
                ))}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
