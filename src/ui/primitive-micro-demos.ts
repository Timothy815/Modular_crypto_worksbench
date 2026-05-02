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
  summary: 'Minimal visible stepped traversal: the same repeated letter enters a rotor while a clock advances its position one step per tick.',
  pipeline: 'TextInput + Clock -> Rotor -> TextOutput',
  defaultTickedMode: true,
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
        { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text', port: 'out' }, to: { moduleId: 'rotor', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'rotor', port: 'clock' } },
        { from: { moduleId: 'rotor', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        rotor: { x: 380, y: 188 },
        text: { x: 76, y: 272 },
        clock: { x: 76, y: 84 },
        out: { x: 680, y: 188 },
      },
      annotations: [],
    },
  },
};

const ROTOR_REVERSE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'RotorReverse',
  name: 'Rotor Reverse Micro Demo',
  summary: 'Minimal visible stepped return path: a repeated letter passes through a linked forward rotor, reflects, then comes back through RotorReverse while the forward rotor position advances per tick.',
  pipeline: 'TextInput + Clock -> Rotor -> Reflector -> RotorReverse -> TextOutput',
  defaultTickedMode: true,
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
        { id: 'text', defId: 'TextInput', params: { value: 'AAAA' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
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
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'rotor-forward', port: 'clock' } },
        { from: { moduleId: 'rotor-forward', port: 'out' }, to: { moduleId: 'reflector', port: 'in' } },
        { from: { moduleId: 'reflector', port: 'out' }, to: { moduleId: 'rotor-reverse', port: 'in' } },
        { from: { moduleId: 'rotor-reverse', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        clock: { x: 48, y: 64 },
        text: { x: 48, y: 292 },
        'rotor-forward': { x: 316, y: 176 },
        reflector: { x: 588, y: 176 },
        'rotor-reverse': { x: 860, y: 176 },
        out: { x: 1132, y: 176 },
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

const BYTE_ROUND_ITERATOR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ByteRoundIterator',
  name: 'Byte Round Iterator Micro Demo',
  summary:
    'Compares one visible byte round body against its iterator wrapper so the repeated-body relationship and round count stay legible on canvas.',
  pipeline: 'BitSource -> ByteRoundComposite + ByteRoundIterator -> BitOutput(body, iterator)',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'iterator', defId: 'ByteRoundIterator', params: { iterationCount: 3 } },
        { id: 'body', defId: 'ByteRoundComposite', params: {} },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'body-out', defId: 'BitOutput', params: {} },
        { id: 'iterator-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'body', port: 'in' } },
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'iterator', port: 'in' } },
        { from: { moduleId: 'body', port: 'out' }, to: { moduleId: 'body-out', port: 'in' } },
        { from: { moduleId: 'iterator', port: 'out' }, to: { moduleId: 'iterator-out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        source: { x: 72, y: 176 },
        body: { x: 360, y: 84 },
        iterator: { x: 360, y: 268 },
        'body-out': { x: 660, y: 84 },
        'iterator-out': { x: 660, y: 268 },
      },
      annotations: [
        { id: 'body-note', x: 360, y: 32, text: 'Single round body' },
        {
          id: 'iterator-note',
          x: 360,
          y: 216,
          text: 'Iterator wrapper • select to inspect default vs resolved rounds',
        },
      ],
    },
  },
};

const CLOCKED_BYTE_ROUND_ITERATOR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ClockedByteRoundIterator',
  name: 'Clocked Byte Round Iterator Micro Demo',
  summary:
    'Shows a bounded round bank that advances one visible byte round per pulse while holding its accumulated state between ticks.',
  pipeline: 'BitSequenceInput + Clock -> ClockedByteRoundIterator -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'clocked', defId: 'ClockedByteRoundIterator', params: {} },
        { id: 'source', defId: 'BitSequenceInput', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'clocked', port: 'in' } },
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'clocked', port: 'clock' } },
        { from: { moduleId: 'clocked', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        source: { x: 64, y: 176 },
        clock: { x: 64, y: 56 },
        clocked: { x: 372, y: 176 },
        out: { x: 676, y: 176 },
      },
      annotations: [
        { id: 'clocked-note', x: 372, y: 96, text: 'Select to watch step 0 -> 3 and halt' },
      ],
    },
  },
};

const CONDITIONAL_BRANCH_DEMO_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ConditionalBranchDemo',
  name: 'Conditional Branch Demo Micro Demo',
  summary: 'Minimal visible conditional: one control bit selects which branch definition runs — rotate-left on 1, invert on 0.',
  pipeline: 'BitSource(select) + BitSource(in) -> ConditionalBranchDemo -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'cond', defId: 'ConditionalBranchDemo', params: {} },
        { id: 'select', defId: 'BitSource', params: { stream: [1] } },
        { id: 'input', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'cond', port: 'select' } },
        { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'cond', port: 'in' } },
        { from: { moduleId: 'cond', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        cond: { x: 360, y: 130 },
        select: { x: 76, y: 52 },
        input: { x: 76, y: 208 },
        out: { x: 620, y: 130 },
      },
      annotations: [],
    },
  },
};

