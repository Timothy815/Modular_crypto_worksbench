import { useEffect, useMemo, useState } from 'react';

import { USER_MANUAL_SECTIONS } from '../manual-content';
import { buildManualIndex, searchManualContent } from '../manual-support';

interface ManualWindowProps {
  initialTheme: 'light' | 'dark';
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

export function ManualWindow({ initialTheme }: ManualWindowProps) {
  const [query, setQuery] = useState('');
  const indexEntries = useMemo(() => buildManualIndex(USER_MANUAL_SECTIONS), []);
  const searchResults = useMemo(
    () => searchManualContent(USER_MANUAL_SECTIONS, query),
    [query],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = initialTheme;
    document.title = 'MCW User Manual';
  }, [initialTheme]);

  return (
    <div className="manual-shell">
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
                    <a key={entry.id} href={`#${entry.id}`} className="manual-toc-entry-link">
                      {entry.title}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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

      <main className="manual-main">
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
                {section.entries.map((entry) => (
                  <article key={entry.id} id={entry.id} className="manual-entry-card">
                    <h3>{entry.title}</h3>
                    <p className="manual-entry-body">{renderManualInline(entry.body)}</p>
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
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
