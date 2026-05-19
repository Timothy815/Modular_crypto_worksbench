import { demoProjects, type DemoProject } from './demo-projects';
import { compareLearningItems, isCoreLearningItem } from './learning-sequence';
import { PIPELINE_MICRO_DEMOS, type PipelineMicroDemo } from './pipeline-micro-demos';

export type AtlasSectionId =
  | 'foundations'
  | 'classical-systems'
  | 'modern-machines'
  | 'protocols-and-integrity'
  | 'arithmetic-and-aes'
  | 'public-key-and-ecc'
  | 'pipeline-micro-demos';

export interface DemoAtlasSectionDefinition {
  id: AtlasSectionId;
  title: string;
  description: string;
  entryKindLabel: 'Full Demo' | 'Pipeline Micro Demo';
}

export interface DemoAtlasSection {
  id: AtlasSectionId;
  title: string;
  description: string;
  entryKindLabel: 'Full Demo' | 'Pipeline Micro Demo';
  entries: DemoAtlasEntry[];
}

export interface DemoAtlasEntry {
  id: string;
  title: string;
  summary: string;
  sectionId: AtlasSectionId;
  sectionLabel: string;
  kindLabel: 'Full Demo' | 'Pipeline Micro Demo';
  keywords: string[];
  isGoodFirstBoard: boolean;
  isAdvanced: boolean;
  usesTickedMode: boolean;
}

interface DemoAtlasEntryFlags {
  keywords?: string[];
  goodFirstBoard?: boolean;
  advanced?: boolean;
}

export const DEMO_ATLAS_SECTIONS: readonly DemoAtlasSectionDefinition[] = [
  {
    id: 'foundations',
    title: 'Foundations And First Boards',
    description:
      'Start here if you want to understand MCW’s basic machine model: explicit inputs, visible conversions, and small boards that make one idea legible at a time.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'classical-systems',
    title: 'Classical Systems And Rotor Machines',
    description:
      'These boards cover telegraph-era and rotor-era systems where state, wiring, and mechanical stepping are part of the explanation.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'modern-machines',
    title: 'Modern Rounds, Control, And Composition',
    description:
      'These boards show how modern cryptographic machines are assembled from rounds, routing, framing, scheduling, and explicit control.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'protocols-and-integrity',
    title: 'Protocols, Integrity, Hashing, And Analysis',
    description:
      'These boards cover protocol context, keyed materials, tamper detection, hash structure, and the analysis labs that help explain what those machines are doing.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'arithmetic-and-aes',
    title: 'Arithmetic, Fields, And AES Building Blocks',
    description:
      'These boards make arithmetic structure visible: integers, finite fields, AES byte algebra, and the round mechanics that sit on top of them.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'public-key-and-ecc',
    title: 'Public-Key And ECC',
    description:
      'These boards move into visible algebraic cryptography: point mechanics, key agreement, signatures, and the structural ideas behind them.',
    entryKindLabel: 'Full Demo',
  },
  {
    id: 'pipeline-micro-demos',
    title: 'Pipeline Micro Demos',
    description:
      'Compact end-to-end boards that show one honest working path without the weight of a full flagship workspace.',
    entryKindLabel: 'Pipeline Micro Demo',
  },
] as const;

