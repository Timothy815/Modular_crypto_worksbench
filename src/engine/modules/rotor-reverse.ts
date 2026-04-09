import type { StatefulModuleDef } from '../types';
import { advanceRotorParams, buildRotorOutputs } from './rotor';

export const RotorReverse: StatefulModuleDef = {
  id: 'RotorReverse',
  name: 'Rotor Reverse',
  inputs: [
    { name: 'in', type: 'symbol' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [
    { name: 'out', type: 'symbol' },
    { name: 'turnover', type: 'bits' },
  ],
  liveStateDisplay: {
    key: 'position',
    label: 'pos',
    format: 'rotor-position',
  },
  paramSchema: {
    linkedRotorId: {
      key: 'linkedRotorId',
      label: 'Linked Rotor',
      kind: 'string',
      defaultValue: '',
      description: 'Optional forward Rotor instance id to mirror as a shared mechanical rotor state',
    },
    wiring: {
      key: 'wiring',
      label: 'Wiring',
      kind: 'wiring',
      defaultValue: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      required: true,
      description: 'Permutation mapping shared with the forward rotor; reverse travel uses the inverse of the active shifted wiring',
    },
    position: {
      key: 'position',
      label: 'Position',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current visible rotor position (0-25)',
    },
    ringOffset: {
      key: 'ringOffset',
      label: 'Ring Offset',
      kind: 'number',
      defaultValue: 0,
      description: 'Ring setting offset (0-25), kept distinct from rotor position',
    },
    notches: {
      key: 'notches',
      label: 'Notches',
      kind: 'string',
      defaultValue: '',
      description: 'Comma-separated turnover letters such as "Q" or "Q, E"',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('RotorReverse expects a symbol signal');
    }

    return buildRotorOutputs(signal.value, params, 'reverse');
  },
  advance: advanceRotorParams,
};
