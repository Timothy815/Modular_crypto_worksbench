import type { ManualSection } from './manual-content';

export const INSTRUCTOR_PILOT_SECTIONS: ManualSection[] = [
  {
    id: 'pilot-overview',
    title: 'Pilot Overview',
    summary: 'What MCW is best at, and how to frame a first classroom pilot.',
    entries: [
      {
        id: 'what-makes-mcw-special',
        title: 'What Makes MCW Different',
        body:
          'MCW is strongest when students are not just reading about ciphers but operating visible machines. The product’s real differentiator is not the primitive count. It is the combination of explicit graph authoring, traceable state, guided repair, bounded verification, and export parity in one place. The question for a pilot is not “Can students click a demo?” It is “Can they explain why a machine behaved the way it did, repair a mistake, and prove that the machine matches a reference?”',
        indexTerms: ['distinctive value', 'why mcw', 'what makes mcw special', 'glass box'],
      },
      {
        id: 'choose-a-first-path',
        title: 'Choose A First Pilot Path',
        body:
          'For a first pilot, start with one flagship lab family rather than browsing the whole library. Use the classical line if you want mechanical visibility and historical intuition: begin with [LAB-1.1] and continue into [LAB-1.2]. Use the modern line if you want explicit round structure and analysis: begin with [LAB-2.1] and continue into [LAB-2.2] and [LAB-2.3]. In both cases, the strongest pilot shape is one coherent path, not many disconnected demos.',
        indexTerms: ['first pilot', 'which lab', 'classical lab', 'modern lab', 'lab 1', 'lab 2'],
      },
    ],
  },
  {
    id: 'pilot-formats',
    title: 'Pilot Formats',
    summary: 'How to turn the flagship labs into a realistic one-class or short-sequence trial.',
    entries: [
      {
        id: 'one-class-pilot',
        title: 'One-Class Pilot',
        body:
          'A strong first pilot is one 50- to 75-minute session built around a single flagship path. Suggested format: 10 minutes of orientation with Quick Start and the relevant flagship demo, 20 minutes of guided tutorial work, 15 to 20 minutes of one repair challenge, and 10 minutes of verification or export discussion. If time is tight, treat Python parity as a demonstration rather than a required student action. The main goal is to see whether students can move from “read the graph” to “repair the graph” with confidence.',
        indexTerms: ['one class', '50 minute class', 'pilot session', 'lesson format'],
      },
      {
        id: 'two-step-pilot',
        title: 'Two-Step Pilot',
        body:
          'If you have more than one session, use the first class for the core machine path and repair challenge, then use the second for verification, cryptanalysis, or parity handoff. A good pattern is Classical in session one and Modern in session two, or one family split into mechanics first and trust/analysis second. This lets you see whether the flagship sequences work both as standalone labs and as a small learning arc.',
        indexTerms: ['two sessions', 'short sequence', 'follow-up class', 'lab arc'],
      },
    ],
  },
  {
    id: 'teaching-notes',
    title: 'Teaching Notes',
    summary: 'What students should do, what they should notice, and how to use MCW’s support surfaces.',
    entries: [
      {
        id: 'student-workflow',
        title: 'Recommended Student Workflow',
        body:
          'Keep the student workflow simple and repeatable: open the demo, switch to Guide, follow the tutorial, attempt the linked challenge, then use Compare or Verification to confirm the repair. Encourage students to use Analyze or Trace at the exact “surprising” moment in the lab, such as rotor turnover in the classical line or avalanche growth in the modern line. The teaching payoff comes from explanation plus repair, not from passive browsing.',
        indexTerms: ['student workflow', 'guide mode', 'repair challenge', 'analyze', 'trace'],
      },
      {
        id: 'verification-and-export',
        title: 'Verification And Export In A Pilot',
        body:
          'Use verification as the trust checkpoint, not as an afterthought. Students should see that “PASS” means “matches the chosen reference behavior,” not “secure.” If you include Python export, frame it as a handoff proof: the authored machine should survive export without changing behavior. If local Python setup is uncertain, show the ZIP contents and explain what verify_parity.py is intended to prove instead of turning environment setup into the center of the lesson.',
        indexTerms: ['verification', 'compare', 'parity', 'verify_parity.py', 'python export'],
      },
    ],
  },
  {
    id: 'feedback-and-evidence',
    title: 'Feedback And Evidence',
    summary: 'What to watch for during a pilot, and what feedback matters most afterward.',
    entries: [
      {
        id: 'what-to-watch-for',
        title: 'What To Watch For During Class',
        body:
          'The most useful pilot evidence is behavioral, not just opinion-based. Watch where students hesitate: opening the right surface, interpreting a failure, identifying which parameter matters, or understanding the meaning of verification. Note whether they can describe a machine in cause-and-effect language, whether they use Analyze or Trace when prompted, and whether they can recover from a broken lab without instructor rescue. Those moments reveal where MCW is already strong and where it still needs support.',
        indexTerms: ['observe students', 'pilot evidence', 'what to watch', 'hesitation points'],
      },
      {
        id: 'questions-to-ask',
        title: 'Questions To Ask Afterward',
        body:
          'After a pilot, ask a short focused set of questions: Which part of the machine became clearer because it was visible? Where did the workflow feel confusing? Did verification help or intimidate? Did the flagship lab feel like one sequence or several unrelated tools? Would they use the same lab again with less guidance? Short answers to those questions will be more valuable than generic “did you like it?” feedback.',
        indexTerms: ['post pilot questions', 'student feedback', 'instructor feedback', 'pilot review'],
      },
    ],
  },
];
