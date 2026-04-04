import { describe, expect, it } from 'vitest';

import {
  getModuleDragAlignmentGuides,
  getOrthogonalPath,
  getOrthogonalPathData,
  getOrthogonalPendingPath,
  snapModulePositionToGuideRails,
} from './workbench-support';

describe('workbench-support orthogonal routing', () => {
  it('starts with a fixed step-back from the source anchor', () => {
    const path = getOrthogonalPath(
      { x: 100, y: 100 },
      'right',
      { x: 260, y: 180 },
      'left',
      0,
      0,
    );

    expect(path).toContain('L 120 100');
    expect(path).toContain('Q');
    expect(path).toContain('L 240 180');
  });

  it('keeps pending orthogonal paths axis-aligned with rounded elbows', () => {
    const path = getOrthogonalPendingPath(
      { x: 100, y: 100 },
      'bottom',
      { x: 180, y: 220 },
    );

    expect(path).toContain('M 100 100');
    expect(path).toContain('L 100 120');
    expect(path).toContain('Q 100 170');
    expect(path).toContain('L 180 220');
  });

  it('applies lane preference to the automatic orthogonal elbow', () => {
    const neutral = getOrthogonalPathData(
      { x: 100, y: 100 },
      'right',
      { x: 260, y: 180 },
      'left',
      0,
      0,
      {},
    );
    const preferred = getOrthogonalPathData(
      { x: 100, y: 100 },
      'right',
      { x: 260, y: 180 },
      'left',
      0,
      0,
      { orthogonalLanePreference: 'positive' },
    );

    expect(preferred.bendHandle?.axis).toBe('x');
    expect(neutral.bendHandle?.axis).toBe('x');
    expect(preferred.bendHandle?.autoValue).toBeGreaterThan(neutral.bendHandle?.autoValue ?? 0);
  });

  it('snaps the nearest module edge or center toward the guide rail instead of away from it', () => {
    const snapped = snapModulePositionToGuideRails(
      { x: 182, y: 92 },
      [
        { id: 'rail-1', axis: 'vertical', position: 188, title: 'Signal Rail' },
        { id: 'rail-2', axis: 'horizontal', position: 140, title: 'Stage Rail' },
      ],
      [],
      [],
      120,
      80,
    );

    expect(snapped).toEqual({ x: 188, y: 100 });
  });

  it('surfaces temporary drag guides for nearby module alignment', () => {
    const guides = getModuleDragAlignmentGuides(
      { x: 96, y: 100 },
      ['dragged'],
      {
        dragged: { x: 96, y: 100 },
        target: { x: 100, y: 220 },
      },
      [],
      [],
      [],
      120,
      80,
    );

    expect(guides).toContainEqual({ axis: 'x', position: 100, kind: 'module' });
  });

  it('surfaces temporary drag guides for nearby guide rails', () => {
    const guides = getModuleDragAlignmentGuides(
      { x: 142, y: 60 },
      ['dragged'],
      {
        dragged: { x: 142, y: 60 },
      },
      [{ id: 'rail-1', axis: 'vertical', position: 150, title: 'Main Rail' }],
      [],
      [],
      120,
      80,
    );

    expect(guides).toContainEqual({ axis: 'x', position: 150, kind: 'guide-rail' });
  });

  it('snaps toward nearby stage label anchors and group box structure', () => {
    const snapped = snapModulePositionToGuideRails(
      { x: 234, y: 128 },
      [],
      [{ id: 'label-1', x: 240, y: 140, text: 'Round 1' }],
      [{ id: 'group-1', x: 80, y: 120, width: 160, height: 100, title: 'Round Box' }],
      120,
      80,
    );

    expect(snapped).toEqual({ x: 240, y: 130 });
  });

  it('surfaces temporary drag guides for stage labels and group boxes', () => {
    const stageLabelGuides = getModuleDragAlignmentGuides(
      { x: 114, y: 60 },
      ['dragged'],
      {
        dragged: { x: 114, y: 60 },
      },
      [],
      [{ id: 'label-1', x: 120, y: 200, text: 'Output' }],
      [],
      120,
      80,
    );

    expect(stageLabelGuides).toContainEqual({
      axis: 'x',
      position: 120,
      kind: 'stage-label',
    });

    const groupBoxGuides = getModuleDragAlignmentGuides(
      { x: 80, y: 114 },
      ['dragged'],
      {
        dragged: { x: 80, y: 114 },
      },
      [],
      [],
      [{ id: 'group-1', x: 60, y: 120, width: 240, height: 180, title: 'Stage Area' }],
      120,
      80,
    );

    expect(groupBoxGuides).toContainEqual({
      axis: 'y',
      position: 120,
      kind: 'group-box',
    });
  });
});
