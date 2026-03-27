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
        { id: 'select', defId: 'BitSource', params: { bits: [1] } },
        { id: 'input-a', defId: 'BitSource', params: { bits: [0] } },
        { id: 'input-b', defId: 'BitSource', params: { bits: [1] } },
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
        { id: 'select', defId: 'BitSource', params: { bits: [1] } },
        { id: 'input', defId: 'BitSource', params: { bits: [1] } },
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
        { id: 'signal', defId: 'BitSource', params: { bits: [1, 0, 1, 1] } },
        { id: 'control', defId: 'BitSource', params: { bits: [1] } },
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
        { id: 'left', defId: 'BitSource', params: { bits: [1, 0, 1, 0] } },
        { id: 'right', defId: 'BitSource', params: { bits: [1, 0, 1, 0] } },
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
        { id: 'left', defId: 'BitSource', params: { bits: [1, 1, 0, 0] } },
        { id: 'right', defId: 'BitSource', params: { bits: [1, 0, 1, 1] } },
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
        { id: 'input-a', defId: 'BitSource', params: { bits: [1] } },
        { id: 'input-b', defId: 'BitSource', params: { bits: [0] } },
        { id: 'input-c', defId: 'BitSource', params: { bits: [1] } },
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

export const PRIMITIVE_MICRO_DEMOS: PrimitiveMicroDemo[] = [
  MUX_MICRO_DEMO,
  DEMUX_MICRO_DEMO,
  GATE_MICRO_DEMO,
  EQUALS_MICRO_DEMO,
  AT_LEAST_MICRO_DEMO,
  MAJORITY_MICRO_DEMO,
];

const PRIMITIVE_MICRO_DEMO_BY_DEF_ID = Object.fromEntries(
  PRIMITIVE_MICRO_DEMOS.map((entry) => [entry.defId, entry]),
) as Record<string, PrimitiveMicroDemo>;

export function getPrimitiveMicroDemo(defId: string): PrimitiveMicroDemo | null {
  return PRIMITIVE_MICRO_DEMO_BY_DEF_ID[defId] ?? null;
}

