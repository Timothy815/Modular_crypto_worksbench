import type { ShareableLabPack } from './workbench-document';
import { STARTER_CHALLENGES } from './starter-challenges';
import { STARTER_TUTORIALS } from './starter-tutorials';
import { demoProjects } from './demo-projects';

export function buildTlsTeachingLabPack(): ShareableLabPack {
  const demo = demoProjects.find((p) => p.id === 'tls-adjacent-handshake');
  const tutorial = STARTER_TUTORIALS.find((t) => t.id === 'tls-adjacent-handshake');
  const challenge = STARTER_CHALLENGES.find((c) => c.id === 'repair-the-tls-kdf-constant');

  if (!demo) {
    throw new Error('TLS-adjacent handshake demo not found');
  }

  return {
    version: 1,
    kind: 'mcw-shareable-lab-pack',
    metadata: {
      id: 'mcw-tls-protocol-teaching-pack',
      title: 'TLS Protocol Teaching Pack',
      summary:
        'A complete three-phase pedagogical TLS handshake: DH key exchange, two-key derivation (enc_key + mac_key), and AEAD encrypt-then-MAC. Includes a 5-step guided tutorial and an intermediate repair challenge demonstrating the consequence of a tampered ciphertext.',
      author: 'MCW Curriculum Team',
      source: 'https://timothy815.github.io/Modular_crypto_worksbench/',
      exportedAt: '2026-06-08T00:00:00.000Z',
    },
    workspace: {
      version: 1,
      project: demo.project,
      ui: {
        layout: demo.layout ?? {},
        annotations: [],
        stageLabels: [],
        groupBoxes: [],
        guideRails: [],
        showFurniture: false,
        showOverviewNavigator: false,
        connectionLayout: {},
      },
    },
    tutorial: tutorial
      ? {
          ...tutorial,
          version: 1 as const,
          id: `tls-teaching-pack-tutorial`,
        }
      : undefined,
    challenge: challenge
      ? {
          ...challenge,
          version: 1 as const,
          id: `tls-teaching-pack-challenge`,
        }
      : undefined,
    teachingNotes: `## TLS Protocol Teaching Pack — Instructor Notes

### Learning Objectives
After completing this lab, students will be able to:
- Explain how Diffie-Hellman key exchange allows two parties to derive a shared secret without transmitting it
- Describe why AEAD encryption needs separate keys for encryption and authentication (domain separation)
- Demonstrate that a single tampered bit in the ciphertext breaks the MAC check and blocks decryption

### Prerequisite Knowledge
Students should be familiar with:
- XOR as a bitwise operation (covered in the XOR cipher demo)
- Modular exponentiation (covered in the ModExp module demo)
- The concept of a shared secret (covered in the Diffie-Hellman demo)

### Running the Lab (~20 minutes)

**Phase 1 (5 min):** Open the workspace. Have students inspect kex-g (generator g=5), alice-priv (private a=6), bob-priv (private b=9). Hover alice-pub and bob-pub to see the public values (8 and 11). Hover kex-match — both parties computed shared=9 without transmitting their private scalars.

**Phase 2 (5 min):** Hover enc-key and mac-key. Ask: why are there TWO keys derived from one shared secret? The XOR constants (0xA5 for enc, 0x5A for mac) are domain-separation labels — they ensure enc_key ≠ mac_key even though they come from the same source. This prevents an attacker who learns one key from deriving the other.

**Phase 3a (5 min):** Hover ciphertext (0xEE) and mac-tag (0xBD). The ciphertext was created by Alice. The tag was computed over the ciphertext. Ask students: which comes first, encryption or MAC? (Answer: encrypt then MAC.)

**Phase 3b (5 min):** The repair challenge: received-ct starts as 0xEF (one bit flipped by an attacker). tag-match shows [0], the gate blocks decryption, and final-out shows [0]. Students restore received-ct to 0xEE to show the MAC recovers.

### Discussion Questions
1. Why does the AEAD structure require the MAC check before decryption? What would happen without it?
2. How many different shared secrets are possible with this toy DH setup? (Answer: ~23, since g and p are small; real TLS uses 2048-bit or larger primes.)
3. If both kdf constants were the same (0xA5), what would happen? (enc_key = mac_key → an attacker who breaks one breaks both.)

### Known Values for Reference
- g=5, p=23, alice_priv=6, bob_priv=9
- alice_pub = 5^6 mod 23 = 8
- bob_pub = 5^9 mod 23 = 11
- shared = 9
- enc_key = 9 XOR 0xA5 = 0xAC
- mac_key = 9 XOR 0x5A = 0x53
- plaintext = 0x42, ciphertext = 0xEE, tag = 0xBD`,
  };
}
