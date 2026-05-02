export interface ManualEntry {
  id: string;
  title: string;
  body: string;
  keyPoints?: string[];
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
      {
        id: 'workspace-modes',
        title: 'Workspace Modes',
        body:
          'MCW supports three distinct interaction modes: Build, Guide, and Challenge. Build mode is for freeform construction and experimentation. Guide mode attaches a tutorial sequence to a project, walking you through a dissection or construction path. Challenge mode presents a \"broken\" machine that you must repair to match a specific target output. You can switch between these modes at any time to move from guided instruction back to active authoring.',
        indexTerms: ['build mode', 'guide mode', 'challenge mode', 'tutorials', 'challenges', 'learning'],
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
          'Use the grouped workbench menus for common actions. View contains zoom and navigation actions. Edit contains authoring operations such as notes, composite creation, layout cleanup, and selection actions. Project contains recovery actions such as save current workspace, save version, undo, and redo. Import/Export contains JSON and Python export. MCW also supports workspace-local undo and redo, named saved versions, and restore workflows. Save Current Workspace updates the live workspace record in place. Save Version creates a named checkpoint you can restore later. If you are trying something risky, save a version first so you can return to a known checkpoint without rebuilding the graph by hand.',
        indexTerms: ['undo', 'redo', 'save workspace', 'save current workspace', 'save version', 'restore', 'workbench menus', 'project menu'],
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        body:
          'MCW supports a small set of workbench shortcuts for repeated actions. These are accelerators for visible controls, not hidden commands.',
        keyPoints: [
          'Cmd/Ctrl+S — Save Current Workspace',
          'Cmd/Ctrl+Shift+S — Save Version',
          'Cmd/Ctrl+Z — Undo',
          'Cmd/Ctrl+Shift+Z — Redo',
          'Cmd/Ctrl+C — Copy Cluster',
          'Cmd/Ctrl+V — Paste Cluster',
          'Cmd/Ctrl+D — Duplicate Cluster',
          'Cmd/Ctrl+G — Create Composite',
          'Cmd/Ctrl+Shift+G — Create Iterator',
          'Cmd/Ctrl+Alt+G — Create Clocked Iterator',
          'Cmd/Ctrl+Alt+C — Create Conditional',
          'Cmd/Ctrl+Alt+M — Create Multi-Conditional',
          'Cmd/Ctrl+Shift+U — Unzip Composite',
          'B — Switch to Build mode',
          'G — Open the Guide or Tutorial surface',
          'A — Open the Analyze or Cryptanalysis surface',
          'C — Open the Challenge surface when the current project has one',
          'Delete or Backspace — Delete Cluster',
          'Enter — Open selected composite instance when Open Instance is available',
          'Arrow keys — Nudge the current selection by one workbench grid step',
          'Shift+Arrow keys — Nudge the current selection by four workbench grid steps',
          'Space — Play or pause tick playback when tick controls are active',
          '[ / ] — Step backward or forward through active tick or trace stepping views',
          '/ — Focus the palette search field',
          'In composite, iterator, and conditional authoring dialogs: Enter confirms the primary action and Escape cancels',
          'Escape also clears transient canvas states such as Quick Add, pending repair insertion, and armed wiring before it falls back to normal selection clearing',
          'Shortcuts do not fire while you are typing in parameter editors, rename fields, CSV boxes, or other text inputs',
        ],
        indexTerms: ['keyboard shortcuts', 'hotkeys', 'quick keys', 'save shortcut', 'save version shortcut', 'copy shortcut', 'paste shortcut', 'undo shortcut', 'redo shortcut', 'duplicate shortcut', 'create composite shortcut', 'create iterator shortcut', 'create clocked iterator shortcut', 'create conditional shortcut', 'create multi-conditional shortcut', 'open instance shortcut', 'unzip composite shortcut', 'build shortcut', 'guide shortcut', 'analyze shortcut', 'challenge shortcut', 'dialog enter', 'dialog escape', 'delete shortcut', 'playback shortcut', 'step shortcut', 'palette search shortcut', 'slash shortcut', 'shift arrow shortcut', 'coarse nudge shortcut'],
      },
      {
        id: 'wiring-and-placement',
        title: 'Wiring And Placement',
        body:
          'MCW now supports several fast authoring gestures that reduce repetitive wiring ceremony without hiding structure. You can drag a module from the expanded palette directly onto the canvas to place it where you want, drag from an output port into empty canvas space to open Quick Add already scoped to that signal type, and click an output once to arm a connection before finishing it on a distant input. If you need to swap one module for another without rebuilding the surrounding graph, use Replace with in the inspector. For a few common sources and controls, the canvas card itself also supports small inline parameter edits so you do not have to bounce to the inspector for every short value change. These actions make the workbench faster, but they do not add hidden auto-logic: the resulting graph is still fully visible and still edited by explicit modules and wires.',
        indexTerms: ['wiring', 'placement', 'quick add', 'click to connect', 'replace with', 'inline edit', 'drag from palette'],
      },
    ],
  },
  {
    id: 'primitive-reference',
    title: 'Module Reference: Primitives',
    summary: 'A definitive guide to every primitive transformation in the MCW registry.',
    entries: [
      // --- SOURCES ---
      {
        id: 'TextInput',
        title: 'TextInput',
        body: 'A fundamental source module for entering arbitrary text. It emits a symbol signal containing the string typed into its configuration. Useful for providing plain-text messages or custom alphabets to downstream modules.',
        indexTerms: ['text', 'input', 'source', 'symbol'],
      },
      {
        id: 'SymbolSequenceInput',
        title: 'SymbolSequenceInput',
        body: 'Allows for the entry of a sequence of distinct symbols. Unlike TextInput, which treats the input as a single string, SymbolSequenceInput is optimized for cases where each character is a discrete token in a larger cryptographic process.',
        indexTerms: ['symbol', 'sequence', 'input'],
      },
      {
        id: 'KeyInput',
        title: 'KeyInput',
        body: 'A specialized source for cryptographic keys. It supports various formats and is designed to feed key material into modules like XOR, SBox, or modular arithmetic operators. It often right-pads shorter hex values to match the required key width.',
        indexTerms: ['key', 'input', 'material'],
      },
      {
        id: 'BitSource',
        title: 'BitSource',
        body: 'A manual entry module for bit streams. Users can input 0s and 1s directly to create custom bit patterns for testing or low-level cryptographic constructions.',
        indexTerms: ['bits', 'source', 'manual bits'],
      },
      {
        id: 'ConstantBit',
        title: 'ConstantBit',
        body: 'Emits a single, fixed bit (0 or 1) as a continuous signal. Frequently used as a static control signal or a constant input for logic gates.',
        indexTerms: ['constant', 'bit', 'static'],
      },
      {
        id: 'BitSequenceInput',
        title: 'BitSequenceInput',
        body: 'Enables the entry of a fixed sequence of bits. Useful for defining short, static bit-level constants like padding patterns or small lookup table fragments.',
        indexTerms: ['bits', 'sequence', 'input'],
      },
      {
        id: 'AsciiSource',
        title: 'AsciiSource',
        body: 'A text-based source that explicitly focuses on ASCII-compatible characters. It provides a bridge between human-readable text and the numeric ASCII domain.',
        indexTerms: ['ascii', 'source', 'text'],
      },
      {
        id: 'AsciiSequenceInput',
        title: 'AsciiSequenceInput',
        body: 'Inputs a sequence of ASCII characters, allowing for precise control over the character stream. Useful for testing machines that operate on character-by-character ASCII logic.',
        indexTerms: ['ascii', 'sequence', 'input'],
      },
      {
        id: 'BaudotSource',
        title: 'BaudotSource',
        body: 'A historical source module for the 5-bit Baudot code. It converts text characters into their corresponding 5-bit patterns used in early teleprinter communications.',
        indexTerms: ['baudot', 'source', 'historical', '5-bit'],
      },
      {
        id: 'HexSource',
        title: 'HexSource',
        body: 'Allows entry of hexadecimal values. It validates the input as hex and emits the corresponding numeric or bit-level representation depending on how it is wired.',
        indexTerms: ['hex', 'source', 'hexadecimal'],
      },
      {
        id: 'HexSequenceInput',
        title: 'HexSequenceInput',
        body: 'Input for a sequence of hexadecimal digits. This is the preferred way to enter raw binary data expressed in a compact hex format.',
        indexTerms: ['hex', 'sequence', 'input'],
      },
      {
        id: 'IV',
        title: 'IV (Initialization Vector)',
        body: 'A source module for Initialization Vectors. In MCW, it is a specialized hex source that often includes padding logic to ensure the IV matches the expected block or state size.',
        indexTerms: ['iv', 'initialization vector', 'padding'],
      },
      {
        id: 'Nonce',
        title: 'Nonce',
        body: 'A source for \"Numbers used once.\" Like the IV module, it provides a hex-based entry field for transient values that should ideally change for every execution or tick.',
        indexTerms: ['nonce', 'source', 'transient'],
      },
      {
        id: 'Salt',
        title: 'Salt',
        body: 'A source for cryptographic salt. Used to add entropy or uniqueness to inputs, particularly in hashing or key derivation micro-demos.',
        indexTerms: ['salt', 'source', 'entropy'],
      },
      {
        id: 'Clock',
        title: 'Clock',
        body: 'The heartbeat of stateful execution. It emits periodic pulses that trigger \"tick\" events in downstream modules like LFSRs or Counters, allowing for time-domain simulation.',
        indexTerms: ['clock', 'tick', 'trigger', 'pulse', 'timing'],
      },

      // --- SINKS ---
      {
        id: 'Output',
        title: 'Output',
        body: 'The most basic visualization module. It displays the current value of any signal it is connected to, regardless of type (bits or symbol).',
        indexTerms: ['output', 'sink', 'display'],
      },
      {
        id: 'TextOutput',
        title: 'TextOutput',
        body: 'A sink specifically for symbol signals. It renders the incoming symbols as a continuous string of text, making it ideal for reading decrypted messages.',
        indexTerms: ['text', 'output', 'sink'],
      },
      {
        id: 'HexOutput',
        title: 'HexOutput',
        body: 'Displays incoming signals as hexadecimal strings. Useful for inspecting the raw numeric content of bitstreams or character codes.',
        indexTerms: ['hex', 'output', 'sink'],
      },
      {
        id: 'BaudotOutput',
        title: 'BaudotOutput',
        body: 'A historical sink that interprets 5-bit patterns as Baudot characters. It reverses the encoding of a BaudotSource to display human-readable historical text.',
        indexTerms: ['baudot', 'output', 'sink', 'historical'],
      },
      {
        id: 'BitOutput',
        title: 'BitOutput',
        body: 'A sink for bit signals. It displays the stream of 0s and 1s, often used as the target for randomness analysis or bit-level inspection.',
        indexTerms: ['bits', 'output', 'sink'],
      },

      // --- BRIDGES (Domain Conversion) ---
      {
        id: 'AsciiSequenceToBits',
        title: 'AsciiSequenceToBits',
        body: 'Converts a sequence of ASCII characters into a continuous bit stream. Each character is expanded into its 8-bit representation.',
        indexTerms: ['ascii', 'bits', 'bridge', 'conversion'],
      },
      {
        id: 'AsciiSequenceToTicked',
        title: 'AsciiSequenceToTicked',
        body: 'A time-domain bridge. It takes an ASCII sequence and emits one character at a time on each clock tick, allowing for sequential processing of text.',
        indexTerms: ['ascii', 'ticked', 'sequential', 'time-domain'],
      },
      {
        id: 'AsciiCharToBits',
        title: 'AsciiCharToBits',
        body: 'Converts a single ASCII character (symbol) into its corresponding 8-bit representation. Useful for character-level bit manipulation.',
        indexTerms: ['ascii', 'bits', 'character'],
      },
      {
        id: 'TickedSymbolsToSequence',
        title: 'TickedSymbolsToSequence',
        body: 'Collects individual symbol signals emitted over multiple clock ticks and reassembles them into a single symbol sequence.',
        indexTerms: ['ticked', 'symbols', 'sequence', 'reassembly'],
      },
      {
        id: 'TickedBitsToSequence',
        title: 'TickedBitsToSequence',
        body: 'Collects individual bit signals emitted over multiple clock ticks and reassembles them into a single bit sequence or word.',
        indexTerms: ['ticked', 'bits', 'sequence', 'reassembly'],
      },
      {
        id: 'HexSequenceToBits',
        title: 'HexSequenceToBits',
        body: 'Converts hexadecimal sequences into their underlying bit representations. Each hex digit becomes 4 bits.',
        indexTerms: ['hex', 'bits', 'conversion'],
      },
      {
        id: 'HexDigitToBits',
        title: 'HexDigitToBits',
        body: 'Converts a single hex digit into its 4-bit representation.',
        indexTerms: ['hex', 'bits', 'digit'],
      },
      {
        id: 'SymbolToBits',
        title: 'SymbolToBits',
        body: 'A generic conversion module that maps symbols (like letters) to bit patterns. The mapping is often defined by an alphabet or an explicit code table.',
        indexTerms: ['symbol', 'bits', 'conversion'],
      },
      {
        id: 'BitsToAscii',
        title: 'BitsToAscii',
        body: 'Converts a bit stream back into ASCII text. It groups bits into sets of 8 and interprets them as character codes.',
        indexTerms: ['bits', 'ascii', 'conversion'],
      },
      {
        id: 'BitsToAsciiChar',
        title: 'BitsToAsciiChar',
        body: 'Interprets a single block of bits (usually 8) as a single ASCII character.',
        indexTerms: ['bits', 'ascii', 'character'],
      },
      {
        id: 'BitsToBaudot',
        title: 'BitsToBaudot',
        body: 'Converts 5-bit sequences back into the Baudot symbol set. Part of the historical teleprinter toolset.',
        indexTerms: ['bits', 'baudot', 'historical'],
      },
      {
        id: 'BitsToSymbol',
        title: 'BitsToSymbol',
        body: 'A generic module for mapping bit patterns back to symbols in a given alphabet.',
        indexTerms: ['bits', 'symbol', 'conversion'],
      },
      {
        id: 'BitsToHex',
        title: 'BitsToHex',
        body: 'Converts bit sequences into their hexadecimal string representation.',
        indexTerms: ['bits', 'hex', 'conversion'],
      },
      {
        id: 'BitsToHexDigit',
        title: 'BitsToHexDigit',
        body: 'Converts a 4-bit signal into its corresponding single hex digit.',
        indexTerms: ['bits', 'hex', 'digit'],
      },
      {
        id: 'HexToAscii',
        title: 'HexToAscii',
        body: 'Interprets hexadecimal numeric values as ASCII character codes, bridging the hex and text domains.',
        indexTerms: ['hex', 'ascii', 'conversion'],
      },
      {
        id: 'AsciiToHex',
        title: 'AsciiToHex',
        body: 'Converts ASCII characters into their hexadecimal numeric representations.',
        indexTerms: ['ascii', 'hex', 'conversion'],
      },

      // --- LOGIC & ARITHMETIC ---
      {
        id: 'XOR',
        title: 'XOR',
        body: 'The most essential operation in cryptography. It performs an Exclusive OR on two bit signals of equal length. If inputs differ in length, it operates on the overlapping portion.',
        indexTerms: ['xor', 'bits', 'logic', 'exclusive or'],
      },
      {
        id: 'AND',
        title: 'AND',
        body: 'Performs a logical AND on two bit signals. The result bit is 1 only if both input bits are 1.',
        indexTerms: ['and', 'bits', 'logic'],
      },
      {
        id: 'OR',
        title: 'OR',
        body: 'Performs a logical OR on two bit signals. The result bit is 1 if at least one input bit is 1.',
        indexTerms: ['or', 'bits', 'logic'],
      },
      {
        id: 'NOT',
        title: 'NOT',
        body: 'Inverts a bit signal. 0s become 1s and 1s become 0s.',
        indexTerms: ['not', 'bits', 'logic', 'inversion'],
      },
      {
        id: 'AddMod',
        title: 'AddMod',
        body: 'Performs modular addition: (a + b) mod 2^n, where n is the bit width of the inputs. A building block for many symmetric and asymmetric algorithms.',
        indexTerms: ['addition', 'modulo', 'arithmetic'],
      },
      {
        id: 'SubMod',
        title: 'SubMod',
        body: 'Performs modular subtraction: (a - b) mod 2^n. The inverse of AddMod.',
        indexTerms: ['subtraction', 'modulo', 'arithmetic'],
      },
      {
        id: 'FieldAdd',
        title: 'FieldAdd',
        body: 'Adds two visible integer-domain field elements modulo a prime p. Unlike AddMod, this is not fixed-width word arithmetic over bits. Both inputs must already be in the field range 0..p-1, and the modulus must be prime.',
        indexTerms: ['field add', 'prime field', 'finite field', 'integer arithmetic', 'mod p'],
      },
      {
        id: 'FieldSub',
        title: 'FieldSub',
        body: 'Subtracts one visible integer-domain field element from another modulo a prime p. This is prime-field subtraction, not bit-word wraparound. Both inputs must already be in the field range 0..p-1, and the modulus must be prime.',
        indexTerms: ['field sub', 'prime field', 'finite field', 'integer arithmetic', 'mod p'],
      },
      {
        id: 'FieldMul',
        title: 'FieldMul',
        body: 'Multiplies two visible integer-domain field elements modulo a prime p. This is prime-field multiplication, not fixed-width word multiplication. Both inputs must already be in the field range 0..p-1, and the modulus must be prime.',
        indexTerms: ['field mul', 'prime field', 'finite field', 'integer arithmetic', 'mod p'],
      },
      {
        id: 'FieldInverse',
        title: 'FieldInverse',
        body: 'Computes the multiplicative inverse of one visible integer-domain field element modulo a prime p. Zero fails visibly because it has no multiplicative inverse in the field. Prime-field arithmetic is foundational for later elliptic-curve work, but it does not by itself imply curve or protocol security.',
        indexTerms: ['field inverse', 'prime field', 'finite field', 'inverse', 'mod p'],
      },
      {
        id: 'PointSource',
        title: 'PointSource',
        body: 'Introduces one visible point on one explicit pedagogical short Weierstrass curve. The parameters p, a, b, x, and y must describe a real point on a non-singular curve, or the module fails before execution.',
        indexTerms: ['point source', 'elliptic curve', 'ec point', 'curve point', 'weierstrass'],
      },
      {
        id: 'PointOnCurve',
        title: 'PointOnCurve',
        body: 'Checks whether one visible point belongs to the declared curve and emits a one-bit success result. It fails visibly on cross-curve mismatches instead of silently guessing.',
        indexTerms: ['point on curve', 'curve membership', 'ec point', 'elliptic curve', 'validate point'],
      },
      {
        id: 'PointNegate',
        title: 'PointNegate',
        body: 'Reflects one visible point to its additive inverse on the same declared curve. A point and its negation add to the point at infinity.',
        indexTerms: ['point negate', 'inverse point', 'ec point', 'elliptic curve', 'point inverse'],
      },
      {
        id: 'PointAdd',
        title: 'PointAdd',
        body: 'Adds two visible points on the same declared pedagogical curve. It returns the point at infinity where mathematically appropriate and fails visibly when the incoming points do not belong to the receiving curve.',
        indexTerms: ['point add', 'elliptic curve', 'ec point', 'point addition', 'infinity'],
      },
      {
        id: 'PointDouble',
        title: 'PointDouble',
        body: 'Doubles one visible point on the same declared curve. MCW exposes this as its own stage because doubling is a special formula branch students should be able to inspect directly.',
        indexTerms: ['point double', 'elliptic curve', 'ec point', 'doubling'],
      },
      {
        id: 'ScalarMultiply',
        title: 'ScalarMultiply',
        body: 'Applies one visible non-negative integer scalar to one visible point on the same declared curve. This is repeated point addition and doubling on that curve, not ordinary multiplication of coordinates. It is foundational for later ECC public-key ideas, but it does not by itself imply ECDH, signatures, or real-world curve coverage.',
        indexTerms: ['scalar multiply', 'elliptic curve', 'ec point', 'repeated point action', 'double and add'],
      },
      {
        id: 'ModExp',
        title: 'ModExp',
        body: 'Performs modular exponentiation: (base ^ exp) mod n. Essential for public-key algorithms like RSA and Diffie-Hellman.',
        indexTerms: ['exponentiation', 'modulo', 'public-key', 'rsa'],
      },
      {
        id: 'ModInverse',
        title: 'ModInverse',
        body: 'Calculates the modular multiplicative inverse: x such that (a * x) ≡ 1 (mod n). Critical for RSA and other asymmetric primitives.',
        indexTerms: ['inverse', 'modulo', 'arithmetic'],
      },
      {
        id: 'Modulo',
        title: 'Modulo',
        body: 'Returns the remainder of division: a mod n.',
        indexTerms: ['modulo', 'remainder', 'arithmetic'],
      },
      {
        id: 'MulMod',
        title: 'MulMod',
        body: 'Performs modular multiplication: (a * b) mod n.',
        indexTerms: ['multiplication', 'modulo', 'arithmetic'],
      },
      {
        id: 'Majority',
        title: 'Majority',
        body: 'Evaluates the majority bit from its inputs. If more inputs are 1 than 0, it emits 1; otherwise 0. Used in specific stream ciphers like A5/1 for irregular clocking logic.',
        indexTerms: ['majority', 'voting', 'logic', 'a5/1'],
      },
      {
        id: 'GreaterThan',
        title: 'GreaterThan',
        body: 'Compares two signals and emits a true (1) signal if the first is numerically greater than the second.',
        indexTerms: ['comparison', 'logic'],
      },
      {
        id: 'Equals',
        title: 'Equals',
        body: 'Compares two signals for exact equality. Emits 1 if they match, 0 otherwise.',
        indexTerms: ['equality', 'comparison'],
      },
      {
        id: 'AtLeast',
        title: 'AtLeast',
        body: 'Compares two signals and emits 1 if the first is numerically greater than or equal to the second.',
        indexTerms: ['comparison', 'logic'],
      },

      // --- FLOW CONTROL ---
      {
        id: 'Mux',
        title: 'Mux',
        body: 'A multiplexer that selects one of its data inputs based on a control signal. It acts as a switch, allowing one signal path to be chosen from several.',
        indexTerms: ['mux', 'multiplexer', 'routing', 'switch'],
      },
      {
        id: 'Demux',
        title: 'Demux',
        body: 'A demultiplexer that routes its single data input to one of several outputs based on a control signal.',
        indexTerms: ['demux', 'demultiplexer', 'routing'],
      },
      {
        id: 'MultiRouter',
        title: 'MultiRouter',
        body: 'A complex routing module that handles multiple input and output paths, often used in large composite machines.',
        indexTerms: ['router', 'routing', 'signal flow'],
      },
      {
        id: 'MultiSelector',
        title: 'MultiSelector',
        body: 'Allows for the selection of multiple discrete signal paths from a set of available inputs.',
        indexTerms: ['selector', 'routing'],
      },
      {
        id: 'Gate',
        title: 'Gate',
        body: 'Acts as a conditional barrier. The data signal only passes through to the output if the control signal is \"active\" (usually a 1 bit).',
        indexTerms: ['gate', 'control', 'conditional'],
      },
      {
        id: 'Counter',
        title: 'Counter',
        body: 'A stateful module that increments its internal value on every tick or trigger pulse. Used for indices, nonces, or loop tracking.',
        indexTerms: ['counter', 'state', 'increment'],
      },
      {
        id: 'BroadcastBits',
        title: 'BroadcastBits',
        body: 'Takes a single bit signal and duplicates it across multiple output ports, allowing one signal to drive many downstream components.',
        indexTerms: ['broadcast', 'fan-out', 'bits'],
      },

      // --- CLASSICAL ---
      {
        id: 'Rotor',
        title: 'Rotor',
        body: 'Simulates a historical cipher rotor (like Enigma). It performs a substitution on symbols that changes as the rotor advances (rotates) during execution.',
        indexTerms: ['rotor', 'enigma', 'historical', 'substitution'],
      },
      {
        id: 'RotorReverse',
        title: 'RotorReverse',
        body: 'The inverse transformation of a Rotor. Used for the return signal path in Enigma-style machines to decrypt or complete the circuit.',
        indexTerms: ['rotor', 'inverse', 'historical'],
      },
      {
        id: 'Reflector',
        title: 'Reflector',
        body: 'A fixed permutation that maps symbols in pairs. In historical machines, it \"reflects\" the signal back through the rotors, ensuring the cipher is reciprocal.',
        indexTerms: ['reflector', 'enigma', 'historical'],
      },
      {
        id: 'Plugboard',
        title: 'Plugboard',
        body: 'Performs a fixed or configurable swap of symbol pairs before or after the main encryption process. Adds significant complexity to classical designs.',
        indexTerms: ['plugboard', 'steckerbrett', 'historical'],
      },
      {
        id: 'SymbolPermutation',
        title: 'SymbolPermutation',
        body: 'A general-purpose module for transposing symbols within an alphabet. Unlike a Rotor, its mapping does not automatically change over time.',
        indexTerms: ['permutation', 'symbols', 'substitution'],
      },
      {
        id: 'PolluxFractionation',
        title: 'PolluxFractionation',
        body: 'A homophonic substitution bridge. It maps bits to symbols using two disjoint sets (one for 0s, one for 1s). It makes bit-level data look like a random symbol stream.',
        indexTerms: ['pollux', 'fractionation', 'homophonic'],
      },
      {
        id: 'PolluxControlledFractionation',
        title: 'PolluxControlledFractionation',
        body: 'An advanced Pollux bridge that uses an additional selector input to choose which specific symbol from the valid set is used for a given bit.',
        indexTerms: ['pollux', 'controlled', 'selector'],
      },
      {
        id: 'PolluxInverse',
        title: 'PolluxInverse',
        body: 'Reverses Pollux fractionation by checking symbol set membership and recovering the original bit stream from ciphertext symbols.',
        indexTerms: ['pollux', 'inverse', 'decryption'],
      },

      // --- MODERN ---
      {
        id: 'SBox',
        title: 'SBox',
        body: 'The non-linear component of modern block ciphers. It maps a bit-level input to a bit-level output according to a substitution table, providing confusion.',
        indexTerms: ['sbox', 'substitution box', 'confusion', 'block cipher'],
      },
      {
        id: 'Permutation',
        title: 'Permutation',
        body: 'A bit-level transposition module. It rearranges the bits of its input according to a fixed or configurable pattern, providing diffusion.',
        indexTerms: ['permutation', 'diffusion', 'bits', 'p-box'],
      },
      {
        id: 'LFSR',
        title: 'LFSR',
        body: 'Linear Feedback Shift Register. A stateful module that generates a pseudo-random bit stream based on a linear recurrence. Fundamental to stream ciphers.',
        indexTerms: ['lfsr', 'prng', 'stream cipher', 'feedback'],
      },
      {
        id: 'BitShifter',
        title: 'BitShifter',
        body: 'Shifts or rotates bits within a signal. Includes logical, arithmetic, and circular shift options for bit-level manipulation.',
        indexTerms: ['shift', 'rotate', 'bits'],
      },
      {
        id: 'ByteRotate',
        title: 'ByteRotate',
        body: 'Performs bit-level rotation within 8-bit boundaries. Often used in block cipher round functions like those found in AES.',
        indexTerms: ['rotate', 'byte', 'bits'],
      },
      {
        id: 'ByteSwap',
        title: 'ByteSwap',
        body: 'Swaps the order of bytes within a signal. Useful for adjusting data formats (endianness) between different protocol layers.',
        indexTerms: ['swap', 'bytes', 'endianness'],
      },

      // --- SEQUENCE MANIPULATION ---
      {
        id: 'SymbolWindow',
        title: 'SymbolWindow',
        body: 'Extracts a specific slice or \"window\" from a symbol sequence. Useful for isolating parts of a message for analysis or sub-processing.',
        indexTerms: ['window', 'slice', 'symbols'],
      },
      {
        id: 'RepeatSymbolToLength',
        title: 'RepeatSymbolToLength',
        body: 'Repeats a symbol sequence until it reaches a specified total length. Ideal for creating periodic keys or padding structures.',
        indexTerms: ['repeat', 'symbols', 'padding'],
      },
      {
        id: 'RepeatSymbolToMatch',
        title: 'RepeatSymbolToMatch',
        body: 'Repeats a symbol sequence until its length matches that of a second \"match\" signal. Commonly used to align key streams with messages.',
        indexTerms: ['repeat', 'match', 'symbols'],
      },
      {
        id: 'PadSymbolToMatch',
        title: 'PadSymbolToMatch',
        body: 'Adds a padding symbol to the end of a sequence until its length matches a reference signal.',
        indexTerms: ['padding', 'match', 'symbols'],
      },
      {
        id: 'RequireSymbolLengthMatch',
        title: 'RequireSymbolLengthMatch',
        body: 'A validation module that throws an error if two symbol sequences do not have the same length, ensuring alignment in the pipeline.',
        indexTerms: ['validation', 'match', 'symbols'],
      },
      {
        id: 'TruncateSymbolSequence',
        title: 'TruncateSymbolSequence',
        body: 'Cuts a symbol sequence to a fixed length, discarding any symbols beyond the specified limit.',
        indexTerms: ['truncate', 'symbols'],
      },
      {
        id: 'TruncateSymbolToMatch',
        title: 'TruncateSymbolToMatch',
        body: 'Truncates a symbol sequence so that its length exactly matches a reference signal.',
        indexTerms: ['truncate', 'match', 'symbols'],
      },
      {
        id: 'SymbolSequenceToTicked',
        title: 'SymbolSequenceToTicked',
        body: 'Converts a symbol sequence into a stream of individual symbols, emitted one per clock tick for sequential machines.',
        indexTerms: ['sequential', 'ticked', 'symbols'],
      },
      {
        id: 'BitsSequenceToTicked',
        title: 'BitsSequenceToTicked',
        body: 'Converts a bit sequence into a stream of individual bits, emitted one per clock tick for time-domain simulation.',
        indexTerms: ['sequential', 'ticked', 'bits'],
      },
      {
        id: 'BitJoin',
        title: 'BitJoin',
        body: 'Concatenates multiple bit signals into a single, longer bit sequence. Used to assemble words or blocks from smaller fragments.',
        indexTerms: ['join', 'concatenate', 'bits'],
      },
      {
        id: 'BitSplit',
        title: 'BitSplit',
        body: 'Divides a bit signal into several shorter signals of specified widths. Essential for dissecting blocks or registers.',
        indexTerms: ['split', 'divide', 'bits'],
      },
      {
        id: 'BitPad',
        title: 'BitPad',
        body: 'Applies standard or custom bit-level padding (e.g., adding a 1 followed by 0s) to bring a signal to a required block size for encryption.',
        indexTerms: ['padding', 'bits', 'block size'],
      },
      {
        id: 'BitUnpad',
        title: 'BitUnpad',
        body: 'Removes bit-level padding from a signal, recovering the original unpadded message length after decryption.',
        indexTerms: ['unpad', 'bits'],
      },
      {
        id: 'BitWindow',
        title: 'BitWindow',
        body: 'Extracts a sub-sequence of bits from a larger bit stream based on a start index and length.',
        indexTerms: ['window', 'slice', 'bits'],
      },
      {
        id: 'BitSelect',
        title: 'BitSelect',
        body: 'Allows for the selection of specific individual bits from a sequence using an explicit list of bit indices.',
        indexTerms: ['select', 'bits', 'index'],
      },
      {
        id: 'BitExpand',
        title: 'BitExpand',
        body: 'Expands a bit signal by duplicating or reordering bits according to an expansion pattern (e.g., the E-box used in DES).',
        indexTerms: ['expand', 'bits', 'des'],
      },
      {
        id: 'RepeatBitsToLength',
        title: 'RepeatBitsToLength',
        body: 'Repeats a bit pattern until it reaches a desired total length in bits.',
        indexTerms: ['repeat', 'bits', 'length'],
      },
      {
        id: 'RepeatBitsToMatch',
        title: 'RepeatBitsToMatch',
        body: 'Repeats a bit pattern until its length matches the width of a reference bit signal.',
        indexTerms: ['repeat', 'match', 'bits'],
      },
      {
        id: 'PadBitsToMatch',
        title: 'PadBitsToMatch',
        body: 'Adds padding bits (0 or 1) to a signal until it matches the exact length of another reference bit signal.',
        indexTerms: ['padding', 'match', 'bits'],
      },
      {
        id: 'RequireBitsLengthMatch',
        title: 'RequireBitsLengthMatch',
        body: 'Validation module that ensures two bit signals have identical widths, raising an error on mismatch.',
        indexTerms: ['validation', 'match', 'bits'],
      },
      {
        id: 'TruncateBitsSequence',
        title: 'TruncateBitsSequence',
        body: 'Reduces a bit sequence to a fixed maximum length, keeping only the leading bits.',
        indexTerms: ['truncate', 'bits'],
      },
      {
        id: 'TruncateBitsToMatch',
        title: 'TruncateBitsToMatch',
        body: 'Truncates a bit signal so that its width matches that of a reference signal.',
        indexTerms: ['truncate', 'match', 'bits'],
      },
      {
        id: 'PadBitsSequence',
        title: 'PadBitsSequence',
        body: 'Pads a bit signal to a specific total length or alignment (e.g., ensuring it is a multiple of 8 bits).',
        indexTerms: ['padding', 'alignment', 'bits'],
      },
    ],
  },
  {
    id: 'composite-reference',
    title: 'Module Reference: Composites & Iterators',
    summary: 'Built-in reusable structures and higher-order execution modules.',
    entries: [
      // --- Round Functions ---
      {
        id: 'FeistelRoundComposite',
        title: 'Feistel Round',
        body: 'FeistelRoundComposite: Implements a classic Feistel network round function using Permutation, BitShifter, XOR, and BitJoin. It demonstrates the split-and-mix structure central to many symmetric ciphers.',
        indexTerms: ['feistel', 'round function', 'symmetric cipher', 'split-and-mix', 'diffusion'],
      },
      {
        id: 'KeyedByteRoundComposite',
        title: 'Keyed Byte Round',
        body: 'KeyedByteRoundComposite: A substitution-permutation round that incorporates an external key via XOR mixing. It represents a single stage of a modern block cipher where data is transformed by both an S-Box and a round key.',
        indexTerms: ['keyed round', 'sbox', 'permutation', 'xor mixing', 'block cipher'],
      },
      {
        id: 'ByteRoundComposite',
        title: 'Byte Round',
        body: 'ByteRoundComposite: A standard substitution-permutation (SP) round consisting of an S-Box substitution followed by a bit-level permutation. This is the fundamental building block for SP-network ciphers.',
        indexTerms: ['byte round', 'sp-network', 'sbox', 'permutation', 'diffusion'],
      },
      {
        id: 'HashDigestRoundComposite',
        title: 'Hash Digest Round',
        body: 'HashDigestRoundComposite: A specialized round for digest generation, combining substitution, rotation, and mixing with a fixed constant to ensure diffusion.',
        indexTerms: ['hash round', 'digest', 'constant mixing', 'bit rotation', 'substitution'],
      },
      {
        id: 'SpongeMixRoundComposite',
        title: 'Sponge Mix Round',
        body: 'SpongeMixRoundComposite: A 16-bit wide state transformation used in sponge constructions, featuring substitution, large-scale permutation, and constant mixing.',
        indexTerms: ['sponge construction', 'state mixing', 'permutation', 'keccak-style', 'diffusion'],
      },

      // --- Iterators & State ---
      {
        id: 'IteratedByteRoundsComposite',
        title: 'Iterated Byte Rounds',
        body: 'IteratedByteRoundsComposite: A hard-coded sequence of two Byte Round modules, demonstrating manual round unrolling before moving to automated iterators.',
        indexTerms: ['manual unroll', 'round chain', 'byte round', 'composition', 'cipher strength'],
      },
      {
        id: 'ByteRoundIterator',
        title: 'Byte Round Iterator',
        body: 'ByteRoundIterator: A higher-order module that dynamically unrolls a specified number of Byte Round instances in a chain for easy experimentation.',
        indexTerms: ['iterator', 'dynamic unrolling', 'byte round', 'round count', 'higher-order'],
      },
      {
        id: 'ClockedByteRoundIterator',
        title: 'Clocked Byte Round Iterator',
        body: 'ClockedByteRoundIterator: A stateful iterator that executes one Byte Round per clock pulse, allowing for step-by-step observation of round transformations.',
        indexTerms: ['clocked iterator', 'stateful execution', 'ticked workspace', 'step-by-step', 'round-by-round'],
      },
      {
        id: 'HashDigestRoundIterator',
        title: 'Hash Digest Iterator',
        body: 'HashDigestRoundIterator: Automates the repeated application of the Hash Digest Round to ensure thorough diffusion and confusion in hash outputs.',
        indexTerms: ['hash iterator', 'digest iteration', 'diffusion', 'confusion', 'hash finalization'],
      },
      {
        id: 'SpongeMixRoundIterator',
        title: 'Sponge Mix Iterator',
        body: 'SpongeMixRoundIterator: Executes multiple Sponge Mix Rounds to provide the necessary permutation strength between absorb and squeeze phases.',
        indexTerms: ['sponge iterator', 'state permutation', 'absorb phase', 'squeeze phase', 'capacity'],
      },
      {
        id: 'KeyedByteRoundIterator',
        title: 'Keyed Byte Round Iterator',
        body: 'KeyedByteRoundIterator: Sequentially applies keyed rounds while automatically partitioning the input key bus into individual round keys.',
        indexTerms: ['keyed iterator', 'round keys', 'key schedule', 'block cipher', 'bus partitioning'],
      },
      {
        id: 'FeistelRoundIterator',
        title: 'Feistel Round Iterator',
        body: 'FeistelRoundIterator: A specialized iterator for Feistel structures that handles round key distribution across multiple Feistel Round instances.',
        indexTerms: ['feistel iterator', 'round keys', 'feistel network', 'symmetric cipher', 'key distribution'],
      },

      // --- Routing & Control ---
      {
        id: 'RotorDoubleStepControl',
        title: 'Rotor Double-Step Control',
        body: 'RotorDoubleStepControl: Implements the mechanical stepping logic of classic rotor machines, including the double-step turnover carry-over.',
        indexTerms: ['rotor control', 'double-step', 'enigma', 'mechanical logic', 'stepping'],
      },
      {
        id: 'RotorControlBankRouter',
        title: 'Rotor Control Bank Router',
        body: 'RotorControlBankRouter: Uses gates and demultiplexers to route control pulses between different rotor stages based on enable signals.',
        indexTerms: ['control routing', 'pulse distribution', 'gate', 'demux', 'rotor bank'],
      },
      {
        id: 'ConditionalBranchDemo',
        title: 'Conditional Branch Demo',
        body: 'ConditionalBranchDemo: A basic control-flow module that selects between two different internal transformations based on a scalar control bit.',
        indexTerms: ['conditional', 'branching', 'control flow', 'if-then-else', 'multiplexer'],
      },
      {
        id: 'MultiCondSwitch4',
        title: 'Multi-Cond Switch 4',
        body: 'MultiCondSwitch4: An 8-bit select-driven switch that routes data through one of four specialized transformation branches.',
        indexTerms: ['multi-conditional', 'switch', 'case statement', 'routing', 'branching'],
      },
      {
        id: 'CipherDirectionSwitch',
        title: 'Cipher Direction Switch',
        body: 'CipherDirectionSwitch: A reversible control structure that selects between a forward transformation and its exact inverse.',
        indexTerms: ['cipher direction', 'reversibility', 'inverse', 'encryption', 'decryption'],
      },
      {
        id: 'ConditionalRotateBranch',
        title: 'Conditional Rotate Branch',
        body: 'ConditionalRotateBranch: A helper branch for conditional demos that performs a 1-bit left rotation on the input signal.',
        indexTerms: ['rotate branch', 'conditional helper', 'bit rotation', 'branching', 'logic'],
      },
      {
        id: 'ConditionalInvertBranch',
        title: 'Conditional Invert Branch',
        body: 'ConditionalInvertBranch: A helper branch for conditional demos that inverts all bits by XORing them with a constant mask.',
        indexTerms: ['invert branch', 'conditional helper', 'xor inversion', 'bit masking', 'logic'],
      },
      {
        id: 'MultiCondBranchRotL1',
        title: 'Multi-Cond Rotate Left 1',
        body: 'MultiCondBranchRotL1: Branch 0 for the multi-conditional demo: rotates bits left by one position.',
        indexTerms: ['rotate left', 'multi-cond helper', 'branch 0', 'logic', 'bit shift'],
      },
      {
        id: 'MultiCondBranchInvert',
        title: 'Multi-Cond Invert',
        body: 'MultiCondBranchInvert: Branch 1 for the multi-conditional demo: inverts all 8 bits using a constant mask.',
        indexTerms: ['invert', 'multi-cond helper', 'branch 1', 'logic', 'bit mask'],
      },
      {
        id: 'MultiCondBranchRotL2',
        title: 'Multi-Cond Rotate Left 2',
        body: 'MultiCondBranchRotL2: Branch 2 for the multi-conditional demo: rotates bits left by two positions.',
        indexTerms: ['rotate left 2', 'multi-cond helper', 'branch 2', 'logic', 'bit shift'],
      },
      {
        id: 'MultiCondBranchRotR1',
        title: 'Multi-Cond Rotate Right 1',
        body: 'MultiCondBranchRotR1: Branch 3 for the multi-conditional demo: rotates bits right by one position.',
        indexTerms: ['rotate right', 'multi-cond helper', 'branch 3', 'logic', 'bit shift'],
      },
      {
        id: 'CipherForwardBranch',
        title: 'Cipher Forward Branch',
        body: 'CipherForwardBranch: The forward path for the direction switch demo: substitutes bits with complements then rotates left.',
        indexTerms: ['forward branch', 'encryption path', 'substitution', 'rotation', 'cipher'],
      },
      {
        id: 'CipherInverseBranch',
        title: 'Cipher Inverse Branch',
        body: 'CipherInverseBranch: The inverse path for the direction switch demo: rotates right then substitutes bits with complements.',
        indexTerms: ['inverse branch', 'decryption path', 'reversibility', 'undo', 'cipher'],
      },

      // --- Architecture Demos ---
      {
        id: 'SymbolRoundTripComposite',
        title: 'Symbol Round Trip',
        body: 'SymbolRoundTripComposite: Demonstrates the conversion between abstract symbols and bit-level representations, ensuring data integrity.',
        indexTerms: ['round trip', 'symbol-to-bits', 'bits-to-symbol', 'data integrity', 'domain conversion'],
      },
      {
        id: 'ToyCompressionHashComposite',
        title: 'Toy Compression Hash',
        body: 'ToyCompressionHashComposite: A full hash construction demonstrating a Merkle-Damgård style compression function and finalization digest.',
        indexTerms: ['hash construction', 'compression function', 'merkle-damgård', 'digest', 'architecture'],
      },
      {
        id: 'ToySpongeHashComposite',
        title: 'Toy Sponge Hash',
        body: 'ToySpongeHashComposite: A complete implementation of a sponge-based hash function, showing the interaction between rate and capacity.',
        indexTerms: ['sponge hash', 'absorb', 'squeeze', 'rate-capacity', 'modern hash'],
      },
    ],
  },
  {
    id: 'analysis-reference',
    title: 'Cryptanalysis & Properties',
    summary: 'A reference for the analytical tools and property panels in the Analyze tab.',
    entries: [
      {
        id: 'sbox-properties',
        title: 'S-Box Properties',
        body:
          'The S-Box analysis panel measures local properties of a substitution table in isolation. Nonlinearity (NL) measures distance from affine functions; higher values usually mean less exploitable linear structure. Differential Uniformity (DDT max) measures how unevenly input differences propagate to output differences; lower values are better for local differential behavior. Algebraic Degree measures the Boolean complexity of the coordinate functions; higher degree usually means a less simple algebraic description. The panel also tracks Fixed Points (where S(x) = x) and Strict Avalanche Criterion (SAC) style bit-dependency behavior. These results help compare substitution tables, but they do not by themselves prove the strength of the full cipher around the S-box.',
        indexTerms: ['nonlinearity', 'ddt', 'differential uniformity', 'algebraic degree', 'fixed points', 'sac', 'matsui', 'biham-shamir', 's-box analysis'],
      },
      {
        id: 'permutation-properties',
        title: 'Permutation Properties',
        body:
          'The Permutation analysis panel describes the diffusion structure of a bit-routing layer. It decomposes the mapping into a Cycle Structure, showing the number and length of orbits. Displacement measures how far each bit travels from its input position to its output position. Inter-Block Spread calculates the Branch Number—the minimum number of active input and output blocks in a nonempty transition. A high branch number indicates strong diffusion, where a single change spreads rapidly across the state; this is the structural goal of the AES ShiftRows and MixColumns combination.',
        indexTerms: ['cycle structure', 'displacement', 'branch number', 'diffusion', 'avalanche', 'permutation analysis', 'block spread'],
      },
      {
        id: 'lfsr-properties',
        title: 'LFSR Properties',
        body:
          'Linear Feedback Shift Register (LFSR) analysis focuses on the period and primitivity of the feedback polynomial. A Primitive polynomial produces a maximum-length sequence of period 2^n − 1, where every non-zero state is visited once. If an LFSR is non-primitive, the keystream repeats prematurely, destroying secrecy. Regardless of period, any LFSR is structurally vulnerable: an attacker who observes 2n consecutive output bits can use the Berlekamp-Massey algorithm to recover the full internal state and predict all future bits.',
        indexTerms: ['lfsr', 'period', 'primitivity', 'maximum length', 'berlekamp-massey', 'feedback taps'],
      },
      {
        id: 'plugboard-properties',
        title: 'Plugboard Properties',
        body:
          'The Plugboard panel analyzes reciprocal substitutions (swapped pairs). It counts the number of wired pairs and identifies Fixed Points (unpaired letters). In classical cryptanalysis, such as Turing’s Bombe attack on Enigma, the absence of fixed points was a critical constraint: if a letter could not encrypt to itself, many potential wheel settings could be eliminated immediately. A weaker plugboard with many fixed points reduces the number of constraints available for crib attacks.',
        indexTerms: ['plugboard', 'reciprocal', 'pairs', 'fixed points', 'turing', 'bombe', 'enigma'],
      },
      {
        id: 'reflector-properties',
        title: 'Reflector Properties',
        body:
          'A Reflector is a special case of a fixed-point-free involution. The analysis verifies that every letter is paired with exactly one other letter and that no letter maps to itself. This self-reciprocal property was the heart of the Enigma machine, allowing the same device settings to both encrypt and decrypt. However, this symmetry was also its greatest weakness: it guaranteed that no letter could ever encrypt to itself, providing the \"hard negative\" constraint that made crib-based attacks possible.',
        indexTerms: ['reflector', 'involution', 'self-reciprocal', 'enigma weakness', 'classical analysis'],
      },
      {
        id: 'modulus-properties',
        title: 'Modulus Properties',
        body:
          'The Modulus panel describes the structure of the multiplicative group for modular arithmetic. It checks for Primality and calculates the Group Order (Euler’s totient function, φ(n)). A prime modulus guarantees that every non-zero element has a modular inverse, a requirement for Diffie-Hellman and other discrete-log constructions. For RSA-style modules, the panel identifies small factors; the modulus must be the product of two primes, and the exponent must be coprime to φ(n) for the inverse operation to exist.',
        indexTerms: ['modulus', 'primality', 'phi', 'totient', 'group order', 'modular inverse', 'rsa', 'diffie-hellman'],
      },
      {
        id: 'transformation-lookup',
        title: 'Substitution Lookup (S-Box) View',
        body:
          'The Substitution View visualizes how the S-Box module processes data. It groups the incoming bit stream into fixed-width chunks (e.g., 4, 6, or 8 bits), treats each chunk as a numerical index, and performs a table lookup to produce the output chunk. The view includes a grid representation of the substitution table, highlighting the active lookup cell and its context within the row and column. For DES-style S-Boxes, it supports the specialized outer-bits/inner-bits row-column mapping.',
        indexTerms: ['sbox view', 'lookup table', 'chunking', 'substitution grid', 'des layout'],
      },
      {
        id: 'transformation-routing',
        title: 'Routing & Permutation Views',
        body:
          'Routing transformations reorder or select signals without changing their underlying values. The Bit Remap (Permutation) view shows explicit wiring between input and output positions. Bit Select extracts specific indices while dropping others (like DES PC-1/PC-2), and Bit Expand copies indices to increase width (like DES E-expansion). The Bit Shifter view animates logical shifts and rotations, highlighting where bits wrap around or where zero-filling occurs. Symbol-domain versions provide the same orbit-preserving reordering for visible character strings.',
        indexTerms: ['permutation view', 'bit remap', 'bit select', 'bit expand', 'bit shifter', 'rotation', 'symbol permutation'],
      },
      {
        id: 'transformation-logic',
        title: 'Bitwise Logic & Gate Views',
        body:
          'Logic views visualize bit-by-bit control and comparison. The XOR view highlights bit disagreements, where the output is 1 only if the inputs differ. The Pulse Gate view shows a signal passing through or being blocked by a one-bit control pulse. Majority Vote displays three-way voting logic, and the Mux/Demux views show active routing where a select line chooses which path a signal follows. These views make control-flow and conditional logic in a cipher explicit and visible.',
        indexTerms: ['xor view', 'gate view', 'majority vote', 'mux', 'demux', 'logic gates', 'control flow'],
      },
      {
        id: 'transformation-structural',
        title: 'Structural & Arithmetic Views',
        body:
          'Structural transforms manage block boundaries and numerical values. BitSplit shows a single bus dividing into left and right sub-blocks (common in Feistel networks), while BitPad and BitUnpad show the addition or removal of padding bits to meet target widths. Word operations like MulMod, ModExp, and ModInverse visualize modular arithmetic, treating bit vectors as unsigned integers and showing the mathematical result alongside the bit-level transformation.',
        indexTerms: ['bitsplit', 'bitpad', 'bitunpad', 'modular multiplication', 'modular exponentiation', 'modular inverse', 'word operations'],
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
          'The palette is where you add modules, browse reusable structures, launch micro demos, and start authoring gestures such as direct drag-to-canvas placement from the expanded card view. The inspector is where you tune parameters, inspect live trace values, compare selected modules, work through verification cases, and use actions such as Replace with when you want to preserve position while changing the selected module. The fastest authoring loop in MCW is often Palette plus Inspector side by side: place from the palette, wire on the canvas, then immediately inspect or tune the result. If you lose track of a module, use the trace and focus tools to jump back to the relevant workspace area instead of manually panning through the full graph.',
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
      {
        id: 'what-verified-means',
        title: 'What Verified Means',
        body:
          'In MCW, verified means the current workspace matches a chosen reference behavior for the bounded cases you checked. That reference may come from a captured baseline, an imported known vector, or the exported parity workflow. A passing result is strong evidence that the machine matches the tested behavior; it is not a claim that the construction is secure, certified, or formally proven correct under all conditions. The trust story is behavioral and explicit: capture or import a reference, run the cases, inspect any first divergence, and if needed replay the same cases against the exported Python. That is the honest meaning of verified inside MCW.',
        indexTerms: ['verified', 'what verified means', 'trust', 'reference behavior', 'security claims'],
      },
    ],
  },
];
