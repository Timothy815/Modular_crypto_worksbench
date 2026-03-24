import { describe, expect, it } from 'vitest';

import type { CompositeLibraryDocument } from './workbench-document';
import { parseCompositeLibraryDocument, parseGuidedChallengeDocument } from './persistence';

describe('parseCompositeLibraryDocument', () => {
  it('accepts a valid composite library document', () => {
    const document: CompositeLibraryDocument = {
      version: 1,
      entries: [
        {
          id: 'SimpleComposite',
          name: 'Simple Composite',
          version: 1,
          definition: {
            id: 'SimpleComposite',
            name: 'Simple Composite',
            kind: 'composite',
            version: 1,
            inputs: [{ name: 'in', type: 'symbol' }],
            outputs: [{ name: 'out', type: 'symbol' }],
            paramSchema: {},
            project: {
              modules: [{ id: 'loop-1', defId: 'Loop', params: {} }],
              connections: [],
            },
            inputBindings: [
              { externalPort: 'in', internalModuleId: 'loop-1', internalPort: 'in' },
            ],
            outputBindings: [
              { externalPort: 'out', internalModuleId: 'loop-1', internalPort: 'out' },
            ],
          },
        },
      ],
    };

    const result = parseCompositeLibraryDocument(JSON.stringify(document));

    expect(result).toEqual(document);
  });

  it('rejects malformed composite library documents', () => {
    const malformed = JSON.stringify({
      version: 1,
      entries: [{ id: 'Broken' }],
    });

    const result = parseCompositeLibraryDocument(malformed);

    expect(result).toBeNull();
  });
});

describe('parseGuidedChallengeDocument', () => {
  it('accepts collision challenges with an explicit home project', () => {
    const result = parseGuidedChallengeDocument(
      JSON.stringify({
        version: 1,
        id: 'find-sponge-collision',
        title: 'Find A Sponge Collision',
        projectId: 'toy-sponge-hash',
        prompt: 'Find a different 2-byte message with the same digest.',
        startingProject: {
          modules: [],
          connections: [],
        },
        targetProject: {
          modules: [],
          connections: [],
        },
        success: {
          kind: 'output-match-target-with-module-difference',
          moduleIds: ['left-source', 'right-source'],
        },
      }),
    );

    expect(result?.projectId).toBe('toy-sponge-hash');
    expect(result?.success.kind).toBe('output-match-target-with-module-difference');
  });
});