const FULL_DEMO_SECTION_MAP: Record<string, AtlasSectionId> = {
  bridge: 'foundations',
  modern: 'foundations',
  'beyond-xor': 'foundations',
  'bit-sequence-segment-and-rejoin': 'foundations',
  'visible-bridge-family': 'foundations',

  'baudot-bridge': 'classical-systems',
  'pollux-fractionation': 'classical-systems',
  'pollux-round-trip': 'classical-systems',
  'pollux-controlled-selection': 'classical-systems',
  'lorenz-foundation': 'classical-systems',
  'gated-lorenz': 'classical-systems',
  'paired-lorenz': 'classical-systems',
  'banked-lorenz': 'classical-systems',
  'rotor-return-path': 'classical-systems',
  'advanced-rotor-stepping': 'classical-systems',
  'rotor-control-bank': 'classical-systems',
  'enigma-machine': 'classical-systems',

  'visible-repeated-key-repair': 'modern-machines',
  'visible-strict-length-gate': 'modern-machines',
  'visible-hex-block-paths': 'modern-machines',
  'visible-mismatch-policy-family': 'modern-machines',
  'visible-operator-family': 'modern-machines',
  'visible-stateful-family': 'modern-machines',
  'visible-stepped-mechanisms': 'modern-machines',
  'visible-control-family': 'modern-machines',
  'visible-byte-order': 'modern-machines',
  'bypass-workshop': 'modern-machines',
  'split-transform-rejoin': 'modern-machines',
  'pad-and-split': 'modern-machines',
  'counter-pulse-gate': 'modern-machines',
  'packaged-iterated-rounds': 'modern-machines',
  'iterated-byte-rounds': 'modern-machines',
  'keyed-byte-rounds': 'modern-machines',
  'visible-subkey-bus': 'modern-machines',
  'keyed-byte-iterator': 'modern-machines',
  'clocked-byte-round-iterator': 'modern-machines',
  'feistel-network': 'modern-machines',
  'byte-round': 'modern-machines',
  'des-s1-lookup': 'modern-machines',
  'aes-byte-sbox': 'modern-machines',
  'sbox-table-transform': 'modern-machines',
  'hex-round': 'modern-machines',
  'ascii-round': 'modern-machines',
  'gated-keystream': 'modern-machines',
  'majority-keystream': 'modern-machines',
  'filtered-keystream': 'modern-machines',
  'routed-clock-keystream': 'modern-machines',
  'clocked-round-traversal': 'modern-machines',
  'one-machine-two-directions': 'modern-machines',
  keystream: 'modern-machines',
  hybrid: 'modern-machines',

  'protocol-material-mixer': 'protocols-and-integrity',
  'key-schedule-workshop': 'protocols-and-integrity',
  'recursive-key-schedule': 'protocols-and-integrity',
  'key-schedule-lab': 'protocols-and-integrity',
  'visible-block-chaining': 'protocols-and-integrity',
  'visible-tamper-check': 'protocols-and-integrity',
  'visible-authenticated-encryption': 'protocols-and-integrity',
  'toy-compression-hash': 'protocols-and-integrity',
  'hash-digest-round': 'protocols-and-integrity',
  'toy-sponge-hash': 'protocols-and-integrity',
  'avalanche-lab': 'protocols-and-integrity',
  'randomness-lab': 'protocols-and-integrity',
  'differential-characteristic': 'protocols-and-integrity',
  'lfsr-predictability': 'protocols-and-integrity',

  'integer-round-trip': 'arithmetic-and-aes',
  'prime-field-inverse-check': 'arithmetic-and-aes',
  'multiply-compare-unpad': 'arithmetic-and-aes',
  'gf2-multiply': 'arithmetic-and-aes',
  'visible-mix-columns': 'arithmetic-and-aes',
  'visible-subbytes': 'arithmetic-and-aes',
  'visible-shiftrows': 'arithmetic-and-aes',
  'visible-add-round-key': 'arithmetic-and-aes',
  'aes-round-full': 'arithmetic-and-aes',
  'aes-row-perturbation': 'arithmetic-and-aes',
  'keyed-sbox-authoring': 'arithmetic-and-aes',
  'aes-column-perturbation': 'arithmetic-and-aes',

  'visible-point-mechanics': 'public-key-and-ecc',
  'visible-scalar-multiplication': 'public-key-and-ecc',
  'visible-double-and-add': 'public-key-and-ecc',
  'toy-curve-point-map': 'public-key-and-ecc',
  'visible-ecdh-key-agreement': 'public-key-and-ecc',
  'secp256k1-ecdh': 'public-key-and-ecc',
  'visible-point-order-and-subgroups': 'public-key-and-ecc',
  'ecdh-low-order-point-consequence': 'public-key-and-ecc',
  'visible-schnorr-signature': 'public-key-and-ecc',
  'schnorr-nonce-reuse-consequence': 'public-key-and-ecc',
  'toy-rsa': 'public-key-and-ecc',
  'diffie-hellman-key-exchange': 'public-key-and-ecc',
  'visible-signature-verification': 'public-key-and-ecc',
  'visible-secure-handshake': 'public-key-and-ecc',
  'visible-message-window': 'modern-machines',
  'visible-symbol-scramble': 'modern-machines',
  'visible-key-selection': 'protocols-and-integrity',
  'visible-key-remap': 'protocols-and-integrity',
  'visible-key-expansion': 'protocols-and-integrity',
  'visible-des-f-function': 'modern-machines',
  'visible-feistel-round': 'modern-machines',
  sequential: 'modern-machines',
} as const;

const START_HERE_OVERRIDE_IDS = [
  'bridge',
  'modern',
  'visible-bridge-family',
  'gf2-multiply',
  'visible-point-mechanics',
] as const;

