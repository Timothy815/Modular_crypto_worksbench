import { describe, expect, it } from 'vitest';

import type { CompositeDef, CompositeLibraryEntry } from '../engine/composites';
import type { Project } from '../engine/types';
import type { WorkbenchDocument } from './workbench-document';
import {
  buildEmbeddedCompositeLibraryForProject,
  prepareWorkbenchDocumentImport,
} from './workspace-document-reusables';

function createCompositeEntry(
  id: string,
  name: string,
  internalModuleDefIds: string[],
): CompositeLibraryEntry {
  const definition: CompositeDef = {
    id,
    name,
    kind: 'composite',
    version: 1,
    inputs: [{ name: 'in', type: 'bits' }],
    outputs: [{ name: 'out', type: 'bits' }],
    paramSchema: {},
    project: {
      modules: internalModuleDefIds.map((defId, index) => ({
        id: `inner-${index + 1}`,
        defId,
        params: {},
      })),
      connections: [],
    },
    inputBindings: [],
    outputBindings: [],
  };

  return {
    id,
    name,
    version: 1,
    source: 'user',
    definition,
  };
}

describe('workspace document reusables', () => {
  it('embeds the transitive user-authored reusable dependencies of a project', () => {
    const roundBody = createCompositeEntry('RoundBody', 'Round Body', ['BitShifter']);
    const roundPair = createCompositeEntry('RoundPair', 'Round Pair', ['RoundBody', 'RoundBody']);
    const project: Project = {
      modules: [{ id: 'pair-1', defId: 'RoundPair', params: {} }],
      connections: [],
    };

    const embedded = buildEmbeddedCompositeLibraryForProject(project, [roundBody, roundPair]);

    expect(embedded?.entries.map((entry) => entry.id)).toEqual(['RoundBody', 'RoundPair']);
  });

  it('imports embedded reusables into the current library when there is no conflict', () => {
    const importedEntry = createCompositeEntry('RoundPair', 'Round Pair', ['BitShifter']);
    const document: WorkbenchDocument = {
      version: 1,
      project: {
        modules: [{ id: 'pair-1', defId: 'RoundPair', params: {} }],
        connections: [],
      },
      ui: {
        layout: {},
        annotations: [],
      },
      embeddedCompositeLibrary: {
        version: 1,
        entries: [importedEntry],
      },
    };

    const prepared = prepareWorkbenchDocumentImport(document, []);

    expect(prepared.document.project.modules[0]?.defId).toBe('RoundPair');
    expect(prepared.reusableEntriesToAdd.map((entry: CompositeLibraryEntry) => entry.id)).toEqual([
      'RoundPair',
    ]);
  });

  it('renames conflicting embedded reusables and rewrites the project to match', () => {
    const existingEntry = createCompositeEntry('RoundPair', 'Existing Round Pair', ['XOR']);
    const importedLeaf = createCompositeEntry('RoundBody', 'Imported Round Body', ['BitShifter']);
    const importedParent = createCompositeEntry('RoundPair', 'Imported Round Pair', ['RoundBody']);

    const document: WorkbenchDocument = {
      version: 1,
      project: {
        modules: [{ id: 'pair-1', defId: 'RoundPair', params: {} }],
        connections: [],
      },
      ui: {
        layout: {},
        annotations: [],
      },
      embeddedCompositeLibrary: {
        version: 1,
        entries: [importedLeaf, importedParent],
      },
    };

    const prepared = prepareWorkbenchDocumentImport(document, [existingEntry]);

    expect(prepared.document.project.modules[0]?.defId).toBe('RoundPair-imported');
    expect(prepared.reusableEntriesToAdd.map((entry: CompositeLibraryEntry) => entry.id)).toEqual([
      'RoundBody',
      'RoundPair-imported',
    ]);
    const importedParentDefinition = prepared.reusableEntriesToAdd.find(
      (entry) => entry.id === 'RoundPair-imported',
    )?.definition;
    if (!importedParentDefinition || importedParentDefinition.kind !== 'composite') {
      throw new Error('Expected imported parent composite definition.');
    }
    expect(importedParentDefinition.project.modules[0]?.defId).toBe('RoundBody');
  });
});
