import type { GuidedChallenge } from './challenges';
import { demoProjects } from './demo-projects';

function cloneProject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const bridgeProject = demoProjects.find((project) => project.id === 'bridge');
const baudotProject = demoProjects.find((project) => project.id === 'baudot-bridge');
const lorenzProject = demoProjects.find((project) => project.id === 'lorenz-foundation');
const gatedLorenzProject = demoProjects.find((project) => project.id === 'gated-lorenz');
const pairedLorenzProject = demoProjects.find((project) => project.id === 'paired-lorenz');
const bankedLorenzProject = demoProjects.find((project) => project.id === 'banked-lorenz');
const iteratedByteRoundsProject = demoProjects.find((project) => project.id === 'iterated-byte-rounds');
const keyedByteRoundsProject = demoProjects.find((project) => project.id === 'keyed-byte-rounds');
const keyedByteIteratorProject = demoProjects.find((project) => project.id === 'keyed-byte-iterator');
const feistelProject = demoProjects.find((project) => project.id === 'feistel-network');
const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
const hexRoundProject = demoProjects.find((project) => project.id === 'hex-round');
const asciiRoundProject = demoProjects.find((project) => project.id === 'ascii-round');
const keystreamProject = demoProjects.find((project) => project.id === 'keystream');
const gatedKeystreamProject = demoProjects.find((project) => project.id === 'gated-keystream');
const sequentialProject = demoProjects.find((project) => project.id === 'sequential');
const toyCompressionHashProject = demoProjects.find((project) => project.id === 'toy-compression-hash');

if (!bridgeProject) {
  throw new Error('Expected bridge demo project to seed starter challenges.');
}
if (!baudotProject) {
  throw new Error('Expected baudot-bridge demo project to seed starter challenges.');
}
if (!lorenzProject) {
  throw new Error('Expected lorenz-foundation demo project to seed starter challenges.');
}
if (!gatedLorenzProject) {
  throw new Error('Expected gated-lorenz demo project to seed starter challenges.');
}
if (!pairedLorenzProject) {
  throw new Error('Expected paired-lorenz demo project to seed starter challenges.');
}
if (!bankedLorenzProject) {
  throw new Error('Expected banked-lorenz demo project to seed starter challenges.');
}
if (!iteratedByteRoundsProject) {
  throw new Error('Expected iterated-byte-rounds demo project to seed starter challenges.');
}
if (!keyedByteRoundsProject) {
  throw new Error('Expected keyed-byte-rounds demo project to seed starter challenges.');
}
if (!keyedByteIteratorProject) {
  throw new Error('Expected keyed-byte-iterator demo project to seed starter challenges.');
}
if (!feistelProject) {
  throw new Error('Expected feistel-network demo project to seed starter challenges.');
}
if (!byteRoundProject) {
  throw new Error('Expected byte-round demo project to seed starter challenges.');
}
if (!hexRoundProject) {
  throw new Error('Expected hex-round demo project to seed starter challenges.');
}
if (!asciiRoundProject) {
  throw new Error('Expected ascii-round demo project to seed starter challenges.');
}
if (!keystreamProject) {
  throw new Error('Expected keystream demo project to seed starter challenges.');
}
if (!gatedKeystreamProject) {
  throw new Error('Expected gated-keystream demo project to seed starter challenges.');
}
if (!sequentialProject) {
  throw new Error('Expected sequential demo project to seed starter challenges.');
}
if (!toyCompressionHashProject) {
  throw new Error('Expected toy-compression-hash project to seed starter challenges.');
}

