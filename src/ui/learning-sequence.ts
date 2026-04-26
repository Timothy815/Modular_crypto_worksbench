export type LearningStage =
  | 'foundations'
  | 'classical-symbol-machines'
  | 'modern-bit-machines'
  | 'state-and-control'
  | 'framing-and-protocol-context'
  | 'streams-and-scheduling'
  | 'rotor-realism-and-mechanized-systems'
  | 'message-structure-and-composition'
  | 'advanced-arithmetic-and-number-theory'
  | 'integrity-and-authentication'
  | 'asymmetric-verification-and-systems-composition';

export interface LearningSequenceMeta {
  stage?: LearningStage;
  order?: number;
  core?: boolean;
  recommendedAfter?: string[];
}

export interface SequencedLearningItem extends LearningSequenceMeta {
  id: string;
  title?: string;
  name?: string;
  group?: string;
  projectId?: string;
}

export interface RecommendedLearningTarget {
  id: string;
  label: string;
}

const STAGE_LABELS: Record<LearningStage, string> = {
  foundations: 'Stage 1 · Foundations',
  'classical-symbol-machines': 'Stage 2 · Classical Symbol Machines',
  'modern-bit-machines': 'Stage 3 · Modern Bit Machines',
  'state-and-control': 'Stage 4 · State And Control',
  'framing-and-protocol-context': 'Stage 5 · Framing And Protocol Context',
  'streams-and-scheduling': 'Stage 6 · Streams And Scheduling',
  'rotor-realism-and-mechanized-systems': 'Stage 7 · Rotor Realism',
  'message-structure-and-composition': 'Stage 8 · Message Structure',
  'advanced-arithmetic-and-number-theory': 'Stage 9 · Advanced Arithmetic',
  'integrity-and-authentication': 'Stage 10 · Integrity And Authentication',
  'asymmetric-verification-and-systems-composition':
    'Stage 11 · Asymmetric Verification And Systems Composition',
};

const STAGE_ORDER: Record<LearningStage, number> = {
  foundations: 1,
  'classical-symbol-machines': 2,
  'modern-bit-machines': 3,
  'state-and-control': 4,
  'framing-and-protocol-context': 5,
  'streams-and-scheduling': 6,
  'rotor-realism-and-mechanized-systems': 7,
  'message-structure-and-composition': 8,
  'advanced-arithmetic-and-number-theory': 9,
  'integrity-and-authentication': 10,
  'asymmetric-verification-and-systems-composition': 11,
};

const GROUP_STAGE_MAP: Record<string, LearningStage> = {
  Foundations: 'foundations',
  'Historical Bridges': 'classical-symbol-machines',
  'Modern Rounds': 'modern-bit-machines',
  'Control Foundations': 'state-and-control',
  'Block Framing': 'framing-and-protocol-context',
  Framing: 'framing-and-protocol-context',
  'Protocol Materials': 'framing-and-protocol-context',
  'Key Schedule': 'framing-and-protocol-context',
  'Conditional Clocking': 'streams-and-scheduling',
  'Stream Ciphers': 'streams-and-scheduling',
  'Rotor Realism': 'rotor-realism-and-mechanized-systems',
  'Symbol Permutation': 'message-structure-and-composition',
  'Symbol Structure': 'message-structure-and-composition',
  'Arithmetic Expansion': 'advanced-arithmetic-and-number-theory',
  'Number Theory': 'advanced-arithmetic-and-number-theory',
  Integrity: 'integrity-and-authentication',
  'Asymmetric Verification': 'asymmetric-verification-and-systems-composition',
  'Systems Composition': 'asymmetric-verification-and-systems-composition',
  'Hash Foundations': 'advanced-arithmetic-and-number-theory',
  Cryptanalysis: 'advanced-arithmetic-and-number-theory',
};

const OPTIONAL_GROUPS = new Set(['Cryptanalysis', 'Hash Foundations']);

const GROUP_ORDER_HINTS: Record<string, number> = {
  Foundations: 10,
  'Historical Bridges': 20,
  'Modern Rounds': 30,
  'Control Foundations': 40,
  'Block Framing': 50,
  Framing: 55,
  'Protocol Materials': 60,
  'Key Schedule': 70,
  'Conditional Clocking': 80,
  'Stream Ciphers': 90,
  'Rotor Realism': 100,
  'Symbol Permutation': 110,
  'Symbol Structure': 120,
  'Arithmetic Expansion': 130,
  'Number Theory': 140,
  Integrity: 150,
  'Asymmetric Verification': 160,
  'Systems Composition': 170,
  'Hash Foundations': 180,
  Cryptanalysis: 190,
};

