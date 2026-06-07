import { V1_REGISTRY } from '../engine/modules';
import { getModuleCategory, type ModuleCategory } from './module-categories';

const TOOLKIT_FILE_NAME = 'mcw-ai-toolkit.md';

const ENGINE_TYPES = `// ── Signal domains ───────────────────────────────────────────────────────────
// MCW has four signal types. No implicit conversion between them.

export type SignalType = 'symbol' | 'bits' | 'integer' | 'ec-point';

export interface SymbolSignal  { type: 'symbol';   value: string;   }
export interface BitsSignal    { type: 'bits';     value: number[]; } // array of 0/1
export interface IntegerSignal { type: 'integer';  value: string;   } // hex string, no 0x prefix, e.g. "FF" for 255
export interface EcPointSignal { type: 'ec-point'; value: EcPointSignalValue; }

export type EcPointSignalValue =
  | { kind: 'affine';   curve: EcCurveDescriptor; x: string; y: string }
  | { kind: 'infinity'; curve: EcCurveDescriptor };

export interface EcCurveDescriptor { p: bigint; a: bigint; b: bigint; }

export type Signal = SymbolSignal | BitsSignal | IntegerSignal | EcPointSignal;

// ── Param kinds ───────────────────────────────────────────────────────────────
// Each field in a module's paramSchema declares a kind.

export type ParamKind =
  | 'number'     // JavaScript number; safe for small integers only
  | 'bigint-hex' // large integer stored as uppercase hex string WITHOUT 0x prefix
  | 'string'     // plain text
  | 'boolean'    // true / false
  | 'select'     // enum; paramSchema will list allowed options
  | 'wiring'     // string[] pairs for plugboard-style wiring, e.g. ["AB","CD"]
  | 'bits';      // number[] for bit-array params`;

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