const fixedBridgeTarget = cloneProject(bridgeProject.project);
const brokenBridgeStart = cloneProject(bridgeProject.project);
const baudotTarget = cloneProject(baudotProject.project);
const brokenBaudotStart = cloneProject(baudotProject.project);
const lorenzTarget = cloneProject(lorenzProject.project);
const brokenLorenzStart = cloneProject(lorenzProject.project);
const gatedLorenzTarget = cloneProject(gatedLorenzProject.project);
const brokenGatedLorenzStart = cloneProject(gatedLorenzProject.project);
const pairedLorenzTarget = cloneProject(pairedLorenzProject.project);
const brokenPairedLorenzStart = cloneProject(pairedLorenzProject.project);
const bankedLorenzTarget = cloneProject(bankedLorenzProject.project);
const brokenBankedLorenzStart = cloneProject(bankedLorenzProject.project);
const iteratedByteRoundsTarget = cloneProject(iteratedByteRoundsProject.project);
const brokenIteratedByteRoundsStart = cloneProject(iteratedByteRoundsProject.project);
const keyedByteRoundsTarget = cloneProject(keyedByteRoundsProject.project);
const brokenKeyedByteRoundsStart = cloneProject(keyedByteRoundsProject.project);
const keyedByteIteratorTarget = cloneProject(keyedByteIteratorProject.project);
const brokenKeyedByteIteratorStart = cloneProject(keyedByteIteratorProject.project);
const feistelTarget = cloneProject(feistelProject.project);
const brokenFeistelStart = cloneProject(feistelProject.project);
const byteRoundTarget = cloneProject(byteRoundProject.project);
const brokenByteRoundStart = cloneProject(byteRoundProject.project);
const hexRoundTarget = cloneProject(hexRoundProject.project);
const brokenHexRoundStart = cloneProject(hexRoundProject.project);
const asciiRoundTarget = cloneProject(asciiRoundProject.project);
const brokenAsciiRoundStart = cloneProject(asciiRoundProject.project);
const keystreamTarget = cloneProject(keystreamProject.project);
const brokenKeystreamStart = cloneProject(keystreamProject.project);
const gatedKeystreamTarget = cloneProject(gatedKeystreamProject.project);
const brokenGatedKeystreamStart = cloneProject(gatedKeystreamProject.project);
const sequentialTarget = cloneProject(sequentialProject.project);
const brokenSequentialStart = cloneProject(sequentialProject.project);
const brokenSequentialTapsStart = cloneProject(sequentialProject.project);
const toyCompressionHashTarget = cloneProject(toyCompressionHashProject.project);
const toyCompressionHashCollisionStart = cloneProject(toyCompressionHashProject.project);

const brokenKeyModule = brokenBridgeStart.modules.find((moduleInstance) => moduleInstance.id === 'key');
if (!brokenKeyModule) {
  throw new Error('Expected bridge demo project to contain a key module.');
}
brokenKeyModule.params.stream = [0, 0, 0, 0, 0];

const brokenBaudotSource = brokenBaudotStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenBaudotSource) {
  throw new Error('Expected baudot-bridge demo project to contain a baudot source.');
}
brokenBaudotSource.params.value = 'BEST';

const brokenLorenzLfsr = brokenLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenLorenzLfsr) {
  throw new Error('Expected lorenz-foundation demo project to contain an LFSR module.');
}
brokenLorenzLfsr.params.seed = [0, 0, 0, 0, 1];

const brokenGatedLorenzGate = brokenGatedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gate',
);
if (!brokenGatedLorenzGate) {
  throw new Error('Expected gated-lorenz demo project to contain a gate LFSR module.');
}
brokenGatedLorenzGate.params.seed = [0, 1, 0, 1, 0];

const brokenPairedLorenzWheelB = brokenPairedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'wheel-b',
);
if (!brokenPairedLorenzWheelB) {
  throw new Error('Expected paired-lorenz demo project to contain wheel-b.');
}
brokenPairedLorenzWheelB.params.seed = [0, 0, 1, 1, 0];

const brokenBankedLorenzControlB = brokenBankedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'control-b',
);
if (!brokenBankedLorenzControlB) {
  throw new Error('Expected banked-lorenz demo project to contain control-b.');
}
brokenBankedLorenzControlB.params.seed = [0, 1, 1, 0, 0];

brokenIteratedByteRoundsStart.connections = brokenIteratedByteRoundsStart.connections.filter(
  (connection) =>
    !(
      (
        connection.from.moduleId === 'round-1' &&
        connection.to.moduleId === 'round-2' &&
        connection.from.port === 'out' &&
        connection.to.port === 'in'
      ) ||
      (
        connection.from.moduleId === 'round-2' &&
        connection.to.moduleId === 'encode' &&
        connection.from.port === 'out' &&
        connection.to.port === 'in'
      )
    ),
);
brokenIteratedByteRoundsStart.connections.push({
  from: { moduleId: 'source', port: 'out' },
  to: { moduleId: 'round-2', port: 'in' },
});
brokenIteratedByteRoundsStart.connections.push({
  from: { moduleId: 'round-1', port: 'out' },
  to: { moduleId: 'encode', port: 'in' },
});

const brokenKeyedRoundKey = brokenKeyedByteRoundsStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'key-2',
);
if (!brokenKeyedRoundKey) {
  throw new Error('Expected keyed-byte-rounds demo project to contain key-2.');
}
brokenKeyedRoundKey.params.value = '00';

