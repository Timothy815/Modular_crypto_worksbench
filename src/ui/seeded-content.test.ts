import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../engine/executor';
import { computeAesConsequenceAnalysis } from '../engine/analysis/aes-consequence-analysis';
import { V1_REGISTRY } from '../engine/modules';
import { isStatefulModule, type ModuleRegistry, type Project } from '../engine/types';
import { validateProject } from '../engine/validation';
import { evaluateChallengeAttempt } from './challenges';
import { demoProjects } from './demo-projects';
import { STARTER_CHALLENGES } from './starter-challenges';
import { STARTER_COMPOSITE_LIBRARY } from './starter-composites';
import { STARTER_TUTORIALS } from './starter-tutorials';

const registry: ModuleRegistry = {
  ...V1_REGISTRY,
  ...Object.fromEntries(
    STARTER_COMPOSITE_LIBRARY.map((entry) => [entry.id, entry.definition]),
  ),
};

function hasExplicitTimeBehavior(project: Project, activeRegistry: ModuleRegistry): boolean {
  return project.modules.some((moduleInstance) => {
    const def = activeRegistry[moduleInstance.defId];
    if (!def) {
      return false;
    }

    return def.id === 'Clock' || isStatefulModule(def);
  });
}

function executeSeededProject(project: Project) {
  if (hasExplicitTimeBehavior(project, registry)) {
    const tickCount = deriveTickCount(project, registry) ?? 0;
    return executeTickedProject(project, registry, tickCount);
  }

  return executeProject(project, registry);
}

function getHexOutputMap(project: Project) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return Object.fromEntries(
    project.modules
      .filter((moduleInstance) => moduleInstance.defId === 'HexOutput')
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in) {
          throw new Error(`Missing HexOutput input for ${moduleInstance.id}`);
        }
        return [moduleInstance.id, String(traceEntry.inputs.in.value).toUpperCase()];
      }),
  );
}

function getBitOutputMap(project: Project) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return Object.fromEntries(
    project.modules
      .filter((moduleInstance) => moduleInstance.defId === 'BitOutput')
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in || traceEntry.inputs.in.type !== 'bits') {
          throw new Error(`Missing BitOutput input for ${moduleInstance.id}`);
        }
        return [moduleInstance.id, traceEntry.inputs.in.value.join('')];
      }),
  );
}

function getIntegerOutputMap(project: Project) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return Object.fromEntries(
    project.modules
      .filter((moduleInstance) => moduleInstance.defId === 'IntegerOutput')
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in || traceEntry.inputs.in.type !== 'integer') {
          throw new Error(`Missing IntegerOutput input for ${moduleInstance.id}`);
        }
        return [moduleInstance.id, String(traceEntry.inputs.in.value)];
      }),
  );
}

function getPointOutputMap(project: Project) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return Object.fromEntries(
    project.modules
      .filter((moduleInstance) => moduleInstance.defId === 'PointOutput')
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in || traceEntry.inputs.in.type !== 'ec-point') {
          throw new Error(`Missing PointOutput input for ${moduleInstance.id}`);
        }
        const value = traceEntry.inputs.in.value;
        const formatted =
          value.kind === 'infinity' ? '∞' : `(${String(value.x)},${String(value.y)})`;
        return [moduleInstance.id, formatted];
      }),
  );
}

function getSymbolOutputMap(project: Project) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return Object.fromEntries(
    project.modules
      .filter((moduleInstance) => moduleInstance.defId === 'Output')
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in || traceEntry.inputs.in.type !== 'symbol') {
          throw new Error(`Missing Output input for ${moduleInstance.id}`);
        }
        return [moduleInstance.id, String(traceEntry.inputs.in.value).toUpperCase()];
      }),
  );
}

function getTraceEntry(project: Project, moduleId: string) {
  const result = executeProject(project, registry);
  return result.trace.find((entry) => entry.moduleId === moduleId) ?? null;
}