// Toy curve: y² = x² + 2x + 3  mod 11  (p=B, a=2, b=3)
// Generator G = (5, 1), k=3 → k·G computed by ScalarMultiply
// All bigint-hex params are uppercase hex strings without 0x prefix.
// "B" = 11, "2" = 2, "3" = 3, "5" = 5, "1" = 1
const ECC_WORKSPACE_EXAMPLE = {
  version: 1,
  project: {
    modules: [
      { id: 'k-bits-1', defId: 'BitSource', params: { value: [0, 0, 0, 0, 0, 0, 1, 1] } },
      { id: 'k-int-1', defId: 'BitsToInteger', params: {} },
      {
        id: 'base-1',
        defId: 'PointSource',
        params: { p: 'B', a: '2', b: '3', x: '5', y: '1' },
      },
      { id: 'mul-1', defId: 'ScalarMultiply', params: { p: 'B', a: '2', b: '3' } },
      { id: 'out-1', defId: 'Output', params: {} },
    ],
    connections: [
      { from: { moduleId: 'k-bits-1', port: 'out' }, to: { moduleId: 'k-int-1', port: 'in' } },
      { from: { moduleId: 'k-int-1', port: 'out' }, to: { moduleId: 'mul-1', port: 'scalar' } },
      { from: { moduleId: 'base-1', port: 'out' }, to: { moduleId: 'mul-1', port: 'point' } },
      { from: { moduleId: 'mul-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
    ],
  },
  ui: {
    layout: {
      'k-bits-1': { x: 80, y: 80 },
      'k-int-1': { x: 280, y: 80 },
      'base-1': { x: 80, y: 220 },
      'mul-1': { x: 480, y: 150 },
      'out-1': { x: 680, y: 150 },
    },
    annotations: [],
  },
} as const;

// GF(2⁸) multiply: a=0x02, b=0x03, poly=0x11B (AES reduction polynomial)
// Both inputs are 8-bit arrays. poly is stored as bigint-hex "11B".
// GF2Mul and GF2Inv operate entirely in the bits domain.
const GF2_WORKSPACE_EXAMPLE = {
  version: 1,
  project: {
    modules: [
      { id: 'a-1', defId: 'BitSource', params: { value: [0, 0, 0, 0, 0, 0, 1, 0] } },
      { id: 'b-1', defId: 'BitSource', params: { value: [0, 0, 0, 0, 0, 0, 1, 1] } },
      { id: 'mul-1', defId: 'GF2Mul', params: { poly: '11B' } },
      { id: 'out-1', defId: 'BitOutput', params: {} },
    ],
    connections: [
      { from: { moduleId: 'a-1', port: 'out' }, to: { moduleId: 'mul-1', port: 'a' } },
      { from: { moduleId: 'b-1', port: 'out' }, to: { moduleId: 'mul-1', port: 'b' } },
      { from: { moduleId: 'mul-1', port: 'out' }, to: { moduleId: 'out-1', port: 'in' } },
    ],
  },
  ui: {
    layout: {
      'a-1': { x: 80, y: 80 },
      'b-1': { x: 80, y: 220 },
      'mul-1': { x: 300, y: 150 },
      'out-1': { x: 500, y: 150 },
    },
    annotations: [],
  },
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

---

## What MCW Is

Modular Cryptography Workbench (MCW) is a graph-based systems IDE for building explicit cryptographic machines. It is not a freeform code runner. The full product spans four signal domains (symbol, bits, integer, ec-point), real-scale ECC arithmetic over secp256k1 and P-256, GF(2⁸) field arithmetic for AES-family operations, classical cipher primitives, and structured verification and Python export parity.

An AI agent should generate JSON artifacts that MCW can import, validate, inspect, verify, and export — not prose descriptions, not pseudo-JSON, and not artifacts with invented module ids or ports.

## What You May Generate

- \`WorkbenchDocument\` JSON for workspace layouts across all four signal domains
- \`GuidedChallenge\` JSON for challenge authoring
- Classical cipher machines (Enigma-style rotors, plugboards, reflectors)
- Modern round-structure machines (S-Box, XOR, permutation, Feistel round)
- ECC point mechanic boards (scalar multiply, point add, ECDH structure)
- GF(2⁸) field arithmetic boards (GF2Mul, GF2Inv, AES MixColumns-style paths)
- Integer-domain field arithmetic boards (FieldAdd, FieldSub, FieldMul, FieldInverse — real-scale bigint-hex modulus)
- Bits-domain small modular arithmetic boards (AddMod, SubMod, MulMod, ModInverse, Modulo, ModExp — JS-number modulus)
- LFSR / stream cipher boards (Clock → LFSR → Gate → BitOutput)
- Schnorr signature boards (ScalarMultiply + ChallengeCombine + ScalarLinearCombine)
- Mixed-domain boards using explicit bridge modules between domains

## What You Must Not Assume

- No hidden signal-type conversion between domains — all transitions need explicit bridge modules
- No cycles in project graphs
- No multiple wires into one input port
- No unsupported module ids or invented ports
- ECC params (p, a, b, x, y, scalar) use the \`bigint-hex\` param kind — hex strings, not JS numbers
- Generated artifacts are starting points; the human must still validate and verify inside MCW

---

## Signal Domains

MCW has four signal types. Ports are typed. Connections between mismatched types are illegal.

| Domain | Wire carries | JS representation | Typical use |
|---|---|---|---|
| \`symbol\` | single character / word | \`string\` | classical cipher text, alphabet-based transforms |
| \`bits\` | bit array | \`number[]\` (each element 0 or 1) | XOR, S-Box, permutation, byte-level AES ops |
| \`integer\` | large non-negative integer | \`string\` (hex, no 0x prefix) | ECC scalar, field arithmetic, modular exponent |
| \`ec-point\` | affine ECC point or point-at-infinity | object (see types below) | ECC point operations, ECDH, Schnorr |

Every domain transition requires an explicit bridge module. The four-domain rule is strict — there are no implicit coercions anywhere in the engine.

### Explicit domain bridges

| Bridge | From | To |
|---|---|---|
| \`SymbolToBits\`, \`AsciiCharToBits\`, \`AsciiSequenceToBits\` | symbol | bits |
| \`BitsToSymbol\`, \`BitsToAscii\`, \`BitsToAsciiChar\` | bits | symbol |
| \`BitsToHex\`, \`BitsToHexDigit\` | bits | symbol (hex) |
| \`HexToBits\`, \`HexDigitToBits\` | symbol (hex) | bits |
| \`BitsToInteger\` | bits | integer |
| \`IntegerToBits\` | integer | bits |
| \`AsciiToHex\`, \`HexToAscii\` | symbol ↔ symbol (encoding change) |

There is no direct path from \`symbol\` to \`integer\` or from \`bits\` to \`ec-point\`. Route through the correct intermediate bridge if needed.

---

## Param Kinds

Each field in a module's \`paramSchema\` has a \`kind\` property. Use the correct storage format when writing params in JSON.

| Kind | Storage format | Example |
|---|---|---|
| \`number\` | JS number | \`14\` |
| \`bigint-hex\` | uppercase hex string, no 0x prefix | \`”11B”\` for 0x11B, \`”FFFFFFFE...FC2F”\` for secp256k1 p |
| \`string\` | JS string | \`”HELLO”\` |
| \`boolean\` | JS boolean | \`true\` |
| \`select\` | string matching one of the listed options | \`”secp256k1”\` |
| \`wiring\` | string array of letter pairs | \`[“AB”,”CD”]\` |
| \`bits\` | number array of 0/1 | \`[0,1,1,0]\` |

**Critical rule for ECC and field arithmetic:** all curve params (\`p\`, \`a\`, \`b\`, \`x\`, \`y\`, scalar values) use the \`bigint-hex\` kind. Store them as uppercase hex strings without any \`0x\` prefix. For small values: 11 → \`”B”\`, 2 → \`”2”\`, 0 → \`”0”\`. For secp256k1 p: \`”FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F”\`.

---

## Connection Rules

- Port signal types must match exactly at every connection boundary.
- Every input port may have at most one incoming connection.
- Projects must be acyclic — no feedback loops.
- Symbol and bits domains cannot connect directly; use explicit bridge modules.
- Integer and ec-point domains cannot connect to symbol or bits ports.
- Module ids must be unique within a project.
- Output sinks must be explicit modules (\`Output\`, \`BitOutput\`, \`HexOutput\`, \`IntegerOutput\`, \`PointOutput\`) — not implied by prose.
- Never wire \`NamedCurveBasePoint.order\` (integer) directly to \`ScalarMultiply.point\` (ec-point).
- \`PointOutput\` is the correct sink for ec-point signals; \`Output\` accepts symbol only.

---

## ECC Module Family

ECC modules operate in the \`ec-point\` and \`integer\` domains. All curve-shape params (\`p\`, \`a\`, \`b\`) are \`bigint-hex\` and must be consistent across every module in the same computation path.

### Key ECC modules

| Module id | Inputs | Outputs | Notes |
|---|---|---|---|
| \`PointSource\` | none | \`out: ec-point\` | Explicit point; params: p, a, b, x, y (all bigint-hex) |
| \`NamedCurveBasePoint\` | none | \`point: ec-point\`, \`order: integer\` | Preset curves; param: \`curve\` (select: “secp256k1” or “P-256”) |
| \`PointAdd\` | \`a: ec-point\`, \`b: ec-point\` | \`out: ec-point\` | params: p, a, b (curve shape) |
| \`PointDouble\` | \`in: ec-point\` | \`out: ec-point\` | params: p, a, b |
| \`ScalarMultiply\` | \`scalar: integer\`, \`point: ec-point\` | \`out: ec-point\` | params: p, a, b |
| \`PointNegate\` | \`in: ec-point\` | \`out: ec-point\` | params: p, a, b |
| \`PointOnCurve\` | \`in: ec-point\` | \`out: bits\` (1 bit result) | params: p, a, b |
| \`PointOrder\` | \`in: ec-point\` | \`out: integer\` | params: p, a, b, n |
| \`PointEquals\` | \`a: ec-point\`, \`b: ec-point\` | \`out: bits\` | params: p, a, b |
| \`PointSelector\` | \`select: bits\`, \`keep: ec-point\`, \`take: ec-point\` | \`out: ec-point\` | conditional point routing; params: p, a, b |
| \`ScalarLinearCombine\` | \`nonce: integer\`, \`challenge: integer\`, \`private: integer\` | \`out: integer\` | Schnorr response s = nonce + challenge×private mod n; params: n |
| \`ChallengeCombine\` | \`commitment: ec-point\`, \`publicKey: ec-point\`, \`message: integer\` | \`out: integer\` | pedagogical Schnorr challenge hash; params: p, a, b, n |
| \`PointOutput\` | \`in: ec-point\` | none | ec-point sink — use instead of Output for ec-point results |
| \`ToyPointMap\` | none | \`selectedPoint: ec-point\`, \`walk3: ec-point\` | toy-curve point landscape source; params: p, a, b, selectedX, selectedY |

### NamedCurveBasePoint

Use \`NamedCurveBasePoint\` for real-scale secp256k1 or P-256 boards. It outputs both the generator point \`G\` and the subgroup order \`n\`:

\`\`\`json
{ “id”: “curve-1”, “defId”: “NamedCurveBasePoint”, “params”: { “curve”: “secp256k1” } }
\`\`\`

Wire \`curve-1.point\` to \`ScalarMultiply.point\` and a scalar source to \`ScalarMultiply.scalar\`. The curve-shape params on \`ScalarMultiply\` (p, a, b) must still be set to the corresponding secp256k1 values when using explicit point modules alongside it.

### ECDH pattern

To generate one ECDH shared-point on a toy curve:
1. \`PointSource\` → \`ScalarMultiply\` (Alice's private key × G = Alice's public key)
2. \`PointSource\` → \`ScalarMultiply\` (Bob's private key × Alice's public key = shared point)
Both multiplications must use identical p, a, b params.

---

## GF(2⁸) Field Arithmetic

\`GF2Mul\` and \`GF2Inv\` operate entirely in the \`bits\` domain. Inputs and outputs are 8-bit arrays.

| Module id | Inputs | Outputs | Key param |
|---|---|---|---|
| \`GF2Mul\` | \`a: bits\` (8), \`b: bits\` (8) | \`out: bits\` (8) | \`poly: bigint-hex\` — reduction polynomial |
| \`GF2Inv\` | \`in: bits\` (8) | \`out: bits\` (8) | \`poly: bigint-hex\` — reduction polynomial |

The AES reduction polynomial is \`x⁸ + x⁴ + x³ + x + 1\` = 0x11B. Store it as \`”11B”\` in \`bigint-hex\` form.

For AES-family boards, the MixColumns coefficients are 0x02 (\`”2”\`) and 0x03 (\`”3”\`).

GF2Inv(0) = 0 by convention. GF2Inv is the first stage of the AES SubBytes S-Box before the affine transform.

---

## Modular Arithmetic — Two Separate Families

MCW has two distinct modular arithmetic families. Using the wrong one produces a type error.

### Integer-domain field arithmetic (real-scale, bigint-hex modulus)

These modules carry \`integer\` signals and use bigint-hex for the modulus param. Use for real-scale RSA, DH, or prime-field arithmetic.

| Module id | Inputs | Outputs | Modulus param |
|---|---|---|---|
| \`FieldAdd\` | \`a: integer\`, \`b: integer\` | \`out: integer\` | \`modulus: bigint-hex\` |
| \`FieldSub\` | \`a: integer\`, \`b: integer\` | \`out: integer\` | \`modulus: bigint-hex\` |
| \`FieldMul\` | \`a: integer\`, \`b: integer\` | \`out: integer\` | \`modulus: bigint-hex\` |
| \`FieldInverse\` | \`in: integer\` | \`out: integer\` | \`modulus: bigint-hex\` |

These modules connect only to \`integer\`-typed ports. Use \`BitsToInteger\` / \`IntegerToBits\` to cross into or out of this domain.

### Bits-domain small modular arithmetic (JS-number modulus)

These modules carry \`bits\` signals and use JS numbers for the modulus param. Use for small-modulus classical cipher arithmetic (Caesar shifts, toy examples).

| Module id | Inputs | Outputs | Modulus param |
|---|---|---|---|
| \`AddMod\` | \`a: bits\`, \`b: bits\` | \`out: bits\` | none (implicit) |
| \`SubMod\` | \`a: bits\`, \`b: bits\` | \`out: bits\` | none |
| \`MulMod\` | \`a: bits\`, \`b: bits\` | \`out: bits\` | none |
| \`Modulo\` | \`in: bits\` | \`out: bits\` | \`modulus: number\` |
| \`ModInverse\` | \`in: bits\` | \`out: bits\` | \`modulus: number\` |
| \`ModExp\` | \`base: bits\`, \`exp: bits\` | \`out: bits\` | \`modulus: number\` |

**Do not mix these families.** If you need real-scale modular exponentiation, use \`FieldMul\` in a loop pattern — \`ModExp\` is bits-only and cannot handle secp256k1-scale values.

---

## Ticked / Clocked Execution

Some modules advance their state on clock pulses rather than evaluating as pure combinational logic. Use these when the machine should produce one symbol or bit per tick (stream ciphers, LFSR, rotor stepping).

### Key ticked modules

| Module id | Role | Notes |
|---|---|---|
| \`Clock\` | Pulse generator | outputs \`pulse: bits\`; params: period, offset, length |
| \`LFSR\` | Linear feedback shift register | \`clock: bits\` input; params: seed, taps, outputLength |
| \`Counter\` | Incrementing counter | \`clock: bits\` input; params: width, value, step |
| \`Gate\` | Controlled bit pass-through | \`in: bits\`, \`control: bits\` → \`out: bits\` |
| \`Rotor\` | Stepped substitution cipher | \`in: symbol\`, \`clock: bits\` → \`out: symbol\`, \`turnover: bits\` |
| \`RotorReverse\` | Return path (linked to Rotor) | same clock-driven stepping as Rotor |
| \`SymbolSequenceToTicked\` | Feed symbol sequence one at a time | \`clock\` advances the index |
| \`BitsSequenceToTicked\` | Feed bits sequence one word at a time | \`clock\` advances, params: wordWidth |
| \`TickedSymbolsToSequence\` | Collect ticked symbols into a sequence | params: collected, count |
| \`TickedBitsToSequence\` | Collect ticked bits into a sequence | params: collected, count |

### Minimal LFSR keystream pattern

\`\`\`json
{ "id": "clk-1", "defId": "Clock",  "params": { "period": 1, "offset": 0, "length": 8 } }
{ "id": "lfsr-1","defId": "LFSR",   "params": { "seed": [1,0,0,1], "taps": [0,3], "outputLength": 8 } }
{ "id": "gate-1","defId": "Gate",   "params": {} }
{ "id": "key-1", "defId": "BitSource", "params": { "value": [1,0,1,0,1,0,1,0] } }
{ "id": "out-1", "defId": "BitOutput","params": {} }
\`\`\`
Connections: clk-1.pulse → lfsr-1.clock, lfsr-1.out → gate-1.in, key-1.out → gate-1.control, gate-1.out → out-1.in

Only introduce ticked modules when the user explicitly requests stream cipher, LFSR, keystream, or stepping behaviour.

---

## Structured Features

- Explicit primitive graphs are preferred for toolkit output unless the user explicitly asks for structured reuse.
- Composites and iterators are supported but are authoring features; toolkit JSON should use primitive modules.
- Stateful and ticked machines are available but should only be introduced when the user asks for temporal behavior.
- Challenge generation should stay bounded: starting project, target project, prompt, success condition, optional hints.
- Python export parity is available for all primitives including GF2 and ECC families; the verification station uses known-vector cases to prove behavioral equivalence before export.

---

## Prompt Scaffold

\`\`\`text
You are generating Modular Cryptography Workbench (MCW) JSON artifacts.

Return only valid JSON unless the user explicitly asks for explanation.
Use only supported MCW module ids and legal port names from the primitive inventory.
Respect signal types at every connection boundary — four types: symbol, bits, integer, ec-point.
Every domain transition requires an explicit bridge module. There are no implicit conversions.
For ECC and field arithmetic modules, store all large-integer params as uppercase hex strings without 0x prefix (bigint-hex kind).
Keep module ids unique, keep the graph acyclic, and never connect more than one source to the same input port.
Prefer the smallest valid graph that satisfies the request.
When asked for a workspace, emit one WorkbenchDocument object.
When asked for a challenge, emit one GuidedChallenge object.
\`\`\`

---

## Engine Types

\`\`\`ts
${ENGINE_TYPES}
\`\`\`

## Workspace Types

\`\`\`ts
${WORKBENCH_TYPES}
\`\`\`

## Challenge Types

\`\`\`ts
${CHALLENGE_TYPES}
\`\`\`

---

## Primitive Inventory

${primitiveInventory}

---

## Minimal Workspace Example (symbol → bits)

\`\`\`json
${JSON.stringify(SIMPLE_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## ECC Workspace Example (integer + ec-point domains, toy curve)

Toy curve: p=11, a=2, b=3. Scalar k=3 (as 8-bit source → BitsToInteger). Generator G=(5,1).
Bigint-hex values: p=”B”, a=”2”, b=”3”, x=”5”, y=”1”.

\`\`\`json
${JSON.stringify(ECC_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## GF(2⁸) Workspace Example (bits domain, AES polynomial)

GF2Mul: 0x02 × 0x03 in GF(2⁸) with AES reduction polynomial (poly=”11B”).
Both inputs are 8-bit BitSource values. Output is an 8-bit BitOutput.

\`\`\`json
${JSON.stringify(GF2_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## Structured Machine Example (symbol domain, Enigma path)

\`\`\`json
${JSON.stringify(STRUCTURED_WORKSPACE_EXAMPLE, null, 2)}
\`\`\`

## Challenge Example

\`\`\`json
${JSON.stringify(CHALLENGE_EXAMPLE, null, 2)}
\`\`\`

---

## Final Reminder

Return valid JSON artifacts, not pseudo-code. Keep the graph minimal, explicit, and typed. The human user will still validate the result in MCW, run verification cases, and use export parity when needed. Signal types must match at every port. All ECC/field params are bigint-hex (uppercase hex strings, no 0x prefix). There are no implicit domain conversions.
`;
}

export function getAiToolkitFileName() {
  return TOOLKIT_FILE_NAME;
}
