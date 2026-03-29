import { useEffect, useMemo, useState } from 'react';

import { INSTRUCTOR_PILOT_SECTIONS } from '../instructor-pilot-content';
import { buildManualIndex, searchManualContent } from '../manual-support';

interface InstructorPilotWindowProps {
  initialTheme: 'light' | 'dark';
}

export function InstructorPilotWindow({ initialTheme }: InstructorPilotWindowProps) {
  const [query, setQuery] = useState('');
  const indexEntries = useMemo(() => buildManualIndex(INSTRUCTOR_PILOT_SECTIONS), []);
  const searchResults = useMemo(
    () => searchManualContent(INSTRUCTOR_PILOT_SECTIONS, query),
    [query],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = initialTheme;
    document.title = 'MCW Instructor Pilot Pack';
  }, [initialTheme]);

  return (
    <div className="manual-shell">
      <aside className="manual-sidebar panel">
        <div className="panel-head">
          <p className="panel-label">Instructor Pilot Pack</p>
          <h2>Plan a first classroom run</h2>
          <p className="comparison-copy">
            Use this pack to choose the right flagship lab, structure a first pilot, and decide
            what evidence to collect from students.
          </p>
        </div>

        <label className="verification-field">
          <span className="meta-label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pilot steps, labs, or teaching notes"
          />
        </label>

        <section className="manual-sidebar-block">
          <span className="meta-label">Table Of Contents</span>
          <div className="manual-toc">
            {INSTRUCTOR_PILOT_SECTIONS.map((section) => (
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
                  No pilot-pack entries matched that search. Try `lab 1`, `lab 2`, `verification`,
                  `parity`, or `one class`.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <div className="manual-section-list">
          {INSTRUCTOR_PILOT_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="panel manual-section">
              <div className="panel-head">
                <p className="panel-label">Pilot Section</p>
                <h2>{section.title}</h2>
                <p className="comparison-copy">{section.summary}</p>
              </div>
              <div className="manual-entry-list">
                {section.entries.map((entry) => (
                  <article key={entry.id} id={entry.id} className="manual-entry-card">
                    <h3>{entry.title}</h3>
                    <p>{entry.body}</p>
                    <p className="manual-entry-terms">
                      <strong>Index Terms:</strong> {entry.indexTerms.join(', ')}
                    </p>
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
