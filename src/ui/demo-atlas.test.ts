import { describe, expect, it } from 'vitest';

import {
  DEMO_ATLAS_SECTIONS,
  filterDemoAtlasSections,
  getDemoAtlasCoverage,
  getDemoAtlasSections,
  getDemoAtlasStartHereEntries,
} from './demo-atlas';
import { demoProjects } from './demo-projects';
import { PIPELINE_MICRO_DEMOS } from './pipeline-micro-demos';

describe('demo atlas', () => {
  it('keeps every shipped full demo and pipeline micro demo assigned to an atlas section', () => {
    const coverage = getDemoAtlasCoverage();

    expect(new Set(coverage.mappedFullDemoIds)).toEqual(new Set(coverage.fullDemoIds));
    expect(new Set(coverage.mappedPipelineIds)).toEqual(new Set(coverage.pipelineIds));
  });

  it('builds the shipped editorial section list with a dedicated pipeline micro demo section', () => {
    expect(DEMO_ATLAS_SECTIONS.map((section) => section.id)).toEqual([
      'foundations',
      'classical-systems',
      'modern-machines',
      'protocols-and-integrity',
      'arithmetic-and-aes',
      'public-key-and-ecc',
      'pipeline-micro-demos',
    ]);
  });

  it('includes every full demo and pipeline micro demo in the rendered atlas sections', () => {
    const sections = getDemoAtlasSections();
    const sectionEntries = sections.flatMap((section) => section.entries.map((entry) => entry.id));

    expect(new Set(sectionEntries)).toEqual(
      new Set([
        ...demoProjects.map((project) => project.id),
        ...PIPELINE_MICRO_DEMOS.map((demo) => demo.id),
      ]),
    );
  });

  it('anchors Start Here to a bounded editorial list when no core demos are present', () => {
    expect(getDemoAtlasStartHereEntries().map((entry) => entry.id)).toEqual([
      'bridge',
      'modern',
      'visible-bridge-family',
      'gf2-multiply',
      'visible-point-mechanics',
    ]);
  });

  it('filters atlas entries by case-insensitive partial concept matches', () => {
    expect(
      filterDemoAtlasSections('aes')
        .flatMap((section) => section.entries.map((entry) => entry.id)),
    ).toContain('aes-round-full');

    expect(
      filterDemoAtlasSections('diffie')
        .flatMap((section) => section.entries.map((entry) => entry.id)),
    ).toContain('diffie-hellman-key-exchange');

    expect(
      filterDemoAtlasSections('rotor')
        .flatMap((section) => section.entries.map((entry) => entry.id)),
    ).toContain('enigma-machine');

    expect(
      filterDemoAtlasSections('s-box')
        .flatMap((section) => section.entries.map((entry) => entry.id)),
    ).toContain('visible-subbytes');
  });

  it('does not index display-only chips in V1 search', () => {
    expect(
      filterDemoAtlasSections('good first board')
        .flatMap((section) => section.entries.map((entry) => entry.id)),
    ).toEqual([]);
  });
});