describe('seeded teaching content', () => {
  it('validates and executes every demo project', () => {
    for (const demo of demoProjects) {
      const validation = validateProject(demo.project, registry);
      expect(validation.ok, `Demo ${demo.id} should validate`).toBe(true);
      expect(() => executeSeededProject(demo.project), `Demo ${demo.id} should execute`).not.toThrow();
    }
  });

  it('keeps every tutorial aligned with a real project and target modules', () => {
    for (const tutorial of STARTER_TUTORIALS) {
      const demo = demoProjects.find((project) => project.id === tutorial.projectId);
      expect(demo, `Tutorial ${tutorial.id} should reference an existing demo`).toBeTruthy();
      if (!demo) {
        continue;
      }

      const moduleIds = new Set(demo.project.modules.map((moduleInstance) => moduleInstance.id));
      for (const step of tutorial.steps) {
        expect(step.title.trim().length, `Tutorial ${tutorial.id} step ${step.id} needs a title`).toBeGreaterThan(0);
        expect(step.body.trim().length, `Tutorial ${tutorial.id} step ${step.id} needs body copy`).toBeGreaterThan(0);
        if (step.focusModuleId) {
          expect(
            moduleIds.has(step.focusModuleId),
            `Tutorial ${tutorial.id} step ${step.id} should focus a real module`,
          ).toBe(true);
        }
        if (step.targetStepIndex !== undefined) {
          expect(
            Number.isInteger(step.targetStepIndex) &&
              step.targetStepIndex >= 0 &&
              step.targetStepIndex < demo.project.modules.length + 50,
            `Tutorial ${tutorial.id} step ${step.id} should point at a plausible trace index`,
          ).toBe(true);
        }
      }
    }
  });

  it('keeps every starter challenge attached to a real demo with valid target and starting projects', () => {
    for (const challenge of STARTER_CHALLENGES) {
      if (challenge.projectId) {
        const demo = demoProjects.find((project) => project.id === challenge.projectId);
        expect(demo, `Challenge ${challenge.id} should reference an existing demo`).toBeTruthy();
      }

      const startingValidation = validateProject(challenge.startingProject, registry);
      expect(startingValidation.ok, `Challenge ${challenge.id} starting project should validate`).toBe(true);

      const targetValidation = validateProject(challenge.targetProject, registry);
      expect(targetValidation.ok, `Challenge ${challenge.id} target project should validate`).toBe(true);

      expect(
        () => executeSeededProject(challenge.startingProject),
        `Challenge ${challenge.id} starting project should execute`,
      ).not.toThrow();
      expect(
        () => executeSeededProject(challenge.targetProject),
        `Challenge ${challenge.id} target project should execute`,
      ).not.toThrow();

      if (challenge.success.kind === 'output-match-target') {
        const targetEvaluation = evaluateChallengeAttempt(challenge, challenge.targetProject, registry);
        expect(
          targetEvaluation.status,
          `Challenge ${challenge.id} target project should satisfy the challenge`,
        ).toBe('success');
      }
    }
  });

  it('keeps the AES full round demo aligned to the FIPS 197 round-1 output', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-round-full');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getHexOutputMap(demo.project)).toEqual({
      'out-0-0': 'A4',
      'out-1-0': '9C',
      'out-2-0': '7F',
      'out-3-0': 'F2',
      'out-0-1': '68',
      'out-1-1': '9F',
      'out-2-1': '35',
      'out-3-1': '2B',
      'out-0-2': '6B',
      'out-1-2': '5B',
      'out-2-2': 'EA',
      'out-3-2': '43',
      'out-0-3': '02',
      'out-1-3': '6A',
      'out-2-3': '50',
      'out-3-3': '49',
    });
  });

  it('keeps the AES round repair challenge broken in exactly the final fourth column', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-aes-round');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    const target = getHexOutputMap(challenge.targetProject);
    const starting = getHexOutputMap(challenge.startingProject);
    const mismatchedOutputs = Object.keys(target).filter((moduleId) => target[moduleId] !== starting[moduleId]);

    expect(mismatchedOutputs.sort()).toEqual(['out-0-3', 'out-1-3', 'out-2-3', 'out-3-3']);
  });

  it('keeps the AES key schedule demo aligned to the FIPS 197 Appendix A.1 Round Key 1 vector', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-aes-key-schedule');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    // FIPS 197 Appendix A.1: key 2B7E1516 28AED2A6 ABF71588 09CF4F3C
    // Round Key 1: A0FAFE17 88542CB1 23A33939 2A6C7605
    expect(getHexOutputMap(demo.project)).toEqual({
      out4: 'A0FAFE17',
      out5: '88542CB1',
      out6: '23A33939',
      out7: '2A6C7605',
    });
  });

  it('keeps the AES key schedule repair challenge broken only at the Rcon byte', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-aes-rcon');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    const target = getHexOutputMap(challenge.targetProject);
    const starting = getHexOutputMap(challenge.startingProject);
    // All four Round Key 1 words should differ (Rcon error propagates through XOR cascade)
    expect(Object.keys(target).filter((id) => target[id] !== starting[id]).sort()).toEqual(
      ['out4', 'out5', 'out6', 'out7'],
    );
  });

  it('keeps the AES row perturbation demo aligned to the named ShiftRows and final-output consequences', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-row-perturbation');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getHexOutputMap(demo.project)).toMatchObject({
      'canonical-shift-out': 'D4BF5D30E0B452AEB84111F11E2798E5',
      'perturbed-shift-out': 'D4275D30E0BF52AEB8B411F11E4198E5',
      'canonical-final-out': 'A49C7FF2689F352B6B5BEA43026A5049',
      'perturbed-final-out': '17B7E76A75893E206FAA1FB6A8A6362F',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'shift-match-out': '0',
      'final-match-out': '0',
    });
  });

  it('keeps the AES row consequence summary aligned to the named first-divergence and byte-count facts', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-row-perturbation');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    const traceEntry = getTraceEntry(demo.project, 'row-consequence-summary');
    expect(traceEntry).toBeTruthy();
    if (!traceEntry) {
      return;
    }

    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'ShiftRows',
      stage1Label: 'Final output',
      ruleChanged: 'Row 1 ShiftRows rotation changed from 1 byte to 0 bytes in the perturbed branch.',
      claimBoundary: 'This is a local routing consequence inside one visible AES round, not a proof of cryptographic quality or failure.',
      canonicalStage0: traceEntry.inputs.canonicalStage0 as never,
      perturbedStage0: traceEntry.inputs.perturbedStage0 as never,
      canonicalStage1: traceEntry.inputs.canonicalStage1 as never,
      perturbedStage1: traceEntry.inputs.perturbedStage1 as never,
    });

    expect(analysis.firstDivergenceLabel).toBe('ShiftRows');
    expect(analysis.stages.map((stage) => stage.changedBytes)).toEqual([4, 16]);
  });

  it('keeps the ShiftRows repair challenge broken until the perturbed branch is restored to the canonical rule', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-shiftrows-rule');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'shift-match-out': '1',
      'final-match-out': '1',
    });
    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'shift-match-out': '0',
      'final-match-out': '0',
    });
  });

  it('keeps the keyed S-box authoring demo aligned to the named valid keyed variant', () => {
    const demo = demoProjects.find((project) => project.id === 'keyed-sbox-authoring');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getSymbolOutputMap(demo.project)).toMatchObject({
      'baseline-a-out': '5',
      'keyed-a-out': 'C',
      'baseline-b-out': 'E',
      'keyed-b-out': 'E',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'match-a-out': '0',
      'match-b-out': '1',
      'valid-out': '1',
    });
  });

  it('keeps the keyed S-box repair challenge invalid until the key-source is restored', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-keyed-sbox');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.targetProject)['valid-out']).toBe('1');
    expect(getBitOutputMap(challenge.startingProject)['valid-out']).toBe('0');
    expect(getSymbolOutputMap(challenge.targetProject)['keyed-a-out']).toBe('5');
    expect(getSymbolOutputMap(challenge.startingProject)['keyed-b-out']).toBe('0');
  });

  it('keeps the AES column perturbation demo aligned to the named post-MixColumns and final-output consequences', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-column-perturbation');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getHexOutputMap(demo.project)).toMatchObject({
      'canonical-postmix-out': '046681E5E0CB199A48F8D37A2806264C',
      'perturbed-postmix-out': 'BB6681E554CB199A09F8D37A0F06264C',
      'canonical-final-out': 'A49C7FF2689F352B6B5BEA43026A5049',
      'perturbed-final-out': '1B9C7FF2DC9F352B2A5BEA43256A5049',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'postmix-match-out': '0',
      'final-match-out': '0',
    });
  });

  it('keeps the AES column consequence summary aligned to the named first-divergence and byte-count facts', () => {
    const demo = demoProjects.find((project) => project.id === 'aes-column-perturbation');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    const traceEntry = getTraceEntry(demo.project, 'column-consequence-summary');
    expect(traceEntry).toBeTruthy();
    if (!traceEntry) {
      return;
    }

    const analysis = computeAesConsequenceAnalysis({
      stage0Label: 'post-MixColumns',
      stage1Label: 'Final output',
      ruleChanged: 'The first MixColumns row changed from 02 03 01 01 to 02 02 01 01 across all four visible column mixers in the perturbed branch.',
      claimBoundary: 'This is one local diffusion-rule consequence inside one visible AES round, not a proof of strength, weakness, or breakability.',
      canonicalStage0: traceEntry.inputs.canonicalStage0 as never,
      perturbedStage0: traceEntry.inputs.perturbedStage0 as never,
      canonicalStage1: traceEntry.inputs.canonicalStage1 as never,
      perturbedStage1: traceEntry.inputs.perturbedStage1 as never,
    });

    expect(analysis.firstDivergenceLabel).toBe('post-MixColumns');
    expect(analysis.stages.map((stage) => stage.changedBytes)).toEqual([4, 4]);
  });

  it('keeps the MixColumns repair challenge broken until the perturbed coefficient is restored to the canonical rule', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-mixcolumns-rule');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'postmix-match-out': '1',
      'final-match-out': '1',
    });
    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'postmix-match-out': '0',
      'final-match-out': '0',
    });
  });

  it('keeps the visible double-and-add demo aligned with the shipped ScalarMultiply result', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-double-and-add');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getBitOutputMap(demo.project)).toMatchObject({
      'bit-lsb-out': '1',
      'bit-mid-out': '0',
      'bit-msb-out': '1',
      'match-out': '1',
    });
  });

  it('keeps the double-and-add repair challenge broken before the branch bit is restored', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-double-and-add-path');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.targetProject)['match-out']).toBe('1');
    expect(getBitOutputMap(challenge.startingProject)['match-out']).toBe('0');
  });

  it('keeps the toy curve point map demo aligned with the selected-point and 3P reference checks', () => {
    const demo = demoProjects.find((project) => project.id === 'toy-curve-point-map');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getBitOutputMap(demo.project)).toMatchObject({
      'selected-match-out': '1',
      'walk3-match-out': '1',
    });
  });

  it('keeps the toy curve point map repair challenge broken before the selected point is restored', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-point-walk');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.targetProject)['selected-match-out']).toBe('1');
    expect(getBitOutputMap(challenge.targetProject)['walk3-match-out']).toBe('1');
    expect(getBitOutputMap(challenge.startingProject)['selected-match-out']).toBe('0');
    expect(getBitOutputMap(challenge.startingProject)['walk3-match-out']).toBe('0');
  });

  it('keeps the Schnorr nonce reuse consequence demo aligned to the named recovered-secret transcript', () => {
    const demo = demoProjects.find((project) => project.id === 'schnorr-nonce-reuse-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getIntegerOutputMap(demo.project)).toMatchObject({
      'base-order-out': '11',
      'private-out': '7',
      'nonce-a-out': '3',
      'nonce-b-out': '5',
      'challenge-a-out': '4',
      'challenge-b-out': '9',
      'response-a-out': '9',
      'response-b-out': '0',
      'delta-s-out': '9',
      'delta-c-out': '6',
      'delta-c-inverse-out': '2',
      'recovered-secret-out': '7',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'reused-r-equals-out': '1',
      'recovered-secret-equals-out': '1',
    });
  });

  it('keeps the Schnorr nonce reuse repair challenge broken until the second lane uses its distinct nonce source', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-schnorr-nonce-reuse');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'reused-r-equals-out': '1',
      'recovered-secret-equals-out': '1',
    });
    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'reused-r-equals-out': '0',
      'recovered-secret-equals-out': '0',
    });
    expect(getIntegerOutputMap(challenge.targetProject)).toMatchObject({
      'challenge-b-out': '2',
      'response-b-out': '8',
      'delta-s-out': '1',
      'delta-c-out': '2',
      'delta-c-inverse-out': '6',
      'recovered-secret-out': '6',
    });
  });

  it('keeps the low-order ECDH consequence demo aligned to the named peer-point collapse facts', () => {
    const demo = demoProjects.find((project) => project.id === 'ecdh-low-order-point-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getIntegerOutputMap(demo.project)).toMatchObject({
      'base-order-out': '11',
      'peer-scalar-out': '2',
      'low-order-order-out': '2',
      'private-a-out': '3',
      'private-aprime-out': '5',
    });
    expect(getPointOutputMap(demo.project)).toMatchObject({
      'honest-peer-public-out': '(8,2)',
      'public-a-out': '(12,2)',
      'honest-shared-a-out': '(14,2)',
      'collapse-shared-a-out': '(16,0)',
      'collapse-shared-aprime-out': '(16,0)',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'collapse-match-out': '1',
    });
  });

  it('keeps the low-order ECDH repair challenge broken until both shared branches are rewired to the honest peer point', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-low-order-ecdh-peer');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getPointOutputMap(challenge.startingProject)).toMatchObject({
      'collapse-shared-a-out': '(16,0)',
      'collapse-shared-aprime-out': '(16,0)',
    });
    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'collapse-match-out': '1',
    });
    expect(getPointOutputMap(challenge.targetProject)).toMatchObject({
      'collapse-shared-a-out': '(14,2)',
      'collapse-shared-aprime-out': '(15,5)',
    });
    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'collapse-match-out': '0',
    });
  });

  it('keeps the ECC public-key validation consequence demo aligned to the named validation and collapse facts', () => {
    const demo = demoProjects.find((project) => project.id === 'ecc-public-key-validation-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getIntegerOutputMap(demo.project)).toMatchObject({
      'peer-scalar-out': '2',
      'order-scalar-out': '11',
      'zero-scalar-out': '0',
      'private-a-out': '3',
      'private-aprime-out': '5',
    });
    expect(getPointOutputMap(demo.project)).toMatchObject({
      'honest-peer-public-out': '(8,2)',
      'infinity-reference-out': '∞',
      'subgroup-check-honest-out': '∞',
      'subgroup-check-low-order-out': '(16,0)',
      'accepted-peer-broken-out': '(16,0)',
      'accepted-peer-honest-out': '(8,2)',
      'honest-shared-a-out': '(14,2)',
      'honest-shared-aprime-out': '(15,5)',
      'collapse-shared-a-out': '(16,0)',
      'collapse-shared-aprime-out': '(16,0)',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'curve-check-honest-out': '1',
      'curve-check-low-order-out': '1',
      'subgroup-check-honest-match-out': '1',
      'subgroup-check-low-order-match-out': '0',
      'honest-shared-match-out': '0',
      'collapse-match-out': '1',
    });
  });

  it('keeps the ECC public-key validation repair challenge broken until both consequence branches are rewired to the honest accepted peer', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-ecc-public-key-validation');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getPointOutputMap(challenge.startingProject)).toMatchObject({
      'accepted-peer-broken-out': '(16,0)',
      'accepted-peer-honest-out': '(8,2)',
      'collapse-shared-a-out': '(16,0)',
      'collapse-shared-aprime-out': '(16,0)',
    });
    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'collapse-match-out': '1',
      'honest-shared-match-out': '0',
    });
    expect(getPointOutputMap(challenge.targetProject)).toMatchObject({
      'collapse-shared-a-out': '(14,2)',
      'collapse-shared-aprime-out': '(15,5)',
    });
    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'collapse-match-out': '0',
      'honest-shared-match-out': '0',
    });
  });

  it('keeps the Schnorr challenge binding consequence demo aligned to the named transcript-binding facts', () => {
    const demo = demoProjects.find((project) => project.id === 'schnorr-challenge-binding-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    expect(getIntegerOutputMap(demo.project)).toMatchObject({
      'base-order-out': '11',
      'private-out': '7',
      'nonce-out': '3',
      'message-sig-out': '3',
      'message-claim-out': '8',
      'signer-challenge-out': '4',
      'response-out': '9',
      'broken-verify-challenge-out': '4',
      'honest-verify-challenge-out': '9',
    });
    expect(getPointOutputMap(demo.project)).toMatchObject({
      'public-out': '(3,6)',
      'commitment-out': '(12,2)',
      'verify-left-out': '(8,15)',
      'broken-verify-right-out': '(8,15)',
      'honest-verify-right-out': '∞',
    });
    expect(getBitOutputMap(demo.project)).toMatchObject({
      'broken-verify-equals-out': '1',
      'honest-verify-equals-out': '0',
    });
  });

  it('keeps the Schnorr challenge binding repair challenge broken until the verifier challenge is rebound to the claimed message', () => {
    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-schnorr-challenge-binding');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    expect(getIntegerOutputMap(challenge.startingProject)).toMatchObject({
      'broken-verify-challenge-out': '4',
    });
    expect(getBitOutputMap(challenge.startingProject)).toMatchObject({
      'broken-verify-equals-out': '1',
      'honest-verify-equals-out': '0',
    });
    expect(getIntegerOutputMap(challenge.targetProject)).toMatchObject({
      'broken-verify-challenge-out': '9',
    });
    expect(getPointOutputMap(challenge.targetProject)).toMatchObject({
      'broken-verify-right-out': '∞',
    });
    expect(getBitOutputMap(challenge.targetProject)).toMatchObject({
      'broken-verify-equals-out': '0',
      'honest-verify-equals-out': '0',
    });
  });

  it('keeps the visible compression hash demo deterministic and the repair challenge broken on the output', () => {
    const demo = demoProjects.find((project) => project.id === 'visible-compression-hash');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    const demoOutputs = getHexOutputMap(demo.project);
    // Board must produce a deterministic digest for inputs A3 and 6F
    expect(demoOutputs.output).toBeTruthy();
    expect(typeof demoOutputs.output).toBe('string');
    expect(demoOutputs.output.length).toBe(2); // 1 byte = 2 hex chars

    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-hash-substitution');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    const target = getHexOutputMap(challenge.targetProject);
    const starting = getHexOutputMap(challenge.startingProject);
    // Target matches the correct demo output
    expect(target.output).toBe(demoOutputs.output);
    // Broken starting project produces a different digest
    expect(starting.output).not.toBe(target.output);
  });

  it('keeps the stream cipher IV reuse demo deterministic and the repair challenge broken', () => {
    const demo = demoProjects.find((project) => project.id === 'stream-cipher-iv-reuse-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    const demoBits = getBitOutputMap(demo.project);
    // LFSR seed=[1,0,0,1,1,0,1,0] taps='0,2' length=8 → keystream 01011001
    expect(demoBits['ks-out']).toBe('01011001');
    // ctA = keystream XOR msgA = 01011001 XOR 01101010 = 00110011
    expect(demoBits['ct-a-out']).toBe('00110011');
    // ctB = keystream XOR msgB = 01011001 XOR 10110101 = 11101100
    expect(demoBits['ct-b-out']).toBe('11101100');
    // XOR of ciphertexts = XOR of messages (keystream cancels) = 11011111
    expect(demoBits['xor-cts-out']).toBe('11011111');
    // Recovered msgB = ctXor XOR msgA = 11011111 XOR 01101010 = 10110101
    expect(demoBits['recover-b-out']).toBe('10110101');
    // Equals confirms full recovery
    expect(demoBits['secret-check-out']).toBe('1');

    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'repair-the-iv-reuse-attack');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    // Target: correct crib → recovery succeeds
    const targetBits = getBitOutputMap(challenge.targetProject);
    expect(targetBits['secret-check-out']).toBe('1');
    expect(targetBits['recover-b-out']).toBe('10110101');

    // Broken start: wrong crib (all zeros) → recovery fails
    const startBits = getBitOutputMap(challenge.startingProject);
    expect(startBits['secret-check-out']).toBe('0');
    expect(startBits['recover-b-out']).not.toBe('10110101');
  });

  it('keeps the CBC padding oracle demo deterministic and the repair challenge broken', () => {
    const demo = demoProjects.find((project) => project.id === 'cbc-padding-oracle-consequence');
    expect(demo).toBeTruthy();
    if (!demo) {
      return;
    }

    const demoBits = getBitOutputMap(demo.project);
    // key=0x5A, C2=0x79 → I = XOR = 0x23 = 00100011
    expect(demoBits['i-out']).toBe('00100011');
    // c1-guess=0x22; oracle-p = I XOR c1-guess = 0x01 = 00000001
    expect(demoBits['oracle-p-out']).toBe('00000001');
    // Oracle says valid padding
    expect(demoBits['oracle-out']).toBe('1');
    // Recovered intermediate = c1-guess XOR 0x01 = 0x23 = 00100011
    expect(demoBits['recover-i-out']).toBe('00100011');
    // Intermediate match confirmed
    expect(demoBits['i-match-out']).toBe('1');
    // Plaintext recovered = I XOR c1-orig = 0x23 XOR 0x3F = 0x1C = 00011100
    expect(demoBits['recover-out']).toBe('00011100');

    const challenge = STARTER_CHALLENGES.find((entry) => entry.id === 'find-the-oracle-c1-guess');
    expect(challenge).toBeTruthy();
    if (!challenge) {
      return;
    }

    // Target: correct c1-guess → oracle valid, intermediate recovered
    const targetBits = getBitOutputMap(challenge.targetProject);
    expect(targetBits['oracle-out']).toBe('1');
    expect(targetBits['i-match-out']).toBe('1');

    // Broken start: c1-guess all zeros → oracle invalid, intermediate mismatch
    const startBits = getBitOutputMap(challenge.startingProject);
    expect(startBits['oracle-out']).toBe('0');
    expect(startBits['i-match-out']).toBe('0');
  });
});
