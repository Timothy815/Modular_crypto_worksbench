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
});
