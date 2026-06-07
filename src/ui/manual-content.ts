export interface PilotDecision {
  label: string;
  description: string;
  bestFor: string;
  startWith: string;
}

export interface RouteBlock {
  useThisWhen?: string;
  openNext?: string;
  then?: string;
  ifRepairPractice?: string;
}

export interface IntentGateway {
  intent: string;
  destination: string;
  surface: string;
}

export interface DiagnosisBlock {
  likelyCause: string;
  whatToCheck: string;
  whatToDoNext: string;
}

export interface ManualEntry {
  id: string;
  title: string;
  body: string;
  keyPoints?: string[];
  routeBlock?: RouteBlock;
  intents?: IntentGateway[];
  diagnosis?: DiagnosisBlock;
  seeAlso?: string[];
  pilotDecisions?: PilotDecision[];
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
    id: 'start-here',
    title: 'Start Here',
    summary: 'What MCW is, how to orient yourself, and where a new user should begin.',
    entries: [
      {
        id: 'what-mcw-is',
        title: 'What MCW Is',
        body:
          'Modular Cryptography Workbench is a visual systems IDE for building cryptographic machines out of explicit parts. Instead of choosing a finished cipher from a menu, you assemble signal paths from sources, transforms, bridges, sinks, composites, and iterators. MCW is strongest when you treat it as a foundry for executable cryptographic specifications: the point is to see the machine, not to hide it behind a black-box result.',
        indexTerms: ['what is mcw', 'overview', 'about', 'systems ide', 'foundry'],
      },
      {
        id: 'intent-gateways',
        title: 'What Do You Want To Do?',
        body: 'Choose the intent that matches your goal. Each one names a manual destination and a first board or surface to open.',
        intents: [
          {
            intent: 'I want a first tour',
            destination: 'Where To Begin',
            surface: 'Atlas → Start Here → Bridge Pipeline',
          },
          {
            intent: 'I want to build',
            destination: 'Core Workflows',
            surface: 'Build mode on any open board',
          },
          {
            intent: 'I want repair practice',
            destination: 'Where To Go For Repair Challenges',
            surface: 'Challenge mode → flagship lines or AES / ECC family',
          },
          {
            intent: 'I want to learn AES',
            destination: 'Where To Go For AES',
            surface: 'Visible MixColumns → Visible SubBytes → AES Round (Full)',
          },
          {
            intent: 'I want to learn ECC',
            destination: 'Where To Go For ECC',
            surface: 'Visible Point Mechanics → Visible ECDH Key Agreement',
          },
          {
            intent: 'I want to verify or export',
            destination: 'How To Export To Python And Prove Parity',
            surface: 'Import/Export → Python Export → verify_parity.py',
          },
        ],
        indexTerms: [
          'what do you want to do',
          'intent',
          'first tour',
          'i want to build',
          'i want repair practice',
          'i want to learn aes',
          'i want to learn ecc',
          'i want to verify or export',
          'intent gateways',
        ],
      },
      {
        id: 'where-to-begin',
        title: 'Where To Begin',
        body:
          'Start with the **Learning** dock, not with the deepest arithmetic or protocol boards. Open the **Atlas** tab and use its **Start Here** area first. The best first boards are **Bridge Pipeline**, **Modern Toy Round**, **Visible Bridge Family**, **GF(2^8) Multiply**, and **Visible Point Mechanics**. If you want guided instruction, open the matching tutorial in **Guide** mode. If you want to experiment immediately, stay in **Build** mode and keep the **Palette** plus **Inspector** visible while you trace the graph.',
        keyPoints: [
          'Open the **Learning** dock and start in **Atlas**, not in the deepest advanced boards.',
          'Use one of these first boards: **Bridge Pipeline**, **Modern Toy Round**, **Visible Bridge Family**, **GF(2^8) Multiply**, or **Visible Point Mechanics**.',
          'Switch to **Guide** mode if you want the board taught step by step.',
          'Stay in **Build** mode if you want to inspect and edit the machine directly.',
        ],
        routeBlock: {
          useThisWhen: 'You are starting MCW for the first time or want to reset your orientation.',
          openNext: 'The **Atlas** tab in the **Learning** dock.',
          then: 'Open **Bridge Pipeline** or **Modern Toy Round** from **Atlas → Start Here**.',
          ifRepairPractice:
            'Switch to **Challenge** mode on any board with a repair task, or go to **Where To Find The Flagship Labs**.',
        },
        seeAlso: ['atlas-and-learning-surfaces', 'find-flagship-labs'],
        indexTerms: [
          'start',
          'begin',
          'first board',
          'start here',
          'bridge pipeline',
          'modern toy round',
          'visible bridge family',
          'gf2 multiply',
          'visible point mechanics',
        ],
      },
      {
        id: 'atlas-and-learning-surfaces',
        title: 'Atlas, Demos, Tutorials, And Challenges',
        body:
          'Use **Atlas** when you do not yet know which board to open. **Atlas** is the discovery surface in the **Learning** dock: it groups the shipped learning boards by family and explains what each family teaches before you launch one. Use a demo when you want to inspect or edit an honest working machine. Use a tutorial when you want a guided reading path through that machine. Use a challenge when you want a broken machine that must be repaired to match a visible target.',
        keyPoints: [
          'Use **Atlas** when the problem is discovery: you know the topic, but not the right board.',
          'Use a demo when you want a working machine you can inspect or edit.',
          'Use a tutorial when you want the product to guide your reading of that machine.',
          'Use a challenge when you want a broken board that teaches by repair.',
        ],
        indexTerms: [
          'atlas',
          'learning dock',
          'demo atlas',
          'demo',
          'tutorial',
          'challenge',
          'learning surfaces',
          'which board should i open',
        ],
        routeBlock: {
          useThisWhen: 'You know the topic but do not yet know which board to open.',
          openNext: 'The **Atlas** tab in the **Learning** dock.',
          then: 'Use the **Start Here** area in Atlas or browse by family.',
          ifRepairPractice:
            'Look for boards with a **Challenge** badge, or use **Where To Go For Repair Challenges**.',
        },
        seeAlso: ['where-to-begin', 'repair-challenges'],
      },
      {
        id: 'workspace-modes',
        title: 'Build, Guide, And Challenge Modes',
        body:
          '**Build** mode is for direct authoring: add modules, wire connections, tune parameters, and restructure the graph. **Guide** mode attaches the tutorial sequence for the current board. **Challenge** mode opens the repair surface when the current board has a challenge. You can switch modes from the current workspace instead of leaving the board. Use **Build** when you want to edit the machine, **Guide** when you want the product to teach by doing, and **Challenge** when you want a concrete repair task.',
        keyPoints: [
          'Use **Build** to author the graph directly.',
          'Use **Guide** to open the tutorial attached to the current board.',
          'Use **Challenge** to open the repair task attached to the current board.',
          'Switch modes on the same board instead of leaving the workspace to find help elsewhere.',
        ],
        indexTerms: [
          'build mode',
          'guide mode',
          'challenge mode',
          'switch modes',
          'tutorial mode',
          'repair mode',
          'B',
          'G',
          'C',
        ],
      },
      {
        id: 'reading-the-workbench',
        title: 'How To Read The Workbench',
        body:
          'The workbench is a typed signal-flow graph. Modules are the nodes, connections are the wires, and the visible sinks tell you what the machine is emitting. Read from source to sink. Watch for bridges when a signal changes domain, for repeated structures when a round or schedule is being reused, and for explicit state or clock modules when time matters. The fastest way to get oriented on a new board is to read the named sources, follow one path to one sink, then inspect the intermediate modules instead of trying to absorb the entire graph at once.',
        indexTerms: [
          'workspace',
          'graph',
          'read the workbench',
          'read the graph',
          'sources',
          'sinks',
          'bridges',
          'pipeline',
        ],
      },
    ],
  },
  {
    id: 'core-workflows',
    title: 'Core Workflows',
    summary: 'Practical operator guidance for the workflows real users need to complete.',
    entries: [
      {
        id: 'create-composite',
        title: 'How To Create A Composite',
        body:
          'Select the modules you want to capture, then use **Edit > Create Composite** or the **Cmd/Ctrl+G** shortcut. MCW packages the selected subgraph into one reusable machine while keeping the inside visible when you open or inspect it later. Before confirming, make sure the selected cluster already has the boundaries you want: what comes in should already enter through the inputs you intend to expose, and what comes out should already land on the outputs you intend to keep. Create a composite when you have a repeated local machine or when a board has become too noisy to read comfortably at full scale.',
        keyPoints: [
          'Select the cluster you want to capture.',
          'Run **Edit > Create Composite** or press **Cmd/Ctrl+G**.',
          'Check that the selected cluster already has the inputs and outputs you want to expose.',
          'Use the resulting reusable when one local machine is repeated or the board has become too noisy to read.',
        ],
        routeBlock: {
          useThisWhen: 'A cluster is repeated on the canvas, or the board is too noisy to read comfortably.',
          openNext: 'Select the cluster, then **Edit > Create Composite** or **Cmd/Ctrl+G**.',
          then: 'Open or inspect the composite to verify the exposed ports are what you intended.',
          ifRepairPractice:
            'Open **Iterated Byte Rounds** in **Build** mode to see how composites structure a real cipher round.',
        },
        seeAlso: ['create-iterator', 'reusable-library-practical'],
        indexTerms: [
          'create composite',
          'composite from selection',
          'capture selection',
          'cmd+g',
          'ctrl+g',
          'reusable',
        ],
      },
      {
        id: 'create-iterator',
        title: 'How To Create An Iterator From A Round',
        body:
          'Use **Create Iterator** when you already have one explicit round or body and you want repetition to stay visible instead of manually unrolling copies forever. Start from a working round, select the relevant body, then use **Edit > Create Iterator** or **Cmd/Ctrl+Shift+G**. The point is not to hide the round; it is to make the repetition policy explicit. Use an iterator when the graph should say "this machine repeats this body under these rules" rather than forcing you to clone round after round by hand. If you want examples before authoring your own, open **Iterated Byte Rounds** or **Scheduled Byte Iterator**.',
        keyPoints: [
          'Start from one round or body that already works honestly on the canvas.',
          'Select that body and run **Edit > Create Iterator** or **Cmd/Ctrl+Shift+G**.',
          'Use the iterator when repetition should stay explicit instead of being manually unrolled.',
          'Study **Iterated Byte Rounds** or **Scheduled Byte Iterator** first if you want an example before authoring your own.',
        ],
        routeBlock: {
          useThisWhen: 'You have a working round and want explicit, non-manual repetition.',
          openNext: 'Select the body, then **Edit > Create Iterator** or **Cmd/Ctrl+Shift+G**.',
          then: 'Inspect the iterator parameters to verify the repetition policy is what you expected.',
          ifRepairPractice: 'Open **Iterated Byte Rounds** or **Scheduled Byte Iterator** to study a reference model first.',
        },
        seeAlso: ['create-composite', 'create-clocked-iterator'],
        indexTerms: [
          'create iterator',
          'iterator from round',
          'cmd+shift+g',
          'ctrl+shift+g',
          'iterated byte rounds',
          'scheduled byte iterator',
          'repeat a round',
        ],
      },
      {
        id: 'create-clocked-iterator',
        title: 'How To Create A Clocked Iterator',
        body:
          'Use **Create Clocked Iterator** when repetition must advance over ticks instead of all at once in one static evaluation. Start from a body that should progress one step at a time, then use **Edit > Create Clocked Iterator** or **Cmd/Ctrl+Alt+G**. This is the right tool when the machine should visibly step through rounds, symbols, or traversal phases under live tick control. If you want a concrete model first, open **Clocked Byte Round Iterator** or **Clocked Round Traversal** and study how the body, clock, and outputs interact.',
        keyPoints: [
          'Choose a body that should advance one step at a time under tick control.',
          'Run **Edit > Create Clocked Iterator** or press **Cmd/Ctrl+Alt+G**.',
          'Use this when the machine should visibly traverse stages over time rather than evaluate everything at once.',
          'Open **Clocked Byte Round Iterator** or **Clocked Round Traversal** if you want a reference model first.',
        ],
        indexTerms: [
          'create clocked iterator',
          'clocked iterator',
          'cmd+alt+g',
          'ctrl+alt+g',
          'tick iterator',
          'clocked byte round iterator',
          'clocked round traversal',
        ],
        seeAlso: ['create-iterator'],
      },
      {
        id: 'save-workspaces-and-versions',
        title: 'How To Save Workspaces, Library Copies, And Versions',
        body:
          'Use **Project > Open Workspace** when you want a file-backed workspace document. Use **Save** to write back to the current bound file. Use **Save As** when you need a new or replacement file binding. Use **Save To Workspace Library** when you want an in-app copy available inside MCW without replacing the current file-backed document. Use **Save Version** when you want a named checkpoint you can restore later after risky edits. If the question is "I want this exact board back later," save a version first. If the question is "I want this board as a standalone document," use **Save** or **Save As**.',
        keyPoints: [
          'Use **Open Workspace** when you want a file-backed document.',
          'Use **Save** to write back to the current file and **Save As** when you need a new binding.',
          'Use **Save To Workspace Library** when the copy should live inside MCW rather than replace the bound file.',
          'Use **Save Version** before risky edits so you can restore a known checkpoint quickly.',
        ],
        indexTerms: [
          'open workspace',
          'save workspace',
          'save as',
          'save to workspace library',
          'save version',
          'restore version',
          'project menu',
          'workspace file',
        ],
        seeAlso: ['reusable-library-practical'],
      },
      {
        id: 'reusable-library-practical',
        title: 'How To Use The Reusable Library Practically',
        body:
          'Use the **Palette** when you want to browse built-in, workspace, and personal reusables side by side. Save a composite to the workspace library when it belongs to one document or one teaching board. Promote a reusable to the **Personal Library** when you want it to travel beyond the current workspace. Dependency scope matters: if a reusable still depends on workspace-only pieces, fix or promote those dependencies before you expect the reusable to behave like a fully portable personal asset. The goal is to keep reusable machines compact to browse and explicit to inspect.',
        keyPoints: [
          'Browse built-in, workspace, and personal reusables from the **Palette**.',
          'Keep board-specific reusables in the workspace library.',
          'Promote to the **Personal Library** when the reusable should travel beyond the current workspace.',
          'Check dependency scope before you assume a promoted reusable is fully portable.',
        ],
        indexTerms: [
          'reusable library',
          'personal library',
          'workspace library',
          'promote reusable',
          'dependencies',
          'composite library',
        ],
        seeAlso: ['save-workspaces-and-versions'],
      },
      {
        id: 'analyze-inspect-and-replace',
        title: 'How To Inspect, Analyze, And Replace In Place',
        body:
          'Use the **Inspector** when you need live parameters, current values, and module-local actions. Use **Analyze** when you want a structured read of what a selected module is doing or why two branches diverge. Use **Replace with** when the current module sits in the right place but it is the wrong component, because **Replace with** preserves the position while changing the machine part. This is one of the fastest authoring loops in MCW: place from the **Palette**, wire on the canvas, inspect in the **Inspector**, then replace or retune without rebuilding the surrounding graph.',
        keyPoints: [
          'Use the **Inspector** for live parameters, values, and local actions.',
          'Use **Analyze** when you need a structured explanation of behavior or divergence.',
          'Use **Replace with** when the module location is right but the component choice is wrong.',
          'Keep the authoring loop tight: place, wire, inspect, then replace or retune.',
        ],
        indexTerms: [
          'inspector',
          'analyze',
          'replace with',
          'inspect module',
          'trace values',
          'module comparison',
        ],
      },
      {
        id: 'verification-station',
        title: 'How To Use The Verification Station',
        body:
          'Use the **Verification Station** when you want to prove that the current workspace matches a chosen reference behavior for bounded cases. Add explicit inputs and expected outputs, capture a baseline from a known-good machine, or import known vectors when a textbook or standard already gives you reference cases. In ticked workspaces, verify against the bounded behavior you actually care about instead of assuming the live machine is correct just because one snapshot looks right. Verification is for behavioral trust inside MCW; it is separate from Python export parity.',
        keyPoints: [
          'Add explicit cases when you already know the input and expected output pair.',
          'Capture a baseline when you want to preserve the behavior of a known-good machine before edits.',
          'Import known vectors when a standard or classroom reference already provides them.',
          'Treat verification as in-product behavioral trust, not as the same thing as Python export parity.',
        ],
        routeBlock: {
          useThisWhen: 'You want to prove the current machine matches a reference behavior before trusting or exporting it.',
          openNext: 'The **Verification** panel for the current workspace.',
          then: 'Add cases, capture a baseline, or import known vectors from a standard.',
          ifRepairPractice:
            'Use known-vector import to bring NIST FIPS 197 vectors into an AES board verification.',
        },
        seeAlso: ['export-and-parity', 'what-verified-means'],
        indexTerms: [
          'verification station',
          'known vectors',
          'known-answer',
          'compare',
          'baseline',
          'expected output',
          'verification',
        ],
      },
      {
        id: 'export-and-parity',
        title: 'How To Export To Python And Prove Parity',
        body:
          'Use **Import/Export** when the workspace already behaves correctly and you want an artifact outside MCW. **JSON export** preserves the workspace document for later reopening in MCW. **Python export** creates a ZIP bundle containing the exported workspace, the shared runtime, and **verify_parity.py**. The trust story is two-stage: first verify the machine inside MCW with explicit or imported cases, then run **verify_parity.py** so the exported Python proves it still matches the authored machine. If Python is unavailable in the current environment, you should still inspect the bundle and explain what the parity script is meant to prove.',
        keyPoints: [
          'Use **JSON export** when the goal is to reopen the workspace later inside MCW.',
          'Use **Python export** when the goal is to carry the machine out as code.',
          'Verify the machine inside MCW before you trust the exported artifact.',
          'Run **verify_parity.py**, or explain its role if Python is unavailable, so export trust stays explicit.',
        ],
        routeBlock: {
          useThisWhen: 'The workspace already behaves correctly and you want an artifact outside MCW.',
          openNext: '**Import/Export > Python Export**.',
          then: 'Run **verify_parity.py** from the bundle to prove the Python artifact matches the authored machine.',
          ifRepairPractice:
            'Run the parity script against a repaired flagship lab capstone to complete **LAB-1.3** or **LAB-2.4**.',
        },
        seeAlso: ['verification-station', 'what-verified-means'],
        indexTerms: [
          'python export',
          'json export',
          'verify_parity.py',
          'parity',
          'mcw_runtime.py',
          'zip bundle',
          'export to python',
        ],
      },
    ],
  },
  {
    id: 'troubleshoot',
    title: 'Troubleshooting',
    summary: 'Quick diagnosis for the most common first-user friction points.',
    entries: [
      {
        id: 'why-cant-create-composite',
        title: "Why Can't I Create A Composite?",
        body: 'The most common cause is that nothing is selected, or the selection spans a boundary that cannot be packaged.',
        diagnosis: {
          likelyCause:
            'Nothing is selected, or the selected cluster includes only output-only sinks with no interior connections.',
          whatToCheck:
            'Verify at least one module is selected on the canvas. Check that the selection contains at least one wire connecting two selected modules.',
          whatToDoNext:
            'Select a coherent cluster with at least one interior connection, then try **Edit > Create Composite** or **Cmd/Ctrl+G** again.',
        },
        seeAlso: ['create-composite'],
        indexTerms: [
          "why can't i create a composite",
          'create composite not working',
          'composite error',
          'nothing selected',
        ],
      },
      {
        id: 'why-challenge-empty',
        title: 'Why Is Challenge Empty On This Board?',
        body: 'Not all boards have a challenge attached. Challenge mode only activates when a repair task is present for the current board.',
        diagnosis: {
          likelyCause:
            'The current board does not have a challenge, or you opened a demo rather than a board from a challenge-enabled family.',
          whatToCheck:
            'Check whether a **Challenge** badge or indicator appears for the current board in the **Learning** dock. Boards without challenges show nothing in **Challenge** mode.',
          whatToDoNext:
            'Open a board from the flagship lines or the AES and ECC challenge families from **Atlas** — those boards are designed with challenges attached.',
        },
        seeAlso: ['find-flagship-labs', 'repair-challenges'],
        indexTerms: [
          'challenge empty',
          'challenge mode empty',
          'no challenge',
          'why is challenge empty',
        ],
      },
      {
        id: 'why-save-not-writing',
        title: 'Why Is Save Not Writing To A File?',
        body: 'Save writes to a bound file. If no file is bound, MCW opens Save As instead.',
        diagnosis: {
          likelyCause:
            'The workspace is not bound to a file. MCW requires an explicit file binding before Save can write directly.',
          whatToCheck:
            'Look at the workspace title or **Project** menu to see whether a file path appears as the current binding.',
          whatToDoNext:
            'Use **Project > Open Workspace** to open a file-backed document, or use **Save As** to create a new file binding for the current workspace.',
        },
        seeAlso: ['save-workspaces-and-versions'],
        indexTerms: [
          'save not working',
          'save not writing',
          'save as',
          'file binding',
          'why is save not writing',
        ],
      },
      {
        id: 'why-reusable-not-portable',
        title: 'Why Is My Reusable Not Portable?',
        body: 'A reusable saved to the workspace library belongs to that document only. Personal library promotion is required for cross-workspace portability.',
        diagnosis: {
          likelyCause:
            'The reusable was saved to the workspace library, or it still depends on workspace-local pieces that were not promoted along with it.',
          whatToCheck:
            'Open the **Palette** and check whether the reusable appears under **Personal Library** or only under **Workspace Library**.',
          whatToDoNext:
            'Promote the reusable to the **Personal Library** from the **Inspector** or **Palette** context action. Resolve any workspace-local dependencies first, or the promoted reusable will still silently pull from the original workspace scope.',
        },
        seeAlso: ['reusable-library-practical'],
        indexTerms: [
          'reusable not portable',
          'personal library',
          'workspace library',
          'promote reusable',
          'why is my reusable not portable',
        ],
      },
      {
        id: 'why-python-not-matching',
        title: 'Why Does Exported Python Not Match The Board?',
        body: 'The exported Python can only match what the machine was doing at export time. Unverified behavior or partial-parity modules will cause divergence.',
        diagnosis: {
          likelyCause:
            'The workspace had unverified behavior before export, or one or more modules in the export path have partial or missing Python parity.',
          whatToCheck:
            'Use the **Verification Station** to verify the machine against explicit or imported cases before re-exporting. Check whether any modules are flagged as having partial Python support.',
          whatToDoNext:
            'Fix any verification divergences in MCW, then re-export. Run **verify_parity.py** after re-export and inspect the first failing case in the output.',
        },
        seeAlso: ['verification-station', 'export-and-parity'],
        indexTerms: [
          'python not matching',
          'parity mismatch',
          'export mismatch',
          'verify_parity.py failing',
          'why does exported python not match',
        ],
      },
    ],
  },
  {
    id: 'find-learning-content',
    title: 'Find Learning Content',
    summary: 'Named routes into the shipped demos, tutorials, labs, and repair challenges.',
    entries: [
      {
        id: 'find-flagship-labs',
        title: 'Where To Find The Flagship Labs',
        body:
          'MCW currently has two flagship lab lines. The Classical Flagship Lab is **[LAB-1.1] Rotor Return Path**, **[LAB-1.2] Advanced Rotor Stepping**, the linked repairs **[LAB-1.2A] Repair the Rotor Notch** and **[LAB-1.2B] Repair Ring Setting Versus Position**, and the capstone **[LAB-1.3] Prove The Mechanical Cipher**. The Modern Flagship Lab is **[LAB-2.1] Byte S-Box Round**, **[LAB-2.2] Feistel Network**, the linked repairs **[LAB-2.1A] Repair the Permutation**, **[LAB-2.1B] Repair the S-Box Transform**, **[LAB-2.2A] Repair the Feistel Bus**, the analysis stop **[LAB-2.3] The Avalanche Effect**, and the capstone **[LAB-2.4] Prove The Modern Round**. Use **Atlas** or the **Learning** dock titles directly if you want to enter one of those lines from the top.',
        keyPoints: [
          'Use **LAB-1.1** through **LAB-1.3** for the Classical flagship line, with **LAB-1.2A** and **LAB-1.2B** as the linked repairs.',
          'Use **LAB-2.1** through **LAB-2.4** for the Modern flagship line, with **LAB-2.1A**, **LAB-2.1B**, and **LAB-2.2A** as the linked repairs.',
          'Use **Atlas** or the **Learning** dock titles directly when you want to jump into one of these lines from the top.',
        ],
        routeBlock: {
          useThisWhen: 'You want a structured capstone sequence rather than standalone boards.',
          openNext: '**Atlas** or the **Learning** dock to enter the flagship line from the top.',
          then: 'For Classical, begin at **LAB-1.1**. For Modern, begin at **LAB-2.1**.',
          ifRepairPractice:
            'Each flagship line includes dedicated repair stops: **LAB-1.2A** and **LAB-1.2B** for Classical; **LAB-2.1A**, **LAB-2.1B**, and **LAB-2.2A** for Modern.',
        },
        indexTerms: [
          'flagship labs',
          'classical flagship lab',
          'modern flagship lab',
          'lab 1',
          'lab 2',
          'rotor lab',
          'feistel network',
          'avalanche effect',
        ],
        seeAlso: ['aes-route', 'ecc-route', 'repair-challenges'],
      },
      {
        id: 'start-here-boards',
        title: 'Which Boards Are Good First Boards',
        body:
          'Use **Bridge Pipeline** when you want the smallest honest end-to-end signal path. Use **Modern Toy Round** when you want a first visible round machine. Use **Visible Bridge Family** when you want to understand explicit domain changes. Use **GF(2^8) Multiply** when you want the arithmetic doorway into AES-style field work. Use **Visible Point Mechanics** when you want a first ECC board. These are the best named first stops because each one makes one class of machine legible before you branch into denser labs.',
        keyPoints: [
          '**Bridge Pipeline** is the smallest honest end-to-end signal path.',
          '**Modern Toy Round** is the fastest first stop for a visible round machine.',
          '**Visible Bridge Family** is the route for explicit domain conversion.',
          '**GF(2^8) Multiply** is the arithmetic doorway into AES-style field work.',
          '**Visible Point Mechanics** is the first ECC board to open.',
        ],
        indexTerms: [
          'good first board',
          'first boards',
          'bridge pipeline',
          'modern toy round',
          'visible bridge family',
          'gf2 multiply',
          'visible point mechanics',
        ],
      },
      {
        id: 'aes-route',
        title: 'Where To Go For AES',
        body:
          'For the AES building-block route, open **Visible MixColumns**, then **Visible SubBytes**, then **Visible ShiftRows**, then **Visible AddRoundKey**, and then **AES Round (Full)**. That sequence moves from one explicit column or byte transformation to one full round. If you want repair practice instead of pure walkthroughs, use **Repair the MixColumns Coefficient**, **Repair the Affine Constant**, **Repair the Round Key**, **Repair the ShiftRows Rule**, and **Repair the MixColumns Rule**. The shipped AES primitive repair challenges belong here as an AES repair family; they are not Flagship Labs in V1.',
        keyPoints: [
          'Open **Visible MixColumns** first.',
          'Then open **Visible SubBytes**, **Visible ShiftRows**, and **Visible AddRoundKey**.',
          'Use **AES Round (Full)** when you want the entire round assembled as one machine.',
          'Use the AES repair family when you want break-and-repair practice rather than straight walkthroughs.',
        ],
        routeBlock: {
          useThisWhen: 'The learning goal is AES building blocks or round structure.',
          openNext: '**Visible MixColumns** first.',
          then: 'Continue through **Visible SubBytes**, **Visible ShiftRows**, **Visible AddRoundKey**, then **AES Round (Full)**.',
          ifRepairPractice:
            'Use the AES repair family: **Repair the MixColumns Coefficient**, **Repair the Affine Constant**, **Repair the Round Key**.',
        },
        indexTerms: [
          'aes',
          'visible mixcolumns',
          'visible subbytes',
          'visible shiftrows',
          'visible addroundkey',
          'aes round full',
          'repair the mixcolumns coefficient',
          'repair the affine constant',
          'repair the round key',
          'repair the shiftrows rule',
          'repair the mixcolumns rule',
        ],
        seeAlso: ['find-flagship-labs', 'repair-challenges'],
      },
      {
        id: 'ecc-route',
        title: 'Where To Go For ECC',
        body:
          'Start with **Visible Point Mechanics** if you want the smallest honest point board. Then open **Visible ECDH Key Agreement** for the first protocol-shaped path, followed by **secp256k1 ECDH** if you want the same structure at real scale. For consequence-driven learning, open **ECDH Low-Order Point Consequence**, **ECC Public-Key Validation Consequence**, and **Visible Schnorr Signature**. If you want repair practice, the ECC challenge family includes **Repair the Visible Point Mechanics**, **Repair the Visible ECDH**, **Repair The Low-Order ECDH Peer**, **Repair The Visible Schnorr Verification**, **Repair The Schnorr Nonce Reuse**, and **Repair The Schnorr Challenge Binding**.',
        keyPoints: [
          'Start with **Visible Point Mechanics**.',
          'Then open **Visible ECDH Key Agreement** and **secp256k1 ECDH** for the first protocol route.',
          'Use the consequence boards when you want structural failure cases rather than only honest reference paths.',
          'Use the ECC challenge family when you want repair-based ECC practice.',
        ],
        routeBlock: {
          useThisWhen: 'The learning goal is elliptic curve point mechanics or key agreement.',
          openNext: '**Visible Point Mechanics** first.',
          then: 'Continue through **Visible ECDH Key Agreement** and **secp256k1 ECDH** for the protocol route.',
          ifRepairPractice:
            'Use the ECC challenge family: **Repair the Visible Point Mechanics**, **Repair the Visible ECDH**, or the Schnorr challenges.',
        },
        indexTerms: [
          'ecc',
          'ecdh',
          'secp256k1',
          'visible point mechanics',
          'visible ecdh key agreement',
          'secp256k1 ecdh',
          'visible schnorr signature',
          'ecc public-key validation consequence',
          'repair the visible ecdh',
        ],
        seeAlso: ['find-flagship-labs', 'repair-challenges'],
      },
      {
        id: 'repair-challenges',
        title: 'Where To Go For Repair Challenges',
        body:
          'Use the **Challenge** surface when you want the product to teach by break-and-repair instead of by straight exposition. The flagship lines already include rotor and modern-round repairs, but there are also targeted AES and ECC repair families. Use the **AES** route for byte-round and round-consequence repairs, and use the **ECC** route for point, ECDH, and Schnorr repairs. If the question is "I want a broken machine to fix," **Challenge** mode is the right learning surface and **Atlas** or these named route entries should tell you which family to open.',
        keyPoints: [
          'Open **Challenge** mode when the learning goal is repair rather than walkthrough.',
          'Use the flagship lines for rotor and modern-round repair sequences.',
          'Use the **AES** and **ECC** route entries when you want challenge families outside the flagship lines.',
          'If the question is "I want a broken machine to fix," this is the right learning surface.',
        ],
        indexTerms: [
          'repair challenges',
          'challenge family',
          'broken machine',
          'repair practice',
          'aes repairs',
          'ecc repairs',
        ],
        seeAlso: ['find-flagship-labs', 'aes-route', 'ecc-route'],
      },
      {
        id: 'prng-and-randomness-route',
        title: 'Where To Go For PRNG And Randomness Teaching',
        body:
          'Use **Modern Keystream**, **Gated Keystream**, **Majority-Clocked Keystream**, **Filtered Keystream**, **Routed Clock Keystream**, and **LFSR Predictability Lab** when the lesson is visible state evolving into a bitstream. Use **Randomness Lab** when you want to inspect the emitted bitstream statistically inside **Cryptanalysis**. These are teaching surfaces, not security badges: the right reading is to compare visible structure against visible output, not to treat one entropy-looking number as proof that the machine is strong.',
        keyPoints: [
          'Use the keystream and LFSR boards when the lesson is state evolving into a visible bitstream.',
          'Use **Randomness Lab** when you want bounded statistical inspection inside **Cryptanalysis**.',
          'Read these as teaching surfaces, not as security certificates.',
        ],
        indexTerms: [
          'prng',
          'randomness lab',
          'lfsr predictability lab',
          'modern keystream',
          'gated keystream',
          'majority-clocked keystream',
          'filtered keystream',
          'routed clock keystream',
        ],
      },
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    summary: 'Secondary reference material for surfaces, terms, shortcuts, and module families.',
    entries: [
      {
        id: 'workbench-surface-reference',
        title: 'Workbench Surface Reference',
        body:
          'Use the palette to add modules, browse reusables, and launch micro demos. Use the inspector to tune parameters, inspect values, compare selections, and access module-local actions. Use the View menu for framing and saved views. Use the Project menu for workspace-file actions, workspace-library saves, and named versions. Use Import/Export for JSON, lab-pack, and Python artifact flows. Use detached windows when your bottleneck is screen space rather than product capability.',
        indexTerms: [
          'palette',
          'inspector',
          'view menu',
          'project menu',
          'import export',
          'detached windows',
          'workbench surfaces',
        ],
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        body:
          'MCW supports a small set of workbench shortcuts for repeated actions. These are accelerators for visible controls, not hidden commands.',
        keyPoints: [
          'Cmd/Ctrl+S - Save to the current bound workspace file, or open Save As when no file binding exists',
          'Cmd/Ctrl+Shift+S - Save Version',
          'Cmd/Ctrl+Z - Undo',
          'Cmd/Ctrl+Shift+Z - Redo',
          'Cmd/Ctrl+C - Copy Cluster',
          'Cmd/Ctrl+V - Paste Cluster',
          'Cmd/Ctrl+D - Duplicate Cluster',
          'Cmd/Ctrl+G - Create Composite',
          'Cmd/Ctrl+Shift+G - Create Iterator',
          'Cmd/Ctrl+Alt+G - Create Clocked Iterator',
          'Cmd/Ctrl+Alt+C - Create Conditional',
          'Cmd/Ctrl+Alt+M - Create Multi-Conditional',
          'Cmd/Ctrl+Shift+U - Unzip Composite',
          'B - Switch to Build mode',
          'G - Open the Guide or Tutorial surface',
          'A - Open the Analyze or Cryptanalysis surface',
          'C - Open the Challenge surface when the current project has one',
          'Delete or Backspace - Delete Cluster',
          'Enter - Open selected composite instance when Open Instance is available',
          'Arrow keys - Nudge the current selection by one workbench grid step',
          'Shift+Arrow keys - Nudge the current selection by four workbench grid steps',
          'Space - Play or pause tick playback when tick controls are active',
          '[ / ] - Step backward or forward through active tick or trace stepping views',
          '/ - Focus the palette search field',
          'Escape clears transient canvas states before it falls back to normal selection clearing',
        ],
        indexTerms: [
          'keyboard shortcuts',
          'hotkeys',
          'save shortcut',
          'save version shortcut',
          'create composite shortcut',
          'create iterator shortcut',
          'create clocked iterator shortcut',
          'palette search shortcut',
        ],
      },
      {
        id: 'module-family-reference',
        title: 'Module Family Reference',
        body:
          'MCW primitives are most useful when you think in families rather than isolated names. Sources introduce data or control: TextInput, SymbolSequenceInput, KeyInput, BitSource, BitSequenceInput, HexSource, HexSequenceInput, Clock, IV, Nonce, and Salt. Sinks render results: Output, TextOutput, HexOutput, BaudotOutput, and BitOutput. Bridges make domain changes explicit: AsciiSequenceToBits, BitsToAscii, HexToBits, BitsToHex, IntegerToBits, BitsToInteger, and point or field bridges where present. Transforms perform the machine work: XOR, SBox, BitWindow, BitJoin, Permutation, BitSelect, GF2Mul, GF2Inv, ScalarMultiply, PointAdd, ModExp, and many others. Composites, iterators, and conditionals package or govern larger structures without changing the rule that every transformation should stay explicit on the graph.',
        indexTerms: [
          'module families',
          'primitives',
          'TextInput',
          'SymbolSequenceInput',
          'KeyInput',
          'BitSource',
          'BitSequenceInput',
          'HexSource',
          'HexSequenceInput',
          'Clock',
          'Output',
          'TextOutput',
          'HexOutput',
          'BitOutput',
          'AsciiSequenceToBits',
          'BitsToAscii',
          'HexToBits',
          'BitsToHex',
          'IntegerToBits',
          'BitsToInteger',
          'XOR',
          'SBox',
          'BitWindow',
          'BitJoin',
          'Permutation',
          'BitSelect',
          'GF2Mul',
          'GF2Inv',
          'ScalarMultiply',
          'PointAdd',
          'ModExp',
        ],
      },
      {
        id: 'transformation-views',
        title: 'Transformation Views And Reading A Module',
        body:
          'Use module-local views when you want to read one transformation honestly instead of trusting its name. Permutation, Bit Select, Bit Expand, and Bit Shifter views show routing structure. XOR and related gate views show how disagreement, control, or majority logic produces one result bit at a time. Split, join, pad, and arithmetic views show how a block boundary or numerical interpretation changes the signal. The general rule is simple: if a module name feels like a black box, open Analyze or the module-local representation and read the visible mapping.',
        indexTerms: [
          'permutation view',
          'bit select',
          'bit expand',
          'bit shifter',
          'xor view',
          'gate view',
          'analyze module',
          'module representation',
        ],
      },
      {
        id: 'detached-windows-and-layouts',
        title: 'Detached Windows, Tabs, And Split Views',
        body:
          'Detach panes when your screen layout is slowing you down. Use tabs when you want several related surfaces in one detached window but only one visible at a time. Use combined view when you want a vertical stack. Use split view when two panes need to stay visible together, especially palette plus inspector or learning plus inspector. The detached system is a layout tool, not a second project state: the main app still owns the live workspace while the detached surfaces give you more room to work.',
        indexTerms: [
          'detach',
          'windows',
          'tabs',
          'combined view',
          'split view',
          'second monitor',
          'layout',
        ],
      },
      {
        id: 'what-verified-means',
        title: 'What Verified Means',
        body:
          'In MCW, verified means the current workspace matches a chosen reference behavior for the bounded cases you checked. That reference may come from a captured baseline, an imported known vector, or the exported parity workflow. A passing result is strong evidence that the machine matches the tested behavior; it is not a claim that the construction is secure, certified, or formally proven correct under all conditions. The trust story is behavioral and explicit: choose or import a reference, run the cases, inspect any divergence, and if needed replay the same cases against the exported Python.',
        indexTerms: [
          'verified',
          'what verified means',
          'trust',
          'reference behavior',
          'security claims',
          'parity',
          'known vectors',
        ],
      },
    ],
  },
];