const brokenKeyBusModule = brokenKeyedByteIteratorStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'keybus',
);
if (!brokenKeyBusModule) {
  throw new Error('Expected keyed-byte-iterator demo project to contain keybus.');
}
brokenKeyBusModule.params.value = '1C00';

const brokenFeistelKeyBus = brokenFeistelStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'keybus',
);
if (!brokenFeistelKeyBus) {
  throw new Error('Expected feistel-network demo project to contain keybus.');
}
brokenFeistelKeyBus.params.value = '10';

const brokenPermutationModule = brokenByteRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'permute',
);
if (!brokenPermutationModule) {
  throw new Error('Expected byte-round demo project to contain a permutation module.');
}
brokenPermutationModule.params.order = '0,1,2,3,4,5,6,7';

const brokenHexSource = brokenHexRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenHexSource) {
  throw new Error('Expected hex-round demo project to contain a hex source.');
}
brokenHexSource.params.value = '3A';

const brokenAsciiSource = brokenAsciiRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenAsciiSource) {
  throw new Error('Expected ascii-round demo project to contain an ASCII source.');
}
brokenAsciiSource.params.value = 'C';

const brokenKeystreamLfsr = brokenKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenKeystreamLfsr) {
  throw new Error('Expected keystream demo project to contain an LFSR module.');
}
brokenKeystreamLfsr.params.seed = [0, 1, 1, 0, 1];

const brokenGateLfsr = brokenGatedKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gate',
);
if (!brokenGateLfsr) {
  throw new Error('Expected gated-keystream demo project to contain a gate LFSR.');
}
brokenGateLfsr.params.seed = [0, 1, 0, 1, 0];

const brokenClockModule = brokenSequentialStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'clock',
);
if (!brokenClockModule) {
  throw new Error('Expected sequential demo project to contain a clock module.');
}
brokenClockModule.params.period = 2;

const brokenTapModule = brokenSequentialTapsStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenTapModule) {
  throw new Error('Expected sequential demo project to contain an LFSR module.');
}
brokenTapModule.params.taps = '1,4';

