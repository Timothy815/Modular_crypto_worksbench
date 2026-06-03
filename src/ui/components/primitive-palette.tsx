import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { CompositeLibraryEntry } from '../../engine/composites';
import type { ModuleRegistry } from '../../engine/types';
import {
  getMatchingCanonicalChainsForTarget,
  type CanonicalChainDefinition,
} from '../canonical-chain-insertion';
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
  getPaletteContextRank,
  type PaletteHoveredInputPortHint,
} from '../palette-wayfinding';
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
import {
  formatReusableInterfaceSummary,
  formatReusablePortCounts,
  formatReusableStructuralSummary,
  getReusableOriginLabel,
} from '../reusable-definition-summary';
import { getReusableDependencyVisibility } from '../reusable-dependency-visibility';
import { parseReusablePersonalTagDraft } from '../reusable-library';

interface PrimitivePaletteProps {
  registry: ModuleRegistry;
  activeWorkspaceId: string;
  compositeLibrary: CompositeLibraryEntry[];
  viewMode: 'compact' | 'expanded';
  onToggleViewMode: () => void;
  onAddModule: (defId: string) => void;
  onStartCanvasDrag?: (defId: string, clientX: number, clientY: number) => void;
  onInsertStarterChain: (starterId: string) => void;
  onOpenComposite: (defId: string) => void;
  onEditClockedIterator: (defId: string) => void;
  onDuplicateReusable: (defId: string) => void;
  onRenameReusable: (defId: string, nextName: string) => void;
  onUpdateReusableTags: (defId: string, tags: string[]) => void;
  onPromoteReusable: (defId: string) => void;
  onOpenPrimitiveMicroDemo: (defId: string) => void;
  onExportCompositeLibrary: () => void;
  onRemoveComposite: (defId: string) => void;
  compositeUsageCountById: Record<string, number>;
  builtInReusableIds: string[];
  pendingConnectionSourceType?: string | null;
  hoveredInputPort?: PaletteHoveredInputPortHint | null;
  onDropForPendingConnection?: (defId: string, toPort: string) => void;
  onInsertChainForHoveredInput?: (chainId: string) => void;
  initialActiveTab?: ModuleLibraryDomainTab;
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

export function PrimitivePalette({
  registry,
  activeWorkspaceId,
  compositeLibrary,
  viewMode,
  onToggleViewMode,
  onAddModule,
  onStartCanvasDrag,
  onInsertStarterChain,
  onOpenComposite,
  onEditClockedIterator,
  onDuplicateReusable,
  onRenameReusable,
  onUpdateReusableTags,
  onPromoteReusable,
  onOpenPrimitiveMicroDemo,
  onExportCompositeLibrary,
  onRemoveComposite,
  compositeUsageCountById,
  builtInReusableIds,
  pendingConnectionSourceType,
  hoveredInputPort,
  onDropForPendingConnection,
  onInsertChainForHoveredInput,
  initialActiveTab = 'all',
}: PrimitivePaletteProps) {
  const [activeTab, setActiveTab] = useState<ModuleLibraryDomainTab>(initialActiveTab);
  const [compositesView, setCompositesView] = useState<'all' | 'workspace' | 'personal' | 'built-in'>('all');
  const [personalTagFilter, setPersonalTagFilter] = useState('all');
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

  const reusableEntryById = useMemo(
    () => new Map(compositeLibrary.map((entry) => [entry.id, entry])),
    [compositeLibrary],
  );

  const personalReusableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const entry of compositeLibrary) {
      if (entry.source !== 'built-in' && (entry.scope ?? 'personal') === 'personal') {
        for (const tag of entry.personalTags ?? []) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).sort((left, right) => left.localeCompare(right));
  }, [compositeLibrary]);

  const contextRank = useMemo(
    () =>
      new Map(
        visibleDefs.map((definition) => [
          definition.id,
          getPaletteContextRank(definition, {
            pendingConnectionSourceType,
            hoveredInputPort,
          }),
        ]),
      ),
    [hoveredInputPort, pendingConnectionSourceType, visibleDefs],
  );

  const orderedVisibleDefs = useMemo(
    () =>
      [...visibleDefs].sort((left, right) => {
        const rankDifference = (contextRank.get(right.id) ?? 0) - (contextRank.get(left.id) ?? 0);
        if (rankDifference !== 0) {
          return rankDifference;
        }

        return (sortOrderIndex.get(left.id) ?? 0) - (sortOrderIndex.get(right.id) ?? 0);
      }),
    [contextRank, sortOrderIndex, visibleDefs],
  );

  const filteredCompositeDefs = useMemo(() => {
    if (activeTab !== 'composites') {
      return orderedVisibleDefs;
    }

    const matchesPersonalTagFilter = (defId: string) => {
      if (personalTagFilter === 'all') {
        return true;
      }
      const entry = reusableEntryById.get(defId);
      return Boolean(
        entry &&
          entry.source !== 'built-in' &&
          (entry.scope ?? 'personal') === 'personal' &&
          (entry.personalTags ?? []).includes(personalTagFilter),
      );
    };

    if (compositesView === 'workspace') {
      return orderedVisibleDefs.filter((def) => {
        const entry = reusableEntryById.get(def.id);
        return entry?.scope === 'workspace' && entry.workspaceId === activeWorkspaceId;
      });
    }

    if (compositesView === 'personal') {
      return orderedVisibleDefs.filter((def) => {
        const entry = reusableEntryById.get(def.id);
        return (
          !builtInReusableIds.includes(def.id) &&
          (entry?.scope ?? 'personal') === 'personal' &&
          matchesPersonalTagFilter(def.id)
        );
      });
    }

    if (compositesView === 'built-in') {
      return orderedVisibleDefs.filter((def) => builtInReusableIds.includes(def.id));
    }

    return orderedVisibleDefs.filter((def) => matchesPersonalTagFilter(def.id));
  }, [activeTab, activeWorkspaceId, builtInReusableIds, compositesView, orderedVisibleDefs, personalTagFilter, reusableEntryById]);

  const hoveredTargetChains = useMemo<CanonicalChainDefinition[]>(
    () =>
      hoveredInputPort
        ? getMatchingCanonicalChainsForTarget({
            targetType: hoveredInputPort.type,
            targetKind: hoveredInputPort.kind,
            registry,
          })
        : [],
    [hoveredInputPort, registry],
  );

  const primitiveSections = useMemo(
    () =>
      MODULE_LIBRARY_SECTIONS.filter((section) => section.id !== 'composites')
        .map((section) => ({
          ...section,
          defs: orderedVisibleDefs.filter((def) => getModuleLibrarySectionId(def) === section.id),
        }))
        .filter((section) => section.defs.length > 0),
    [orderedVisibleDefs],
  );

  useEffect(() => {
    if (personalTagFilter !== 'all' && !personalReusableTags.includes(personalTagFilter)) {
      setPersonalTagFilter('all');
    }
  }, [personalReusableTags, personalTagFilter]);

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
          {hoveredInputPort ? (
            <div className="palette-compatibility-label">
              Showing likely sources for {hoveredInputPort.defId ? `${hoveredInputPort.defId}.` : ''}{hoveredInputPort.port} ({hoveredInputPort.type}, {hoveredInputPort.kind})
            </div>
          ) : null}
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
              <optgroup label="Sources &amp; Sinks">
                <option value="inputs">Inputs</option>
                <option value="outputs">Outputs</option>
                <option value="protocol">Protocol &amp; Timing</option>
              </optgroup>
              <optgroup label="Symbol Domain">
                <option value="symbol">Symbol Machines</option>
              </optgroup>
              <optgroup label="Bit Domain">
                <option value="bit">All Bit Domain</option>
                <option value="bit-logic">Bit Logic</option>
                <option value="framing">Framing &amp; Routing</option>
                <option value="block-transforms">Block Transforms</option>
                <option value="modular-arithmetic">Modular Arithmetic</option>
                <option value="elliptic-curves">Elliptic Curves &amp; Fields</option>
                <option value="keystream">State &amp; Keystream</option>
              </optgroup>
              <optgroup label="Cross-Domain">
                <option value="bridge">Bridges</option>
              </optgroup>
              <optgroup label="Authored">
                <option value="composites">Composites</option>
              </optgroup>
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
      {hoveredInputPort && hoveredTargetChains.length > 0 && onInsertChainForHoveredInput ? (
        <div className="palette-common-chains">
          <p className="palette-starters-label">Common chains</p>
          <div className="palette-starters-chips">
            {hoveredTargetChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                className="palette-starter-chip palette-chain-chip"
                title={chain.description}
                onClick={() => onInsertChainForHoveredInput(chain.id)}
              >
                {chain.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
          {activeTab === 'composites' ? (
            <div className="palette-starters">
              <p className="palette-starters-label">Reusable Library</p>
              <div className="palette-starters-chips">
                {(['all', 'workspace', 'personal', 'built-in'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`palette-starter-chip${compositesView === mode ? ' palette-starter-chip-active' : ''}`}
                    onClick={() => setCompositesView(mode)}
                  >
                    {mode === 'all'
                      ? 'All Reusables'
                      : mode === 'workspace'
                        ? 'This Workspace'
                        : mode === 'personal'
                          ? 'Personal Library'
                          : 'Built-In'}
                  </button>
                ))}
              </div>
              <p className="primitive-section-copy">
                Dependency scope shows what a reusable still relies on. Promote creates a personal-library
                copy, not a fully independent package. Workspace-local dependencies remain local unless
                explicitly promoted later.
              </p>
              {personalReusableTags.length > 0 ? (
                <div className="palette-tag-filter" data-no-palette-drag="true">
                  <p className="palette-starters-label">Personal Tags</p>
                  <div className="palette-starters-chips">
                    <button
                      type="button"
                      className={`palette-starter-chip${personalTagFilter === 'all' ? ' palette-starter-chip-active' : ''}`}
                      onClick={() => setPersonalTagFilter('all')}
                    >
                      All Tags
                    </button>
                    {personalReusableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`palette-starter-chip${personalTagFilter === tag ? ' palette-starter-chip-active' : ''}`}
                        onClick={() => {
                          setCompositesView('personal');
                          setPersonalTagFilter(tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {searchActive ? (
        <div className="primitive-sections primitive-search-results" role="list" aria-label="Palette search results">
          <div className="primitive-search-summary">
            <p className="panel-label">Results</p>
            <p className="primitive-search-copy">
              {filteredCompositeDefs.length} match{filteredCompositeDefs.length === 1 ? '' : 'es'} for “{searchQuery.trim()}”
            </p>
          </div>
          <ul className="primitive-list">
            {filteredCompositeDefs.map((def) => (
              <ModuleLibraryCard
                key={def.id}
                def={def}
                entry={reusableEntryById.get(def.id) ?? null}
                compositeLibrary={compositeLibrary}
                registry={registry}
                activeWorkspaceId={activeWorkspaceId}
                viewMode={viewMode}
                usageCount={compositeUsageCountById[def.id] ?? 0}
                isBuiltInReusable={builtInReusableIds.includes(def.id)}
                  onAddModule={onAddModule}
                  onStartCanvasDrag={onStartCanvasDrag}
                onOpenComposite={onOpenComposite}
                onEditClockedIterator={onEditClockedIterator}
                onDuplicateReusable={onDuplicateReusable}
                onRenameReusable={onRenameReusable}
                onUpdateReusableTags={onUpdateReusableTags}
                onPromoteReusable={onPromoteReusable}
                onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                onRemoveComposite={onRemoveComposite}
                pendingConnectionSourceType={pendingConnectionSourceType}
                hoveredInputPort={hoveredInputPort}
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
                    entry={reusableEntryById.get(def.id) ?? null}
                    compositeLibrary={compositeLibrary}
                    registry={registry}
                    activeWorkspaceId={activeWorkspaceId}
                    viewMode={viewMode}
                    usageCount={compositeUsageCountById[def.id] ?? 0}
                    isBuiltInReusable={false}
                onAddModule={onAddModule}
                onStartCanvasDrag={onStartCanvasDrag}
                    onOpenComposite={onOpenComposite}
                    onEditClockedIterator={onEditClockedIterator}
                    onDuplicateReusable={onDuplicateReusable}
                    onRenameReusable={onRenameReusable}
                    onUpdateReusableTags={onUpdateReusableTags}
                    onPromoteReusable={onPromoteReusable}
                    onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                    onRemoveComposite={onRemoveComposite}
                    pendingConnectionSourceType={pendingConnectionSourceType}
                    hoveredInputPort={hoveredInputPort}
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
                defs: filteredCompositeDefs.filter(
                  (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'composite',
                ),
            },
            {
              id: 'built-in-iterators',
              title: 'Built-In Iterators',
              description: 'Shipped bounded iterator architectures provided by the product.',
                defs: filteredCompositeDefs.filter(
                  (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'iterator',
                ),
            },
            {
              id: 'built-in-clocked-iterators',
              title: 'Built-In Clocked Iterators',
              description: 'Shipped pulse-driven bounded iterator architectures provided by the product.',
                defs: filteredCompositeDefs.filter(
                  (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'clocked-iterator',
                ),
            },
            {
              id: 'built-in-conditionals',
              title: 'Built-In Conditionals',
              description: 'Shipped conditional branching modules — one control bit selects which branch definition runs.',
                defs: filteredCompositeDefs.filter(
                  (def) => builtInReusableIds.includes(def.id) && 'kind' in def && def.kind === 'conditional',
                ),
            },
            {
              id: 'workspace-conditionals',
              title: 'This Workspace Conditionals',
              description: 'Conditional modules local to this workspace.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    reusableEntryById.get(def.id)?.scope === 'workspace' &&
                    reusableEntryById.get(def.id)?.workspaceId === activeWorkspaceId &&
                    'kind' in def &&
                    def.kind === 'conditional',
                ),
            },
            {
              id: 'workspace-multi-conditionals',
              title: 'This Workspace Multi-Conditionals',
              description: 'Multi-branch modules local to this workspace.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    reusableEntryById.get(def.id)?.scope === 'workspace' &&
                    reusableEntryById.get(def.id)?.workspaceId === activeWorkspaceId &&
                    'kind' in def &&
                    def.kind === 'multi-conditional',
                ),
            },
            {
              id: 'workspace-composites',
              title: 'This Workspace Composites',
              description: 'Editable composite modules created for this workspace.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    reusableEntryById.get(def.id)?.scope === 'workspace' &&
                    reusableEntryById.get(def.id)?.workspaceId === activeWorkspaceId &&
                    'kind' in def &&
                    def.kind === 'composite',
                ),
            },
            {
              id: 'workspace-iterators',
              title: 'This Workspace Iterators',
              description: 'Editable bounded iterator modules created for this workspace.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    reusableEntryById.get(def.id)?.scope === 'workspace' &&
                    reusableEntryById.get(def.id)?.workspaceId === activeWorkspaceId &&
                    'kind' in def &&
                    def.kind === 'iterator',
                ),
            },
            {
              id: 'workspace-clocked-iterators',
              title: 'This Workspace Clocked Iterators',
              description: 'Pulse-driven bounded iterator modules created for this workspace.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    reusableEntryById.get(def.id)?.scope === 'workspace' &&
                    reusableEntryById.get(def.id)?.workspaceId === activeWorkspaceId &&
                    'kind' in def &&
                    def.kind === 'clocked-iterator',
                ),
            },
            {
              id: 'personal-conditionals',
              title: 'Personal Library Conditionals',
              description: 'Conditional modules promoted for cross-workspace reuse.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    !builtInReusableIds.includes(def.id) &&
                    (reusableEntryById.get(def.id)?.scope ?? 'personal') === 'personal' &&
                    'kind' in def &&
                    def.kind === 'conditional',
                ),
            },
            {
              id: 'personal-multi-conditionals',
              title: 'Personal Library Multi-Conditionals',
              description: 'Multi-branch modules promoted for cross-workspace reuse.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    !builtInReusableIds.includes(def.id) &&
                    (reusableEntryById.get(def.id)?.scope ?? 'personal') === 'personal' &&
                    'kind' in def &&
                    def.kind === 'multi-conditional',
                ),
            },
            {
              id: 'personal-composites',
              title: 'Personal Library Composites',
              description: 'Composite modules promoted for cross-workspace reuse.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    !builtInReusableIds.includes(def.id) &&
                    (reusableEntryById.get(def.id)?.scope ?? 'personal') === 'personal' &&
                    'kind' in def &&
                    def.kind === 'composite',
                ),
            },
            {
              id: 'personal-iterators',
              title: 'Personal Library Iterators',
              description: 'Iterator modules promoted for cross-workspace reuse.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    !builtInReusableIds.includes(def.id) &&
                    (reusableEntryById.get(def.id)?.scope ?? 'personal') === 'personal' &&
                    'kind' in def &&
                    def.kind === 'iterator',
                ),
            },
            {
              id: 'personal-clocked-iterators',
              title: 'Personal Library Clocked Iterators',
              description: 'Clocked iterator modules promoted for cross-workspace reuse.',
              defs: filteredCompositeDefs.filter(
                  (def) =>
                    !builtInReusableIds.includes(def.id) &&
                    (reusableEntryById.get(def.id)?.scope ?? 'personal') === 'personal' &&
                    'kind' in def &&
                    def.kind === 'clocked-iterator',
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
                      entry={reusableEntryById.get(def.id) ?? null}
                      compositeLibrary={compositeLibrary}
                      registry={registry}
                      activeWorkspaceId={activeWorkspaceId}
                      viewMode={viewMode}
                      usageCount={compositeUsageCountById[def.id] ?? 0}
                      isBuiltInReusable={builtInReusableIds.includes(def.id)}
                      onAddModule={onAddModule}
                      onStartCanvasDrag={onStartCanvasDrag}
                      onOpenComposite={onOpenComposite}
                      onEditClockedIterator={onEditClockedIterator}
                      onDuplicateReusable={onDuplicateReusable}
                      onRenameReusable={onRenameReusable}
                      onUpdateReusableTags={onUpdateReusableTags}
                      onPromoteReusable={onPromoteReusable}
                      onOpenPrimitiveMicroDemo={onOpenPrimitiveMicroDemo}
                      onRemoveComposite={onRemoveComposite}
                      pendingConnectionSourceType={pendingConnectionSourceType}
                      hoveredInputPort={hoveredInputPort}
                      onDropForPendingConnection={onDropForPendingConnection}
                    />
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
      {(activeTab === 'composites' ? filteredCompositeDefs.length : visibleDefs.length) === 0 ? (
        <p className="empty-state">
          {searchActive
            ? activeTab === 'composites'
              ? 'No composites or iterators match this search. Press Escape to clear and browse again.'
              : 'No modules match this search. Press Escape to clear and browse again.'
            : activeTab === 'composites'
              ? 'No built-in, workspace, or personal-library reusables match this view.'
              : 'No primitive modules match this search.'}
        </p>
      ) : null}
    </aside>
  );
}

interface ModuleLibraryCardProps {
  def: ModuleRegistry[string];
  entry: CompositeLibraryEntry | null;
  compositeLibrary: CompositeLibraryEntry[];
  registry: ModuleRegistry;
  activeWorkspaceId: string;
  viewMode: 'compact' | 'expanded';
  usageCount: number;
  isBuiltInReusable: boolean;
  onAddModule: (defId: string) => void;
  onStartCanvasDrag?: (defId: string, clientX: number, clientY: number) => void;
  onOpenComposite: (defId: string) => void;
  onEditClockedIterator: (defId: string) => void;
  onDuplicateReusable: (defId: string) => void;
  onRenameReusable: (defId: string, nextName: string) => void;
  onUpdateReusableTags: (defId: string, tags: string[]) => void;
  onPromoteReusable: (defId: string) => void;
  onOpenPrimitiveMicroDemo: (defId: string) => void;
  onRemoveComposite: (defId: string) => void;
  pendingConnectionSourceType?: string | null;
  hoveredInputPort?: PaletteHoveredInputPortHint | null;
  onDropForPendingConnection?: (defId: string, toPort: string) => void;
}

function getRoleClassName(def: ModuleRegistry[string]) {
  return `primitive-role-chip-${getModuleRole(def).toLowerCase().replace(/\s+/g, '-')}`;
}

function ModuleLibraryCard({
  def,
  entry,
  compositeLibrary,
  registry,
  activeWorkspaceId,
  viewMode,
  usageCount,
  isBuiltInReusable,
  onAddModule,
  onStartCanvasDrag,
  onOpenComposite,
  onEditClockedIterator,
  onDuplicateReusable,
  onRenameReusable,
  onUpdateReusableTags,
  onPromoteReusable,
  onOpenPrimitiveMicroDemo,
  onRemoveComposite,
  pendingConnectionSourceType,
  hoveredInputPort,
  onDropForPendingConnection,
}: ModuleLibraryCardProps) {
  const isComposite = 'kind' in def && def.kind === 'composite';
  const isIterator = 'kind' in def && def.kind === 'iterator';
  const isClockedIterator = 'kind' in def && def.kind === 'clocked-iterator';
  const isConditional = 'kind' in def && def.kind === 'conditional';
  const isMultiConditional = 'kind' in def && def.kind === 'multi-conditional';
  const isReusable = isComposite || isIterator || isClockedIterator || isConditional || isMultiConditional;
  const [showHelp, setShowHelp] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [renameDraft, setRenameDraft] = useState(def.name);
  const [tagDraft, setTagDraft] = useState((entry?.personalTags ?? []).join(', '));
  const primitiveMicroDemo = getPrimitiveMicroDemo(def.id);
  const moduleRole = getModuleRole(def);
  const moduleRoleDetail = getModuleRoleDetail(def);
  const moduleTypicalPath = getModuleTypicalPath(def);
  const chainsBefore = getModuleChainsBefore(def);
  const chainsAfter = getModuleChainsAfter(def);
  const reusableOriginLabel = isReusable
    ? getReusableOriginLabel(
        entry ?? { source: isBuiltInReusable ? 'built-in' : 'user' },
        activeWorkspaceId,
      )
    : null;
  const canPromoteReusable =
    Boolean(entry) && entry?.scope === 'workspace' && entry.workspaceId === activeWorkspaceId;
  const canOrganizeReusable =
    entry !== null && entry.source !== 'built-in' && (entry.scope ?? 'personal') === 'personal';
  const personalTags = canOrganizeReusable ? entry?.personalTags ?? [] : [];
  const reusableStructuralSummary = isReusable ? formatReusableStructuralSummary(def, registry) : '';
  const reusablePortCounts = isReusable ? formatReusablePortCounts(def) : '';
  const reusableInterfaceSummary = isReusable ? formatReusableInterfaceSummary(def) : '';
  const reusableDependencyVisibility =
    isReusable && entry
      ? getReusableDependencyVisibility(entry, compositeLibrary, activeWorkspaceId)
      : null;

  useEffect(() => {
    setRenameDraft(def.name);
  }, [def.name]);

  useEffect(() => {
    setTagDraft((entry?.personalTags ?? []).join(', '));
  }, [entry?.personalTags]);

  function submitRename() {
    const normalized = renameDraft.trim();
    if (!normalized || normalized === def.name) {
      setIsRenaming(false);
      setRenameDraft(def.name);
      return;
    }
    onRenameReusable(def.id, normalized);
    setIsRenaming(false);
  }

  function submitTags() {
    if (!entry || !canOrganizeReusable) {
      setIsEditingTags(false);
      return;
    }
    onUpdateReusableTags(def.id, parseReusablePersonalTagDraft(tagDraft));
    setIsEditingTags(false);
  }

  const compatibleDropPort = pendingConnectionSourceType
    ? def.inputs.find((p) => p.type === pendingConnectionSourceType) ?? null
    : null;
  const isDropTarget = compatibleDropPort !== null;
  const isSuggestedSource =
    !pendingConnectionSourceType &&
    hoveredInputPort !== null &&
    hoveredInputPort !== undefined &&
    def.outputs.some((port) => port.type === hoveredInputPort.type);

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
        className={`primitive-card primitive-compact-row primitive-card-${getModuleCategory(def)}${isDropTarget ? ' primitive-card-droppable' : pendingConnectionSourceType ? ' primitive-card-incompat' : ''}${isSuggestedSource ? ' primitive-card-suggested' : ''}`}
        onMouseUp={isDropTarget ? handleDropMouseUp : undefined}
      >
        <div className="primitive-compact-main" onMouseDown={handleCardMouseDown}>
          <div className="primitive-compact-meta">
            <strong className="primitive-title">{def.name}</strong>
            {isDropTarget ? (
              <span className="primitive-drop-hint">→ {compatibleDropPort?.name}</span>
            ) : null}
            {isReusable ? (
              <span className={isComposite ? 'module-kind-badge' : 'module-kind-badge module-kind-badge-iterator'}>
                {isBuiltInReusable ? 'Architecture' : isComposite ? 'Composite' : isClockedIterator ? 'Clocked Iterator' : 'Iterator'}
              </span>
            ) : null}
            <span className={`primitive-role-chip ${getRoleClassName(def)}`}>{moduleRole}</span>
            {isReusable ? (
              <p className="primitive-reuse-summary">
                {reusablePortCounts}
                {reusableStructuralSummary ? ` · ${reusableStructuralSummary}` : ''}
                {usageCount > 0 ? ` · In use ${usageCount} time${usageCount === 1 ? '' : 's'}` : ''}
              </p>
            ) : null}
            {isReusable && reusableDependencyVisibility ? (
              <p className="primitive-reuse-summary">{reusableDependencyVisibility.summary}</p>
            ) : null}
            {personalTags.length > 0 ? (
              <p className="primitive-reuse-summary">
                {personalTags.map((tag) => (
                  <span key={`${def.id}-${tag}`} className="primitive-tag-chip">{tag}</span>
                ))}
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
                title={`Duplicate ${def.name} into This Workspace`}
                aria-label={`Duplicate ${def.name} into This Workspace`}
              >
                ⧉
              </button>
            ) : isReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onDuplicateReusable(def.id)}
                title={`Duplicate ${def.name} as a new reusable definition`}
                aria-label={`Duplicate ${def.name} as a new reusable definition`}
              >
                ⧉
              </button>
            ) : null}
            {primitiveMicroDemo ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onOpenPrimitiveMicroDemo(def.id)}
                title={
                  primitiveMicroDemo.defaultTickedMode
                    ? `Try ${def.name} in a minimal example (opens in ticked mode)`
                    : `Try ${def.name} in a minimal example`
                }
                aria-label={
                  primitiveMicroDemo.defaultTickedMode
                    ? `Try ${def.name} in a minimal example that opens in ticked mode`
                    : `Try ${def.name} in a minimal example`
                }
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
            {isClockedIterator && !isBuiltInReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onEditClockedIterator(def.id)}
                title={`Edit ${def.name}`}
                aria-label={`Edit ${def.name}`}
              >
                ✎
              </button>
            ) : null}
            {isReusable && !isBuiltInReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => setIsRenaming((current) => !current)}
                title={`Rename ${def.name}`}
                aria-label={`Rename ${def.name}`}
              >
                Aa
              </button>
            ) : null}
            {canPromoteReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onPromoteReusable(def.id)}
                title={`Promote ${def.name} to Personal Library`}
                aria-label={`Promote ${def.name} to Personal Library`}
              >
                ⇪
              </button>
            ) : null}
            {canOrganizeReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => setIsEditingTags((current) => !current)}
                title={`Organize ${def.name} with personal-library tags`}
                aria-label={`Organize ${def.name} with personal-library tags`}
              >
                #
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
      className={`primitive-card primitive-card-${getModuleCategory(def)}${isDropTarget ? ' primitive-card-droppable' : pendingConnectionSourceType ? ' primitive-card-incompat' : ''}${isSuggestedSource ? ' primitive-card-suggested' : ''}`}
      onMouseUp={isDropTarget ? handleDropMouseUp : undefined}
    >
      <div className="primitive-main" onMouseDown={handleCardMouseDown}>
        <div className="primitive-meta">
          <strong className="primitive-title">{def.name}</strong>
          <p className="primitive-def-id">{def.id}</p>
          <div className="primitive-role-line">
            <span className={`primitive-role-chip ${getRoleClassName(def)}`}>{moduleRole}</span>
            <span className="primitive-role-detail">{moduleRoleDetail}</span>
          </div>
          <p className="primitive-purpose">{getModulePurpose(def)}</p>
          {moduleTypicalPath ? <p className="primitive-typical-path">{moduleTypicalPath}</p> : null}
          {!moduleTypicalPath && (chainsBefore.length > 0 || chainsAfter.length > 0) ? (
            <div className="primitive-inline-chains">
              {chainsBefore.length > 0 ? (
                <span className="primitive-inline-chain-group">
                  <span className="meta-label">After</span>
                  <span className="primitive-chains-chips">
                    {chainsBefore.slice(0, 3).map((id) => (
                      <span key={id} className="primitive-chain-chip">{id}</span>
                    ))}
                  </span>
                </span>
              ) : null}
              {chainsAfter.length > 0 ? (
                <span className="primitive-inline-chain-group">
                  <span className="meta-label">Then</span>
                  <span className="primitive-chains-chips">
                    {chainsAfter.slice(0, 3).map((id) => (
                      <span key={id} className="primitive-chain-chip">{id}</span>
                    ))}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
          {isDropTarget ? (
            <span className="primitive-drop-hint">Release to connect → {compatibleDropPort?.name}</span>
          ) : viewMode === 'expanded' ? (
            <span className="primitive-domain-sig">{getModuleDomainSignature(def)}</span>
          ) : null}
          {isReusable ? (
            <span className={isComposite ? 'module-kind-badge' : 'module-kind-badge module-kind-badge-iterator'}>
              {isBuiltInReusable
                ? 'Architecture'
                : isComposite
                  ? 'Composite'
                  : isClockedIterator
                    ? 'Clocked Iterator'
                    : 'Iterator'}
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
                title={`Duplicate ${def.name} into This Workspace`}
                aria-label={`Duplicate ${def.name} into This Workspace`}
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
            {isClockedIterator && !isBuiltInReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onEditClockedIterator(def.id)}
                title={`Edit ${def.name}`}
                aria-label={`Edit ${def.name}`}
              >
                ✎
              </button>
            ) : null}
            {canPromoteReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => onPromoteReusable(def.id)}
                title={`Promote ${def.name} to Personal Library`}
                aria-label={`Promote ${def.name} to Personal Library`}
              >
                ⇪
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
            {canOrganizeReusable ? (
              <button
                type="button"
                className="primitive-action-button"
                onClick={() => setIsEditingTags((current) => !current)}
                title={`Organize ${def.name} with personal-library tags`}
                aria-label={`Organize ${def.name} with personal-library tags`}
              >
                #
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
                ? `${reusableOriginLabel} · In use ${usageCount} time${usageCount === 1 ? '' : 's'}`
                : reusableOriginLabel}
            </p>
          ) : null}
          {isReusable ? (
            <p className="primitive-reuse-summary">
              <strong>{reusablePortCounts}</strong>
              {reusableStructuralSummary ? ` · ${reusableStructuralSummary}` : ''}
            </p>
          ) : null}
          {isReusable ? (
            <p className="primitive-reuse-summary">
              <strong>{reusableInterfaceSummary}</strong>
            </p>
          ) : null}
          {isReusable && reusableDependencyVisibility ? (
            <p className="primitive-reuse-summary">
              <strong>{reusableDependencyVisibility.summary}</strong>
            </p>
          ) : null}
          {personalTags.length > 0 ? (
            <div className="primitive-tag-row" aria-label={`${def.name} personal-library tags`}>
              {personalTags.map((tag) => (
                <span key={`${def.id}-${tag}`} className="primitive-tag-chip">{tag}</span>
              ))}
            </div>
          ) : null}
          {isReusable && reusableDependencyVisibility && reusableDependencyVisibility.immediateDependencies.length > 0 ? (
            <div className="primitive-help-card" data-no-palette-drag="true">
              <p className="primitive-help-role">
                <span className="meta-label">Immediate Dependencies</span> Immediate reusable names and scopes only.
              </p>
              <ul className="primitive-list">
                {reusableDependencyVisibility.immediateDependencies.map((dependency) => (
                  <li key={`${def.id}-${dependency.id}`} className="primitive-card primitive-compact-row">
                    <div className="primitive-compact-main">
                      <div className="primitive-compact-meta">
                        <strong className="primitive-title">{dependency.name}</strong>
                        <span className="primitive-def-id">{dependency.id}</span>
                        <p className="primitive-reuse-summary">{dependency.scopeLabel}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {isReusable && !isBuiltInReusable && isRenaming ? (
            <div className="primitive-help-card" data-no-palette-drag="true">
              <p className="primitive-help-role">
                <span className="meta-label">Rename Reusable</span> Display name only. Stable id stays{' '}
                <strong>{def.id}</strong>.
              </p>
              <label className="workspace-version-item">
                <div>
                  <strong>Display Name</strong>
                </div>
                <input
                  type="text"
                  value={renameDraft}
                  onChange={(event) => setRenameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setIsRenaming(false);
                      setRenameDraft(def.name);
                    }
                  }}
                />
              </label>
              <div className="primitive-button-row">
                <button
                  type="button"
                  className="primitive-action-button"
                  onClick={submitRename}
                >
                  Save Name
                </button>
                <button
                  type="button"
                  className="primitive-action-button"
                  onClick={() => {
                    setIsRenaming(false);
                    setRenameDraft(def.name);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {canOrganizeReusable && isEditingTags ? (
            <div className="primitive-help-card" data-no-palette-drag="true">
              <p className="primitive-help-role">
                <span className="meta-label">Personal Tags</span> Comma-separated labels for browsing your personal library.
              </p>
              <label className="workspace-version-item">
                <div>
                  <strong>Tags</strong>
                </div>
                <input
                  type="text"
                  value={tagDraft}
                  placeholder="rounds, aes, classroom"
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitTags();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setIsEditingTags(false);
                      setTagDraft((entry?.personalTags ?? []).join(', '));
                    }
                  }}
                />
              </label>
              <div className="primitive-button-row">
                <button
                  type="button"
                  className="primitive-action-button"
                  onClick={submitTags}
                >
                  Save Tags
                </button>
                <button
                  type="button"
                  className="primitive-action-button"
                  onClick={() => {
                    setIsEditingTags(false);
                    setTagDraft((entry?.personalTags ?? []).join(', '));
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {viewMode === 'expanded' && showHelp ? (
        <div className="primitive-help-card">
          <p className="primitive-help-role">
            <span className="meta-label">Role</span> <strong>{moduleRole}</strong> {'\u00b7'} {moduleRoleDetail}
          </p>
          <span className="meta-label">What It Does</span>
          <p>{getModuleDetail(def)}</p>
          {moduleTypicalPath ? (
            <p>
              <span className="meta-label">Typical path</span>{' '}
              {moduleTypicalPath}
            </p>
          ) : null}
          {primitiveMicroDemo ? (
            <p className="comparison-copy">
              <strong>Try Demo:</strong> Loads a tiny editable example focused on this primitive.
              {primitiveMicroDemo.defaultTickedMode ? ' Opens in ticked mode.' : ''}
            </p>
          ) : null}
          <p className="primitive-help-ports">
            Inputs: <strong>{def.inputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
          </p>
          <p className="primitive-help-ports">
            Outputs: <strong>{def.outputs.map((port) => `${port.name}:${port.type}`).join(', ') || 'none'}</strong>
          </p>
          {chainsBefore.length > 0 ? (
            <div className="primitive-chains-row">
              <span className="meta-label">Comes after</span>
              <span className="primitive-chains-chips">
                {chainsBefore.map((id) => (
                  <span key={id} className="primitive-chain-chip">{id}</span>
                ))}
              </span>
            </div>
          ) : null}
          {chainsAfter.length > 0 ? (
            <div className="primitive-chains-row">
              <span className="meta-label">Chains into</span>
              <span className="primitive-chains-chips">
                {chainsAfter.map((id) => (
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
