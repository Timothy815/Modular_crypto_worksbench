export interface ManualEntry {
  id: string;
  title: string;
  body: string;
  indexTerms: string[];
}

export interface ManualSection {
  id: string;
  title: string;
  summary: string;
  entries: ManualEntry[];
}

export const USER_MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'What MCW is, how to orient yourself, and where to begin.',
    entries: [
      {
        id: 'what-mcw-is',
        title: 'What MCW Is',
        body:
          'Modular Cryptography Workbench is a visual systems IDE for building cryptographic machines out of explicit parts. Instead of choosing a finished cipher from a menu, you assemble signal paths from sources, transforms, bridges, sinks, composites, and iterators. The goal is visibility: the workspace should show how data moves, how state changes, and where control or timing matters. MCW is strongest when you treat it as a foundry for executable cryptographic specifications rather than a black-box calculator.',
        indexTerms: ['what is mcw', 'overview', 'about', 'systems ide', 'foundry'],
      },
      {
        id: 'where-to-begin',
        title: 'Where To Begin',
        body:
          'New users should usually start in the earliest learning demos rather than the advanced arithmetic or protocol stages. Begin with the foundation workspaces, read the pipeline summary at the top of the workbench, and inspect how modules are connected before editing anything. If you want guided help, switch to Guide mode and use the tutorial and challenge surfaces. If you want freeform exploration, stay in Build mode and use the palette plus inspector together. The workbench is designed so you can move between guided learning and direct authoring without leaving the same project surface.',
        indexTerms: ['start', 'begin', 'first project', 'guide mode', 'build mode'],
      },
    ],
  },
  {
    id: 'workbench-basics',
    title: 'Workbench Basics',
    summary: 'How to read, navigate, and edit the workspace.',
    entries: [
      {
        id: 'reading-the-workspace',
        title: 'Reading The Workspace',
        body:
          'The workbench is a typed signal-flow graph. Modules are the nodes, connections are the wires, and the pipeline summary gives a quick read of the current machine. Sources introduce values, operators transform them, bridges change domain explicitly, and sinks render visible output. If a machine is stateful, ticked execution and trace surfaces help you see when state advances. The key habit is to read from left to right or from source to sink, watching where signals are transformed instead of assuming hidden behavior.',
        indexTerms: ['workspace', 'graph', 'pipeline', 'sources', 'sinks', 'bridges'],
      },
      {
        id: 'editing-and-recovery',
        title: 'Editing, Versions, And Recovery',
        body:
          'Use the grouped workbench menus for common actions. View contains zoom and navigation actions. Edit contains authoring operations such as notes, composite creation, layout cleanup, and selection actions. Project contains recovery actions such as undo, redo, and save version. Import/Export contains JSON and Python export. MCW also supports workspace-local undo and redo, named saved versions, and restore workflows. If you are trying something risky, save a version first so you can return to a known checkpoint without rebuilding the graph by hand.',
        indexTerms: ['undo', 'redo', 'save version', 'restore', 'workbench menus', 'project menu'],
      },
    ],
  },
  {
    id: 'core-surfaces',
    title: 'Core Surfaces',
    summary: 'What the palette, inspector, learning, and compare surfaces are for.',
    entries: [
      {
        id: 'palette-and-inspector',
        title: 'Palette And Inspector',
        body:
          'The palette is where you add modules, browse reusable structures, and launch micro demos or library exports. The inspector is where you tune parameters, inspect live trace values, compare selected modules, and work through verification cases. The fastest authoring loop in MCW is often Palette plus Inspector side by side: add a structure from the palette, then immediately inspect or tune it. If you lose track of a module, use the trace and focus tools to jump back to the relevant workspace area instead of manually panning through the full graph.',
        indexTerms: ['palette', 'inspector', 'parameters', 'micro demos', 'library'],
      },
      {
        id: 'sbox-table-editing',
        title: 'Editing S-Box Tables',
        body:
          'The S-Box editor in Configure mode is more than a raw CSV field. You can still edit the table directly, but MCW now also provides a dimension-first Generate block for 4-bit and 8-bit permutation tables, plus the grid view, value-preserving swap controls, and bounded row or column transforms. The selected cell determines the active row and active column, so you can rotate or swap parts of the table without breaking permutation validity. Generate is best for creating an initial visible table quickly; the grid and transforms are best for refining that authored structure without replacing the S-Box with a hidden black box.',
        indexTerms: ['sbox editor', 's-box table', 'generate sbox', 'rotate row', 'swap column', 'substitution table'],
      },
      {
        id: 'learning-and-verification',
        title: 'Learning And Verification',
        body:
          'Guide mode exposes tutorials and challenges that teach by doing, while the compare and verification surfaces help you test whether a machine behaves as expected. The verification station supports explicit input and expected-output cases, baseline-backed comparison, known-vector import, and bounded ticked verification. The goal is not to claim that a construction is secure; the goal is to help you prove that your machine matches reference behavior or matches the baseline you intended. Use tutorials when you want guided practice, and use verification when you want confidence that a machine is behaviorally right.',
        indexTerms: ['tutorials', 'challenges', 'compare', 'verification', 'known vectors'],
      },
      {
        id: 'pollux-fractionation',
        title: 'Pollux Fractionation',
        body:
          'Pollux in MCW is a round-trip historical bridge, not a security claim. PolluxFractionation takes a bit stream and emits one visible symbol per bit using two disjoint symbol sets: one for 0 bits and one for 1 bits. PolluxControlledFractionation adds a second explicit bits input called select, so another visible signal can choose which symbol inside the already-correct zero-set or one-set alphabet gets emitted. In batch mode, that selector stream is consumed across the whole message; in a ticked workspace, the meaningful reading is the collected per-tick ciphertext rather than the non-ticked snapshot. This means the same message can surface as many different ciphertexts while remaining easy to decode, because PolluxInverse reverses the disguise by checking set membership only and recovering one bit per symbol. Both sides must share the same zeroAlphabet and oneAlphabet values, and membership is normalized to uppercase so the agreement is about the sets themselves rather than letter casing. This is useful for teaching sender/receiver representation agreement: Pollux can flatten direct symbol clues, but it does not mix positions or create modern diffusion.',
        indexTerms: [
          'pollux',
          'fractionation',
          'homophonic',
          'disguise',
          'polluxcontrolledfractionation',
          'polluxinverse',
          'selector',
          'round trip',
          'zeroalphabet',
          'onealphabet',
        ],
      },
      {
        id: 'classical-flagship-lab',
        title: 'The Classical Flagship Lab',
        body:
          'MCW’s classical flagship path is a numbered rotor lab sequence, not a museum tour. Start with [LAB-1.1] to read the forward rotor, reflector, and inverse return path as one honest machine. Continue into [LAB-1.2] to inspect ring setting, turnover, and the double-step as visible stepping logic instead of folklore. Then use the linked repair challenges to fix a wrong notch and a wrong ring-setting-versus-position configuration. The capstone is [LAB-1.3], where you capture a verification case, export the machine to Python, and either run verify_parity.py locally or explain the parity handoff if Python is unavailable. The point of the sequence is to prove that a mechanical cipher can be built, debugged, verified, and exported as one coherent glass-box system.',
        indexTerms: [
          'classical flagship lab',
          'rotor lab',
          'enigma lab',
          'double-step',
          'ring setting',
          'return path',
          'verify_parity.py',
        ],
      },
      {
        id: 'modern-flagship-lab',
        title: 'The Modern Flagship Lab',
        body:
          'MCW’s modern flagship path is a numbered Lab 2 sequence built to make modern-round structure visible instead of mystical. Start with [LAB-2.1] to read one explicit byte round as substitution plus permutation. Continue into [LAB-2.2] to see a visible key bus feed a small Feistel network rather than disappearing into hidden round metadata. Then use the linked repair challenges to restore a broken permutation and a broken S-Box table, and use [LAB-2.3] to run an Avalanche experiment in Modern Cryptanalysis so diffusion becomes something you can point to rather than just praise abstractly. The capstone is [LAB-2.4], where you capture a verification case, export the machine to Python, and either run verify_parity.py locally or explain the parity handoff if Python is unavailable. The point of the sequence is to show that modern cipher structure can be built, analyzed, verified, and exported as one coherent glass-box system.',
        indexTerms: [
          'modern flagship lab',
          'lab 2',
          'byte round',
          'feistel',
          'diffusion',
          'avalanche',
          'sbox',
          'verify_parity.py',
        ],
      },
      {
        id: 'visible-prng-labs',
        title: 'Visible PRNG Labs',
        body:
          'MCW’s PRNG-oriented workspaces are teaching laboratories, not security badges. The plain LFSR, gated keystream, majority-clocked keystream, and predictability labs are designed to show how visible state evolves into an output stream, how gating or voting changes that rhythm, and why those changes still do not guarantee cryptographic strength. Read the warning text in each workspace, use Trace to connect register state to the emitted bit, and pay attention to disclosed period limits such as 2^n - 1 for an n-bit LFSR. The important distinction is this: a stream can look noisy while remaining deterministic and structurally weak.',
        indexTerms: ['prng', 'lfsr', 'keystream', 'predictability', 'period', 'not secure'],
      },
      {
        id: 'bitstream-randomness-lab',
        title: 'Bitstream Randomness Lab',
        body:
          'The Randomness mode inside Cryptanalysis is a bounded teaching surface for bitstreams, not a security certificate. It reads a visible bit-domain sink and summarizes checks such as monobit balance, Shannon entropy per bit, run lengths, transition counts, lag-1 dependence, a short-pattern heatmap, and repeated 4-bit or 8-bit windows. The right habit is to read the meaning first: a stream can have high balance entropy and still be weak, and a short sample can be misleading enough that the lab marks it as low-confidence under 64 bits. In ticked workspaces the lab analyzes the collected sink history rather than only the current snapshot, and if a project has several bit outputs you can choose which sink to inspect. The heatmap is there to paint a picture for students: if a few short bit patterns glow brighter than the rest, the stream is telling you it has a rhythm. This is useful for PRNG teaching because it turns “looks noisy” into something measurable without pretending the result proves cryptographic security.',
        indexTerms: ['randomness lab', 'bitstream analysis', 'monobit', 'entropy', 'heatmap', 'runs', 'autocorrelation', 'transition counts', 'repeated windows'],
      },
    ],
  },
  {
    id: 'multi-window',
    title: 'Multi-Window Work',
    summary: 'How detached windows, tabs, combined views, and split views work.',
    entries: [
      {
        id: 'detaching-and-grouping',
        title: 'Detaching And Grouping Panes',
        body:
          'MCW can detach the Palette, Inspector, and Learning surfaces into separate windows. Detached panes can be grouped into tabs, stacked in combined view, or shown side by side in split view. The Windows surface in the header is where you open panes in new windows, move panes between windows, and return them to the main app. This lets you use a second monitor or arrange work around your preferred authoring loop without hiding important context. The detached system remains host-authoritative, so the main app owns the live project state even when panes are displayed elsewhere.',
        indexTerms: ['windows', 'detach', 'group tabs', 'combined view', 'split view'],
      },
      {
        id: 'choosing-a-layout',
        title: 'Choosing A Layout',
        body:
          'Use tabs when you want several related surfaces in one detached place but only need one visible at a time. Use combined view when you want several panes visible in one scrollable vertical stack. Use split view when you want two panes visible side by side on a wide display, especially common pairs such as Palette plus Inspector or Learning plus Inspector. The right choice depends on whether your bottleneck is screen width, scrolling, or rapid switching. When in doubt, split view is usually the fastest way to keep authoring and inspection visible at the same time.',
        indexTerms: ['tabbed windows', 'split view', 'combined view', 'layout', 'second monitor'],
      },
    ],
  },
  {
    id: 'export-and-verification',
    title: 'Export And Verification',
    summary: 'How JSON export, Python export, parity, and manual verification fit together.',
    entries: [
      {
        id: 'json-and-python-export',
        title: 'JSON And Python Export',
        body:
          'Import/Export actions in the workbench let you move workspace documents or generate executable Python artifacts. JSON export preserves the workspace document so it can be reloaded into MCW later. Python export produces a flat ZIP bundle containing the generated workspace file, the shared runtime file, and a parity verification script. The export path is intended to let you carry a machine out of MCW as code while preserving the authored structure rather than collapsing it into a hidden black box.',
        indexTerms: ['json export', 'python export', 'zip bundle', 'mcw_runtime.py'],
      },
      {
        id: 'parity-and-known-vectors',
        title: 'Parity And Known Vectors',
        body:
          'Verification and export trust are separate but related. Known-answer verification inside MCW helps you prove that the machine behaves like a reference case. Export parity then helps you prove that the exported Python behaves like the machine you authored. The generated verify_parity.py script replays active verification cases against the exported workspace in a local Python environment. Known-vector import inside the verification station makes it faster to bring textbook or classroom reference cases into the product without typing them one by one.',
        indexTerms: ['verify_parity.py', 'parity', 'known-answer', 'known vectors', 'reference behavior'],
      },
    ],
  },
];