const MULTI_SELECTOR_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'MultiSelector',
  name: 'Multi Selector Micro Demo',
  summary: 'Minimal visible case rejoining: a counter cycles through four distinct inputs so one is forwarded to the output at a time.',
  pipeline: 'Clock -> Counter -> MultiSelector(in0..in3) -> BitOutput',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sel', defId: 'MultiSelector', params: { selectCount: '4' } },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'counter', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        { id: 'in0', defId: 'BitSource', params: { stream: [1, 0, 1, 0, 1, 0, 1, 0] } },
        { id: 'in1', defId: 'BitSource', params: { stream: [1, 1, 0, 0, 1, 1, 0, 0] } },
        { id: 'in2', defId: 'BitSource', params: { stream: [1, 1, 1, 1, 0, 0, 0, 0] } },
        { id: 'in3', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 1, 1, 1, 1] } },
        { id: 'zero', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 0, 0, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'sel', port: 'select' } },
        { from: { moduleId: 'in0', port: 'out' }, to: { moduleId: 'sel', port: 'in0' } },
        { from: { moduleId: 'in1', port: 'out' }, to: { moduleId: 'sel', port: 'in1' } },
        { from: { moduleId: 'in2', port: 'out' }, to: { moduleId: 'sel', port: 'in2' } },
        { from: { moduleId: 'in3', port: 'out' }, to: { moduleId: 'sel', port: 'in3' } },
        { from: { moduleId: 'zero', port: 'out' }, to: { moduleId: 'sel', port: 'in4' } },
        { from: { moduleId: 'zero', port: 'out' }, to: { moduleId: 'sel', port: 'in5' } },
        { from: { moduleId: 'zero', port: 'out' }, to: { moduleId: 'sel', port: 'in6' } },
        { from: { moduleId: 'zero', port: 'out' }, to: { moduleId: 'sel', port: 'in7' } },
        { from: { moduleId: 'sel', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        clock: { x: 40, y: 48 },
        counter: { x: 240, y: 48 },
        sel: { x: 560, y: 200 },
        in0: { x: 340, y: 80 },
        in1: { x: 340, y: 180 },
        in2: { x: 340, y: 280 },
        in3: { x: 340, y: 380 },
        zero: { x: 340, y: 480 },
        out: { x: 800, y: 200 },
      },
      annotations: [],
    },
  },
};

const MULTI_COND_SWITCH_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'MultiCondSwitch4',
  name: 'Multi-Cond Switch 4 Micro Demo',
  summary: 'Minimal visible N-branch conditional: a counter cycles through four branch definitions — rotate-left-1, invert, rotate-left-2, rotate-right-1 — applied to the same 8-bit input.',
  pipeline: 'Clock -> Counter(2-bit) -> MultiCondSwitch4.select + BitSource -> out',
  defaultTickedMode: true,
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'sw', defId: 'MultiCondSwitch4', params: {} },
        { id: 'clock', defId: 'Clock', params: { period: 1, offset: 0, length: 8 } },
        { id: 'counter', defId: 'Counter', params: { width: 2, value: 0, step: 1 } },
        { id: 'input', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 0, 1, 0] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock', port: 'pulse' }, to: { moduleId: 'counter', port: 'clock' } },
        { from: { moduleId: 'counter', port: 'out' }, to: { moduleId: 'sw', port: 'select' } },
        { from: { moduleId: 'input', port: 'out' }, to: { moduleId: 'sw', port: 'in' } },
        { from: { moduleId: 'sw', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        clock: { x: 40, y: 48 },
        counter: { x: 240, y: 48 },
        input: { x: 240, y: 200 },
        sw: { x: 500, y: 130 },
        out: { x: 760, y: 130 },
      },
      annotations: [],
    },
  },
};

const BIT_SELECT_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitSelect',
  name: 'BitSelect Micro Demo',
  summary: 'Minimal compression permutation: an 8-bit source passes through BitSelect which drops 2 bits and reorders the rest, producing a 6-bit output.',
  pipeline: 'BitSource(8) -> BitSelect(order:0,1,2,4,5,7) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'select', defId: 'BitSelect', params: { order: '0,1,2,4,5,7', inputWidth: 8 } },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1, 0, 1, 0, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'select', port: 'in' } },
        { from: { moduleId: 'select', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        source: { x: 76, y: 176 },
        select: { x: 360, y: 176 },
        out: { x: 640, y: 176 },
      },
      annotations: [],
    },
  },
};