const ITEM_ORDER_HINTS: Record<string, number> = {
  bridge: 10,
  'repair-the-key-stream': 10,
  'baudot-bridge': 20,
  'beyond-xor': 30,
  'repair-the-mask': 30,
  'byte-round': 40,
  'hex-round': 50,
  'ascii-round': 60,
  'counter-pulse-gate': 70,
  'repair-the-threshold': 70,
  'split-transform-rejoin': 80,
  'visible-block-boundaries': 80,
  'repair-the-split-width': 80,
  'pad-and-split': 90,
  'padding-before-splitting': 90,
  'repair-the-pad-width': 90,
  'protocol-material-mixer': 100,
  'protocol-material-is-context': 100,
  'repair-the-iv': 100,
  'visible-subkey-bus': 110,
  'repair-the-key-window': 110,
  'visible-key-selection': 112,
  'repair-the-key-selection': 112,
  'visible-key-expansion': 113,
  'repair-the-e-expansion': 113,
  'key-schedule-workshop': 120,
  keystream: 130,
  'gated-keystream': 140,
  'majority-keystream': 150,
  'repair-the-majority-vote': 150,
  'filtered-keystream': 160,
  'repair-the-filter-selector': 160,
  'clocked-round-traversal': 165,
  'repair-the-clock-pulse': 165,
  'routed-clock-keystream': 170,
  'repair-the-routed-clock': 170,
  'one-machine-two-directions': 175,
  'advanced-rotor-stepping': 180,
  'repair-the-rotor-notch': 180,
  'visible-symbol-scramble': 190,
  'repair-the-symbol-order': 190,
  'visible-message-window': 200,
  'repair-the-message-window': 200,
  'multiply-compare-unpad': 210,
  'repair-the-threshold-window': 210,
  'toy-rsa': 220,
  'repair-the-rsa-exponent': 220,
  'toy-compression-hash': 230,
  'toy-sponge-hash': 240,
  'breaking-the-unbreakable': 250,
  'avalanche-effect': 260,
};

const RECOMMENDED_AFTER_HINTS: Record<string, string[]> = {
  'baudot-bridge': ['bridge'],
  'beyond-xor': ['bridge'],
  'counter-pulse-gate': ['beyond-xor'],
  'split-transform-rejoin': ['counter-pulse-gate'],
  'pad-and-split': ['split-transform-rejoin'],
  'protocol-material-mixer': ['pad-and-split'],
  'visible-subkey-bus': ['protocol-material-mixer'],
  'key-schedule-workshop': ['visible-subkey-bus'],
  keystream: ['counter-pulse-gate'],
  'gated-keystream': ['keystream'],
  'majority-keystream': ['gated-keystream'],
  'filtered-keystream': ['majority-keystream'],
  'routed-clock-keystream': ['filtered-keystream'],
  'one-machine-two-directions': ['routed-clock-keystream'],
  'advanced-rotor-stepping': ['routed-clock-keystream'],
  'visible-symbol-scramble': ['bridge'],
  'visible-message-window': ['visible-symbol-scramble'],
  'toy-rsa': ['multiply-compare-unpad'],
  'breaking-the-unbreakable': ['bridge'],
  'avalanche-effect': ['feistel-network'],
};

function normalizeHintKey(item: SequencedLearningItem): string {
  return item.projectId ?? item.id;
}

function getDisplayLabel(item: SequencedLearningItem): string {
  return item.title ?? item.name ?? item.id;
}

function getDefaultOrder(item: SequencedLearningItem): number {
  const hintKey = normalizeHintKey(item);
  return item.order ?? ITEM_ORDER_HINTS[hintKey] ?? ITEM_ORDER_HINTS[item.id] ?? Number.MAX_SAFE_INTEGER;
}

export function inferLearningStage(item: SequencedLearningItem): LearningStage {
  if (item.stage) {
    return item.stage;
  }

  if (item.id.includes('rotor') || item.group === 'Rotor Realism') {
    return 'rotor-realism-and-mechanized-systems';
  }

  if (
    item.id.includes('keystream') ||
    item.id.includes('majority') ||
    item.id.includes('filter') ||
    item.id.includes('routed-clock') ||
    item.group === 'Conditional Clocking' ||
    item.group === 'Stream Ciphers'
  ) {
    return 'streams-and-scheduling';
  }

  if (
    item.id.includes('protocol') ||
    item.id.includes('split') ||
    item.id.includes('pad') ||
    item.id.includes('subkey') ||
    item.id.includes('key-window') ||
    item.id.includes('key-schedule') ||
    item.group === 'Block Framing' ||
    item.group === 'Protocol Materials' ||
    item.group === 'Key Schedule'
  ) {
    return 'framing-and-protocol-context';
  }

  if (
    item.id.includes('symbol') ||
    item.id.includes('message-window') ||
    item.group === 'Symbol Permutation' ||
    item.group === 'Symbol Structure'
  ) {
    return 'message-structure-and-composition';
  }

  return GROUP_STAGE_MAP[item.group ?? ''] ?? 'foundations';
}

