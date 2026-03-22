import type { GuidedTutorial } from './tutorials';

export const STARTER_TUTORIALS: GuidedTutorial[] = [
  {
    version: 1,
    id: 'bridge-walkthrough',
    title: 'Bridge Walkthrough',
    summary: 'Learn how MCW crosses from letters into bits and back again.',
    projectId: 'bridge',
    steps: [
      {
        id: 'bridge-text',
        title: 'Start With A Symbol',
        body: 'The TextInput module emits one letter into the graph. This is the symbolic side of the workbench.',
        focusModuleId: 'text',
        targetStepIndex: 0,
      },
      {
        id: 'bridge-encode',
        title: 'Cross Into Bits',
        body: 'SymbolToBits is an explicit bridge. It turns the incoming letter into a 5-bit value so bit-domain modules can operate on it.',
        focusModuleId: 'encode',
        targetStepIndex: 1,
      },
      {
        id: 'bridge-xor',
        title: 'Mix With A Bit Key',
        body: 'XOR combines the encoded symbol bits with the BitSource key stream. This is the key mixing step in the bridge pipeline.',
        focusModuleId: 'xor',
        targetStepIndex: 2,
      },
      {
        id: 'bridge-decode',
        title: 'Return To Symbols',
        body: 'BitsToSymbol converts the transformed 5-bit value back into a readable letter result.',
        focusModuleId: 'decode',
        targetStepIndex: 3,
      },
      {
        id: 'bridge-output',
        title: 'Read The Result',
        body: 'Output marks the final signal students should inspect while stepping or comparing runs.',
        focusModuleId: 'output',
        targetStepIndex: 4,
      },
    ],
  },
];