const BIT_EXPAND_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'BitExpand',
  name: 'BitExpand Micro Demo',
  summary: 'Minimal expansion permutation: a 4-bit source passes through BitExpand which repeats two boundary bits, producing a 6-bit output.',
  pipeline: 'BitSource(4) -> BitExpand(order:3,0,1,2,3,0) -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'expand', defId: 'BitExpand', params: { order: '3,0,1,2,3,0', inputWidth: 4 } },
        { id: 'source', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'source', port: 'out' }, to: { moduleId: 'expand', port: 'in' } },
        { from: { moduleId: 'expand', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        source: { x: 76, y: 176 },
        expand: { x: 360, y: 176 },
        out: { x: 640, y: 176 },
      },
      annotations: [],
    },
  },
};

const SCALAR_MULTIPLY_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ScalarMultiply',
  name: 'Scalar Multiply Micro Demo',
  summary: 'Minimal visible scalar action: one integer scalar acts on one explicit pedagogical curve point and the result stays in the point domain.',
  pipeline: 'BitSource -> BitsToInteger -> ScalarMultiply(point) -> PointOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'scalar-multiply', defId: 'ScalarMultiply', params: { p: 17, a: 2, b: 3 } },
        { id: 'scalar-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 0] } },
        { id: 'scalar', defId: 'BitsToInteger', params: {} },
        { id: 'point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'out', defId: 'PointOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'scalar-bits', port: 'out' }, to: { moduleId: 'scalar', port: 'in' } },
        { from: { moduleId: 'scalar', port: 'out' }, to: { moduleId: 'scalar-multiply', port: 'scalar' } },
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'scalar-multiply', port: 'point' } },
        { from: { moduleId: 'scalar-multiply', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'scalar-multiply': { x: 396, y: 176 },
        'scalar-bits': { x: 76, y: 68 },
        scalar: { x: 76, y: 244 },
        point: { x: 76, y: 396 },
        out: { x: 700, y: 176 },
      },
      annotations: [],
    },
  },
};

const POINT_ORDER_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PointOrder',
  name: 'Point Order Micro Demo',
  summary: 'Minimal visible subgroup check: one explicit pedagogical curve point is measured until repeated point action reaches visible infinity.',
  pipeline: 'PointSource -> PointOrder -> IntegerOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'point-order', defId: 'PointOrder', params: { p: 17, a: 0, b: 13 } },
        { id: 'point', defId: 'PointSource', params: { p: 17, a: 0, b: 13, x: 5, y: 6 } },
        { id: 'out', defId: 'IntegerOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'point', port: 'out' }, to: { moduleId: 'point-order', port: 'point' } },
        { from: { moduleId: 'point-order', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'point-order': { x: 396, y: 176 },
        point: { x: 76, y: 176 },
        out: { x: 700, y: 176 },
      },
      annotations: [],
    },
  },
};

const POINT_EQUALS_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'PointEquals',
  name: 'Point Equals Micro Demo',
  summary: 'Minimal visible point comparison: two explicit curve points are checked for exact equality and the result becomes one visible control bit.',
  pipeline: 'PointSource(a,b) -> PointEquals -> BitOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'point-equals', defId: 'PointEquals', params: { p: 17, a: 2, b: 3 } },
        { id: 'left-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'right-point', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 5, y: 6 } },
        { id: 'out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'left-point', port: 'out' }, to: { moduleId: 'point-equals', port: 'a' } },
        { from: { moduleId: 'right-point', port: 'out' }, to: { moduleId: 'point-equals', port: 'b' } },
        { from: { moduleId: 'point-equals', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'point-equals': { x: 388, y: 176 },
        'left-point': { x: 76, y: 84 },
        'right-point': { x: 76, y: 300 },
        out: { x: 700, y: 176 },
      },
      annotations: [],
    },
  },
};

