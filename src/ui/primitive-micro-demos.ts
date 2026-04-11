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

const SBOX_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'SBox',
  name: 'S-Box Micro Demo',
  summary: 'Minimal visible substitution: one 4-bit input nibble enters an S-Box and leaves as a substituted 4-bit output.',
  pipeline: 'BitSource -> SBox(16) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'sbox',
          defId: 'SBox',
          params: { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' },
        },
        { id: 'source', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'sbox', port: 'in' } },
        { from: { moduleId: 'sbox', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        sbox: { x: 348, y: 176 },
        source: { x: 76, y: 176 },
        out: { x: 620, y: 176 },
      },
      annotations: [],
    },
  },
};

const POLLUX_FRACTIONATION_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PolluxFractionation',
  name: 'Pollux Fractionation Micro Demo',
  summary: 'Minimal visible fractionation: each input bit becomes one output symbol drawn from the zero-set or one-set alphabet.',
  pipeline: 'PolluxFractionation(bits) -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'pollux',
          defId: 'PolluxFractionation',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'source', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 1, 0] } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'pollux', port: 'in' } },
        { from: { moduleId: 'pollux', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        pollux: { x: 360, y: 176 },
        source: { x: 76, y: 176 },
        out: { x: 644, y: 176 },
      },
      annotations: [],
    },
  },
};

const POLLUX_CONTROLLED_FRACTIONATION_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PolluxControlledFractionation',
  name: 'Controlled Pollux Fractionation Micro Demo',
  summary:
    'Minimal selector-driven fractionation: the message bit chooses the alphabet, and a separate bit stream chooses which visible symbol inside that alphabet is emitted.',
  pipeline: 'BitSource(message) + BitSource(select) -> PolluxControlledFractionation -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'pollux',
          defId: 'PolluxControlledFractionation',
          params: { zeroAlphabet: 'X,Q,Z', oneAlphabet: 'M,N,O' },
        },
        { id: 'message', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 1, 0] } },
        { id: 'select', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0] } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'pollux', port: 'in' } },
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'pollux', port: 'select' } },
        { from: { moduleId: 'pollux', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        message: { x: 56, y: 120 },
        select: { x: 56, y: 244 },
        pollux: { x: 388, y: 182 },
        out: { x: 716, y: 182 },
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

const SYMBOL_SEQUENCE_INPUT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'SymbolSequenceInput',
  name: 'Symbol Sequence Input Micro Demo',
  summary: 'Minimal visible whole-sequence source: one ordered symbol buffer is emitted as a single sequence signal.',
  pipeline: 'SymbolSequenceInput -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        sequence: { x: 184, y: 176 },
        out: { x: 476, y: 176 },
      },
      annotations: [],
    },
  },
};

const ASCII_SEQUENCE_INPUT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AsciiSequenceInput',
  name: 'ASCII Sequence Input Micro Demo',
  summary: 'Minimal visible whole-sequence source: one ordered ASCII buffer is emitted as a single sequence signal.',
  pipeline: 'AsciiSequenceInput -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sequence', defId: 'AsciiSequenceInput', params: { value: 'HELLO' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        sequence: { x: 184, y: 176 },
        out: { x: 476, y: 176 },
      },
      annotations: [],
    },
  },
};

const REPEAT_SYMBOL_TO_LENGTH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RepeatSymbolToLength',
  name: 'Repeat Symbol To Length Micro Demo',
  summary: 'Minimal visible repeated-key pattern: one whole symbol sequence is repeated until it reaches the target length.',
  pipeline: 'SymbolSequenceInput -> RepeatSymbolToLength -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'repeat', defId: 'RepeatSymbolToLength', params: { targetLength: 10 } },
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        repeat: { x: 436, y: 176 },
        sequence: { x: 96, y: 176 },
        out: { x: 736, y: 176 },
      },
      annotations: [],
    },
  },
};