const FULL_DEMO_FLAGS: Record<string, DemoAtlasEntryFlags> = {
  bridge: {
    goodFirstBoard: true,
    keywords: ['starter', 'onboarding', 'first board'],
  },
  modern: {
    goodFirstBoard: true,
    keywords: ['round', 'substitution', 'permutation'],
  },
  'visible-bridge-family': {
    goodFirstBoard: true,
    keywords: ['bridges', 'conversion', 'sequence', 'bits'],
  },
  'gf2-multiply': {
    goodFirstBoard: true,
    keywords: ['aes', 'field', 'gf2', 'mixcolumns'],
  },
  'visible-point-mechanics': {
    goodFirstBoard: true,
    keywords: ['ecc', 'elliptic curve', 'point'],
  },
  'visible-double-and-add': {
    keywords: ['ecc', 'double and add', 'scalar multiplication', 'repeated point action'],
  },
  'toy-curve-point-map': {
    keywords: ['ecc', 'finite field', 'point map', 'toy curve', '3P', 'selected point'],
  },
  'visible-strict-length-gate': {
    keywords: ['length', 'xor', 'strict'],
  },
  'visible-subbytes': {
    keywords: ['aes', 's-box', 'subbytes'],
  },
  'visible-shiftrows': {
    keywords: ['aes', 'shiftrows'],
  },
  'visible-add-round-key': {
    keywords: ['aes', 'round key'],
  },
  'aes-round-full': {
    advanced: true,
    keywords: ['aes', 'round', 'fips 197'],
  },
  'aes-row-perturbation': {
    advanced: true,
    keywords: ['aes', 'shiftrows', 'perturbation', 'row rotation', 'fips 197', 'comparison'],
  },
  'keyed-sbox-authoring': {
    advanced: true,
    keywords: ['aes', 's-box', 'keyed table', 'present', 'permutation validity', 'substitution'],
  },
  'aes-column-perturbation': {
    advanced: true,
    keywords: ['aes', 'mixcolumns', 'column diffusion', 'perturbation', 'gf2', 'fips 197', 'comparison'],
  },
  'secp256k1-ecdh': {
    advanced: true,
    keywords: ['ecc', 'ecdh', 'secp256k1'],
  },
  'visible-schnorr-signature': {
    advanced: true,
    keywords: ['ecc', 'signature', 'schnorr'],
  },
  'schnorr-nonce-reuse-consequence': {
    advanced: true,
    keywords: ['ecc', 'schnorr', 'nonce reuse', 'signature failure', 'secret recovery'],
  },
  'toy-rsa': {
    keywords: ['rsa', 'public key'],
  },
  'diffie-hellman-key-exchange': {
    keywords: ['diffie-hellman', 'key exchange'],
  },
  'visible-ecdh-key-agreement': {
    keywords: ['ecc', 'ecdh', 'diffie-hellman'],
  },
  'visible-point-order-and-subgroups': {
    advanced: true,
    keywords: ['ecc', 'subgroup', 'order'],
  },
  'ecdh-low-order-point-consequence': {
    advanced: true,
    keywords: ['ecc', 'ecdh', 'low-order point', 'subgroup collapse', 'peer validation'],
  },
  'visible-signature-verification': {
    advanced: true,
    keywords: ['signature', 'verification'],
  },
  'visible-tamper-check': {
    keywords: ['integrity', 'tamper'],
  },
  'visible-authenticated-encryption': {
    advanced: true,
    keywords: ['authentication', 'integrity', 'aead'],
  },
  'toy-sponge-hash': {
    advanced: true,
    keywords: ['hash', 'sponge'],
  },
  'enigma-machine': {
    advanced: true,
    keywords: ['enigma', 'rotor'],
  },
} as const;

const PIPELINE_DEMO_FLAGS: Record<string, DemoAtlasEntryFlags> = {
  'visible-ecdh-shared-secret-equality': {
    keywords: ['ecc', 'ecdh', 'shared secret'],
  },
  'visible-schnorr-verification-equality': {
    keywords: ['ecc', 'schnorr', 'verification'],
  },
  'scalar-times-three': {
    keywords: ['ecc', 'scalar multiplication'],
  },
  'visible-double-and-add-agreement': {
    keywords: ['ecc', 'double and add', 'scalar multiplication'],
  },
  'toy-curve-walk-agreement': {
    keywords: ['ecc', 'toy curve', '3P', 'point map'],
  },
  'representation-round-trip': {
    keywords: ['representation', 'bridges', 'round trip'],
  },
} as const;

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase();
}

