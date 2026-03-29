import type { ManualSection } from './manual-content';

export interface ManualSearchResult {
  sectionId: string;
  sectionTitle: string;
  entryId: string;
  entryTitle: string;
  excerpt: string;
  score: number;
}

export interface ManualIndexEntry {
  term: string;
  sectionId: string;
  sectionTitle: string;
  entryId: string;
  entryTitle: string;
}

export function buildManualIndex(sections: ManualSection[]): ManualIndexEntry[] {
  const entries: ManualIndexEntry[] = [];

  for (const section of sections) {
    for (const entry of section.entries) {
      for (const term of entry.indexTerms) {
        entries.push({
          term,
          sectionId: section.id,
          sectionTitle: section.title,
          entryId: entry.id,
          entryTitle: entry.title,
        });
      }
    }
  }

  return entries.sort((left, right) => {
    const termDelta = left.term.localeCompare(right.term);
    if (termDelta !== 0) {
      return termDelta;
    }

    const sectionDelta = left.sectionTitle.localeCompare(right.sectionTitle);
    if (sectionDelta !== 0) {
      return sectionDelta;
    }

    return left.entryTitle.localeCompare(right.entryTitle);
  });
}

export function searchManualContent(
  sections: ManualSection[],
  rawQuery: string,
): ManualSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return [];
  }

  const results: ManualSearchResult[] = [];

  for (const section of sections) {
    for (const entry of section.entries) {
      const title = entry.title.toLowerCase();
      const body = entry.body.toLowerCase();
      const indexTerms = entry.indexTerms.map((term) => term.toLowerCase());

      let score = 0;
      if (title.includes(query)) {
        score += 4;
      }
      if (indexTerms.some((term) => term.includes(query))) {
        score += 3;
      }
      if (body.includes(query)) {
        score += 1;
      }

      if (score === 0) {
        continue;
      }

      results.push({
        sectionId: section.id,
        sectionTitle: section.title,
        entryId: entry.id,
        entryTitle: entry.title,
        excerpt: buildManualExcerpt(entry.body, rawQuery),
        score,
      });
    }
  }

  return results.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const sectionDelta = left.sectionTitle.localeCompare(right.sectionTitle);
    if (sectionDelta !== 0) {
      return sectionDelta;
    }

    return left.entryTitle.localeCompare(right.entryTitle);
  });
}

function buildManualExcerpt(body: string, rawQuery: string): string {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return body.slice(0, 160);
  }

  const normalizedBody = body.toLowerCase();
  const matchIndex = normalizedBody.indexOf(query);
  if (matchIndex === -1) {
    return body.slice(0, 160);
  }

  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(body.length, matchIndex + query.length + 100);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}