const REPEAT_SYMBOL_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RepeatSymbolToMatch',
  name: 'Repeat Symbol To Match Micro Demo',
  summary: 'Visible repeated-key ergonomics: one symbol sequence repeats until it matches the length of a second explicit symbol sequence.',
  pipeline: 'SymbolSequenceInput(key) + SymbolSequenceInput(message) -> RepeatSymbolToMatch -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'repeat', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'key', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'message', defId: 'SymbolSequenceInput', params: { value: 'HELLOWORLD' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        repeat: { x: 432, y: 176 },
        key: { x: 80, y: 120 },
        message: { x: 80, y: 260 },
        out: { x: 764, y: 176 },
      },
      annotations: [],
    },
  },
};

const PAD_SYMBOL_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PadSymbolToMatch',
  name: 'Pad Symbol To Match Micro Demo',
  summary: 'Visible padding ergonomics: one symbol sequence grows to a visible reference length with an explicit pad character.',
  pipeline: 'SymbolSequenceInput(shortCode) + SymbolSequenceInput(reference) -> PadSymbolToMatch -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'pad', defId: 'PadSymbolToMatch', params: { side: 'left', padChar: ' ' } },
        { id: 'short-code', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'reference', defId: 'SymbolSequenceInput', params: { value: 'HELLOWORLD' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'short-code', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        pad: { x: 432, y: 176 },
        'short-code': { x: 72, y: 120 },
        reference: { x: 72, y: 260 },
        out: { x: 764, y: 176 },
      },
      annotations: [],
    },
  },
};

const REQUIRE_SYMBOL_LENGTH_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RequireSymbolLengthMatch',
  name: 'Require Symbol Length Match Micro Demo',
  summary: 'Strict mismatch demo: one branch blocks, the parallel branch shows visible repeat-based repair.',
  pipeline: 'message + key -> RequireSymbolLengthMatch || key -> RepeatSymbolToMatch(reference=message)',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'require', defId: 'RequireSymbolLengthMatch', params: {} },
        { id: 'repair', defId: 'RepeatSymbolToMatch', params: {} },
        { id: 'message', defId: 'SymbolSequenceInput', params: { value: 'ATTACK' } },
        { id: 'key', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'strict-out', defId: 'TextOutput', params: {} },
        { id: 'repair-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'strict-out', port: 'in' } },
        { from: { moduleId: 'key', port: 'out' }, to: { moduleId: 'repair', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'repair', port: 'reference' } },
        { from: { moduleId: 'repair', port: 'out' }, to: { moduleId: 'repair-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        require: { x: 420, y: 120 },
        repair: { x: 420, y: 260 },
        message: { x: 72, y: 120 },
        key: { x: 72, y: 260 },
        'strict-out': { x: 760, y: 120 },
        'repair-out': { x: 760, y: 260 },
      },
      annotations: [],
    },
  },
};

const TRUNCATE_SYMBOL_SEQUENCE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TruncateSymbolSequence',
  name: 'Truncate Symbol Sequence Micro Demo',
  summary: 'Minimal visible mismatch policy: keep only the leftmost symbols from one explicit sequence.',
  pipeline: 'SymbolSequenceInput -> TruncateSymbolSequence -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'truncate', defId: 'TruncateSymbolSequence', params: { targetLength: 5, side: 'left' } },
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: 'HELLOWORLD' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        truncate: { x: 436, y: 176 },
        sequence: { x: 72, y: 176 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const TRUNCATE_SYMBOL_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TruncateSymbolToMatch',
  name: 'Truncate Symbol To Match Micro Demo',
  summary: 'Visible truncation ergonomics: one symbol sequence is clipped only when it exceeds a visible reference length.',
  pipeline: 'SymbolSequenceInput(message) + SymbolSequenceInput(reference) -> TruncateSymbolToMatch -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'truncate', defId: 'TruncateSymbolToMatch', params: { side: 'left' } },
        { id: 'message', defId: 'SymbolSequenceInput', params: { value: 'HELLOWORLD' } },
        { id: 'reference', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        truncate: { x: 432, y: 176 },
        message: { x: 72, y: 120 },
        reference: { x: 72, y: 260 },
        out: { x: 764, y: 176 },
      },
      annotations: [],
    },
  },
};

