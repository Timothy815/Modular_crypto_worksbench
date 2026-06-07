import { useEffect, useMemo, useRef, useState } from 'react';

import {
  type DiagnosisBlock,
  type IntentGateway,
  type RouteBlock,
  USER_MANUAL_SECTIONS,
} from '../manual-content';
import { buildManualIndex, searchManualContent } from '../manual-support';

interface ManualWindowProps {
  initialTheme: 'light' | 'dark';
}

interface RecentEntry {
  id: string;
  title: string;
  sectionTitle: string;
}

const RECENT_STORAGE_KEY = 'mcw-manual-last-visited';
const RECENT_MAX = 3;

function loadRecentEntries(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

function saveRecentEntries(entries: RecentEntry[]): void {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be unavailable
  }
}

function detectPrintMode(): boolean {
  return new URLSearchParams(window.location.search).get('print') === '1';
}

function renderManualInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}:${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${part}:${index}`}>{part}</span>;
  });
}

function IntentGatewayGrid({ intents }: { intents: IntentGateway[] }) {
  return (
    <div className="manual-intent-grid">
      {intents.map((item) => (
        <div key={item.intent} className="manual-intent-card">
          <p className="manual-intent-label">{item.intent}</p>
          <p className="manual-intent-destination">
            <span className="meta-label">Go to</span>
            <strong>{item.destination}</strong>
          </p>
          <p className="manual-intent-surface">
            <span className="meta-label">Open</span>
            {item.surface}
          </p>
        </div>
      ))}
    </div>
  );
}

function RouteBlockView({ block }: { block: RouteBlock }) {
  return (
    <div className="manual-route-block">
      {block.useThisWhen ? (
        <div className="manual-route-row">
          <span className="manual-route-label">Use this when</span>
          <span className="manual-route-value">{renderManualInline(block.useThisWhen)}</span>
        </div>
      ) : null}
      {block.openNext ? (
        <div className="manual-route-row">
          <span className="manual-route-label">Open next</span>
          <span className="manual-route-value">{renderManualInline(block.openNext)}</span>
        </div>
      ) : null}
      {block.then ? (
        <div className="manual-route-row">
          <span className="manual-route-label">Then</span>
          <span className="manual-route-value">{renderManualInline(block.then)}</span>
        </div>
      ) : null}
      {block.ifRepairPractice ? (
        <div className="manual-route-row">
          <span className="manual-route-label">Repair practice</span>
          <span className="manual-route-value">{renderManualInline(block.ifRepairPractice)}</span>
        </div>
      ) : null}
    </div>
  );
}

function DiagnosisBlockView({ block }: { block: DiagnosisBlock }) {
  return (
    <div className="manual-diagnosis-block">
      <div className="manual-diagnosis-row">
        <span className="manual-route-label">Likely cause</span>
        <span className="manual-route-value">{renderManualInline(block.likelyCause)}</span>
      </div>
      <div className="manual-diagnosis-row">
        <span className="manual-route-label">What to check</span>
        <span className="manual-route-value">{renderManualInline(block.whatToCheck)}</span>
      </div>
      <div className="manual-diagnosis-row">
        <span className="manual-route-label">What to do next</span>
        <span className="manual-route-value">{renderManualInline(block.whatToDoNext)}</span>
      </div>
    </div>
  );
}

function SeeAlsoBlock({
  ids,
  entryMap,
}: {
  ids: string[];
  entryMap: Map<string, { title: string; sectionTitle: string }>;
}) {
  const resolved = ids.flatMap((id) => {
    const info = entryMap.get(id);
    return info ? [{ id, title: info.title }] : [];
  });

  if (resolved.length === 0) return null;

  return (
    <div className="manual-see-also">
      <span className="manual-entry-subhead">See also</span>
      <div className="manual-see-also-links">
        {resolved.map(({ id, title }) => (
          <a key={id} href={`#${id}`} className="manual-see-also-link">
            {title}
          </a>
        ))}
      </div>
    </div>
  );
}