export const STARTER_CHALLENGES: GuidedChallenge[] = [
  {
    version: 1,
    id: 'find-hash-collision',
    title: 'Find A Hash Collision',
    group: 'Hash Foundations',
    difficulty: 'intermediate',
    prompt:
      'The Toy Compression Hash starts from a seeded 2-byte message. Change at least one of the two message bytes so the final digest stays exactly the same. Success means: different input, same digest.',
    startingProject: toyCompressionHashCollisionStart,
    startingLayout: cloneProject(toyCompressionHashProject.layout),
    targetProject: toyCompressionHashTarget,
    success: {
      kind: 'output-match-target-with-module-difference',
      moduleIds: ['left-source', 'right-source'],
    },
    hints: [
      'You are not trying to preserve the whole intermediate trace. Only the final digest has to match.',
      'At least one of the two HexSource values must change, or the challenge will not count as solved.',
      'A one-byte digest has only 256 possible outputs, so different 2-byte messages must eventually overlap.',
    ],
  },
  {
    version: 1,
    id: 'repair-bridge-key',
    title: 'Repair the Bridge Key',
    group: 'Foundations',
    difficulty: 'beginner',
    prompt:
      'The bridge pipeline was working, but the bit source changed. Adjust the machine until its output matches the reference behavior again.',
    startingProject: brokenBridgeStart,
    startingLayout: cloneProject(bridgeProject.layout),
    targetProject: fixedBridgeTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The problem is on the bit-domain side of the bridge pipeline, not the text input side.',
      'Compare the BitSource stream against the target behavior and follow it through XOR.',
    ],
  },
  {
    version: 1,
    id: 'repair-baudot-source',
    title: 'Repair the Baudot Source',
    group: 'Historical Bridges',
    difficulty: 'beginner',
    prompt:
      'The teleprinter bridge is wired correctly, but the Baudot source text was changed. Restore the source so the decoded telegraph output matches the captured reference machine again.',
    startingProject: brokenBaudotStart,
    startingLayout: cloneProject(baudotProject.layout),
    targetProject: baudotTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The bridge and output modules are already correct in this lab.',
      'Focus on the very first teleprinter text entering the graph.',
      'A one-letter change in the Baudot source changes the decoded result immediately.',
    ],
  },
  {
    version: 1,
    id: 'teleprinter-tweak',
    title: 'The Teleprinter Tweak',
    group: 'Historical Bridges',
    difficulty: 'intermediate',
    prompt:
      'The teleprinter ciphertext and bridge are correct, but the keystream no longer unmasks the message properly. Repair the LFSR seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenLorenzStart,
    startingLayout: cloneProject(lorenzProject.layout),
    targetProject: lorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The source ciphertext is already correct in this lab.',
      'Focus on the LFSR seed feeding the XOR stage.',
      'If the keystream is wrong, the first divergence appears as soon as the wrong 5-bit group is unmixed.',
    ],
  },
  {
    version: 1,
    id: 'repair-wheel-gate',
    title: 'Repair the Wheel Gate',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter ciphertext and data wheel are still correct, but the gate wheel is stepping the 5-bit keystream at the wrong moments. Repair the gate seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenGatedLorenzStart,
    startingLayout: cloneProject(gatedLorenzProject.layout),
    targetProject: gatedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first wheel does not decode the message directly; it controls when the second wheel advances.',
      'Watch the gate output on each tick and compare its rhythm against the target run.',
      'If the gate wheel pauses the data wheel on the wrong codeword, the recovered teleprinter text drifts immediately.',
    ],
  },
  {
    version: 1,
    id: 'repair-wheel-pair',
    title: 'Repair the Wheel Pair',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter bridge and first wheel are still correct, but the second wheel stream is no longer combining into the right keystream. Repair the second wheel seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenPairedLorenzStart,
    startingLayout: cloneProject(pairedLorenzProject.layout),
    targetProject: pairedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both wheels advance on every tick in this lab.',
      'The first XOR stage combines the two wheel streams before the teleprinter text is unmixed.',
      'If wheel B is wrong, the mixed keystream diverges before the decode stage ever sees a valid codeword.',
    ],
  },
  {
    version: 1,
    id: 'repair-control-bank',
    title: 'Repair the Control Bank',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter bridge and data wheel are still correct, but one control wheel is generating the wrong gate rhythm. Repair the second control wheel seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenBankedLorenzStart,
    startingLayout: cloneProject(bankedLorenzProject.layout),
    targetProject: bankedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The two control wheels are mixed first, and only that mixed bit stream clocks the data wheel.',
      'Watch the gate-mix output to see when the data wheel should or should not advance.',
      'A wrong control wheel can leave the data wheel stepping on the wrong codewords even if the data seed itself is correct.',
    ],
  },
  {
    version: 1,
    id: 'restore-round-stack',
    title: 'Restore the Round Stack',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The first reusable byte round still runs, but the second round has been bypassed. Restore the stacked round path so the final hex result matches the captured reference machine again.',
    startingProject: brokenIteratedByteRoundsStart,
    startingLayout: cloneProject(iteratedByteRoundsProject.layout),
    targetProject: iteratedByteRoundsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both Byte Round composites should participate in the final path.',
      'Right now the machine bridges back to hex too early.',
      'Reconnect the output of the first round through the second round before the final bridge.',
    ],
  },
  {
    version: 1,
    id: 'repair-round-key',
    title: 'Repair the Round Key',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The repeated round structure is still wired correctly, but one visible sub-key was changed. Restore the wrong round key so the final byte matches the captured target machine again.',
    startingProject: brokenKeyedByteRoundsStart,
    startingLayout: cloneProject(keyedByteRoundsProject.layout),
    targetProject: keyedByteRoundsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The reusable round structure is already correct in this lab.',
      'Compare the first and second key sources separately.',
      'Only one round key needs to change to restore the target byte.',
    ],
  },
  {
    version: 1,
    id: 'repair-key-bus',
    title: 'Repair the Key Bus',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The keyed iterator is wired correctly, but the visible key bus was changed. Restore the key bus so each internal round receives the right sub-key again.',
    startingProject: brokenKeyedByteIteratorStart,
    startingLayout: cloneProject(keyedByteIteratorProject.layout),
    targetProject: keyedByteIteratorTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The iterator already knows how many rounds it has and how wide each round key should be.',
      'The problem is in the visible key bus entering the iterator, not in the data byte.',
      'Changing the second half of the bus changes only the later round key.',
    ],
  },
  {
    version: 1,
    id: 'restore-feistel-rounds',
    title: 'Repair the Feistel Bus',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The Feistel network still has the right round structure, but the visible key bus no longer feeds the right sub-keys into its half-block swaps. Restore the bus so the final ciphertext matches the captured reference network again.',
    startingProject: brokenFeistelStart,
    startingLayout: cloneProject(feistelProject.layout),
    targetProject: feistelTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The iterator depth is already correct in this lab.',
      'Focus on the visible key source feeding the Feistel iterator.',
      'Each round still swaps halves, but the wrong sub-key changes the recombined output immediately.',
    ],
  },
  {
    version: 1,
    id: 'byte-scrambler',
    title: 'Byte Scrambler',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The byte-round machine still substitutes correctly, but its bit permutation was flattened. Restore the permutation order so the final bit output matches the captured reference round.',
    startingProject: brokenByteRoundStart,
    startingLayout: cloneProject(byteRoundProject.layout),
    targetProject: byteRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The S-Box table is already correct in this lab.',
      'Focus on the permutation stage after substitution.',
      'The target round reverses the bit order after the byte leaves the S-Box.',
    ],
  },
  {
    version: 1,
    id: 'repair-hex-vector',
    title: 'Repair the Hex Vector',
    group: 'Bridge Rounds',
    difficulty: 'beginner',
    prompt:
      'The byte round itself is wired correctly, but the injected hex test vector is wrong. Restore the input value so the final hex output matches the captured reference machine again.',
    startingProject: brokenHexRoundStart,
    startingLayout: cloneProject(hexRoundProject.layout),
    targetProject: hexRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The problem is at the very start of the graph, not in the S-Box or permutation.',
      'HexSource should inject the same byte the reference machine begins with.',
      'Compare the current source value against the expected output pattern.',
    ],
  },
  {
    version: 1,
    id: 'repair-ascii-source',
    title: 'Repair the ASCII Source',
    group: 'Bridge Rounds',
    difficulty: 'beginner',
    prompt:
      'The byte round itself is wired correctly, but the starting ASCII character is wrong. Restore the source text so the final ASCII output matches the captured reference machine again.',
    startingProject: brokenAsciiRoundStart,
    startingLayout: cloneProject(asciiRoundProject.layout),
    targetProject: asciiRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The S-Box and permutation are already correct in this lab.',
      'Focus on the very first byte entering the graph.',
      'A one-character change at the source can change the entire byte result.',
    ],
  },
  {
    version: 1,
    id: 'repair-keystream-seed',
    title: 'Repair the Keystream Seed',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The plaintext bits are still correct, but the pseudo-random mask is drifting. Repair the LFSR seed so the running ciphertext stream matches the captured reference machine again.',
    startingProject: brokenKeystreamStart,
    startingLayout: cloneProject(keystreamProject.layout),
    targetProject: keystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The clock timing is already correct in this machine.',
      'The XOR stage simply mixes the plaintext bits with the current keystream bit.',
      'If the seed is wrong, the output starts diverging as soon as the first shifted bit changes.',
    ],
  },
  {
    version: 1,
    id: 'repair-gate-seed',
    title: 'Repair the Gate Seed',
    group: 'Conditional Clocking',
    difficulty: 'expert',
    prompt:
      'The gated keystream machine still has the right plaintext and data register, but the gate register is pulsing the second LFSR at the wrong moments. Repair the gate seed so the ciphertext rhythm matches the captured reference machine again.',
    startingProject: brokenGatedKeystreamStart,
    startingLayout: cloneProject(gatedKeystreamProject.layout),
    targetProject: gatedKeystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first LFSR is not the mask itself; it controls when the second LFSR advances.',
      'Watch the gate register output bit on each tick and compare it against the target rhythm.',
      'A wrong gate seed can leave the second register frozen on the wrong ticks.',
    ],
  },
  {
    version: 1,
    id: 'restore-sequential-pulse',
    title: 'Restore the Sequential Pulse',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The clocked keystream machine is no longer advancing on every tick. Repair the timing so its running output matches the captured reference stream again.',
    startingProject: brokenSequentialStart,
    startingLayout: cloneProject(sequentialProject.layout),
    targetProject: sequentialTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The LFSR only advances when the clock sends a live pulse.',
      'Compare the Clock settings to the expected rhythm of the output stream.',
      'A period of 2 means the register only shifts every other tick.',
    ],
  },
  {
    version: 1,
    id: 'repair-lfsr-taps',
    title: 'Repair the LFSR Taps',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The clock is pulsing correctly, but the keystream itself is wrong. Fix the feedback taps so the running output stream matches the reference machine again.',
    startingProject: brokenSequentialTapsStart,
    startingLayout: cloneProject(sequentialProject.layout),
    targetProject: sequentialTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The clock timing is already correct in this lab.',
      'The feedback path inside the LFSR determines which new bit gets shifted into the register.',
      'Compare the tap indexes against the expected repeating pattern in the output stream.',
    ],
  },
];