const SYMBOL_SEQUENCE_TO_TICKED_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'SymbolSequenceToTicked',
  name: 'Symbol Sequence To Ticked Micro Demo',
  summary: 'Minimal visible bridge: a whole symbol sequence is read one symbol per tick, then wraps back to the start.',
  pipeline: 'SymbolSequenceInput -> SymbolSequenceToTicked + Clock -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'SymbolSequenceToTicked', params: { index: 0, wrap: true } },
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: 'KEY' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'bridge', port: 'clock' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 444, y: 176 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const ASCII_SEQUENCE_TO_TICKED_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AsciiSequenceToTicked',
  name: 'ASCII Sequence To Ticked Micro Demo',
  summary: 'Minimal visible bridge: a whole ASCII sequence is read one character per tick, then wraps back to the start.',
  pipeline: 'AsciiSequenceInput -> AsciiSequenceToTicked + Clock -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: true } },
        { id: 'sequence', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'bridge', port: 'clock' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 444, y: 176 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const ASCII_CHAR_TO_BITS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AsciiCharToBits',
  name: 'ASCII Char To Bits Micro Demo',
  summary: 'Minimal visible bridge: one ticked ASCII character becomes one 8-bit word for bit-domain processing.',
  pipeline: 'AsciiSequenceInput -> AsciiSequenceToTicked + Clock -> AsciiCharToBits -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'AsciiCharToBits', params: {} },
        { id: 'tick', defId: 'AsciiSequenceToTicked', params: { index: 0, wrap: true } },
        { id: 'sequence', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'tick', port: 'clock' } },
        { from: { moduleId: 'tick', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 640, y: 176 },
        tick: { x: 408, y: 176 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 900, y: 176 },
      },
      annotations: [],
    },
  },
};

