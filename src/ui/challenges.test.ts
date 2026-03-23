import { describe, expect, it } from 'vitest';
import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import { demoProjects } from './demo-projects';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { evaluateChallengeAttempt, type GuidedChallenge } from './challenges';

function cloneProject(project: Project): Project {
  return {
    modules: project.modules.map((moduleInstance) => ({
      ...moduleInstance,
      params: { ...moduleInstance.params },
    })),
    connections: project.connections.map((connection) => ({
      from: { ...connection.from },
      to: { ...connection.to },
    })),
  };
}

describe('evaluateChallengeAttempt', () => {
  const compositeRegistry = {
    ...V1_REGISTRY,
    ...Object.fromEntries(
      STARTER_COMPOSITE_LIBRARY.map((entry) => [entry.id, entry.definition]),
    ),
  };
  const bridgeProject = demoProjects.find((project) => project.id === 'bridge');
  const packagedIteratedRoundsProject = demoProjects.find(
    (project) => project.id === 'packaged-iterated-rounds',
  );
  const iteratedByteRoundsProject = demoProjects.find((project) => project.id === 'iterated-byte-rounds');
  const baudotProject = demoProjects.find((project) => project.id === 'baudot-bridge');
  const lorenzProject = demoProjects.find((project) => project.id === 'lorenz-foundation');
  const gatedLorenzProject = demoProjects.find((project) => project.id === 'gated-lorenz');
  const pairedLorenzProject = demoProjects.find((project) => project.id === 'paired-lorenz');
  const bankedLorenzProject = demoProjects.find((project) => project.id === 'banked-lorenz');
  const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
  const hexRoundProject = demoProjects.find((project) => project.id === 'hex-round');
  const asciiRoundProject = demoProjects.find((project) => project.id === 'ascii-round');
  const keystreamProject = demoProjects.find((project) => project.id === 'keystream');
  const gatedKeystreamProject = demoProjects.find((project) => project.id === 'gated-keystream');
  const sequentialProject = demoProjects.find((project) => project.id === 'sequential');

  if (!bridgeProject) {
    throw new Error('Expected bridge demo project.');
  }
  if (!packagedIteratedRoundsProject) {
    throw new Error('Expected packaged-iterated-rounds project.');
  }
  if (!iteratedByteRoundsProject) {
    throw new Error('Expected iterated-byte-rounds project.');
  }
  if (!baudotProject) {
    throw new Error('Expected baudot-bridge project.');
  }
  if (!lorenzProject) {
    throw new Error('Expected lorenz-foundation project.');
  }
  if (!gatedLorenzProject) {
    throw new Error('Expected gated-lorenz project.');
  }
  if (!pairedLorenzProject) {
    throw new Error('Expected paired-lorenz project.');
  }
  if (!bankedLorenzProject) {
    throw new Error('Expected banked-lorenz project.');
  }
  if (!byteRoundProject) {
    throw new Error('Expected byte-round project.');
  }
  if (!hexRoundProject) {
    throw new Error('Expected hex-round project.');
  }
  if (!asciiRoundProject) {
    throw new Error('Expected ascii-round project.');
  }
  if (!keystreamProject) {
    throw new Error('Expected keystream project.');
  }
  if (!gatedKeystreamProject) {
    throw new Error('Expected gated-keystream project.');
  }
  if (!sequentialProject) {
    throw new Error('Expected sequential project.');
  }

  it('returns success when the current project matches the target behavior', () => {
    const currentProject = cloneProject(bridgeProject.project);
    const challenge: GuidedChallenge = {
      id: 'bridge-match',
      title: 'Bridge Match',
      prompt: 'Make the output match the target.',
      startingProject: cloneProject(bridgeProject.project),
      targetProject: cloneProject(bridgeProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('success');
    expect(result.reason).toBe('matched-target');
    expect(result.comparison?.outputsMatch).toBe(true);
    expect(result.comparison?.firstDivergence).toBeNull();
  });

  it('returns failure when the current project diverges from the target behavior', () => {
    const currentProject = cloneProject(bridgeProject.project);
    const keyModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'key');
    if (!keyModule) {
      throw new Error('Expected key module in bridge project.');
    }
    keyModule.params.stream = [0, 0, 0, 0, 0];

    const challenge: GuidedChallenge = {
      id: 'bridge-failure',
      title: 'Bridge Failure',
      prompt: 'Make the output match the target.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(bridgeProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.reason).toBe('outputs');
  });

  it('returns blocked when the current project is invalid', () => {
    const currentProject = cloneProject(bridgeProject.project);
    currentProject.connections.push({
      from: { moduleId: 'decode', port: 'out' },
      to: { moduleId: 'xor', port: 'a' },
    });

    const challenge: GuidedChallenge = {
      id: 'bridge-invalid',
      title: 'Bridge Invalid',
      prompt: 'Make the output match the target.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(bridgeProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('current-project-invalid');
    expect(result.comparison).toBeNull();
    expect(result.currentIssues.length).toBeGreaterThan(0);
  });

  it('returns blocked when the current project throws during execution', () => {
    const currentProject = cloneProject(bridgeProject.project);
    const textModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'text');
    if (!textModule) {
      throw new Error('Expected text module in bridge project.');
    }
    textModule.params.value = 'AB';

    const challenge: GuidedChallenge = {
      id: 'bridge-runtime-error',
      title: 'Bridge Runtime Error',
      prompt: 'Make the output match the target.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(bridgeProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('current-project-runtime-error');
    expect(result.comparison).toBeNull();
    expect(result.currentRuntimeError).toContain('SymbolToBits');
  });

  it('returns failure when a baudot bridge starts from the wrong source text', () => {
    const currentProject = cloneProject(baudotProject.project);
    const sourceModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'source');
    if (!sourceModule) {
      throw new Error('Expected baudot source module in baudot project.');
    }
    sourceModule.params.value = 'BEST';

    const challenge: GuidedChallenge = {
      id: 'baudot-failure',
      title: 'Baudot Failure',
      prompt: 'Repair the teleprinter source.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(baudotProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('source');
  });

  it('returns failure when a lorenz-style keystream uses the wrong lfsr seed', () => {
    const currentProject = cloneProject(lorenzProject.project);
    const lfsrModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'lfsr');
    if (!lfsrModule) {
      throw new Error('Expected LFSR module in lorenz project.');
    }
    lfsrModule.params.seed = [0, 0, 0, 0, 1];

    const challenge: GuidedChallenge = {
      id: 'lorenz-failure',
      title: 'Lorenz Failure',
      prompt: 'Repair the teleprinter keystream.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(lorenzProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('lfsr');
  });

  it('returns failure when a gated lorenz machine uses the wrong gate seed', () => {
    const currentProject = cloneProject(gatedLorenzProject.project);
    const gateModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'gate');
    if (!gateModule) {
      throw new Error('Expected gate LFSR module in gated-lorenz project.');
    }
    gateModule.params.seed = [0, 1, 0, 1, 0];

    const challenge: GuidedChallenge = {
      id: 'gated-lorenz-failure',
      title: 'Gated Lorenz Failure',
      prompt: 'Repair the teleprinter wheel gate.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(gatedLorenzProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(1);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('data');
  });

  it('returns failure when a paired lorenz machine uses the wrong second wheel seed', () => {
    const currentProject = cloneProject(pairedLorenzProject.project);
    const wheelBModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'wheel-b');
    if (!wheelBModule) {
      throw new Error('Expected wheel-b module in paired-lorenz project.');
    }
    wheelBModule.params.seed = [0, 0, 1, 1, 0];

    const challenge: GuidedChallenge = {
      id: 'paired-lorenz-failure',
      title: 'Paired Lorenz Failure',
      prompt: 'Repair the second teleprinter wheel.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(pairedLorenzProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(0);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('wheel-b');
  });

  it('returns failure when a banked lorenz machine uses the wrong control wheel seed', () => {
    const currentProject = cloneProject(bankedLorenzProject.project);
    const controlBModule = currentProject.modules.find(
      (moduleInstance) => moduleInstance.id === 'control-b',
    );
    if (!controlBModule) {
      throw new Error('Expected control-b module in banked-lorenz project.');
    }
    controlBModule.params.seed = [0, 1, 1, 0, 0];

    const challenge: GuidedChallenge = {
      id: 'banked-lorenz-failure',
      title: 'Banked Lorenz Failure',
      prompt: 'Repair the control wheel bank.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(bankedLorenzProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(1);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('data');
  });

  it('returns failure when a bit-domain round diverges from the target output bits', () => {
    const currentProject = cloneProject(byteRoundProject.project);
    const permutationModule = currentProject.modules.find(
      (moduleInstance) => moduleInstance.id === 'permute',
    );
    if (!permutationModule) {
      throw new Error('Expected permutation module in byte-round project.');
    }
    permutationModule.params.order = '0,1,2,3,4,5,6,7';

    const challenge: GuidedChallenge = {
      id: 'byte-round-failure',
      title: 'Byte Round Failure',
      prompt: 'Repair the byte permutation.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(byteRoundProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.baselineOutput.formatted).toBe('[1, 1, 0, 0, 1, 0, 1, 0]');
    expect(result.comparison?.variantOutput.formatted).toBe('[0, 1, 0, 1, 0, 0, 1, 1]');
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('permute');
  });

  it('returns failure when an iterated round machine bypasses the second composite round', () => {
    const currentProject = cloneProject(iteratedByteRoundsProject.project);
    currentProject.connections = currentProject.connections.filter(
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
    currentProject.connections.push({
      from: { moduleId: 'source', port: 'out' },
      to: { moduleId: 'round-2', port: 'in' },
    });
    currentProject.connections.push({
      from: { moduleId: 'round-1', port: 'out' },
      to: { moduleId: 'encode', port: 'in' },
    });

    const challenge: GuidedChallenge = {
      id: 'iterated-round-failure',
      title: 'Iterated Round Failure',
      prompt: 'Restore the round stack.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(iteratedByteRoundsProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
  });

  it('returns failure when a packaged iterated-round machine starts from the wrong source byte', () => {
    const currentProject = cloneProject(packagedIteratedRoundsProject.project);
    const sourceModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'source');
    if (!sourceModule) {
      throw new Error('Expected source module in packaged-iterated-rounds project.');
    }
    sourceModule.params.value = '3A';

    const challenge: GuidedChallenge = {
      id: 'packaged-iterated-failure',
      title: 'Packaged Iterated Failure',
      prompt: 'Repair the packaged round input.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(packagedIteratedRoundsProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
  });

  it('returns failure when a hex-round machine starts from the wrong input vector', () => {
    const currentProject = cloneProject(hexRoundProject.project);
    const sourceModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'source');
    if (!sourceModule) {
      throw new Error('Expected hex source module in hex-round project.');
    }
    sourceModule.params.value = '3A';

    const challenge: GuidedChallenge = {
      id: 'hex-round-failure',
      title: 'Hex Round Failure',
      prompt: 'Repair the hex input vector.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(hexRoundProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('source');
  });

  it('returns failure when an ascii-round machine starts from the wrong source character', () => {
    const currentProject = cloneProject(asciiRoundProject.project);
    const sourceModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'source');
    if (!sourceModule) {
      throw new Error('Expected ASCII source module in ascii-round project.');
    }
    sourceModule.params.value = 'C';

    const challenge: GuidedChallenge = {
      id: 'ascii-round-failure',
      title: 'ASCII Round Failure',
      prompt: 'Repair the ASCII input.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(asciiRoundProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('source');
  });

  it('returns success when a sequential project matches the target ticked output stream', () => {
    const currentProject = cloneProject(sequentialProject.project);
    const challenge: GuidedChallenge = {
      id: 'sequential-match',
      title: 'Sequential Match',
      prompt: 'Repair the pulse stream.',
      startingProject: cloneProject(sequentialProject.project),
      targetProject: cloneProject(sequentialProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('success');
    expect(result.reason).toBe('matched-target');
    expect(result.comparison?.outputsMatch).toBe(true);
    expect(result.comparison?.baselineOutput.formatted.length).toBeGreaterThan(0);
  });

  it('returns failure when a keystream machine uses the wrong LFSR seed', () => {
    const currentProject = cloneProject(keystreamProject.project);
    const lfsrModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'lfsr');
    if (!lfsrModule) {
      throw new Error('Expected LFSR module in keystream project.');
    }
    lfsrModule.params.seed = [0, 1, 1, 0, 1];

    const challenge: GuidedChallenge = {
      id: 'keystream-failure',
      title: 'Keystream Failure',
      prompt: 'Repair the keystream generator.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(keystreamProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(0);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('lfsr');
  });

  it('returns failure when a gated keystream machine uses the wrong gate seed', () => {
    const currentProject = cloneProject(gatedKeystreamProject.project);
    const gateModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'gate');
    if (!gateModule) {
      throw new Error('Expected gate LFSR module in gated-keystream project.');
    }
    gateModule.params.seed = [0, 1, 0, 1, 0];

    const challenge: GuidedChallenge = {
      id: 'gated-keystream-failure',
      title: 'Gated Keystream Failure',
      prompt: 'Repair the gate register.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(gatedKeystreamProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(1);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('data');
  });

  it('returns failure when a sequential project diverges from the target ticked output stream', () => {
    const currentProject = cloneProject(sequentialProject.project);
    const clockModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'clock');
    if (!clockModule) {
      throw new Error('Expected clock module in sequential project.');
    }
    clockModule.params.period = 2;

    const challenge: GuidedChallenge = {
      id: 'sequential-failure',
      title: 'Sequential Failure',
      prompt: 'Repair the pulse stream.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(sequentialProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, V1_REGISTRY);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.tickIndex).toBe(2);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('lfsr');
    expect(result.comparison?.baselineOutput.formatted).not.toBe(
      result.comparison?.variantOutput.formatted,
    );
  });
});