export function getLearningStageLabel(stage: LearningStage): string {
  return STAGE_LABELS[stage];
}

export function getLearningGroupStage(group: string): LearningStage {
  return GROUP_STAGE_MAP[group] ?? 'foundations';
}

export function getLearningGroupLabel(group: string, itemCount?: number): string {
  const stageLabel = getLearningStageLabel(getLearningGroupStage(group));
  const countLabel =
    typeof itemCount === 'number' ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : '';
  return `${stageLabel} — ${group}${countLabel}`;
}

export function isCoreLearningItem(item: SequencedLearningItem): boolean {
  if (typeof item.core === 'boolean') {
    return item.core;
  }

  if (OPTIONAL_GROUPS.has(item.group ?? '')) {
    return false;
  }

  return true;
}

export function compareLearningItems(left: SequencedLearningItem, right: SequencedLearningItem): number {
  const stageDelta = STAGE_ORDER[inferLearningStage(left)] - STAGE_ORDER[inferLearningStage(right)];
  if (stageDelta !== 0) {
    return stageDelta;
  }

  const groupDelta =
    (GROUP_ORDER_HINTS[left.group ?? ''] ?? Number.MAX_SAFE_INTEGER) -
    (GROUP_ORDER_HINTS[right.group ?? ''] ?? Number.MAX_SAFE_INTEGER);
  if (groupDelta !== 0) {
    return groupDelta;
  }

  const orderDelta = getDefaultOrder(left) - getDefaultOrder(right);
  if (orderDelta !== 0) {
    return orderDelta;
  }

  return getDisplayLabel(left).localeCompare(getDisplayLabel(right));
}

export function getSortedLearningGroups(items: SequencedLearningItem[]): string[] {
  const groups = [...new Set(items.map((item) => item.group ?? 'Other'))];
  return groups.sort((left, right) => {
    const leftStage = GROUP_STAGE_MAP[left] ?? 'foundations';
    const rightStage = GROUP_STAGE_MAP[right] ?? 'foundations';
    const stageDelta = STAGE_ORDER[leftStage] - STAGE_ORDER[rightStage];
    if (stageDelta !== 0) {
      return stageDelta;
    }

    const hintDelta =
      (GROUP_ORDER_HINTS[left] ?? Number.MAX_SAFE_INTEGER) -
      (GROUP_ORDER_HINTS[right] ?? Number.MAX_SAFE_INTEGER);
    if (hintDelta !== 0) {
      return hintDelta;
    }

    return left.localeCompare(right);
  });
}

export function getRecommendedAfterIds(item: SequencedLearningItem): string[] {
  if (item.recommendedAfter && item.recommendedAfter.length > 0) {
    return item.recommendedAfter;
  }

  const hintKey = normalizeHintKey(item);
  return RECOMMENDED_AFTER_HINTS[hintKey] ?? RECOMMENDED_AFTER_HINTS[item.id] ?? [];
}

export function getRecommendedAfterTitles(
  items: SequencedLearningItem[],
  item: SequencedLearningItem,
): string[] {
  return getRecommendedAfterTargets(items, item).map((target) => target.label);
}

export function getRecommendedAfterTargets(
  items: SequencedLearningItem[],
  item: SequencedLearningItem,
): RecommendedLearningTarget[] {
  const allItems = [...items];
  const targetById = new Map<string, RecommendedLearningTarget>();

  for (const entry of allItems) {
    const target = {
      id: entry.projectId ?? entry.id,
      label: getDisplayLabel(entry),
    };
    targetById.set(entry.id, target);
    if (entry.projectId) {
      targetById.set(entry.projectId, target);
    }
  }

  return getRecommendedAfterIds(item)
    .map((id) => targetById.get(id))
    .filter((target): target is RecommendedLearningTarget => Boolean(target));
}

export function getRecommendedNextItem<T extends SequencedLearningItem>(
  items: T[],
  currentId: string,
): T | null {
  const sorted = [...items].sort(compareLearningItems);
  const currentIndex = sorted.findIndex((item) => item.id === currentId);
  if (currentIndex < 0) {
    return null;
  }

  for (let index = currentIndex + 1; index < sorted.length; index += 1) {
    if (isCoreLearningItem(sorted[index])) {
      return sorted[index];
    }
  }

  return null;
}

export function getFirstLearningItemInGroup<T extends SequencedLearningItem>(
  items: T[],
  group: string,
): T | null {
  const sorted = [...items].sort(compareLearningItems);
  return sorted.find((item) => (item.group ?? 'Other') === group) ?? null;
}