function buildSearchHaystack(parts: string[]) {
  return parts.join(' ').toLowerCase();
}

function findSectionDefinition(sectionId: AtlasSectionId) {
  return DEMO_ATLAS_SECTIONS.find((section) => section.id === sectionId) ?? null;
}

function toFullDemoEntry(project: DemoProject): DemoAtlasEntry {
  const sectionId = FULL_DEMO_SECTION_MAP[project.id];
  if (!sectionId) {
    throw new Error(`Missing Demo Atlas section mapping for demo project: ${project.id}`);
  }

  const section = findSectionDefinition(sectionId);
  if (!section) {
    throw new Error(`Missing Demo Atlas section definition: ${sectionId}`);
  }

  const flags = FULL_DEMO_FLAGS[project.id] ?? {};
  return {
    id: project.id,
    title: project.name,
    summary: project.summary,
    sectionId,
    sectionLabel: section.title,
    kindLabel: 'Full Demo',
    keywords: flags.keywords ?? [],
    isGoodFirstBoard: Boolean(flags.goodFirstBoard),
    isAdvanced: Boolean(flags.advanced),
    usesTickedMode: Boolean(project.defaultTickedMode),
  };
}

function toPipelineDemoEntry(demo: PipelineMicroDemo): DemoAtlasEntry {
  const section = findSectionDefinition('pipeline-micro-demos');
  if (!section) {
    throw new Error('Missing Demo Atlas section definition: pipeline-micro-demos');
  }

  const flags = PIPELINE_DEMO_FLAGS[demo.id] ?? {};
  return {
    id: demo.id,
    title: demo.name,
    summary: demo.summary,
    sectionId: 'pipeline-micro-demos',
    sectionLabel: section.title,
    kindLabel: 'Pipeline Micro Demo',
    keywords: flags.keywords ?? [],
    isGoodFirstBoard: Boolean(flags.goodFirstBoard),
    isAdvanced: Boolean(flags.advanced),
    usesTickedMode: Boolean(demo.defaultTickedMode),
  };
}

const FULL_DEMO_ENTRY_MAP = new Map(
  [...demoProjects]
    .sort(compareLearningItems)
    .map((project) => [project.id, toFullDemoEntry(project)] as const),
);

const PIPELINE_ENTRY_MAP = new Map(
  PIPELINE_MICRO_DEMOS.map((demo) => [demo.id, toPipelineDemoEntry(demo)] as const),
);

export function getDemoAtlasCoverage() {
  return {
    fullDemoIds: demoProjects.map((project) => project.id),
    mappedFullDemoIds: Object.keys(FULL_DEMO_SECTION_MAP),
    pipelineIds: PIPELINE_MICRO_DEMOS.map((demo) => demo.id),
    mappedPipelineIds: PIPELINE_MICRO_DEMOS.map((demo) => demo.id),
  };
}

export function getDemoAtlasStartHereEntries() {
  const coreEntries = demoProjects.filter((project) => isCoreLearningItem(project));
  if (coreEntries.length >= 3) {
    return START_HERE_OVERRIDE_IDS
      .map((projectId) => FULL_DEMO_ENTRY_MAP.get(projectId))
      .filter((entry): entry is DemoAtlasEntry => entry !== undefined);
  }

  return START_HERE_OVERRIDE_IDS
    .map((projectId) => FULL_DEMO_ENTRY_MAP.get(projectId))
    .filter((entry): entry is DemoAtlasEntry => entry !== undefined);
}

export function getDemoAtlasSections(): DemoAtlasSection[] {
  return DEMO_ATLAS_SECTIONS.map((section) => {
    const entries =
      section.id === 'pipeline-micro-demos'
        ? PIPELINE_MICRO_DEMOS.map((demo) => PIPELINE_ENTRY_MAP.get(demo.id)).filter(
            (entry): entry is DemoAtlasEntry => entry !== undefined,
          )
        : [...FULL_DEMO_ENTRY_MAP.values()].filter((entry) => entry.sectionId === section.id);

    return {
      ...section,
      entries,
    };
  });
}

export function filterDemoAtlasSections(query: string): DemoAtlasSection[] {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) {
    return getDemoAtlasSections();
  }

  return getDemoAtlasSections()
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) =>
        buildSearchHaystack([
          entry.title,
          entry.summary,
          section.title,
          ...entry.keywords,
        ]).includes(normalized),
      ),
    }))
    .filter((section) => section.entries.length > 0);
}
