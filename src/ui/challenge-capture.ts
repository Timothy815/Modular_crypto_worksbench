export interface ChallengeCaptureDraft {
  title: string;
  id: string;
  prompt: string;
  hints: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
}

export function createChallengeIdCandidate(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createChallengeCaptureDraft(projectId: string, projectName: string): ChallengeCaptureDraft {
  const title = `${projectName} Guided Lab`;

  if (projectId === 'sequential') {
    return {
      title,
      id: createChallengeIdCandidate(title),
      difficulty: 'intermediate',
      prompt: `Repair or complete the ${projectName} machine until its running output stream matches the captured reference behavior.`,
      hints:
        'The clock period controls when the machine advances.\nUse the tick bar and probes to find the first wrong moment.',
    };
  }

  return {
    title,
    id: createChallengeIdCandidate(title),
    difficulty: 'beginner',
    prompt: `Repair or complete the ${projectName} machine until its output matches the captured reference behavior.`,
    hints: '',
  };
}