const ASCII_SEQUENCE_TO_BITS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AsciiSequenceToBits',
  name: 'ASCII Sequence To Bits Micro Demo',
  summary: 'Minimal visible whole-sequence bridge: one ASCII buffer becomes one bit buffer without forcing a ticked path.',
  pipeline: 'AsciiSequenceInput -> AsciiSequenceToBits -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'AsciiSequenceToBits', params: {} },
        { id: 'sequence', defId: 'AsciiSequenceInput', params: { value: 'KEY' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const BITS_TO_ASCII_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsToAscii',
  name: 'Bits To ASCII Micro Demo',
  summary: 'Minimal visible whole-buffer bridge: one bit buffer is decoded directly into readable ASCII text.',
  pipeline: 'BitSequenceInput -> BitsToAscii -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'BitsToAscii', params: {} },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [0, 1, 0, 0, 0, 0, 0, 1] } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const BITS_TO_HEX_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsToHex',
  name: 'Bits To Hex Micro Demo',
  summary: 'Minimal visible whole-buffer bridge: one bit buffer is encoded directly into uppercase hexadecimal text.',
  pipeline: 'BitSequenceInput -> BitsToHex -> HexOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'BitsToHex', params: {} },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 0, 0, 0, 1, 1] } },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const ASCII_TO_HEX_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'AsciiToHex',
  name: 'ASCII To Hex Micro Demo',
  summary: 'Minimal visible whole-buffer bridge: one ASCII sequence is encoded directly into uppercase hexadecimal byte text.',
  pipeline: 'AsciiSequenceInput -> AsciiToHex -> HexOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'AsciiToHex', params: {} },
        { id: 'sequence', defId: 'AsciiSequenceInput', params: { value: 'AB' } },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const SYMBOL_TO_BITS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'SymbolToBits',
  name: 'Symbol To Bits Micro Demo',
  summary: 'Minimal visible scalar bridge: one letter symbol becomes one 5-bit word using the built-in alphabet mapping.',
  pipeline: 'TextInput -> SymbolToBits -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'SymbolToBits', params: {} },
        { id: 'text', defId: 'TextInput', params: { value: 'K' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        text: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const BITS_TO_SYMBOL_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsToSymbol',
  name: 'Bits To Symbol Micro Demo',
  summary: 'Minimal visible scalar bridge: one 5-bit word becomes one letter symbol using the built-in alphabet mapping.',
  pipeline: 'BitSource -> BitsToSymbol -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'BitsToSymbol', params: {} },
        { id: 'bits', defId: 'BitSource', params: { stream: [0, 1, 0, 1, 0] } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        bits: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const HEX_TO_ASCII_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'HexToAscii',
  name: 'Hex To ASCII Micro Demo',
  summary: 'Minimal visible whole-buffer bridge: one hex-authored text sequence is decoded directly into readable ASCII.',
  pipeline: 'SymbolSequenceInput -> HexToAscii -> TextOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'HexToAscii', params: {} },
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: '4142' } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const HEX_SEQUENCE_TO_BITS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'HexSequenceToBits',
  name: 'Hex Sequence To Bits Micro Demo',
  summary: 'Minimal visible whole-buffer bridge: one in-graph hex text sequence becomes one bit buffer without re-entering through a source.',
  pipeline: 'SymbolSequenceInput -> HexSequenceToBits -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'HexSequenceToBits', params: {} },
        { id: 'sequence', defId: 'SymbolSequenceInput', params: { value: 'A3F9' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        sequence: { x: 120, y: 176 },
        out: { x: 720, y: 176 },
      },
      annotations: [],
    },
  },
};

const TICKED_SYMBOLS_TO_SEQUENCE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TickedSymbolsToSequence',
  name: 'Ticked Symbols To Sequence Micro Demo',
  summary: 'Minimal visible collector: one symbol per tick is accumulated back into a whole visible sequence.',
  pipeline: 'TextInput + Clock -> TickedSymbolsToSequence -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'collector', defId: 'TickedSymbolsToSequence', params: { collected: '', count: 0 } },
        { id: 'text', defId: 'TextInput', params: { value: 'KEY' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
        { from: { moduleId: 'collector', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        collector: { x: 444, y: 176 },
        text: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const TICKED_BITS_TO_SEQUENCE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TickedBitsToSequence',
  name: 'Ticked Bits To Sequence Micro Demo',
  summary: 'Minimal visible collector: one bit word per tick is accumulated back into a whole visible bit sequence.',
  pipeline: 'BitSource + Clock -> TickedBitsToSequence -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'collector', defId: 'TickedBitsToSequence', params: { collected: [], count: 0 } },
        { id: 'bits', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 5 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bits', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
        { from: { moduleId: 'collector', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        collector: { x: 444, y: 176 },
        bits: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const TRUNCATE_BITS_SEQUENCE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TruncateBitsSequence',
  name: 'Truncate Bits Sequence Micro Demo',
  summary: 'Minimal visible mismatch policy: keep only the leftmost bits from one explicit bit sequence.',
  pipeline: 'BitSequenceInput -> TruncateBitsSequence -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'truncate', defId: 'TruncateBitsSequence', params: { targetLength: 6, side: 'left' } },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        truncate: { x: 436, y: 176 },
        sequence: { x: 72, y: 176 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const TRUNCATE_BITS_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'TruncateBitsToMatch',
  name: 'Truncate Bits To Match Micro Demo',
  summary: 'Visible truncation ergonomics: one bit buffer is clipped only when it exceeds a visible reference width.',
  pipeline: 'BitSequenceInput(buffer) + BitSequenceInput(reference) -> TruncateBitsToMatch -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'truncate', defId: 'TruncateBitsToMatch', params: { side: 'right' } },
        { id: 'buffer', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'reference', defId: 'BitSequenceInput', params: { stream: [0, 0, 0, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'truncate', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'truncate', port: 'reference' } },
        { from: { moduleId: 'truncate', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        truncate: { x: 436, y: 176 },
        buffer: { x: 72, y: 120 },
        reference: { x: 72, y: 260 },
        out: { x: 756, y: 176 },
      },
      annotations: [],
    },
  },
};

const PAD_BITS_SEQUENCE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PadBitsSequence',
  name: 'Pad Bits Sequence Micro Demo',
  summary: 'Minimal visible mismatch policy: extend one explicit bit sequence with chosen left or right padding bits.',
  pipeline: 'BitSequenceInput -> PadBitsSequence -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'pad', defId: 'PadBitsSequence', params: { targetLength: 8, side: 'left', padBit: '0' } },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        pad: { x: 436, y: 176 },
        sequence: { x: 72, y: 176 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const BIT_SEQUENCE_INPUT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitSequenceInput',
  name: 'Bit Sequence Input Micro Demo',
  summary: 'Minimal visible whole-sequence source: one ordered bit buffer is emitted as a single sequence signal.',
  pipeline: 'BitSequenceInput -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        sequence: { x: 184, y: 176 },
        out: { x: 476, y: 176 },
      },
      annotations: [],
    },
  },
};

const REPEAT_BITS_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RepeatBitsToMatch',
  name: 'Repeat Bits To Match Micro Demo',
  summary: 'Visible repeated-mask ergonomics: one bit sequence repeats until it matches the width of a second explicit bit buffer.',
  pipeline: 'BitSequenceInput(mask) + BitSequenceInput(data) -> RepeatBitsToMatch -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'repeat', defId: 'RepeatBitsToMatch', params: {} },
        { id: 'mask', defId: 'BitSequenceInput', params: { stream: [1, 0, 1] } },
        { id: 'data', defId: 'BitSequenceInput', params: { stream: [1, 1, 0, 0, 1, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'mask', port: 'out' }, to: { moduleId: 'repeat', port: 'in' } },
        { from: { moduleId: 'data', port: 'out' }, to: { moduleId: 'repeat', port: 'reference' } },
        { from: { moduleId: 'repeat', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        repeat: { x: 436, y: 176 },
        mask: { x: 72, y: 120 },
        data: { x: 72, y: 260 },
        out: { x: 756, y: 176 },
      },
      annotations: [],
    },
  },
};

const PAD_BITS_TO_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PadBitsToMatch',
  name: 'Pad Bits To Match Micro Demo',
  summary: 'Visible padding ergonomics: one bit sequence grows to a visible reference width with an explicit pad bit.',
  pipeline: 'BitSequenceInput(shortBlock) + BitSequenceInput(reference) -> PadBitsToMatch -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'pad', defId: 'PadBitsToMatch', params: { side: 'right', padBit: '0' } },
        { id: 'short-block', defId: 'BitSequenceInput', params: { stream: [1, 0, 1] } },
        { id: 'reference', defId: 'BitSequenceInput', params: { stream: [0, 0, 0, 0, 0, 0, 0, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'short-block', port: 'out' }, to: { moduleId: 'pad', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'pad', port: 'reference' } },
        { from: { moduleId: 'pad', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        pad: { x: 436, y: 176 },
        'short-block': { x: 72, y: 120 },
        reference: { x: 72, y: 260 },
        out: { x: 756, y: 176 },
      },
      annotations: [],
    },
  },
};

const REQUIRE_BITS_LENGTH_MATCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RequireBitsLengthMatch',
  name: 'Require Bits Length Match Micro Demo',
  summary: 'Strict mismatch demo: one bit branch blocks, the parallel branch shows visible pad-based repair.',
  pipeline: 'buffer + reference -> RequireBitsLengthMatch || buffer -> PadBitsToMatch(reference)',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'require', defId: 'RequireBitsLengthMatch', params: {} },
        { id: 'repair', defId: 'PadBitsToMatch', params: { side: 'right', padBit: '0' } },
        { id: 'buffer', defId: 'BitSequenceInput', params: { stream: [1, 0, 1] } },
        { id: 'reference', defId: 'BitSequenceInput', params: { stream: [0, 0, 0, 0, 0, 0, 0, 0] } },
        { id: 'strict-out', defId: 'BitOutput', params: {} },
        { id: 'repair-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'require', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'require', port: 'reference' } },
        { from: { moduleId: 'require', port: 'out' }, to: { moduleId: 'strict-out', port: 'in' } },
        { from: { moduleId: 'buffer', port: 'out' }, to: { moduleId: 'repair', port: 'in' } },
        { from: { moduleId: 'reference', port: 'out' }, to: { moduleId: 'repair', port: 'reference' } },
        { from: { moduleId: 'repair', port: 'out' }, to: { moduleId: 'repair-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        require: { x: 436, y: 120 },
        repair: { x: 436, y: 260 },
        buffer: { x: 72, y: 120 },
        reference: { x: 72, y: 260 },
        'strict-out': { x: 756, y: 120 },
        'repair-out': { x: 756, y: 260 },
      },
      annotations: [],
    },
  },
};

const HEX_SEQUENCE_INPUT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'HexSequenceInput',
  name: 'Hex Sequence Input Micro Demo',
  summary: 'Minimal visible whole-sequence source: one hex-authored buffer is emitted as a single bit sequence.',
  pipeline: 'HexSequenceInput -> BitsToHex -> HexOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sequence', defId: 'HexSequenceInput', params: { value: 'A3F9' } },
        { id: 'to-hex', defId: 'BitsToHex', params: {} },
        { id: 'out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'to-hex', port: 'in' } },
        { from: { moduleId: 'to-hex', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        sequence: { x: 120, y: 176 },
        'to-hex': { x: 420, y: 176 },
        out: { x: 700, y: 176 },
      },
      annotations: [],
    },
  },
};

