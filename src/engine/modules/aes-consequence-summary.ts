import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function expectAesState(bits: number[], field: string) {
  if (bits.length !== 128) {
    throw new Error(`AES Consequence Summary requires ${field} to be exactly 128 bits.`);
  }
}

export const AesConsequenceSummary: ModuleDef = {
  id: 'AesConsequenceSummary',
  name: 'AES Consequence Summary',
  inputs: [
    { name: 'canonicalStage0', type: 'bits' },
    { name: 'perturbedStage0', type: 'bits' },
    { name: 'canonicalStage1', type: 'bits' },
    { name: 'perturbedStage1', type: 'bits' },
  ],
  outputs: [],
  paramSchema: {
    stage0Label: {
      key: 'stage0Label',
      label: 'Stage 0 Label',
      kind: 'string',
      defaultValue: 'ShiftRows',
      required: true,
      description: 'Human label for the first tracked checkpoint.',
    },
    stage1Label: {
      key: 'stage1Label',
      label: 'Stage 1 Label',
      kind: 'string',
      defaultValue: 'Final output',
      required: true,
      description: 'Human label for the second tracked checkpoint.',
    },
    ruleChanged: {
      key: 'ruleChanged',
      label: 'Rule Changed',
      kind: 'string',
      defaultValue: 'One bounded AES rule changed.',
      required: true,
      description: 'Board-authored explanation of the structural edit being compared.',
    },
    claimBoundary: {
      key: 'claimBoundary',
      label: 'Claim Boundary',
      kind: 'string',
      defaultValue: 'This is a local machine consequence, not a cryptographic strength claim.',
      required: true,
      description: 'Board-authored boundary sentence describing what the comparison does not prove.',
    },
  },
  evaluate: (inputs) => {
    expectAesState(expectBitsSignal(inputs.canonicalStage0, 'AesConsequenceSummary'), 'canonicalStage0');
    expectAesState(expectBitsSignal(inputs.perturbedStage0, 'AesConsequenceSummary'), 'perturbedStage0');
    expectAesState(expectBitsSignal(inputs.canonicalStage1, 'AesConsequenceSummary'), 'canonicalStage1');
    expectAesState(expectBitsSignal(inputs.perturbedStage1, 'AesConsequenceSummary'), 'perturbedStage1');
    return {};
  },
};