const CHALLENGE_COMBINE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ChallengeCombine',
  name: 'Challenge Combine Micro Demo',
  summary:
    'Minimal visible challenge stage: one commitment point R, one public key point P, and one visible message m combine into one bounded pedagogical challenge value c.',
  pipeline: 'PointSource(R,P) + BitSource -> BitsToInteger -> ChallengeCombine -> IntegerOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'challenge-combine', defId: 'ChallengeCombine', params: { p: 17, a: 2, b: 3, n: 11 } },
        { id: 'commitment', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 3, y: 11 } },
        { id: 'public-key', defId: 'PointSource', params: { p: 17, a: 2, b: 3, x: 12, y: 2 } },
        { id: 'message-bits', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'message', defId: 'BitsToInteger', params: {} },
        { id: 'out', defId: 'IntegerOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'commitment', port: 'out' }, to: { moduleId: 'challenge-combine', port: 'commitment' } },
        { from: { moduleId: 'public-key', port: 'out' }, to: { moduleId: 'challenge-combine', port: 'publicKey' } },
        { from: { moduleId: 'message-bits', port: 'out' }, to: { moduleId: 'message', port: 'in' } },
        { from: { moduleId: 'message', port: 'out' }, to: { moduleId: 'challenge-combine', port: 'message' } },
        { from: { moduleId: 'challenge-combine', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'challenge-combine': { x: 476, y: 176 },
        commitment: { x: 76, y: 52 },
        'public-key': { x: 76, y: 232 },
        'message-bits': { x: 76, y: 412 },
        message: { x: 296, y: 412 },
        out: { x: 808, y: 176 },
      },
      annotations: [],
    },
  },
};

const SCALAR_LINEAR_COMBINE_MICRO_DEMO: PrimitiveMicroDemo = {
  defId: 'ScalarLinearCombine',
  name: 'Scalar Linear Combine Micro Demo',
  summary:
    'Minimal visible response stage: nonce r, challenge c, and private scalar x stay in the scalar domain and produce one response value s modulo n.',
  pipeline: 'BitSource(r,c,x) -> BitsToInteger -> ScalarLinearCombine -> IntegerOutput',
  document: {
    version: 1,
    project: {
      modules: [
        { id: 'scalar-linear-combine', defId: 'ScalarLinearCombine', params: { n: 11 } },
        { id: 'nonce-bits', defId: 'BitSource', params: { stream: [0, 1, 0, 0] } },
        { id: 'nonce', defId: 'BitsToInteger', params: {} },
        { id: 'challenge-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 1] } },
        { id: 'challenge', defId: 'BitsToInteger', params: {} },
        { id: 'private-bits', defId: 'BitSource', params: { stream: [0, 0, 1, 1] } },
        { id: 'private', defId: 'BitsToInteger', params: {} },
        { id: 'out', defId: 'IntegerOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'nonce-bits', port: 'out' }, to: { moduleId: 'nonce', port: 'in' } },
        { from: { moduleId: 'nonce', port: 'out' }, to: { moduleId: 'scalar-linear-combine', port: 'nonce' } },
        { from: { moduleId: 'challenge-bits', port: 'out' }, to: { moduleId: 'challenge', port: 'in' } },
        { from: { moduleId: 'challenge', port: 'out' }, to: { moduleId: 'scalar-linear-combine', port: 'challenge' } },
        { from: { moduleId: 'private-bits', port: 'out' }, to: { moduleId: 'private', port: 'in' } },
        { from: { moduleId: 'private', port: 'out' }, to: { moduleId: 'scalar-linear-combine', port: 'private' } },
        { from: { moduleId: 'scalar-linear-combine', port: 'out' }, to: { moduleId: 'out', port: 'in' } },
      ],
    },
    ui: {
      layout: {
        'scalar-linear-combine': { x: 516, y: 176 },
        'nonce-bits': { x: 76, y: 52 },
        nonce: { x: 292, y: 52 },
        'challenge-bits': { x: 76, y: 232 },
        challenge: { x: 292, y: 232 },
        'private-bits': { x: 76, y: 412 },
        private: { x: 292, y: 412 },
        out: { x: 856, y: 176 },
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
  MULTI_SELECTOR_MICRO_DEMO,
  MULTI_COND_SWITCH_MICRO_DEMO,
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
  BYTE_ROUND_ITERATOR_MICRO_DEMO,
  CLOCKED_BYTE_ROUND_ITERATOR_MICRO_DEMO,
  CONDITIONAL_BRANCH_DEMO_MICRO_DEMO,
  BIT_SELECT_MICRO_DEMO,
  BIT_EXPAND_MICRO_DEMO,
  SCALAR_MULTIPLY_MICRO_DEMO,
  POINT_ORDER_MICRO_DEMO,
  POINT_EQUALS_MICRO_DEMO,
  CHALLENGE_COMBINE_MICRO_DEMO,
  SCALAR_LINEAR_COMBINE_MICRO_DEMO,
];

const PRIMITIVE_MICRO_DEMO_BY_DEF_ID = Object.fromEntries(
  PRIMITIVE_MICRO_DEMOS.map((entry) => [entry.defId, entry]),
) as Record<string, PrimitiveMicroDemo>;

export function getPrimitiveMicroDemo(defId: string): PrimitiveMicroDemo | null {
  return PRIMITIVE_MICRO_DEMO_BY_DEF_ID[defId] ?? null;
}
