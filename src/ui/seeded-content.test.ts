import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../engine/executor';
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
});