const HEX_DIGIT_TO_BITS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'HexDigitToBits',
  name: 'Hex Digit To Bits Micro Demo',
  summary: 'Minimal visible bridge: one authored hex digit becomes one 4-bit word for bit-domain processing.',
  pipeline: 'TextInput -> HexDigitToBits -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'HexDigitToBits', params: {} },
        { id: 'text', defId: 'TextInput', params: { value: 'A' } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 420, y: 176 },
        text: { x: 120, y: 176 },
        out: { x: 700, y: 176 },
      },
      annotations: [],
    },
  },
};

const BITS_SEQUENCE_TO_TICKED_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsSequenceToTicked',
  name: 'Bits Sequence To Ticked Micro Demo',
  summary: 'Minimal visible bridge: a whole bit sequence is read as one fixed-width word per tick, then wraps back to the start.',
  pipeline: 'BitSequenceInput -> BitsSequenceToTicked + Clock -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        {
          id: 'bridge',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: true, remainderMode: 'error' },
        },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'bridge', port: 'clock' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 444, y: 176 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 760, y: 176 },
      },
      annotations: [],
    },
  },
};

const BITS_TO_ASCII_CHAR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsToAsciiChar',
  name: 'Bits To ASCII Char Micro Demo',
  summary: 'Minimal visible bridge: one 8-bit word becomes one collected ASCII character.',
  pipeline: 'BitSequenceInput -> BitsSequenceToTicked + Clock -> BitsToAsciiChar -> TickedSymbolsToSequence -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'BitsToAsciiChar', params: {} },
        { id: 'collector', defId: 'TickedSymbolsToSequence', params: { collected: '', count: 0 } },
        {
          id: 'tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 8, wrap: true, remainderMode: 'error' },
        },
        { id: 'sequence', defId: 'BitSequenceInput', params: { stream: [0, 1, 0, 0, 0, 0, 0, 1] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 3 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'tick', port: 'clock' } },
        { from: { moduleId: 'tick', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'collector', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 652, y: 132 },
        collector: { x: 652, y: 252 },
        tick: { x: 420, y: 176 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 920, y: 252 },
      },
      annotations: [],
    },
  },
};

