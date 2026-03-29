import { V1_REGISTRY } from '../engine/modules';
import { getModuleCategory, type ModuleCategory } from './module-categories';

const TOOLKIT_FILE_NAME = 'mcw-ai-toolkit.md';

const WORKBENCH_TYPES = `export interface WorkbenchPosition {
  x: number;
  y: number;
}

export interface WorkbenchAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ModuleInstance {
  id: string;
  defId: string;
  params: Record<string, unknown>;
  bypass?: boolean;
}

export interface Connection {
  from: { moduleId: string; port: string };
  to: { moduleId: string; port: string };
}

export interface Project {
  modules: ModuleInstance[];
  connections: Connection[];
}

export interface WorkbenchDocument {
  version: 1;
  project: Project;
  ui: {
    layout: Record<string, WorkbenchPosition>;
    annotations: WorkbenchAnnotation[];
  };
}`;

const CHALLENGE_TYPES = `export interface GuidedChallenge {
  version?: 1;
  id: string;
  title: string;
  projectId?: string;
  group?: string;
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  prompt: string;
  startingProject: Project;
  startingLayout?: Record<string, WorkbenchPosition>;
  targetProject: Project;
  success: ChallengeSuccessCondition;
  hints?: string[];
}

export interface ChallengeSuccessCondition {
  kind: 'output-match-target' | 'output-match-target-with-module-difference';
  moduleIds?: string[];
}`;

const SIMPLE_WORKSPACE_EXAMPLE = {
  version: 1,
  project: {
    modules: [
      { id: 'text-1', defId: 'TextInput', params: { text: 'HELLO' } },
      { id: 'bridge-1', defId: 'SymbolToBits', params: {} },
      { id: 'out-1', defId: 'BitOutput', params: {} },
    ],
    connections: [
      {
        from: { moduleId: 'text-1', port: 'out' },
        to: { moduleId: 'bridge-1', port: 'in' },
      },
      {
        from: { moduleId: 'bridge-1', port: 'out' },
        to: { moduleId: 'out-1', port: 'in' },
      },
    ],
  },
  ui: {
    layout: {
      'text-1': { x: 80, y: 120 },
      'bridge-1': { x: 280, y: 120 },
      'out-1': { x: 500, y: 120 },
    },
    annotations: [],
  },
} as const;

