import type { GuidedChallenge } from './challenges';
import { demoProjects } from './demo-projects';

function cloneProject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const bridgeProject = demoProjects.find((project) => project.id === 'bridge');
const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
const keystreamProject = demoProjects.find((project) => project.id === 'keystream');
const sequentialProject = demoProjects.find((project) => project.id === 'sequential');

if (!bridgeProject) {
  throw new Error('Expected bridge demo project to seed starter challenges.');
}
if (!byteRoundProject) {
  throw new Error('Expected byte-round demo project to seed starter challenges.');
}
if (!keystreamProject) {
  throw new Error('Expected keystream demo project to seed starter challenges.');
}
if (!sequentialProject) {
  throw new Error('Expected sequential demo project to seed starter challenges.');
}

const fixedBridgeTarget = cloneProject(bridgeProject.project);
const brokenBridgeStart = cloneProject(bridgeProject.project);
const byteRoundTarget = cloneProject(byteRoundProject.project);
const brokenByteRoundStart = cloneProject(byteRoundProject.project);
const keystreamTarget = cloneProject(keystreamProject.project);
const brokenKeystreamStart = cloneProject(keystreamProject.project);
const sequentialTarget = cloneProject(sequentialProject.project);
const brokenSequentialStart = cloneProject(sequentialProject.project);
const brokenSequentialTapsStart = cloneProject(sequentialProject.project);

const brokenKeyModule = brokenBridgeStart.modules.find((moduleInstance) => moduleInstance.id === 'key');
if (!brokenKeyModule) {
  throw new Error('Expected bridge demo project to contain a key module.');
}
brokenKeyModule.params.stream = [0, 0, 0, 0, 0];

const brokenPermutationModule = brokenByteRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'permute',
);
if (!brokenPermutationModule) {
  throw new Error('Expected byte-round demo project to contain a permutation module.');
}
brokenPermutationModule.params.order = '0,1,2,3,4,5,6,7';

const brokenKeystreamLfsr = brokenKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenKeystreamLfsr) {
  throw new Error('Expected keystream demo project to contain an LFSR module.');
}
brokenKeystreamLfsr.params.seed = [0, 1, 1, 0, 1];

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
    id: 'byte-scrambler',
    title: 'Byte Scrambler',
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
    id: 'repair-keystream-seed',
    title: 'Repair the Keystream Seed',
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
    id: 'restore-sequential-pulse',
    title: 'Restore the Sequential Pulse',
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
