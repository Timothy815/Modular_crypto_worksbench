import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  DEMO_ATLAS_SECTIONS,
  filterDemoAtlasSections,
  getDemoAtlasStartHereEntries,
  type AtlasSectionId,
  type DemoAtlasEntry,
} from '../demo-atlas';

interface DemoAtlasPanelProps {
  currentProjectId: string;
  onOpenProject: (projectId: string) => void;
  onOpenPipelineMicroDemo: (pipelineId: string) => void;
}

function DemoAtlasEntryRow({
  entry,
  currentProjectId,
  onOpenProject,
  onOpenPipelineMicroDemo,
}: {
  entry: DemoAtlasEntry;
  currentProjectId: string;
  onOpenProject: (projectId: string) => void;
  onOpenPipelineMicroDemo: (pipelineId: string) => void;
}) {
  const isOpen = entry.kindLabel === 'Full Demo' && currentProjectId === entry.id;

  return (
    <div className="demo-atlas-entry">
      <div className="demo-atlas-entry-head">
        <div>
          <strong>{entry.title}</strong>
          <p className="comparison-copy">{entry.summary}</p>
        </div>
        <div className="demo-atlas-chip-row">
          <span className="content-status-chip">{entry.kindLabel}</span>
          {entry.isGoodFirstBoard ? (
            <span className="content-status-chip tutorial-completed-chip">Good first board</span>
          ) : null}
          {entry.isAdvanced ? (
            <span className="content-status-chip status-chip-warning">Advanced</span>
          ) : null}
          {entry.usesTickedMode ? (
            <span className="content-status-chip">Uses ticked mode</span>
          ) : null}
          {isOpen ? (
            <span className="content-status-chip tutorial-completed-chip">Open now</span>
          ) : null}
        </div>
      </div>
      <div className="comparison-actions">
        <button
          type="button"
          className="mini-action-button"
          onClick={() =>
            entry.kindLabel === 'Full Demo'
              ? onOpenProject(entry.id)
              : onOpenPipelineMicroDemo(entry.id)
          }
        >
          {entry.kindLabel === 'Full Demo' ? 'Open Demo' : 'Open Pipeline Demo'}
        </button>
      </div>
    </div>
  );
}

function DemoAtlasSectionChooser({
  sectionId,
  title,
  description,
  entryCount,
  isActive,
  onSelect,
}: {
  sectionId: AtlasSectionId;
  title: string;
  description: string;
  entryCount: number;
  isActive: boolean;
  onSelect: (sectionId: AtlasSectionId) => void;
}) {
  return (
    <button
      type="button"
      className={isActive ? 'demo-atlas-section-chooser active' : 'demo-atlas-section-chooser'}
      onClick={() => onSelect(sectionId)}
    >
      <span className="meta-label">{title}</span>
      <strong>{entryCount} entries</strong>
      <p className="comparison-copy">{description}</p>
    </button>
  );
}

