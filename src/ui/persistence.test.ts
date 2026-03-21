import { describe, expect, it } from 'vitest';

import type { CompositeLibraryDocument } from './workbench-document';
import { parseCompositeLibraryDocument } from './persistence';

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