const STRUCTURED_WORKSPACE_EXAMPLE = {
  version: 1,
  project: {
    modules: [
      { id: 'plain-1', defId: 'TextInput', params: { text: 'HELLO' } },
      {
        id: 'plug-1',
        defId: 'Plugboard',
        params: { alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', wiring: ['AB'] },
      },
      {
        id: 'rotor-1',
        defId: 'Rotor',
        params: {
          alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
          notch: 'Q',
          position: 0,
          ringSetting: 0,
        },
      },
      {
        id: 'reflect-1',
        defId: 'Reflector',
        params: {
          alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          wiring: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
        },
      },
      { id: 'return-1', defId: 'RotorReverse', params: { linkedRotorId: 'rotor-1' } },
      { id: 'cipher-1', defId: 'Output', params: {} },
    ],
    connections: [
      { from: { moduleId: 'plain-1', port: 'out' }, to: { moduleId: 'plug-1', port: 'in' } },
      { from: { moduleId: 'plug-1', port: 'out' }, to: { moduleId: 'rotor-1', port: 'in' } },
      { from: { moduleId: 'rotor-1', port: 'out' }, to: { moduleId: 'reflect-1', port: 'in' } },
      { from: { moduleId: 'reflect-1', port: 'out' }, to: { moduleId: 'return-1', port: 'in' } },
      { from: { moduleId: 'return-1', port: 'out' }, to: { moduleId: 'cipher-1', port: 'in' } },
    ],
  },
  ui: {
    layout: {},
    annotations: [],
  },
} as const;

const CHALLENGE_EXAMPLE = {
  version: 1,
  id: 'enigma-round-trip',
  title: 'Build A Basic Enigma Path',
  difficulty: 'beginner',
  prompt: 'Create a working Enigma-style round trip from input to output.',
  startingProject: SIMPLE_WORKSPACE_EXAMPLE.project,
  startingLayout: SIMPLE_WORKSPACE_EXAMPLE.ui.layout,
  targetProject: STRUCTURED_WORKSPACE_EXAMPLE.project,
  success: {
    kind: 'output-match-target',
  },
  hints: [
    'Use explicit symbol-domain modules.',
    'The return path must be visible, not implied.',
  ],
} as const;

function formatPorts(
  ports: {
    name: string;
    type: string;
  }[],
) {
  return ports.length === 0 ? 'none' : ports.map((port) => `${port.name}:${port.type}`).join(', ');
}

function formatKeyParams(paramSchema: Record<string, { required?: boolean }>) {
  const keys = Object.keys(paramSchema);
  if (keys.length === 0) {
    return 'none';
  }

  const required = keys.filter((key) => paramSchema[key]?.required);
  const ordered = required.length > 0 ? required : keys.slice(0, 3);
  return ordered.join(', ');
}

function buildPrimitiveInventorySection() {
  const categoryOrder: ModuleCategory[] = ['source', 'bridge', 'operator', 'sink', 'composite'];
  const categoryLabels: Record<ModuleCategory, string> = {
    source: 'Sources and clocks',
    bridge: 'Explicit bridges',
    operator: 'Operators and transforms',
    sink: 'Sinks',
    composite: 'Structured definitions',
  };

  const grouped = new Map<ModuleCategory, string[]>();
  for (const category of categoryOrder) {
    grouped.set(category, []);
  }

  const definitions = Object.values(V1_REGISTRY).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  for (const def of definitions) {
    const category = getModuleCategory(def);
    const entry = `- \`${def.id}\` — in [${formatPorts(def.inputs)}] -> out [${formatPorts(def.outputs)}]; key params: ${formatKeyParams(def.paramSchema)}`;
    grouped.get(category)?.push(entry);
  }

  return categoryOrder
    .map((category) => {
      const entries = grouped.get(category) ?? [];
      if (entries.length === 0) {
        return '';
      }
      return `### ${categoryLabels[category]}\n\n${entries.join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export interface AiToolkitOptions {
  generatedAt?: string;
}

export function generateAiToolkitDocument(options: AiToolkitOptions = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString().slice(0, 10);
  const primitiveInventory = buildPrimitiveInventorySection();

  return `# MCW AI Toolkit

Generated: ${generatedAt}
Artifact: single-file prompt pack for external LLMs

## What MCW Is

Modular Cryptography Workbench (MCW) is a graph-based systems IDE for explicit cryptographic machines. It is not a freeform code runner. An AI should generate JSON artifacts that MCW can import, validate, inspect, verify, and export.

## What You May Generate

- \`WorkbenchDocument\` JSON for workspace layouts
- \`GuidedChallenge\` JSON for challenge authoring
- small, structurally valid starter labs

## What You Must Not Assume

- No hidden symbol<->bits conversion
- No cycles in project graphs
- No multiple wires into one input port
- No unsupported module ids or invented ports
- Generated artifacts are starting points; the human must still validate and verify inside MCW

## Prompt Scaffold

\`\`\`text
You are generating Modular Cryptography Workbench (MCW) JSON artifacts.

Return only valid JSON unless the user explicitly asks for explanation.
Use only supported MCW module ids and legal port names.
Respect signal types at every connection boundary.
If a symbol<->bits transition is needed, insert an explicit bridge module.
Keep ids unique, keep the graph acyclic, and never connect more than one source to the same input port.
Prefer the smallest valid graph that satisfies the request.
When asked for a workspace, emit one WorkbenchDocument object.
When asked for a challenge, emit one GuidedChallenge object.
\`\`\`

## Connection Rules

- Port signal types must match exactly at connection boundaries.
- Every input port may have at most one incoming connection.
- Projects must stay acyclic.
- Symbol-domain and bits-domain modules cannot be wired together directly.
- Use explicit bridge modules such as \`SymbolToBits\`, \`BitsToSymbol\`, \`BitsToAscii\`, \`BitsToHex\`, \`AsciiToHex\`, or \`HexToAscii\`.
- Module ids must be unique within a project.
- Output sinks should be explicit modules, not implied by “final result” prose.

## Structured Features

- MCW supports reusable composites and iterators, but V1 toolkit output should prefer explicit primitive graphs unless the user explicitly asks for structured reuse.
- Stateful and ticked machines are allowed, but the AI should only introduce them when the user clearly asks for temporal behavior.
- Challenge generation should stay bounded: starting project, target project, prompt, success rule, optional hints.

## Workspace Types

\`\`\`ts
${WORKBENCH_TYPES}
\`\`\`

## Challenge Types

\`\`\`ts
${CHALLENGE_TYPES}
\`\`\`

## Primitive Inventory

${primitiveInventory}

## Minimal Workspace Example

\`\`\`json
${JSON.stringify(SIMPLE_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## Structured Machine Example

\`\`\`json
${JSON.stringify(STRUCTURED_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## Challenge Example

\`\`\`json
${JSON.stringify(CHALLENGE_EXAMPLE, null, 2)}
\`\`\`

## Final Reminder

Return valid JSON artifacts, not pseudo-code. Keep the graph minimal, explicit, and typed. The human user will still validate the result in MCW, run verification cases, and use export parity when needed.
`;
}

export function getAiToolkitFileName() {
  return TOOLKIT_FILE_NAME;
}