export function DemoAtlasPanel({
  currentProjectId,
  onOpenProject,
  onOpenPipelineMicroDemo,
}: DemoAtlasPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<AtlasSectionId>('foundations');
  const deferredSearch = useDeferredValue(search);
  const sections = useMemo(
    () => filterDemoAtlasSections(deferredSearch),
    [deferredSearch],
  );
  const isSearching = deferredSearch.trim().length > 0;
  const startHereEntries = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    const entries = getDemoAtlasStartHereEntries();
    if (!normalized) {
      return entries;
    }
    return entries.filter((entry) =>
      [entry.title, entry.summary, entry.sectionLabel, ...entry.keywords]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredSearch]);
  const visibleSections = useMemo(() => {
    if (isSearching) {
      return sections;
    }

    const selectedSection = sections.find((section) => section.id === selectedSectionId);
    return selectedSection ? [selectedSection] : sections.slice(0, 1);
  }, [isSearching, sections, selectedSectionId]);
  const totalVisibleEntries = useMemo(
    () => sections.reduce((total, section) => total + section.entries.length, 0),
    [sections],
  );

  useEffect(() => {
    if (isSearching) {
      return;
    }
    if (sections.some((section) => section.id === selectedSectionId)) {
      return;
    }
    if (sections[0]) {
      setSelectedSectionId(sections[0].id);
    }
  }, [isSearching, sections, selectedSectionId]);

  return (
    <section className="panel comparison-panel demo-atlas-panel">
      <div className="panel-head demo-atlas-hero">
        <p className="panel-label">Atlas</p>
        <h2>Demo Atlas</h2>
        <p className="comparison-copy">
          Use this as the discovery surface for MCW’s demo library. The Demo menu still exists for
          fast launch; the Atlas explains what each family teaches before you open a board.
        </p>
        <div className="demo-atlas-hero-actions">
          <div className="demo-atlas-search-shell">
            <label className="meta-label" htmlFor="demo-atlas-search">
              Search The Atlas
            </label>
            <input
              id="demo-atlas-search"
              className="text-input demo-atlas-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search demos, sections, or concepts"
            />
          </div>
          <div className="demo-atlas-hero-status">
            <span className="content-status-chip">{DEMO_ATLAS_SECTIONS.length} families</span>
            <span className="content-status-chip">
              {isSearching ? `${totalVisibleEntries} matches` : `${totalVisibleEntries} visible entries`}
            </span>
            <span className="content-status-chip">Full Demo + Pipeline Micro Demo</span>
          </div>
        </div>
      </div>

      <div className="comparison-card comparison-card-wide demo-atlas-start-card">
        <span className="meta-label">Start Here</span>
        <p className="comparison-copy">
          New to the workbench? Start with one of these boards to learn the shape of the product
          before branching into AES, ECC, or rotor-era systems.
        </p>
        <div className="demo-atlas-entry-list">
          {startHereEntries.map((entry) => (
            <DemoAtlasEntryRow
              key={`start-${entry.id}`}
              entry={entry}
              currentProjectId={currentProjectId}
              onOpenProject={onOpenProject}
              onOpenPipelineMicroDemo={onOpenPipelineMicroDemo}
            />
          ))}
        </div>
      </div>

      {!isSearching ? (
        <div className="comparison-card comparison-card-wide demo-atlas-map-card">
          <span className="meta-label">Browse By Family</span>
          <p className="comparison-copy">
            Pick a family first, then inspect the boards inside it. This is the concept map view;
            use search when you already know the idea you want.
          </p>
          <div className="demo-atlas-section-chooser-grid">
            {sections.map((section) => (
              <DemoAtlasSectionChooser
                key={section.id}
                sectionId={section.id}
                title={section.title}
                description={section.description}
                entryCount={section.entries.length}
                isActive={section.id === selectedSectionId}
                onSelect={setSelectedSectionId}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="comparison-card comparison-card-wide demo-atlas-search-results-card">
          <span className="meta-label">Search Results</span>
          <p className="comparison-copy">
            Showing {totalVisibleEntries} matching {totalVisibleEntries === 1 ? 'entry' : 'entries'} across{' '}
            {sections.length} {sections.length === 1 ? 'family' : 'families'}.
          </p>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="comparison-card comparison-card-wide">
          <span className="meta-label">No matches</span>
          <p className="comparison-copy">
            No atlas entries matched that search. Try a demo family, concept, or board title.
          </p>
        </div>
      ) : null}

      <div className="comparison-grid demo-atlas-grid">
        {visibleSections.map((section) => (
          <div key={section.id} className="comparison-card comparison-card-wide demo-atlas-section-card">
            <div className="demo-atlas-section-header">
              <div>
                <span className="meta-label">{section.title}</span>
                <p className="comparison-copy">{section.description}</p>
              </div>
              <div className="demo-atlas-chip-row">
                <span className="content-status-chip">{section.entryKindLabel}</span>
                <span className="content-status-chip">{section.entries.length} entries</span>
              </div>
            </div>
            <div className="demo-atlas-entry-list">
              {section.entries.map((entry) => (
                <DemoAtlasEntryRow
                  key={entry.id}
                  entry={entry}
                  currentProjectId={currentProjectId}
                  onOpenProject={onOpenProject}
                  onOpenPipelineMicroDemo={onOpenPipelineMicroDemo}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