interface EntryBodyProps {
  entryId: string;
  body: string;
  isCollapsible: boolean;
  isPrint: boolean;
  isOpen: boolean;
  onToggle: (id: string, nowOpen: boolean) => void;
}

function EntryBody({ entryId, body, isCollapsible, isPrint, isOpen, onToggle }: EntryBodyProps) {
  const paragraph = <p className="manual-entry-body">{renderManualInline(body)}</p>;

  if (!isCollapsible || isPrint) {
    return paragraph;
  }

  return (
    <details
      className="manual-body-details"
      open={isOpen}
      onToggle={(e) => {
        onToggle(entryId, (e.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className="manual-body-summary">Context</summary>
      {paragraph}
    </details>
  );
}

export function ManualWindow({ initialTheme }: ManualWindowProps) {
  const isPrint = useMemo(detectPrintMode, []);
  const [query, setQuery] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [recentlyVisited, setRecentlyVisited] = useState<RecentEntry[]>(loadRecentEntries);
  const [collapsedBodies, setCollapsedBodies] = useState<Set<string>>(new Set());

  const indexEntries = useMemo(() => buildManualIndex(USER_MANUAL_SECTIONS), []);
  const searchResults = useMemo(
    () => searchManualContent(USER_MANUAL_SECTIONS, query),
    [query],
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, { title: string; sectionTitle: string }>();
    for (const section of USER_MANUAL_SECTIONS) {
      for (const entry of section.entries) {
        map.set(entry.id, { title: entry.title, sectionTitle: section.title });
      }
    }
    return map;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = initialTheme;
    document.title = isPrint ? 'MCW User Manual — Print' : 'MCW User Manual';
  }, [initialTheme, isPrint]);

  // Track which entry the user is currently reading via IntersectionObserver
  useEffect(() => {
    if (isPrint) return;

    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        }

        const allCards = document.querySelectorAll<HTMLElement>('.manual-entry-card[id]');
        for (const card of allCards) {
          if (intersecting.has(card.id)) {
            setActiveEntryId(card.id);
            return;
          }
        }
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 0 },
    );

    document.querySelectorAll<HTMLElement>('.manual-entry-card[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isPrint]);

  // Scroll the active TOC link into view
  const activeTocLinkRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    if (!activeEntryId) return;
    const link = document.querySelector<HTMLAnchorElement>(
      `.manual-toc-entry-link[href="#${activeEntryId}"]`,
    );
    activeTocLinkRef.current = link;
    link?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeEntryId]);

  // Record a visit after the entry has been in view for 1 second
  useEffect(() => {
    if (!activeEntryId || isPrint) return;
    const info = entryMap.get(activeEntryId);
    if (!info) return;

    const timer = setTimeout(() => {
      setRecentlyVisited((prev) => {
        const next: RecentEntry[] = [
          { id: activeEntryId, title: info.title, sectionTitle: info.sectionTitle },
          ...prev.filter((e) => e.id !== activeEntryId),
        ].slice(0, RECENT_MAX);
        saveRecentEntries(next);
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeEntryId, entryMap, isPrint]);

  const handleBodyToggle = (entryId: string, nowOpen: boolean) => {
    setCollapsedBodies((prev) => {
      const next = new Set(prev);
      if (nowOpen) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const shellClass = `manual-shell${isPrint ? ' manual-shell--print' : ''}`;

  return (
    <div className={shellClass}>
      {!isPrint ? (
        <aside className="manual-sidebar panel">
          <div className="panel-head">
            <p className="panel-label">User Manual</p>
            <h2>Find workflows and boards</h2>
            <p className="comparison-copy">
              Use the table of contents for orientation, search when you know the task you want to
              complete, and use the index when you know a feature or module name.
            </p>
          </div>

          <label className="verification-field">
            <span className="meta-label">Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search features, workflows, or terms"
            />
          </label>

          <section className="manual-sidebar-block">
            <span className="meta-label">Table Of Contents</span>
            <div className="manual-toc">
              {USER_MANUAL_SECTIONS.map((section) => (
                <div key={section.id} className="manual-toc-section">
                  <a href={`#${section.id}`} className="manual-toc-section-link">
                    {section.title}
                  </a>
                  <div className="manual-toc-entries">
                    {section.entries.map((entry) => (
                      <a
                        key={entry.id}
                        href={`#${entry.id}`}
                        className={`manual-toc-entry-link${activeEntryId === entry.id ? ' is-active' : ''}`}
                      >
                        {entry.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {recentlyVisited.length > 0 ? (
            <section className="manual-sidebar-block">
              <span className="meta-label">Recently Viewed</span>
              <div className="manual-recent-list">
                {recentlyVisited.map((recent) => (
                  <a key={recent.id} href={`#${recent.id}`} className="manual-recent-link">
                    <strong>{recent.title}</strong>
                    <span>{recent.sectionTitle}</span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="manual-sidebar-block">
            <span className="meta-label">Index</span>
            <div className="manual-index-list">
              {indexEntries.map((entry) => (
                <a
                  key={`${entry.term}:${entry.entryId}`}
                  href={`#${entry.entryId}`}
                  className="manual-index-link"
                >
                  <strong>{entry.term}</strong>
                  <span>{entry.entryTitle}</span>
                </a>
              ))}
            </div>
          </section>
        </aside>
      ) : null}

      <main className="manual-main">
        {isPrint ? (
          <div className="manual-print-header">
            <div>
              <p className="panel-label">MCW User Manual</p>
              <p className="comparison-copy">
                All sections — printed {new Date().toLocaleDateString()}
              </p>
            </div>
            <button
              className="manual-print-button"
              onClick={() => window.print()}
            >
              Print this page
            </button>
          </div>
        ) : null}

        {query.trim() ? (
          <section className="panel manual-search-panel">
            <div className="panel-head">
              <p className="panel-label">Search Results</p>
              <h2>{searchResults.length} result(s)</h2>
            </div>
            <div className="manual-search-results">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <a
                    key={`${result.entryId}:${result.score}`}
                    href={`#${result.entryId}`}
                    className="manual-search-result"
                  >
                    <strong>{result.entryTitle}</strong>
                    <span className="manual-search-result-section">{result.sectionTitle}</span>
                    <p>{result.excerpt}</p>
                  </a>
                ))
              ) : (
                <p className="comparison-copy">
                  No manual entries matched that search. Try a task or route like `create
                  composite`, `flagship labs`, `verify_parity.py`, `atlas`, or `save version`.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <div className="manual-section-list">
          {USER_MANUAL_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="panel manual-section">
              <div className="panel-head">
                <p className="panel-label">Manual Section</p>
                <h2>{section.title}</h2>
                <p className="comparison-copy">{section.summary}</p>
              </div>
              <div className="manual-entry-list">
                {section.entries.map((entry) => {
                  const isCollapsible = Boolean(entry.keyPoints?.length || entry.diagnosis);
                  const isOpen = !collapsedBodies.has(entry.id);

                  return (
                    <article key={entry.id} id={entry.id} className="manual-entry-card">
                      <h3>{entry.title}</h3>
                      <EntryBody
                        entryId={entry.id}
                        body={entry.body}
                        isCollapsible={isCollapsible}
                        isPrint={isPrint}
                        isOpen={isOpen}
                        onToggle={handleBodyToggle}
                      />
                      {entry.intents?.length ? (
                        <IntentGatewayGrid intents={entry.intents} />
                      ) : null}
                      {entry.keyPoints?.length ? (
                        <>
                          <p className="manual-entry-subhead">Stops</p>
                          <ol className="manual-entry-key-points">
                            {entry.keyPoints.map((point) => (
                              <li key={point}>{renderManualInline(point)}</li>
                            ))}
                          </ol>
                        </>
                      ) : null}
                      {entry.diagnosis ? (
                        <DiagnosisBlockView block={entry.diagnosis} />
                      ) : null}
                      {entry.routeBlock ? (
                        <RouteBlockView block={entry.routeBlock} />
                      ) : null}
                      {entry.seeAlso?.length ? (
                        <SeeAlsoBlock ids={entry.seeAlso} entryMap={entryMap} />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
