import { describe, expect, it } from 'vitest';
import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import { demoProjects } from './demo-projects';
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
  const bridgeProject = demoProjects.find((project) => project.id === 'bridge');
  const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
  const sequentialProject = demoProjects.find((project) => project.id === 'sequential');

  if (!bridgeProject) {
    throw new Error('Expected bridge demo project.');
  }
  if (!byteRoundProject) {
    throw new Error('Expected byte-round project.');
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
