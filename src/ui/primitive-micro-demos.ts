import type { WorkbenchDocument } from './workbench-document';

export interface PrimitiveMicroDemo {
  defId: string;
  name: string;
  summary: string;
  pipeline: string;
  defaultTickedMode?: boolean;
  document: WorkbenchDocument;
}

const MUX_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Mux',
  name: 'Mux Micro Demo',
  summary: 'Minimal visible selector: one control bit chooses whether input a or input b reaches the output.',
  pipeline: 'Mux(select,a,b) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'mux', defId: 'Mux', params: {} },
        { id: 'select', defId: 'BitSource', params: { stream: [1] } },
        { id: 'input-a', defId: 'BitSource', params: { stream: [0] } },
        { id: 'input-b', defId: 'BitSource', params: { stream: [1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'mux', port: 'select' } },
        { from: { moduleId: 'input-a', port: 'out' }, to: { moduleId: 'mux', port: 'a' } },
        { from: { moduleId: 'input-b', port: 'out' }, to: { moduleId: 'mux', port: 'b' } },
        { from: { moduleId: 'mux', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        mux: { x: 360, y: 176 },
        select: { x: 76, y: 52 },
        'input-a': { x: 76, y: 176 },
        'input-b': { x: 76, y: 300 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const DEMUX_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Demux',
  name: 'Demux Micro Demo',
  summary: 'Minimal visible routing: one control bit sends the input into output a or output b.',
  pipeline: 'Demux(select,in) -> BitOutput(a,b)',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'demux', defId: 'Demux', params: {} },
        { id: 'select', defId: 'BitSource', params: { stream: [1] } },
        { id: 'input', defId: 'BitSource', params: { stream: [1] } },
        { id: 'out-a', defId: 'BitOutput', params: {} },
        { id: 'out-b', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'demux', port: 'select' } },
        { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'demux', port: 'in' } },
        { from: { moduleId: 'demux', port: 'a' }, to: { moduleId: 'out-a', port: 'in' } },
        { from: { moduleId: 'demux', port: 'b' }, to: { moduleId: 'out-b', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        demux: { x: 356, y: 176 },
        select: { x: 76, y: 84 },
        input: { x: 76, y: 268 },
        'out-a': { x: 620, y: 120 },
        'out-b': { x: 620, y: 256 },
      },
      annotations: [],
    },
  },
};

