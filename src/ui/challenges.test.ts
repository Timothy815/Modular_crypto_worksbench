import { describe, expect, it } from 'vitest';
import { executeProject } from '../engine/executor';
import { V1_REGISTRY } from '../engine/modules';
import type { Project } from '../engine/types';
import { demoProjects } from './demo-projects';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { evaluateChallengeAttempt, type GuidedChallenge } from './challenges';
import { compareExecutionResults } from './execution-compare';

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

function formatBitsAsHex(bits: number[]): string {
  let output = '';
  for (let index = 0; index < bits.length; index += 4) {
    output += parseInt(bits.slice(index, index + 4).join(''), 2).toString(16).toUpperCase();
  }
  return output;
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
  const keyedByteRoundsProject = demoProjects.find((project) => project.id === 'keyed-byte-rounds');
  const keyedByteIteratorProject = demoProjects.find((project) => project.id === 'keyed-byte-iterator');
  const feistelProject = demoProjects.find((project) => project.id === 'feistel-network');
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
  const toyCompressionHashProject = demoProjects.find((project) => project.id === 'toy-compression-hash');
  const toySpongeHashProject = demoProjects.find((project) => project.id === 'toy-sponge-hash');

  if (!bridgeProject) {
    throw new Error('Expected bridge demo project.');
  }
  if (!packagedIteratedRoundsProject) {
    throw new Error('Expected packaged-iterated-rounds project.');
  }
  if (!iteratedByteRoundsProject) {
    throw new Error('Expected iterated-byte-rounds project.');
  }
  if (!keyedByteRoundsProject) {
    throw new Error('Expected keyed-byte-rounds project.');
  }
  if (!keyedByteIteratorProject) {
    throw new Error('Expected keyed-byte-iterator project.');
  }
  if (!feistelProject) {
    throw new Error('Expected feistel-network project.');
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
  if (!toyCompressionHashProject) {
    throw new Error('Expected toy-compression-hash project.');
  }
  if (!toySpongeHashProject) {
    throw new Error('Expected toy-sponge-hash project.');
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

  it('returns failure when a collision challenge matches the digest but keeps the original inputs', () => {
    const currentProject = cloneProject(toyCompressionHashProject.project);
    const challenge: GuidedChallenge = {
      id: 'hash-collision-same-input',
      title: 'Hash Collision',
      prompt: 'Find a different input with the same digest.',
      startingProject: cloneProject(toyCompressionHashProject.project),
      targetProject: cloneProject(toyCompressionHashProject.project),
      success: {
        kind: 'output-match-target-with-module-difference',
        moduleIds: ['left-source', 'right-source'],
      },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('matched-target-but-input-not-different');
    expect(result.comparison?.outputsMatch).toBe(true);
  });

  it('returns success when a collision challenge finds a different input with the same digest', () => {
    const currentProject = cloneProject(toyCompressionHashProject.project);
    const targetExecution = executeProject(cloneProject(toyCompressionHashProject.project), compositeRegistry);
    const leftSource = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
    const rightSource = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'right-source');
    if (!leftSource || !rightSource) {
      throw new Error('Expected left and right source modules in toy-compression-hash project.');
    }

    const originalLeft = String(leftSource.params.value);
    const originalRight = String(rightSource.params.value);
    let foundCollision = false;

    for (let left = 0; left < 256 && !foundCollision; left += 1) {
      for (let right = 0; right < 256 && !foundCollision; right += 1) {
        const leftHex = left.toString(16).toUpperCase().padStart(2, '0');
        const rightHex = right.toString(16).toUpperCase().padStart(2, '0');

        if (leftHex === originalLeft && rightHex === originalRight) {
          continue;
        }

        leftSource.params.value = leftHex;
        rightSource.params.value = rightHex;

        const execution = executeProject(currentProject, compositeRegistry);
        if (compareExecutionResults(targetExecution, execution).outputsMatch) {
          foundCollision = true;
        }
      }
    }

    expect(foundCollision).toBe(true);

    const challenge: GuidedChallenge = {
      id: 'hash-collision-success',
      title: 'Hash Collision',
      prompt: 'Find a different input with the same digest.',
      startingProject: cloneProject(toyCompressionHashProject.project),
      targetProject: cloneProject(toyCompressionHashProject.project),
      success: {
        kind: 'output-match-target-with-module-difference',
        moduleIds: ['left-source', 'right-source'],
      },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('success');
    expect(result.reason).toBe('matched-target');
    expect(result.comparison?.outputsMatch).toBe(true);
    expect(result.analysisDivergence).not.toBeNull();
    expect(result.analysisDivergence?.baseline?.moduleId).not.toBe('left-source');
    expect(result.analysisDivergence?.baseline?.moduleId).not.toBe('right-source');
  });

  it('can find a collision for the seeded toy sponge hash target', () => {
    const currentProject = cloneProject(toySpongeHashProject.project);
    const targetExecution = executeProject(cloneProject(toySpongeHashProject.project), compositeRegistry);
    const leftSource = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
    const rightSource = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'right-source');
    if (!leftSource || !rightSource) {
      throw new Error('Expected left and right source modules in toy-sponge-hash project.');
    }

    const originalLeft = String(leftSource.params.value);
    const originalRight = String(rightSource.params.value);
    let foundCollision = false;

    for (let left = 0; left < 256 && !foundCollision; left += 1) {
      for (let right = 0; right < 256 && !foundCollision; right += 1) {
        const leftHex = left.toString(16).toUpperCase().padStart(2, '0');
        const rightHex = right.toString(16).toUpperCase().padStart(2, '0');

        if (leftHex === originalLeft && rightHex === originalRight) {
          continue;
        }

        leftSource.params.value = leftHex;
        rightSource.params.value = rightHex;

        const execution = executeProject(currentProject, compositeRegistry);
        if (compareExecutionResults(targetExecution, execution).outputsMatch) {
          foundCollision = true;
        }
      }
    }

    expect(foundCollision).toBe(true);
  });

  it('compression hash covers the full digest byte when sweeping one message byte', () => {
    const seen = new Set<string>();
    let previousDigest: string | null = null;
    let adjacentSame = 0;

    for (let right = 0; right < 256; right += 1) {
      const project = cloneProject(toyCompressionHashProject.project);
      const leftSource = project.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
      const rightSource = project.modules.find((moduleInstance) => moduleInstance.id === 'right-source');

      if (!leftSource || !rightSource) {
        throw new Error('Expected left and right source modules in toy-compression-hash project.');
      }

      leftSource.params.value = 'AA';
      rightSource.params.value = right.toString(16).toUpperCase().padStart(2, '0');

      const terminalSignal = executeProject(project, compositeRegistry).trace.at(-1)?.inputs.in;
      if (!terminalSignal || terminalSignal.type !== 'symbol') {
        throw new Error('Expected terminal hex output for toy-compression-hash.');
      }

      seen.add(terminalSignal.value);
      if (previousDigest === terminalSignal.value) {
        adjacentSame += 1;
      }
      previousDigest = terminalSignal.value;
    }

    expect(seen.size).toBe(256);
    expect(adjacentSame).toBe(0);
  });

  it('sponge hash uses a broad digest spread instead of collapsing into a tiny repeat set', () => {
    const seen = new Set<string>();
    let previousDigest: string | null = null;
    let adjacentSame = 0;

    for (let right = 0; right < 256; right += 1) {
      const project = cloneProject(toySpongeHashProject.project);
      const leftSource = project.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
      const rightSource = project.modules.find((moduleInstance) => moduleInstance.id === 'right-source');

      if (!leftSource || !rightSource) {
        throw new Error('Expected left and right source modules in toy-sponge-hash project.');
      }

      leftSource.params.value = 'AA';
      rightSource.params.value = right.toString(16).toUpperCase().padStart(2, '0');

      const terminalSignal = executeProject(project, compositeRegistry).trace.at(-1)?.inputs.in;
      if (!terminalSignal) {
        throw new Error('Expected terminal output for toy-sponge-hash.');
      }

      const digestValue =
        terminalSignal.type === 'symbol' ? terminalSignal.value : formatBitsAsHex(terminalSignal.value);

      seen.add(digestValue);
      if (previousDigest === digestValue) {
        adjacentSame += 1;
      }
      previousDigest = digestValue;
    }

    expect(seen.size).toBeGreaterThanOrEqual(128);
    expect(adjacentSame).toBe(0);
  });

  it('sponge hash does not preserve the digest under sampled paired (+k,+k) byte shifts', () => {
    const deltas = [1, 2, 4, 8, 16, 32, 64, 128];

    for (const delta of deltas) {
      let preservedCount = 0;
      let samples = 0;

      for (let left = 0; left < 256; left += 17) {
        for (let right = 0; right < 256; right += 19) {
          const project = cloneProject(toySpongeHashProject.project);
          const shiftedProject = cloneProject(toySpongeHashProject.project);
          const leftSource = project.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
          const rightSource = project.modules.find((moduleInstance) => moduleInstance.id === 'right-source');
          const shiftedLeftSource = shiftedProject.modules.find((moduleInstance) => moduleInstance.id === 'left-source');
          const shiftedRightSource = shiftedProject.modules.find((moduleInstance) => moduleInstance.id === 'right-source');

          if (!leftSource || !rightSource || !shiftedLeftSource || !shiftedRightSource) {
            throw new Error('Expected left and right source modules in toy-sponge-hash project.');
          }

          leftSource.params.value = left.toString(16).toUpperCase().padStart(2, '0');
          rightSource.params.value = right.toString(16).toUpperCase().padStart(2, '0');
          shiftedLeftSource.params.value = ((left + delta) & 0xff).toString(16).toUpperCase().padStart(2, '0');
          shiftedRightSource.params.value = ((right + delta) & 0xff).toString(16).toUpperCase().padStart(2, '0');

          const currentDigest = executeProject(project, compositeRegistry).trace.at(-1)?.inputs.in;
          const shiftedDigest = executeProject(shiftedProject, compositeRegistry).trace.at(-1)?.inputs.in;

          if (!currentDigest || !shiftedDigest || currentDigest.type !== 'symbol' || shiftedDigest.type !== 'symbol') {
            throw new Error('Expected terminal hex output for toy-sponge-hash.');
          }

          samples += 1;
          if (currentDigest.value === shiftedDigest.value) {
            preservedCount += 1;
          }
        }
      }

      expect(preservedCount, `delta ${delta} preserved ${preservedCount}/${samples} sampled sponge digests`).toBe(0);
    }
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

  it('returns failure when a keyed iterated-round machine uses the wrong second round key', () => {
    const currentProject = cloneProject(keyedByteRoundsProject.project);
    const keyModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'key-2');
    if (!keyModule) {
      throw new Error('Expected key-2 module in keyed-byte-rounds project.');
    }
    keyModule.params.value = '00';

    const challenge: GuidedChallenge = {
      id: 'keyed-round-failure',
      title: 'Keyed Round Failure',
      prompt: 'Repair the changed round key.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(keyedByteRoundsProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('key-2');
  });

  it('returns failure when a keyed iterator machine uses the wrong second key slice in its bus', () => {
    const currentProject = cloneProject(keyedByteIteratorProject.project);
    const keyBusModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'keybus');
    if (!keyBusModule) {
      throw new Error('Expected keybus module in keyed-byte-iterator project.');
    }
    keyBusModule.params.value = '1C00';

    const challenge: GuidedChallenge = {
      id: 'key-bus-failure',
      title: 'Key Bus Failure',
      prompt: 'Repair the visible key bus.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(keyedByteIteratorProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('keybus');
  });

  it('returns failure when a feistel iterator uses the wrong visible key bus', () => {
    const currentProject = cloneProject(feistelProject.project);
    const keyBusModule = currentProject.modules.find((moduleInstance) => moduleInstance.id === 'keybus');
    if (!keyBusModule) {
      throw new Error('Expected keybus module in feistel-network project.');
    }
    keyBusModule.params.value = '10';

    const challenge: GuidedChallenge = {
      id: 'feistel-round-failure',
      title: 'Feistel Round Failure',
      prompt: 'Repair the Feistel key bus.',
      startingProject: cloneProject(currentProject),
      targetProject: cloneProject(feistelProject.project),
      success: { kind: 'output-match-target' },
    };

    const result = evaluateChallengeAttempt(challenge, currentProject, compositeRegistry);

    expect(result.status).toBe('failure');
    expect(result.reason).toBe('diverged-from-target');
    expect(result.comparison?.outputsMatch).toBe(false);
    expect(result.comparison?.firstDivergence?.variant?.moduleId).toBe('keybus');
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