const BITS_TO_HEX_DIGIT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitsToHexDigit',
  name: 'Bits To Hex Digit Micro Demo',
  summary: 'Minimal visible bridge: one ticked nibble-scale bit word becomes one collected hex digit after a real bit-domain transform.',
  pipeline: 'HexSequenceInput -> BitsSequenceToTicked + Clock -> XOR -> BitsToHexDigit -> TickedSymbolsToSequence -> TextOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'bridge', defId: 'BitsToHexDigit', params: {} },
        { id: 'collector', defId: 'TickedSymbolsToSequence', params: { collected: '', count: 0 } },
        { id: 'xor', defId: 'XOR', params: {} },
        { id: 'mask', defId: 'BitSource', params: { stream: [0, 0, 0, 1] } },
        {
          id: 'tick',
          defId: 'BitsSequenceToTicked',
          params: { index: 0, wordWidth: 4, wrap: true, remainderMode: 'error' },
        },
        { id: 'sequence', defId: 'HexSequenceInput', params: { value: 'A3' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'sequence', port: 'out' }, to: { moduleId: 'tick', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'tick', port: 'clock' } },
        { from: { moduleId: 'tick', port: 'out' }, to: { moduleId: 'xor', port: 'a' } },
        { from: { moduleId: 'mask', port: 'out' }, to: { moduleId: 'xor', port: 'b' } },
        { from: { moduleId: 'xor', port: 'out' }, to: { moduleId: 'bridge', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'collector', port: 'clock' } },
        { from: { moduleId: 'bridge', port: 'out' }, to: { moduleId: 'collector', port: 'in' } },
        { from: { moduleId: 'collector', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        bridge: { x: 860, y: 132 },
        collector: { x: 860, y: 252 },
        xor: { x: 636, y: 176 },
        mask: { x: 420, y: 268 },
        tick: { x: 420, y: 84 },
        sequence: { x: 72, y: 84 },
        clock: { x: 72, y: 268 },
        out: { x: 1110, y: 252 },
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
  SBOX_MICRO_DEMO,
  POLLUX_FRACTIONATION_MICRO_DEMO,
  POLLUX_CONTROLLED_FRACTIONATION_MICRO_DEMO,
  LFSR_MICRO_DEMO,
  MULTI_ROUTER_MICRO_DEMO,
  ROTOR_MICRO_DEMO,
  ROTOR_REVERSE_MICRO_DEMO,
  SYMBOL_SEQUENCE_INPUT_MICRO_DEMO,
  ASCII_SEQUENCE_INPUT_MICRO_DEMO,
  REPEAT_SYMBOL_TO_LENGTH_MICRO_DEMO,
  REPEAT_SYMBOL_TO_MATCH_MICRO_DEMO,
  PAD_SYMBOL_TO_MATCH_MICRO_DEMO,
  REQUIRE_SYMBOL_LENGTH_MATCH_MICRO_DEMO,
  TRUNCATE_SYMBOL_SEQUENCE_MICRO_DEMO,
  TRUNCATE_SYMBOL_TO_MATCH_MICRO_DEMO,
  SYMBOL_SEQUENCE_TO_TICKED_MICRO_DEMO,
  ASCII_SEQUENCE_TO_TICKED_MICRO_DEMO,
  ASCII_CHAR_TO_BITS_MICRO_DEMO,
  ASCII_SEQUENCE_TO_BITS_MICRO_DEMO,
  BITS_TO_ASCII_MICRO_DEMO,
  BITS_TO_HEX_MICRO_DEMO,
  ASCII_TO_HEX_MICRO_DEMO,
  SYMBOL_TO_BITS_MICRO_DEMO,
  BITS_TO_SYMBOL_MICRO_DEMO,
  HEX_TO_ASCII_MICRO_DEMO,
  HEX_SEQUENCE_TO_BITS_MICRO_DEMO,
  TICKED_SYMBOLS_TO_SEQUENCE_MICRO_DEMO,
  TICKED_BITS_TO_SEQUENCE_MICRO_DEMO,
  BIT_SEQUENCE_INPUT_MICRO_DEMO,
  REPEAT_BITS_TO_MATCH_MICRO_DEMO,
  PAD_BITS_TO_MATCH_MICRO_DEMO,
  REQUIRE_BITS_LENGTH_MATCH_MICRO_DEMO,
  TRUNCATE_BITS_SEQUENCE_MICRO_DEMO,
  TRUNCATE_BITS_TO_MATCH_MICRO_DEMO,
  PAD_BITS_SEQUENCE_MICRO_DEMO,
  HEX_SEQUENCE_INPUT_MICRO_DEMO,
  HEX_DIGIT_TO_BITS_MICRO_DEMO,
  BITS_SEQUENCE_TO_TICKED_MICRO_DEMO,
  BITS_TO_ASCII_CHAR_MICRO_DEMO,
  BITS_TO_HEX_DIGIT_MICRO_DEMO,
];

const PRIMITIVE_MICRO_DEMO_BY_DEF_ID = Object.fromEntries(
  PRIMITIVE_MICRO_DEMOS.map((entry) => [entry.defId, entry]),
) as Record<string, PrimitiveMicroDemo>;

export function getPrimitiveMicroDemo(defId: string): PrimitiveMicroDemo | null {
  return PRIMITIVE_MICRO_DEMO_BY_DEF_ID[defId] ?? null;
}
