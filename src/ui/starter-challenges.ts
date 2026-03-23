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
const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
const hexRoundProject = demoProjects.find((project) => project.id === 'hex-round');
const asciiRoundProject = demoProjects.find((project) => project.id === 'ascii-round');
const keystreamProject = demoProjects.find((project) => project.id === 'keystream');
const gatedKeystreamProject = demoProjects.find((project) => project.id === 'gated-keystream');
const sequentialProject = demoProjects.find((project) => project.id === 'sequential');

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
