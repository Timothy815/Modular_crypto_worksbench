import type { GuidedChallenge } from './challenges';
import { demoProjects } from './demo-projects';

function cloneProject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const bridgeProject = demoProjects.find((project) => project.id === 'bridge');

if (!bridgeProject) {
  throw new Error('Expected bridge demo project to seed starter challenges.');
}

const fixedBridgeTarget = cloneProject(bridgeProject.project);
const brokenBridgeStart = cloneProject(bridgeProject.project);

const brokenKeyModule = brokenBridgeStart.modules.find((moduleInstance) => moduleInstance.id === 'key');
if (!brokenKeyModule) {
  throw new Error('Expected bridge demo project to contain a key module.');
}
brokenKeyModule.params.stream = [0, 0, 0, 0, 0];

export const STARTER_CHALLENGES: GuidedChallenge[] = [
  {
    version: 1,
    id: 'repair-bridge-key',
    title: 'Repair the Bridge Key',
    prompt:
      'The bridge pipeline was working, but the bit source changed. Adjust the machine until its output matches the reference behavior again.',
    startingProject: brokenBridgeStart,
    startingLayout: cloneProject(bridgeProject.layout),
    targetProject: fixedBridgeTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The failure begins in the bit-domain half of the graph, not the rotor side.',
      'Compare the BitSource stream to the expected challenge behavior.',
    ],
  },
];