const GATE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Gate',
  name: 'Gate Micro Demo',
  summary: 'Minimal visible gate: the control bit decides whether the signal passes through or is zeroed out.',
  pipeline: 'Gate(in,control) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'gate', defId: 'Gate', params: {} },
        { id: 'signal', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'control', defId: 'BitSource', params: { stream: [1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'signal', port: 'out' }, to: { moduleId: 'gate', port: 'in' } },
        { from: { moduleId: 'control', port: 'out' }, to: { moduleId: 'gate', port: 'control' } },
        { from: { moduleId: 'gate', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        gate: { x: 360, y: 176 },
        signal: { x: 76, y: 126 },
        control: { x: 76, y: 268 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const EQUALS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Equals',
  name: 'Equals Micro Demo',
  summary: 'Minimal visible equality check: two equal-width bit words produce a one-bit match result.',
  pipeline: 'Equals(a,b) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'equals', defId: 'Equals', params: {} },
        { id: 'left', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'right', defId: 'BitSource', params: { stream: [1, 0, 1, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'equals', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'equals', port: 'b' } },
        { from: { moduleId: 'equals', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        equals: { x: 360, y: 176 },
        left: { x: 76, y: 116 },
        right: { x: 76, y: 252 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const AT_LEAST_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AtLeast',
  name: 'At Least Micro Demo',
  summary: 'Minimal visible comparison: the output goes high when input a is greater than or equal to input b.',
  pipeline: 'AtLeast(a,b) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'at-least', defId: 'AtLeast', params: {} },
        { id: 'left', defId: 'BitSource', params: { stream: [1, 1, 0, 0] } },
        { id: 'right', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'at-least', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'at-least', port: 'b' } },
        { from: { moduleId: 'at-least', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'at-least': { x: 360, y: 176 },
        left: { x: 76, y: 116 },
        right: { x: 76, y: 252 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const MAJORITY_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Majority',
  name: 'Majority Micro Demo',
  summary: 'Minimal visible vote: three one-bit inputs produce a one-bit output that goes high when at least two inputs are high.',
  pipeline: 'Majority(a,b,c) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'majority', defId: 'Majority', params: {} },
        { id: 'input-a', defId: 'BitSource', params: { stream: [1] } },
        { id: 'input-b', defId: 'BitSource', params: { stream: [0] } },
        { id: 'input-c', defId: 'BitSource', params: { stream: [1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'input-a', port: 'out' }, to: { moduleId: 'majority', port: 'a' } },
        { from: { moduleId: 'input-b', port: 'out' }, to: { moduleId: 'majority', port: 'b' } },
        { from: { moduleId: 'input-c', port: 'out' }, to: { moduleId: 'majority', port: 'c' } },
        { from: { moduleId: 'majority', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        majority: { x: 360, y: 176 },
        'input-a': { x: 76, y: 52 },
        'input-b': { x: 76, y: 176 },
        'input-c': { x: 76, y: 300 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const CLOCK_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Clock',
  name: 'Clock Micro Demo',
  summary: 'Minimal visible pulse source: the clock emits a one-bit pulse stream over ticks.',
  pipeline: 'Clock -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'clock', defId: 'Clock', params: { period: 2, offset: 0, length: 8 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        clock: { x: 180, y: 176 },
        out: { x: 456, y: 176 },
      },
      annotations: [],
    },
  },
};

const COUNTER_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Counter',
  name: 'Counter Micro Demo',
  summary: 'Minimal visible counter: clock pulses advance a fixed-width word that wraps modulo 2^width.',
  pipeline: 'Clock -> Counter -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'counter', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        counter: { x: 360, y: 176 },
        clock: { x: 76, y: 176 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const BIT_SPLIT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitSplit',
  name: 'Bit Split Micro Demo',
  summary: 'Minimal visible framing: one input word is split into left and right outputs at the configured width.',
  pipeline: 'BitSource -> BitSplit -> BitOutput(left,right)',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'split', defId: 'BitSplit', params: { leftWidth: 4 } },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 1, 0, 0] } },
        { id: 'left-out', defId: 'BitOutput', params: {} },
        { id: 'right-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'split', port: 'in' } },
        { from: { moduleId: 'split', port: 'left' }, to: { moduleId: 'left-out', port: 'in' } },
        { from: { moduleId: 'split', port: 'right' }, to: { moduleId: 'right-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        split: { x: 360, y: 176 },
        source: { x: 76, y: 176 },
        'left-out': { x: 620, y: 116 },
        'right-out': { x: 620, y: 252 },
      },
      annotations: [],
    },
  },
};

const BIT_PAD_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitPad',
  name: 'Bit Pad Micro Demo',
  summary: 'Minimal visible padding: one input word is extended to a target width on the chosen side.',
  pipeline: 'BitSource -> BitPad -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'pad', defId: 'BitPad', params: { targetWidth: 8, side: 'left', padBit: '0' } },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        pad: { x: 360, y: 176 },
        source: { x: 76, y: 176 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const BIT_JOIN_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitJoin',
  name: 'Bit Join Micro Demo',
  summary: 'Minimal visible rejoin: two explicit bit inputs are concatenated into one output word.',
  pipeline: 'BitSource(a,b) -> BitJoin -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'join', defId: 'BitJoin', params: {} },
        { id: 'left', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'right', defId: 'BitSource', params: { stream: [0, 1, 0, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left', port: 'out' }, to: { moduleId: 'join', port: 'a' } },
        { from: { moduleId: 'right', port: 'out' }, to: { moduleId: 'join', port: 'b' } },
        { from: { moduleId: 'join', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        join: { x: 360, y: 176 },
        left: { x: 76, y: 116 },
        right: { x: 76, y: 252 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const LFSR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'LFSR',
  name: 'LFSR Micro Demo',
  summary: 'Minimal visible keystream source: a clocked linear-feedback shift register emits a stateful output over ticks.',
  pipeline: 'Clock -> LFSR -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'lfsr', defId: 'LFSR', params: { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 5 } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'lfsr', port: 'clock' } },
        { from: { moduleId: 'lfsr', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        lfsr: { x: 360, y: 176 },
        clock: { x: 76, y: 176 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const MULTI_ROUTER_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'MultiRouter',
  name: 'Multi Router Micro Demo',
  summary: 'Minimal visible case routing: a counter drives a multi-way router so one destination lane is active at a time.',
  pipeline: 'Clock -> Counter -> MultiRouter -> BitOutput(out0..out3)',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'router', defId: 'MultiRouter', params: { routeCount: '4' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'counter', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'out0', defId: 'BitOutput', params: {} },
        { id: 'out1', defId: 'BitOutput', params: {} },
        { id: 'out2', defId: 'BitOutput', params: {} },
        { id: 'out3', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'router', port: 'select' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'router', port: 'in' } },
        { from: { moduleId: 'router', port: 'out0' }, to: { moduleId: 'out0', port: 'in' } },
        { from: { moduleId: 'router', port: 'out1' }, to: { moduleId: 'out1', port: 'in' } },
        { from: { moduleId: 'router', port: 'out2' }, to: { moduleId: 'out2', port: 'in' } },
        { from: { moduleId: 'router', port: 'out3' }, to: { moduleId: 'out3', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        clock: { x: 40, y: 48 },
        counter: { x: 260, y: 48 },
        source: { x: 40, y: 240 },
        router: { x: 500, y: 176 },
        out0: { x: 820, y: 24 },
        out1: { x: 820, y: 124 },
        out2: { x: 820, y: 224 },
        out3: { x: 820, y: 324 },
      },
      annotations: [],
    },
  },
};

const ROTOR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'Rotor',
  name: 'Rotor Micro Demo',
  summary: 'Minimal visible forward traversal: one letter enters a rotor and exits through its active wiring.',
  pipeline: 'TextInput -> Rotor -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'rotor',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor', port: 'in' } },
        { from: { moduleId: 'rotor', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        rotor: { x: 356, y: 176 },
        text: { x: 76, y: 176 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const ROTOR_REVERSE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RotorReverse',
  name: 'Rotor Reverse Micro Demo',
  summary: 'Minimal visible return path: a letter passes through a rotor, reflects, then comes back through RotorReverse.',
  pipeline: 'TextInput -> Rotor -> Reflector -> RotorReverse -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'rotor-reverse',
          defId: 'RotorReverse',
          params: {
            linkedRotorId: 'rotor-forward',
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        {
          id: 'rotor-forward',
          defId: 'Rotor',
          params: {
            wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''),
            position: 0,
            ringOffset: 0,
            notches: '',
          },
        },
        {
          id: 'reflector',
          defId: 'Reflector',
          params: { wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT'.split('') },
        },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor-forward', port: 'in' } },
        { from: { moduleId: 'rotor-forward', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
        { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-reverse', port: 'in' } },
        { from: { moduleId: 'rotor-reverse', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'rotor-reverse': { x: 812, y: 176 },
        text: { x: 48, y: 176 },
        'rotor-forward': { x: 300, y: 176 },
        reflector: { x: 556, y: 176 },
        out: { x: 1068, y: 176 },
      },
      annotations: [],
    },
  },
};

export const PRIMITIVE_MICRO_DEMOS: PrimitiveMicroDemo[] = [
  MUX_MICRO_DEMO,
  DEMUX_MICRO_DEMO,
  GATE_MICRO_DEMO,
  EQUALS_MICRO_DEMO,
  AT_LEAST_MICRO_DEMO,
  MAJORITY_MICRO_DEMO,
  CLOCK_MICRO_DEMO,
  COUNTER_MICRO_DEMO,
  BIT_SPLIT_MICRO_DEMO,
  BIT_PAD_MICRO_DEMO,
  BIT_JOIN_MICRO_DEMO,
  LFSR_MICRO_DEMO,
  MULTI_ROUTER_MICRO_DEMO,
  ROTOR_MICRO_DEMO,
  ROTOR_REVERSE_MICRO_DEMO,
];

const PRIMITIVE_MICRO_DEMO_BY_DEF_ID = Object.fromEntries(
  PRIMITIVE_MICRO_DEMOS.map((entry) => [entry.defId, entry]),
) as Record<string, PrimitiveMicroDemo>;

export function getPrimitiveMicroDemo(defId: string): PrimitiveMicroDemo | null {
  return PRIMITIVE_MICRO_DEMO_BY_DEF_ID[defId] ?? null;
}
