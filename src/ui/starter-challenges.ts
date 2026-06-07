import type { GuidedChallenge } from './challenges';
import { demoProjects } from './demo-projects';

function cloneProject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const bridgeProject = demoProjects.find((project) => project.id === 'bridge');
const beyondXorProject = demoProjects.find((project) => project.id === 'beyond-xor');
const controlProject = demoProjects.find((project) => project.id === 'counter-pulse-gate');
const bypassWorkshopProject = demoProjects.find((project) => project.id === 'bypass-workshop');
const splitTransformProject = demoProjects.find((project) => project.id === 'split-transform-rejoin');
const padAndSplitProject = demoProjects.find((project) => project.id === 'pad-and-split');
const protocolMaterialProject = demoProjects.find((project) => project.id === 'protocol-material-mixer');
const baudotProject = demoProjects.find((project) => project.id === 'baudot-bridge');
const polluxFractionationProject = demoProjects.find((project) => project.id === 'pollux-fractionation');
const polluxRoundTripProject = demoProjects.find((project) => project.id === 'pollux-round-trip');
const polluxControlledSelectionProject = demoProjects.find(
  (project) => project.id === 'pollux-controlled-selection',
);
const lorenzProject = demoProjects.find((project) => project.id === 'lorenz-foundation');
const gatedLorenzProject = demoProjects.find((project) => project.id === 'gated-lorenz');
const pairedLorenzProject = demoProjects.find((project) => project.id === 'paired-lorenz');
const bankedLorenzProject = demoProjects.find((project) => project.id === 'banked-lorenz');
const iteratedByteRoundsProject = demoProjects.find((project) => project.id === 'iterated-byte-rounds');
const keyedByteRoundsProject = demoProjects.find((project) => project.id === 'keyed-byte-rounds');
const keyedByteIteratorProject = demoProjects.find((project) => project.id === 'keyed-byte-iterator');
const feistelProject = demoProjects.find((project) => project.id === 'feistel-network');
const byteRoundProject = demoProjects.find((project) => project.id === 'byte-round');
const sboxTableTransformProject = demoProjects.find((project) => project.id === 'sbox-table-transform');
const hexRoundProject = demoProjects.find((project) => project.id === 'hex-round');
const asciiRoundProject = demoProjects.find((project) => project.id === 'ascii-round');
const keystreamProject = demoProjects.find((project) => project.id === 'keystream');
const lfsrPredictabilityProject = demoProjects.find((project) => project.id === 'lfsr-predictability');
const gatedKeystreamProject = demoProjects.find((project) => project.id === 'gated-keystream');
const majorityKeystreamProject = demoProjects.find((project) => project.id === 'majority-keystream');
const filteredKeystreamProject = demoProjects.find((project) => project.id === 'filtered-keystream');
const clockedRoundTraversalProject = demoProjects.find((project) => project.id === 'clocked-round-traversal');
const routedClockKeystreamProject = demoProjects.find((project) => project.id === 'routed-clock-keystream');
const advancedRotorSteppingProject = demoProjects.find((project) => project.id === 'advanced-rotor-stepping');
const visibleSymbolScrambleProject = demoProjects.find((project) => project.id === 'visible-symbol-scramble');
const visibleSubkeyBusProject = demoProjects.find((project) => project.id === 'visible-subkey-bus');
const visibleKeySelectionProject = demoProjects.find((project) => project.id === 'visible-key-selection');
const visibleKeyExpansionProject = demoProjects.find((project) => project.id === 'visible-key-expansion');
const enigmaMachineProject = demoProjects.find((project) => project.id === 'enigma-machine');
const visibleFeistelRoundProject = demoProjects.find((project) => project.id === 'visible-feistel-round');
const multiplyCompareUnpadProject = demoProjects.find((project) => project.id === 'multiply-compare-unpad');
const visibleMessageWindowProject = demoProjects.find((project) => project.id === 'visible-message-window');
const toyRsaProject = demoProjects.find((project) => project.id === 'toy-rsa');
const diffieHellmanProject = demoProjects.find((project) => project.id === 'diffie-hellman-key-exchange');
const gf2MultiplyProject = demoProjects.find((project) => project.id === 'gf2-multiply');
const visibleMixColumnsProject = demoProjects.find((project) => project.id === 'visible-mix-columns');
const visibleSubBytesProject = demoProjects.find((project) => project.id === 'visible-subbytes');
const visibleAddRoundKeyProject = demoProjects.find((project) => project.id === 'visible-add-round-key');
const aesRoundFullProject = demoProjects.find((project) => project.id === 'aes-round-full');
const aesRowPerturbationProject = demoProjects.find((project) => project.id === 'aes-row-perturbation');
const aesColumnPerturbationProject = demoProjects.find((project) => project.id === 'aes-column-perturbation');
const keyedSBoxAuthoringProject = demoProjects.find((project) => project.id === 'keyed-sbox-authoring');
const visiblePointMechanicsProject = demoProjects.find(
  (project) => project.id === 'visible-point-mechanics',
);
const visibleScalarMultiplicationProject = demoProjects.find(
  (project) => project.id === 'visible-scalar-multiplication',
);
const visibleDoubleAndAddProject = demoProjects.find(
  (project) => project.id === 'visible-double-and-add',
);
const toyCurvePointMapProject = demoProjects.find((project) => project.id === 'toy-curve-point-map');
const visibleEcdhProject = demoProjects.find((project) => project.id === 'visible-ecdh-key-agreement');
const visiblePointOrderProject = demoProjects.find(
  (project) => project.id === 'visible-point-order-and-subgroups',
);
const ecdhLowOrderPointProject = demoProjects.find(
  (project) => project.id === 'ecdh-low-order-point-consequence',
);
const eccPublicKeyValidationProject = demoProjects.find(
  (project) => project.id === 'ecc-public-key-validation-consequence',
);
const visibleSchnorrProject = demoProjects.find((project) => project.id === 'visible-schnorr-signature');
const schnorrNonceReuseProject = demoProjects.find((project) => project.id === 'schnorr-nonce-reuse-consequence');
const schnorrChallengeBindingProject = demoProjects.find(
  (project) => project.id === 'schnorr-challenge-binding-consequence',
);
const visibleSignatureVerificationProject = demoProjects.find(
  (project) => project.id === 'visible-signature-verification',
);
const visibleSecureHandshakeProject = demoProjects.find(
  (project) => project.id === 'visible-secure-handshake',
);
const keyScheduleWorkshopProject = demoProjects.find((project) => project.id === 'key-schedule-workshop');
const recursiveKeyScheduleProject = demoProjects.find((project) => project.id === 'recursive-key-schedule');
const visibleBlockChainingProject = demoProjects.find((project) => project.id === 'visible-block-chaining');
const visibleByteOrderProject = demoProjects.find((project) => project.id === 'visible-byte-order');
const visibleTamperCheckProject = demoProjects.find((project) => project.id === 'visible-tamper-check');
const visibleAuthenticatedEncryptionProject = demoProjects.find(
  (project) => project.id === 'visible-authenticated-encryption',
);
const sequentialProject = demoProjects.find((project) => project.id === 'sequential');
const visibleCompressionHashProject = demoProjects.find(
  (project) => project.id === 'visible-compression-hash',
);
const toyCompressionHashProject = demoProjects.find((project) => project.id === 'toy-compression-hash');
const toySpongeHashProject = demoProjects.find((project) => project.id === 'toy-sponge-hash');
const ivReuseProject = demoProjects.find(
  (project) => project.id === 'stream-cipher-iv-reuse-consequence',
);
const cbcPaddingOracleProject = demoProjects.find(
  (project) => project.id === 'cbc-padding-oracle-consequence',
);
const visibleVigenereProject = demoProjects.find(
  (project) => project.id === 'visible-vigenere-cipher',
);
const visibleRsaKeyGenProject = demoProjects.find(
  (project) => project.id === 'visible-rsa-key-generation',
);
const columnarTranspositionProject = demoProjects.find(
  (project) => project.id === 'columnar-transposition-cipher',
);

if (!bridgeProject) {
  throw new Error('Expected bridge demo project to seed starter challenges.');
}
if (!beyondXorProject) {
  throw new Error('Expected beyond-xor demo project to seed starter challenges.');
}
if (!controlProject) {
  throw new Error('Expected counter-pulse-gate demo project to seed starter challenges.');
}
if (!bypassWorkshopProject) {
  throw new Error('Expected bypass-workshop demo project to seed starter challenges.');
}
if (!splitTransformProject) {
  throw new Error('Expected split-transform-rejoin demo project to seed starter challenges.');
}
if (!padAndSplitProject) {
  throw new Error('Expected pad-and-split demo project to seed starter challenges.');
}
if (!protocolMaterialProject) {
  throw new Error('Expected protocol-material-mixer demo project to seed starter challenges.');
}
if (!baudotProject) {
  throw new Error('Expected baudot-bridge demo project to seed starter challenges.');
}
if (!polluxFractionationProject) {
  throw new Error('Expected pollux-fractionation demo project to seed starter challenges.');
}
if (!polluxRoundTripProject) {
  throw new Error('Expected pollux-round-trip demo project to seed starter challenges.');
}
if (!polluxControlledSelectionProject) {
  throw new Error('Expected pollux-controlled-selection demo project to seed starter challenges.');
}
if (!lorenzProject) {
  throw new Error('Expected lorenz-foundation demo project to seed starter challenges.');
}
if (!gatedLorenzProject) {
  throw new Error('Expected gated-lorenz demo project to seed starter challenges.');
}
if (!pairedLorenzProject) {
  throw new Error('Expected paired-lorenz demo project to seed starter challenges.');
}
if (!bankedLorenzProject) {
  throw new Error('Expected banked-lorenz demo project to seed starter challenges.');
}
if (!iteratedByteRoundsProject) {
  throw new Error('Expected iterated-byte-rounds demo project to seed starter challenges.');
}
if (!keyedByteRoundsProject) {
  throw new Error('Expected keyed-byte-rounds demo project to seed starter challenges.');
}
if (!keyedByteIteratorProject) {
  throw new Error('Expected keyed-byte-iterator demo project to seed starter challenges.');
}
if (!feistelProject) {
  throw new Error('Expected feistel-network demo project to seed starter challenges.');
}
if (!byteRoundProject) {
  throw new Error('Expected byte-round demo project to seed starter challenges.');
}
if (!sboxTableTransformProject) {
  throw new Error('Expected sbox-table-transform demo project to seed starter challenges.');
}
if (!hexRoundProject) {
  throw new Error('Expected hex-round demo project to seed starter challenges.');
}
if (!asciiRoundProject) {
  throw new Error('Expected ascii-round demo project to seed starter challenges.');
}
if (!keystreamProject) {
  throw new Error('Expected keystream demo project to seed starter challenges.');
}
if (!lfsrPredictabilityProject) {
  throw new Error('Expected lfsr-predictability demo project to seed starter challenges.');
}
if (!gatedKeystreamProject) {
  throw new Error('Expected gated-keystream demo project to seed starter challenges.');
}
if (!majorityKeystreamProject) {
  throw new Error('Expected majority-keystream demo project to seed starter challenges.');
}
if (!filteredKeystreamProject) {
  throw new Error('Expected filtered-keystream demo project to seed starter challenges.');
}
if (!clockedRoundTraversalProject) {
  throw new Error('Expected clocked-round-traversal demo project to seed starter challenges.');
}
if (!routedClockKeystreamProject) {
  throw new Error('Expected routed-clock-keystream demo project to seed starter challenges.');
}
if (!advancedRotorSteppingProject) {
  throw new Error('Expected advanced-rotor-stepping demo project to seed starter challenges.');
}
if (!visibleSymbolScrambleProject) {
  throw new Error('Expected visible-symbol-scramble demo project to seed starter challenges.');
}
if (!visibleSubkeyBusProject) {
  throw new Error('Expected visible-subkey-bus demo project to seed starter challenges.');
}
if (!visibleKeySelectionProject) {
  throw new Error('Expected visible-key-selection demo project to seed starter challenges.');
}
if (!visibleKeyExpansionProject) {
  throw new Error('Expected visible-key-expansion demo project to seed starter challenges.');
}
if (!enigmaMachineProject) {
  throw new Error('Expected enigma-machine demo project to seed starter challenges.');
}
if (!visibleFeistelRoundProject) {
  throw new Error('Expected visible-feistel-round demo project to seed starter challenges.');
}
if (!multiplyCompareUnpadProject) {
  throw new Error('Expected multiply-compare-unpad demo project to seed starter challenges.');
}
if (!visibleMessageWindowProject) {
  throw new Error('Expected visible-message-window demo project to seed starter challenges.');
}
if (!sequentialProject) {
  throw new Error('Expected sequential demo project to seed starter challenges.');
}
if (!visibleCompressionHashProject) {
  throw new Error('Expected visible-compression-hash project to seed starter challenges.');
}
if (!toyCompressionHashProject) {
  throw new Error('Expected toy-compression-hash project to seed starter challenges.');
}
if (!toySpongeHashProject) {
  throw new Error('Expected toy-sponge-hash project to seed starter challenges.');
}
if (!ivReuseProject) {
  throw new Error('Expected stream-cipher-iv-reuse-consequence project to seed starter challenges.');
}
if (!cbcPaddingOracleProject) {
  throw new Error('Expected cbc-padding-oracle-consequence project to seed starter challenges.');
}
if (!visibleVigenereProject) {
  throw new Error('Expected visible-vigenere-cipher project to seed starter challenges.');
}
if (!visibleRsaKeyGenProject) {
  throw new Error('Expected visible-rsa-key-generation project to seed starter challenges.');
}
if (!columnarTranspositionProject) {
  throw new Error('Expected columnar-transposition-cipher project to seed starter challenges.');
}
if (!toyRsaProject) {
  throw new Error('Expected toy-rsa demo project to seed starter challenges.');
}
if (!diffieHellmanProject) {
  throw new Error('Expected diffie-hellman-key-exchange demo project to seed starter challenges.');
}
if (!gf2MultiplyProject) {
  throw new Error('Expected gf2-multiply demo project to seed starter challenges.');
}
if (!visibleMixColumnsProject) {
  throw new Error('Expected visible-mix-columns demo project to seed starter challenges.');
}
if (!visibleSubBytesProject) {
  throw new Error('Expected visible-subbytes demo project to seed starter challenges.');
}
if (!visibleAddRoundKeyProject) {
  throw new Error('Expected visible-add-round-key demo project to seed starter challenges.');
}
if (!aesRoundFullProject) {
  throw new Error('Expected aes-round-full demo project to seed starter challenges.');
}
if (!aesRowPerturbationProject) {
  throw new Error('Expected aes-row-perturbation demo project to seed starter challenges.');
}
if (!aesColumnPerturbationProject) {
  throw new Error('Expected aes-column-perturbation demo project to seed starter challenges.');
}
if (!keyedSBoxAuthoringProject) {
  throw new Error('Expected keyed-sbox-authoring demo project to seed starter challenges.');
}
if (!visiblePointMechanicsProject) {
  throw new Error('Expected visible-point-mechanics demo project to seed starter challenges.');
}
if (!visibleScalarMultiplicationProject) {
  throw new Error('Expected visible-scalar-multiplication demo project to seed starter challenges.');
}
if (!visibleDoubleAndAddProject) {
  throw new Error('Expected visible-double-and-add demo project to seed starter challenges.');
}
if (!toyCurvePointMapProject) {
  throw new Error('Expected toy-curve-point-map demo project to seed starter challenges.');
}
if (!visibleEcdhProject) {
  throw new Error('Expected visible-ecdh-key-agreement demo project to seed starter challenges.');
}
if (!visiblePointOrderProject) {
  throw new Error('Expected visible-point-order-and-subgroups demo project to seed starter challenges.');
}
if (!ecdhLowOrderPointProject) {
  throw new Error('Expected ecdh-low-order-point-consequence demo project to seed starter challenges.');
}
if (!eccPublicKeyValidationProject) {
  throw new Error('Expected ecc-public-key-validation-consequence demo project to seed starter challenges.');
}
if (!visibleSchnorrProject) {
  throw new Error('Expected visible-schnorr-signature demo project to seed starter challenges.');
}
if (!schnorrNonceReuseProject) {
  throw new Error('Expected schnorr-nonce-reuse-consequence demo project to seed starter challenges.');
}
if (!schnorrChallengeBindingProject) {
  throw new Error('Expected schnorr-challenge-binding-consequence demo project to seed starter challenges.');
}
if (!visibleSignatureVerificationProject) {
  throw new Error('Expected visible-signature-verification demo project to seed starter challenges.');
}
if (!visibleSecureHandshakeProject) {
  throw new Error('Expected visible-secure-handshake demo project to seed starter challenges.');
}
if (!keyScheduleWorkshopProject) {
  throw new Error('Expected key-schedule-workshop demo project to seed starter challenges.');
}
if (!recursiveKeyScheduleProject) {
  throw new Error('Expected recursive-key-schedule demo project to seed starter challenges.');
}
if (!visibleBlockChainingProject) {
  throw new Error('Expected visible-block-chaining demo project to seed starter challenges.');
}
if (!visibleByteOrderProject) {
  throw new Error('Expected visible-byte-order demo project to seed starter challenges.');
}
if (!visibleTamperCheckProject) {
  throw new Error('Expected visible-tamper-check demo project to seed starter challenges.');
}
if (!visibleAuthenticatedEncryptionProject) {
  throw new Error('Expected visible-authenticated-encryption demo project to seed starter challenges.');
}

const fixedBridgeTarget = cloneProject(bridgeProject.project);
const brokenBridgeStart = cloneProject(bridgeProject.project);
const beyondXorTarget = cloneProject(beyondXorProject.project);
const brokenBeyondXorStart = cloneProject(beyondXorProject.project);
const controlTarget = cloneProject(controlProject.project);
const brokenControlStart = cloneProject(controlProject.project);
const bypassWorkshopTarget = cloneProject(bypassWorkshopProject.project);
const brokenBypassWorkshopStart = cloneProject(bypassWorkshopProject.project);
const splitTransformTarget = cloneProject(splitTransformProject.project);
const brokenSplitTransformStart = cloneProject(splitTransformProject.project);
const padAndSplitTarget = cloneProject(padAndSplitProject.project);
const brokenPadAndSplitStart = cloneProject(padAndSplitProject.project);
const protocolMaterialTarget = cloneProject(protocolMaterialProject.project);
const brokenProtocolMaterialStart = cloneProject(protocolMaterialProject.project);
const baudotTarget = cloneProject(baudotProject.project);
const brokenBaudotStart = cloneProject(baudotProject.project);
const lorenzTarget = cloneProject(lorenzProject.project);
const brokenLorenzStart = cloneProject(lorenzProject.project);
const gatedLorenzTarget = cloneProject(gatedLorenzProject.project);
const brokenGatedLorenzStart = cloneProject(gatedLorenzProject.project);
const pairedLorenzTarget = cloneProject(pairedLorenzProject.project);
const brokenPairedLorenzStart = cloneProject(pairedLorenzProject.project);
const bankedLorenzTarget = cloneProject(bankedLorenzProject.project);
const brokenBankedLorenzStart = cloneProject(bankedLorenzProject.project);
const iteratedByteRoundsTarget = cloneProject(iteratedByteRoundsProject.project);
const brokenIteratedByteRoundsStart = cloneProject(iteratedByteRoundsProject.project);
const keyedByteRoundsTarget = cloneProject(keyedByteRoundsProject.project);
const brokenKeyedByteRoundsStart = cloneProject(keyedByteRoundsProject.project);
const keyedByteIteratorTarget = cloneProject(keyedByteIteratorProject.project);
const brokenKeyedByteIteratorStart = cloneProject(keyedByteIteratorProject.project);
const feistelTarget = cloneProject(feistelProject.project);
const brokenFeistelStart = cloneProject(feistelProject.project);
const byteRoundTarget = cloneProject(byteRoundProject.project);
const brokenByteRoundStart = cloneProject(byteRoundProject.project);
const sboxTableTransformTarget = cloneProject(sboxTableTransformProject.project);
const brokenSBoxTableTransformStart = cloneProject(sboxTableTransformProject.project);
const hexRoundTarget = cloneProject(hexRoundProject.project);
const brokenHexRoundStart = cloneProject(hexRoundProject.project);
const asciiRoundTarget = cloneProject(asciiRoundProject.project);
const brokenAsciiRoundStart = cloneProject(asciiRoundProject.project);
const keystreamTarget = cloneProject(keystreamProject.project);
const brokenKeystreamStart = cloneProject(keystreamProject.project);
const lfsrPredictabilityTarget = cloneProject(lfsrPredictabilityProject.project);
const brokenLfsrPredictabilityStart = cloneProject(lfsrPredictabilityProject.project);
const brokenRandomnessLabStart = cloneProject(lfsrPredictabilityProject.project);
const gatedKeystreamTarget = cloneProject(gatedKeystreamProject.project);
const brokenGatedKeystreamStart = cloneProject(gatedKeystreamProject.project);
const majorityKeystreamTarget = cloneProject(majorityKeystreamProject.project);
const brokenMajorityKeystreamStart = cloneProject(majorityKeystreamProject.project);
const filteredKeystreamTarget = cloneProject(filteredKeystreamProject.project);
const brokenFilteredKeystreamStart = cloneProject(filteredKeystreamProject.project);
const clockedRoundTraversalTarget = cloneProject(clockedRoundTraversalProject.project);
const brokenClockedRoundTraversalStart = cloneProject(clockedRoundTraversalProject.project);
brokenClockedRoundTraversalStart.connections = brokenClockedRoundTraversalStart.connections.filter(
  (c) => !(c.from.moduleId === 'clock' && c.to.moduleId === 'iterator'),
);
const routedClockKeystreamTarget = cloneProject(routedClockKeystreamProject.project);
const brokenRoutedClockKeystreamStart = cloneProject(routedClockKeystreamProject.project);
const advancedRotorSteppingTarget = cloneProject(advancedRotorSteppingProject.project);
const brokenAdvancedRotorSteppingStart = cloneProject(advancedRotorSteppingProject.project);
const brokenRotorRingSettingStart = cloneProject(advancedRotorSteppingProject.project);
const visibleSymbolScrambleTarget = cloneProject(visibleSymbolScrambleProject.project);
const brokenVisibleSymbolScrambleStart = cloneProject(visibleSymbolScrambleProject.project);
const visibleSubkeyBusTarget = cloneProject(visibleSubkeyBusProject.project);
const brokenVisibleSubkeyBusStart = cloneProject(visibleSubkeyBusProject.project);
const visibleKeySelectionTarget = cloneProject(visibleKeySelectionProject.project);
const brokenVisibleKeySelectionStart = cloneProject(visibleKeySelectionProject.project);
const visibleKeyExpansionTarget = cloneProject(visibleKeyExpansionProject.project);
const brokenVisibleKeyExpansionStart = cloneProject(visibleKeyExpansionProject.project);
const enigmaMachineTarget = cloneProject(enigmaMachineProject.project);
const brokenEnigmaMachineStart = cloneProject(enigmaMachineProject.project);
const visibleFeistelRoundTarget = cloneProject(visibleFeistelRoundProject.project);
const brokenVisibleFeistelRoundStart = cloneProject(visibleFeistelRoundProject.project);
const multiplyCompareUnpadTarget = cloneProject(multiplyCompareUnpadProject.project);
const brokenMultiplyCompareUnpadStart = cloneProject(multiplyCompareUnpadProject.project);
const visibleMessageWindowTarget = cloneProject(visibleMessageWindowProject.project);
const brokenVisibleMessageWindowStart = cloneProject(visibleMessageWindowProject.project);
const sequentialTarget = cloneProject(sequentialProject.project);
const brokenSequentialStart = cloneProject(sequentialProject.project);
const brokenSequentialTapsStart = cloneProject(sequentialProject.project);
const visibleCompressionHashTarget = cloneProject(visibleCompressionHashProject.project);
const brokenVisibleCompressionHashStart = cloneProject(visibleCompressionHashProject.project);
// Break: left SBox uses identity (no substitution) instead of the inverting table
const brokenCompressionLSub = brokenVisibleCompressionHashStart.modules.find(
  (m) => m.id === 'l-sub',
);
if (!brokenCompressionLSub) {
  throw new Error('Expected visible-compression-hash project to contain l-sub module.');
}
brokenCompressionLSub.params.table = Array.from({ length: 256 }, (_, i) => i).join(',');

const toyCompressionHashTarget = cloneProject(toyCompressionHashProject.project);
const toyCompressionHashCollisionStart = cloneProject(toyCompressionHashProject.project);
const toySpongeHashTarget = cloneProject(toySpongeHashProject.project);
const toySpongeHashCollisionStart = cloneProject(toySpongeHashProject.project);

// IV Reuse challenge: same board structure but with a separate 'crib' BitSource for
// the recovery step, so the student can independently adjust the known-plaintext guess.
const ivReuseTarget = cloneProject(ivReuseProject.project);
ivReuseTarget.modules.push({ id: 'crib', defId: 'BitSource', params: { stream: [0, 1, 1, 0, 1, 0, 1, 0] } });
ivReuseTarget.connections = ivReuseTarget.connections.filter(
  (c) => !(c.from.moduleId === 'msg-a' && c.to.moduleId === 'recover-b' && c.to.port === 'b'),
);
ivReuseTarget.connections.push({ from: { moduleId: 'crib', port: 'out' }, to: { moduleId: 'recover-b', port: 'b' } });

const brokenIvReuseStart = cloneProject(ivReuseProject.project);
brokenIvReuseStart.modules.push({ id: 'crib', defId: 'BitSource', params: { stream: [0, 0, 0, 0, 0, 0, 0, 0] } });
brokenIvReuseStart.connections = brokenIvReuseStart.connections.filter(
  (c) => !(c.from.moduleId === 'msg-a' && c.to.moduleId === 'recover-b' && c.to.port === 'b'),
);
brokenIvReuseStart.connections.push({ from: { moduleId: 'crib', port: 'out' }, to: { moduleId: 'recover-b', port: 'b' } });

// Vigenere challenge: k-b starts as 'F' instead of 'E', producing 'N' instead of 'M'
const vigenereTarget = cloneProject(visibleVigenereProject.project);
const brokenVigenereStart = cloneProject(visibleVigenereProject.project);
const brokenVigenereKb = brokenVigenereStart.modules.find((m) => m.id === 'k-b');
if (!brokenVigenereKb) {
  throw new Error('Expected visible-vigenere-cipher project to contain k-b module.');
}
brokenVigenereKb.params.value = 'F';

// Transposition challenge: broken order reads columns in keyword-position order (K,E,Y)
// instead of alphabetical-rank order (E,K,Y). Student must fix the order parameter.
const transpositionTarget = cloneProject(columnarTranspositionProject.project);
const brokenTranspositionStart = cloneProject(columnarTranspositionProject.project);
const brokenTranspose = brokenTranspositionStart.modules.find((m) => m.id === 'transpose');
if (!brokenTranspose) {
  throw new Error('Expected columnar-transposition-cipher project to contain transpose module.');
}
brokenTranspose.params.order = '0,3,1,4,2,5';

// RSA challenge: d-inv uses wrong φ(n) modulus '16'=22 instead of '18'=24
// → d=9 instead of d=5 → decryption gives 22 instead of 2
const rsaKeyGenTarget = cloneProject(visibleRsaKeyGenProject.project);
const brokenRsaKeyGenStart = cloneProject(visibleRsaKeyGenProject.project);
const brokenDInv = brokenRsaKeyGenStart.modules.find((m) => m.id === 'd-inv');
if (!brokenDInv) {
  throw new Error('Expected visible-rsa-key-generation project to contain d-inv module.');
}
brokenDInv.params.modulus = '16';

// CBC padding oracle challenge: c1-guess starts all-zeros (wrong); student must set it
// to I XOR 0x01 (= 0x22 = [0,0,1,0,0,0,1,0]) so the oracle returns 1 (valid padding)
// and the intermediate recovery confirms match.
const cbcPaddingOracleTarget = cloneProject(cbcPaddingOracleProject.project);
const brokenCbcPaddingOracleStart = cloneProject(cbcPaddingOracleProject.project);
const brokenOracleC1Guess = brokenCbcPaddingOracleStart.modules.find((m) => m.id === 'c1-guess');
if (!brokenOracleC1Guess) {
  throw new Error('Expected cbc-padding-oracle-consequence project to contain c1-guess module.');
}
brokenOracleC1Guess.params.stream = [0, 0, 0, 0, 0, 0, 0, 0];
const toyRsaTarget = cloneProject(toyRsaProject.project);
const brokenToyRsaStart = cloneProject(toyRsaProject.project);
const diffieHellmanTarget = cloneProject(diffieHellmanProject.project);
const brokenDiffieHellmanStart = cloneProject(diffieHellmanProject.project);
const gf2MultiplyTarget = cloneProject(gf2MultiplyProject.project);
const brokenGf2MultiplyStart = cloneProject(gf2MultiplyProject.project);
const visiblePointMechanicsTarget = cloneProject(visiblePointMechanicsProject.project);
const brokenVisiblePointMechanicsStart = cloneProject(visiblePointMechanicsProject.project);
const visibleScalarMultiplicationTarget = cloneProject(visibleScalarMultiplicationProject.project);
const brokenVisibleScalarMultiplicationStart = cloneProject(visibleScalarMultiplicationProject.project);
const visibleDoubleAndAddTarget = cloneProject(visibleDoubleAndAddProject.project);
const brokenVisibleDoubleAndAddStart = cloneProject(visibleDoubleAndAddProject.project);
const toyCurvePointMapTarget = cloneProject(toyCurvePointMapProject.project);
const brokenToyCurvePointMapStart = cloneProject(toyCurvePointMapProject.project);
const keyedSBoxAuthoringTarget = cloneProject(keyedSBoxAuthoringProject.project);
const brokenKeyedSBoxAuthoringStart = cloneProject(keyedSBoxAuthoringProject.project);
const keyedSBoxAuthoringTargetKeySource = keyedSBoxAuthoringTarget.modules.find((module) => module.id === 'key-source');
if (!keyedSBoxAuthoringTargetKeySource) {
  throw new Error('Expected keyed-sbox-authoring target project to contain the key-source module.');
}
keyedSBoxAuthoringTargetKeySource.params = {
  ...keyedSBoxAuthoringTargetKeySource.params,
  stream: [0, 0],
};
const visibleEcdhTarget = cloneProject(visibleEcdhProject.project);
const brokenVisibleEcdhStart = cloneProject(visibleEcdhProject.project);
const visiblePointOrderTarget = cloneProject(visiblePointOrderProject.project);
const brokenVisiblePointOrderStart = cloneProject(visiblePointOrderProject.project);
const ecdhLowOrderPointTarget = cloneProject(ecdhLowOrderPointProject.project);
const brokenEcdhLowOrderPointStart = cloneProject(ecdhLowOrderPointProject.project);
const eccPublicKeyValidationTarget = cloneProject(eccPublicKeyValidationProject.project);
const brokenEccPublicKeyValidationStart = cloneProject(eccPublicKeyValidationProject.project);
const visibleSchnorrTarget = cloneProject(visibleSchnorrProject.project);
const brokenVisibleSchnorrStart = cloneProject(visibleSchnorrProject.project);
const schnorrNonceReuseTarget = cloneProject(schnorrNonceReuseProject.project);
const brokenSchnorrNonceReuseStart = cloneProject(schnorrNonceReuseProject.project);
const schnorrChallengeBindingTarget = cloneProject(schnorrChallengeBindingProject.project);
const brokenSchnorrChallengeBindingStart = cloneProject(schnorrChallengeBindingProject.project);
const visibleSignatureVerificationTarget = cloneProject(visibleSignatureVerificationProject.project);
const brokenVisibleSignatureVerificationStart = cloneProject(
  visibleSignatureVerificationProject.project,
);
const visibleSecureHandshakeTarget = cloneProject(visibleSecureHandshakeProject.project);
const brokenVisibleSecureHandshakeStart = cloneProject(visibleSecureHandshakeProject.project);
const keyScheduleWorkshopTarget = cloneProject(keyScheduleWorkshopProject.project);
const brokenKeyScheduleWorkshopStart = cloneProject(keyScheduleWorkshopProject.project);
const recursiveKeyScheduleTarget = cloneProject(recursiveKeyScheduleProject.project);
const brokenRecursiveKeyScheduleStart = cloneProject(recursiveKeyScheduleProject.project);
const visibleBlockChainingTarget = cloneProject(visibleBlockChainingProject.project);
const brokenVisibleBlockChainingStart = cloneProject(visibleBlockChainingProject.project);
const visibleByteOrderTarget = cloneProject(visibleByteOrderProject.project);
const brokenVisibleByteOrderStart = cloneProject(visibleByteOrderProject.project);
const visibleTamperCheckTarget = cloneProject(visibleTamperCheckProject.project);
const brokenVisibleTamperCheckStart = cloneProject(visibleTamperCheckProject.project);
const visibleAuthenticatedEncryptionTarget = cloneProject(visibleAuthenticatedEncryptionProject.project);
const brokenVisibleAuthenticatedEncryptionStart = cloneProject(
  visibleAuthenticatedEncryptionProject.project,
);

const brokenKeyModule = brokenBridgeStart.modules.find((moduleInstance) => moduleInstance.id === 'key');
if (!brokenKeyModule) {
  throw new Error('Expected bridge demo project to contain a key module.');
}
brokenKeyModule.params.stream = [0, 0, 0, 0, 0];

const brokenBeyondXorMask = brokenBeyondXorStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'mask',
);
if (!brokenBeyondXorMask) {
  throw new Error('Expected beyond-xor demo project to contain a mask source.');
}
brokenBeyondXorMask.params.stream = [0, 0, 1, 1, 1, 1, 0, 0];

const brokenSplitModule = brokenSplitTransformStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'split',
);
if (!brokenSplitModule) {
  throw new Error('Expected split-transform-rejoin demo project to contain a split module.');
}
brokenSplitModule.params.leftWidth = 4;

const brokenPadModule = brokenPadAndSplitStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'pad',
);
if (!brokenPadModule) {
  throw new Error('Expected pad-and-split demo project to contain a pad module.');
}
brokenPadModule.params.targetWidth = 12;

const brokenControlThreshold = brokenControlStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'threshold',
);
if (!brokenControlThreshold) {
  throw new Error('Expected counter-pulse-gate demo project to contain a threshold module.');
}
brokenControlThreshold.params.value = 'C';

const brokenBypassShift = brokenBypassWorkshopStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'shift',
);
if (!brokenBypassShift) {
  throw new Error('Expected bypass-workshop demo project to contain a shift module.');
}
brokenBypassShift.bypass = true;

const brokenProtocolIv = brokenProtocolMaterialStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'iv',
);
if (!brokenProtocolIv) {
  throw new Error('Expected protocol-material-mixer demo project to contain an IV module.');
}
brokenProtocolIv.params.value = '00';

const brokenMiddleRotor = brokenAdvancedRotorSteppingStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'middle',
);
if (!brokenMiddleRotor) {
  throw new Error('Expected advanced-rotor-stepping demo project to contain a middle rotor.');
}
brokenMiddleRotor.params.notches = 'F';

const brokenLeftRotorForRingSetting = brokenRotorRingSettingStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'left',
);
if (!brokenLeftRotorForRingSetting) {
  throw new Error('Expected advanced-rotor-stepping demo project to contain a left rotor.');
}
brokenLeftRotorForRingSetting.params.position = 2;
brokenLeftRotorForRingSetting.params.ringOffset = 0;

const brokenSymbolPermutation = brokenVisibleSymbolScrambleStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'permute',
);
if (!brokenSymbolPermutation) {
  throw new Error('Expected visible-symbol-scramble demo project to contain a permutation module.');
}
brokenSymbolPermutation.params.order = '2,1,3,0';

const brokenWindowTwo = brokenVisibleSubkeyBusStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'window-2',
);
if (!brokenWindowTwo) {
  throw new Error('Expected visible-subkey-bus demo project to contain window-2.');
}
brokenWindowTwo.params.start = 4;

const brokenBitSelect = brokenVisibleKeySelectionStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'select',
);
if (!brokenBitSelect) {
  throw new Error('Expected visible-key-selection demo project to contain a select module.');
}
// Break it by swapping indices 6 and 7 — position 7 was the dropped parity bit, now included
brokenBitSelect.params.order = '0,1,2,3,4,5,7,8,9,10,11,12,13,14';

const brokenBitExpand = brokenVisibleKeyExpansionStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'expand',
);
if (!brokenBitExpand) {
  throw new Error('Expected visible-key-expansion demo project to contain an expand module.');
}
// Break it by removing the second duplicate — order '3,0,1,2,3,0' becomes '3,0,1,2,1,0'
// The repeated boundary bit (index 3) is replaced with a non-boundary bit (index 1)
brokenBitExpand.params.order = '3,0,1,2,1,0';

const brokenEnigmaRightRotor = brokenEnigmaMachineStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'right',
);
if (!brokenEnigmaRightRotor) {
  throw new Error('Expected enigma-machine demo project to contain a right rotor.');
}
const brokenEnigmaRightRev = brokenEnigmaMachineStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'right-rev',
);
if (!brokenEnigmaRightRev) {
  throw new Error('Expected enigma-machine demo project to contain a right-rev rotor.');
}
// Break it: swap the first two entries in Rotor III wiring (B,D → D,B)
// This corrupts position 0 mapping and breaks self-reciprocal property
const brokenWiring = ['D','B','F','H','J','L','C','P','R','T','X','V','Z','N','Y','E','I','W','G','A','K','M','U','S','Q','O'];
brokenEnigmaRightRotor.params.wiring = brokenWiring;
// right-rev must also be corrupted the same way (it mirrors the forward rotor)
brokenEnigmaRightRev.params.wiring = brokenWiring;

const brokenFeistelKey2 = brokenVisibleFeistelRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'key2',
);
if (!brokenFeistelKey2) {
  throw new Error('Expected visible-feistel-round demo project to contain key2.');
}
// Break it: zero out round 2 key — F(R1, 0) leaks structure because XOR with 0 is identity
brokenFeistelKey2.params.stream = [0, 0, 0, 0];

const brokenSymbolWindowTwo = brokenVisibleMessageWindowStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'window-2',
);
if (!brokenSymbolWindowTwo) {
  throw new Error('Expected visible-message-window demo project to contain window-2.');
}
brokenSymbolWindowTwo.params.start = 1;

const brokenUnpadModule = brokenMultiplyCompareUnpadStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'unpad',
);
if (!brokenUnpadModule) {
  throw new Error('Expected multiply-compare-unpad demo project to contain unpad.');
}
brokenUnpadModule.params.originalWidth = 12;

const brokenPrivExp = brokenToyRsaStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'priv-exp',
);
if (!brokenPrivExp) {
  throw new Error('Expected toy-rsa demo project to contain a priv-exp module.');
}
brokenPrivExp.params.value = '02';

const brokenBobPrivateExp = brokenDiffieHellmanStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'bob-private',
);
if (!brokenBobPrivateExp) {
  throw new Error('Expected diffie-hellman-key-exchange demo project to contain bob-private.');
}
brokenBobPrivateExp.params.value = '0E';

const brokenGf2MulModule = brokenGf2MultiplyStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gf-mul',
);
if (!brokenGf2MulModule) {
  throw new Error('Expected gf2-multiply demo project to contain gf-mul module.');
}
brokenGf2MulModule.params.poly = '11D';

const visibleMixColumnsTarget = cloneProject(visibleMixColumnsProject.project);
const brokenVisibleMixColumnsStart = cloneProject(visibleMixColumnsProject.project);
const brokenMixColumnsMulModule = brokenVisibleMixColumnsStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gf-2s0',
);
if (!brokenMixColumnsMulModule) {
  throw new Error('Expected visible-mix-columns demo project to contain gf-2s0 module.');
}
brokenMixColumnsMulModule.params.poly = '11D';

const visibleSubBytesTarget = cloneProject(visibleSubBytesProject.project);
const brokenVisibleSubBytesStart = cloneProject(visibleSubBytesProject.project);
const brokenSubBytesConstant = brokenVisibleSubBytesStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'c63',
);
if (!brokenSubBytesConstant) {
  throw new Error('Expected visible-subbytes demo project to contain c63 module.');
}
brokenSubBytesConstant.params.value = '65';

const visibleAddRoundKeyTarget = cloneProject(visibleAddRoundKeyProject.project);
const brokenVisibleAddRoundKeyStart = cloneProject(visibleAddRoundKeyProject.project);
const brokenAddRoundKeyModule = brokenVisibleAddRoundKeyStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'k0',
);
if (!brokenAddRoundKeyModule) {
  throw new Error('Expected visible-add-round-key demo project to contain k0 module.');
}
brokenAddRoundKeyModule.params.value = 'B0';

const visibleAesKeyScheduleProject = demoProjects.find(
  (project) => project.id === 'visible-aes-key-schedule',
);
if (!visibleAesKeyScheduleProject) {
  throw new Error('Expected visible-aes-key-schedule demo project to seed starter challenges.');
}
const visibleAesKeyScheduleTarget = cloneProject(visibleAesKeyScheduleProject.project);
const brokenAesKeyScheduleStart = cloneProject(visibleAesKeyScheduleProject.project);
// Break: change Rcon[1] from 01000000 to 03000000 (wrong round constant)
const brokenRconModule = brokenAesKeyScheduleStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'rcon1',
);
if (!brokenRconModule) {
  throw new Error('Expected visible-aes-key-schedule demo project to contain rcon1 module.');
}
brokenRconModule.params.value = '03000000';

const aesRoundFullTarget = cloneProject(aesRoundFullProject.project);
const brokenAesRoundFullStart = cloneProject(aesRoundFullProject.project);
const brokenAesRoundSBox = brokenAesRoundFullStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'sub-2-1',
);
if (!brokenAesRoundSBox) {
  throw new Error('Expected aes-round-full demo project to contain sub-2-1 module.');
}
brokenAesRoundSBox.params.table = Array.from({ length: 256 }, (_, index) => index).join(',');

const aesRowPerturbationTarget = cloneProject(aesRowPerturbationProject.project);
const brokenAesRowPerturbationStart = cloneProject(aesRowPerturbationProject.project);
const canonicalShiftRowsModule = aesRowPerturbationTarget.modules.find(
  (moduleInstance) => moduleInstance.id === 'canonical-shift-rows',
);
const correctedPerturbedShiftRowsModule = aesRowPerturbationTarget.modules.find(
  (moduleInstance) => moduleInstance.id === 'perturbed-shift-rows',
);
if (!canonicalShiftRowsModule || !correctedPerturbedShiftRowsModule) {
  throw new Error('Expected aes-row-perturbation demo project to contain both ShiftRows branches.');
}
correctedPerturbedShiftRowsModule.params.order = canonicalShiftRowsModule.params.order;

const aesColumnPerturbationTarget = cloneProject(aesColumnPerturbationProject.project);
const brokenAesColumnPerturbationStart = cloneProject(aesColumnPerturbationProject.project);
const repairedAesColumnCoefficient = aesColumnPerturbationTarget.modules.find(
  (moduleInstance) => moduleInstance.id === 'perturbed-mix-row0-col1-coeff',
);
if (!repairedAesColumnCoefficient) {
  throw new Error('Expected aes-column-perturbation demo project to contain the perturbed coefficient source.');
}
repairedAesColumnCoefficient.params.value = '03';

const brokenVisiblePointMechanicsConnections = brokenVisiblePointMechanicsStart.connections;
const brokenVisiblePointMechanicsInverseIndex = brokenVisiblePointMechanicsConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'negate' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'inverse-sum' &&
    connection.to.port === 'b',
);
if (brokenVisiblePointMechanicsInverseIndex === -1) {
  throw new Error('Expected visible-point-mechanics demo project to contain the negate -> inverse-sum.b leg.');
}
brokenVisiblePointMechanicsConnections[brokenVisiblePointMechanicsInverseIndex] = {
  from: { moduleId: 'point', port: 'out' },
  to: { moduleId: 'inverse-sum', port: 'b' },
};

const brokenVisibleScalarMultiplicationConnections = brokenVisibleScalarMultiplicationStart.connections;
const brokenVisibleScalarMultiplicationVerifyIndex =
  brokenVisibleScalarMultiplicationConnections.findIndex(
    (connection) =>
      connection.from.moduleId === 'point' &&
      connection.from.port === 'out' &&
      connection.to.moduleId === 'verify-3-add' &&
      connection.to.port === 'b',
  );
if (brokenVisibleScalarMultiplicationVerifyIndex === -1) {
  throw new Error(
    'Expected visible-scalar-multiplication demo project to contain the point -> verify-3-add.b leg.',
  );
}
brokenVisibleScalarMultiplicationConnections[brokenVisibleScalarMultiplicationVerifyIndex] = {
  from: { moduleId: 'times-2', port: 'out' },
  to: { moduleId: 'verify-3-add', port: 'b' },
};

const brokenVisibleDoubleAndAddConnections = brokenVisibleDoubleAndAddStart.connections;
const brokenVisibleDoubleAndAddSelectIndex = brokenVisibleDoubleAndAddConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'bit-mid' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'step1-select' &&
    connection.to.port === 'select',
);
if (brokenVisibleDoubleAndAddSelectIndex === -1) {
  throw new Error(
    'Expected visible-double-and-add demo project to contain the bit-mid -> step1-select.select leg.',
  );
}
brokenVisibleDoubleAndAddConnections[brokenVisibleDoubleAndAddSelectIndex] = {
  from: { moduleId: 'bit-lsb', port: 'out' },
  to: { moduleId: 'step1-select', port: 'select' },
};

const brokenToyCurvePointMapModule = brokenToyCurvePointMapStart.modules.find((module) => module.id === 'map');
if (!brokenToyCurvePointMapModule) {
  throw new Error('Expected toy-curve-point-map demo project to contain the map module.');
}
brokenToyCurvePointMapModule.params = {
  ...brokenToyCurvePointMapModule.params,
  selectedY: 11,
};

const brokenKeyedSBoxKeySource = brokenKeyedSBoxAuthoringStart.modules.find((module) => module.id === 'key-source');
if (!brokenKeyedSBoxKeySource) {
  throw new Error('Expected keyed-sbox-authoring demo project to contain the key-source module.');
}
brokenKeyedSBoxKeySource.params = {
  ...brokenKeyedSBoxKeySource.params,
  stream: [1, 1],
};

const brokenVisibleEcdhConnections = brokenVisibleEcdhStart.connections;
const brokenVisibleEcdhSharedLegIndex = brokenVisibleEcdhConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'alice-public' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'bob-shared' &&
    connection.to.port === 'point',
);
if (brokenVisibleEcdhSharedLegIndex === -1) {
  throw new Error('Expected visible-ecdh-key-agreement demo project to contain the Alice public -> Bob shared leg.');
}
brokenVisibleEcdhConnections[brokenVisibleEcdhSharedLegIndex] = {
  from: { moduleId: 'base-point', port: 'out' },
  to: { moduleId: 'bob-shared', port: 'point' },
};

const brokenVisiblePointOrderConnections = brokenVisiblePointOrderStart.connections;
const brokenVisiblePointOrderScalarIndex = brokenVisiblePointOrderConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'order-q' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'verify-q' &&
    connection.to.port === 'scalar',
);
if (brokenVisiblePointOrderScalarIndex === -1) {
  throw new Error(
    'Expected visible-point-order-and-subgroups demo project to contain the order-q -> verify-q scalar leg.',
  );
}
brokenVisiblePointOrderConnections[brokenVisiblePointOrderScalarIndex] = {
  from: { moduleId: 'order-p', port: 'out' },
  to: { moduleId: 'verify-q', port: 'scalar' },
};

const repairedLowOrderSharedAIndex = ecdhLowOrderPointTarget.connections.findIndex(
  (connection) =>
    connection.from.moduleId === 'low-order-peer' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'collapse-shared-a' &&
    connection.to.port === 'point',
);
if (repairedLowOrderSharedAIndex === -1) {
  throw new Error(
    'Expected ecdh-low-order-point-consequence target project to contain the low-order-peer -> collapse-shared-a leg.',
  );
}
ecdhLowOrderPointTarget.connections[repairedLowOrderSharedAIndex] = {
  from: { moduleId: 'honest-peer-public', port: 'out' },
  to: { moduleId: 'collapse-shared-a', port: 'point' },
};

const repairedLowOrderSharedAprimeIndex = ecdhLowOrderPointTarget.connections.findIndex(
  (connection) =>
    connection.from.moduleId === 'low-order-peer' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'collapse-shared-aprime' &&
    connection.to.port === 'point',
);
if (repairedLowOrderSharedAprimeIndex === -1) {
  throw new Error(
    'Expected ecdh-low-order-point-consequence target project to contain the low-order-peer -> collapse-shared-aprime leg.',
  );
}
ecdhLowOrderPointTarget.connections[repairedLowOrderSharedAprimeIndex] = {
  from: { moduleId: 'honest-peer-public', port: 'out' },
  to: { moduleId: 'collapse-shared-aprime', port: 'point' },
};

const repairedPublicKeyValidationSharedAIndex = eccPublicKeyValidationTarget.connections.findIndex(
  (connection) =>
    connection.from.moduleId === 'accepted-peer-broken' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'collapse-shared-a' &&
    connection.to.port === 'point',
);
if (repairedPublicKeyValidationSharedAIndex === -1) {
  throw new Error(
    'Expected ecc-public-key-validation-consequence target project to contain the accepted-peer-broken -> collapse-shared-a leg.',
  );
}
eccPublicKeyValidationTarget.connections[repairedPublicKeyValidationSharedAIndex] = {
  from: { moduleId: 'accepted-peer-honest', port: 'out' },
  to: { moduleId: 'collapse-shared-a', port: 'point' },
};

const repairedPublicKeyValidationSharedAprimeIndex = eccPublicKeyValidationTarget.connections.findIndex(
  (connection) =>
    connection.from.moduleId === 'accepted-peer-broken' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'collapse-shared-aprime' &&
    connection.to.port === 'point',
);
if (repairedPublicKeyValidationSharedAprimeIndex === -1) {
  throw new Error(
    'Expected ecc-public-key-validation-consequence target project to contain the accepted-peer-broken -> collapse-shared-aprime leg.',
  );
}
eccPublicKeyValidationTarget.connections[repairedPublicKeyValidationSharedAprimeIndex] = {
  from: { moduleId: 'accepted-peer-honest', port: 'out' },
  to: { moduleId: 'collapse-shared-aprime', port: 'point' },
};

const brokenVisibleSchnorrConnections = brokenVisibleSchnorrStart.connections;
const brokenVisibleSchnorrPublicBranchIndex = brokenVisibleSchnorrConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'public' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'verify-scale-public' &&
    connection.to.port === 'point',
);
if (brokenVisibleSchnorrPublicBranchIndex === -1) {
  throw new Error('Expected visible-schnorr-signature demo project to contain the public -> verify-scale-public leg.');
}
brokenVisibleSchnorrConnections[brokenVisibleSchnorrPublicBranchIndex] = {
  from: { moduleId: 'base-point', port: 'out' },
  to: { moduleId: 'verify-scale-public', port: 'point' },
};

const repairedSchnorrNonceReuseTargetConnections = schnorrNonceReuseTarget.connections;
const repairedSchnorrNonceReuseCommitmentIndex = repairedSchnorrNonceReuseTargetConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'nonce-a' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'commitment-b' &&
    connection.to.port === 'scalar',
);
if (repairedSchnorrNonceReuseCommitmentIndex === -1) {
  throw new Error(
    'Expected schnorr-nonce-reuse-consequence target project to contain the reused nonce -> commitment-b scalar leg.',
  );
}
repairedSchnorrNonceReuseTargetConnections[repairedSchnorrNonceReuseCommitmentIndex] = {
  from: { moduleId: 'nonce-b', port: 'out' },
  to: { moduleId: 'commitment-b', port: 'scalar' },
};

const repairedSchnorrNonceReuseResponseIndex = repairedSchnorrNonceReuseTargetConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'nonce-a' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'response-b' &&
    connection.to.port === 'nonce',
);
if (repairedSchnorrNonceReuseResponseIndex === -1) {
  throw new Error(
    'Expected schnorr-nonce-reuse-consequence target project to contain the reused nonce -> response-b nonce leg.',
  );
}
repairedSchnorrNonceReuseTargetConnections[repairedSchnorrNonceReuseResponseIndex] = {
  from: { moduleId: 'nonce-b', port: 'out' },
  to: { moduleId: 'response-b', port: 'nonce' },
};

const repairedSchnorrChallengeBindingTargetConnections = schnorrChallengeBindingTarget.connections;
const repairedSchnorrChallengeBindingMessageIndex = repairedSchnorrChallengeBindingTargetConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'message-sig' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'broken-verify-challenge' &&
    connection.to.port === 'message',
);
if (repairedSchnorrChallengeBindingMessageIndex === -1) {
  throw new Error(
    'Expected schnorr-challenge-binding-consequence target project to contain the message-sig -> broken-verify-challenge message leg.',
  );
}
repairedSchnorrChallengeBindingTargetConnections[repairedSchnorrChallengeBindingMessageIndex] = {
  from: { moduleId: 'message-claim', port: 'out' },
  to: { moduleId: 'broken-verify-challenge', port: 'message' },
};

const brokenSignatureVerifyExp = brokenVisibleSignatureVerificationStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'public-exp',
);
if (!brokenSignatureVerifyExp) {
  throw new Error('Expected visible-signature-verification demo project to contain public-exp.');
}
brokenSignatureVerifyExp.params.value = '02';

const brokenVisibleSecureHandshakeConnections = brokenVisibleSecureHandshakeStart.connections;
const brokenHandshakeKeySourceIndex = brokenVisibleSecureHandshakeConnections.findIndex(
  (connection) =>
    connection.from.moduleId === 'sender-session' &&
    connection.from.port === 'out' &&
    connection.to.moduleId === 'encrypt' &&
    connection.to.port === 'b',
);
if (brokenHandshakeKeySourceIndex === -1) {
  throw new Error('Expected visible-secure-handshake demo project to contain the derived-key link into encrypt.');
}
brokenVisibleSecureHandshakeConnections[brokenHandshakeKeySourceIndex] = {
  from: { moduleId: 'sender-public', port: 'out' },
  to: { moduleId: 'encrypt', port: 'b' },
};

const brokenRotate = brokenKeyScheduleWorkshopStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'rotate',
);
if (!brokenRotate) {
  throw new Error('Expected key-schedule-workshop demo project to contain a rotate module.');
}
brokenRotate.params.amount = 5;

const brokenRecursiveRoundConst = brokenRecursiveKeyScheduleStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'round-const-3',
);
if (!brokenRecursiveRoundConst) {
  throw new Error('Expected recursive-key-schedule demo project to contain round-const-3.');
}
brokenRecursiveRoundConst.params.value = '00';

const brokenVisibleBlockChainingConnections = brokenVisibleBlockChainingStart.connections;
const chainTwoSourceIndex = brokenVisibleBlockChainingConnections.findIndex(
  (connection) => connection.to.moduleId === 'chain-2' && connection.to.port === 'a',
);
if (chainTwoSourceIndex < 0) {
  throw new Error('Expected visible-block-chaining demo project to contain a chaining edge into chain-2.');
}
brokenVisibleBlockChainingConnections[chainTwoSourceIndex] = {
  from: { moduleId: 'iv', port: 'out' },
  to: { moduleId: 'chain-2', port: 'a' },
};

const brokenVisibleByteOrderConnections = brokenVisibleByteOrderStart.connections;
const swapSourceIndex = brokenVisibleByteOrderConnections.findIndex(
  (connection) => connection.to.moduleId === 'swap-hex' && connection.to.port === 'in',
);
if (swapSourceIndex < 0) {
  throw new Error('Expected visible-byte-order demo project to contain a swap output connection.');
}
brokenVisibleByteOrderConnections[swapSourceIndex] = {
  from: { moduleId: 'word', port: 'out' },
  to: { moduleId: 'swap-hex', port: 'in' },
};

const brokenReceiverKey = brokenVisibleTamperCheckStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'receiver-key',
);
if (!brokenReceiverKey) {
  throw new Error('Expected visible-tamper-check demo project to contain receiver-key.');
}
brokenReceiverKey.params.value = '0F00';

const brokenVisibleAuthenticatedEncryptionConnections =
  brokenVisibleAuthenticatedEncryptionStart.connections;
const verifyCipherSourceIndex = brokenVisibleAuthenticatedEncryptionConnections.findIndex(
  (connection) => connection.to.moduleId === 'verify-mix' && connection.to.port === 'a',
);
if (verifyCipherSourceIndex < 0) {
  throw new Error(
    'Expected visible-authenticated-encryption demo project to authenticate ciphertext at verify-mix.',
  );
}
brokenVisibleAuthenticatedEncryptionConnections[verifyCipherSourceIndex] = {
  from: { moduleId: 'plain-join', port: 'out' },
  to: { moduleId: 'verify-mix', port: 'a' },
};

const brokenBaudotSource = brokenBaudotStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenBaudotSource) {
  throw new Error('Expected baudot-bridge demo project to contain a baudot source.');
}
brokenBaudotSource.params.value = 'BEST';

const polluxFractionationTarget = cloneProject(polluxFractionationProject.project);
const brokenPolluxFractionationStart = cloneProject(polluxFractionationProject.project);
const brokenPolluxModule = brokenPolluxFractionationStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'pollux',
);
if (!brokenPolluxModule) {
  throw new Error('Expected pollux-fractionation demo project to contain a pollux module.');
}
brokenPolluxModule.params.oneAlphabet = 'N,O,P';

const polluxRoundTripTarget = cloneProject(polluxRoundTripProject.project);
const brokenPolluxRoundTripStart = cloneProject(polluxRoundTripProject.project);
const brokenPolluxRoundTripDecode = brokenPolluxRoundTripStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'decode',
);
if (!brokenPolluxRoundTripDecode) {
  throw new Error('Expected pollux-round-trip demo project to contain a decode module.');
}
brokenPolluxRoundTripDecode.params.zeroAlphabet = 'X,Q,N';
brokenPolluxRoundTripDecode.params.oneAlphabet = 'M,O,Z';

const polluxControlledSelectionTarget = cloneProject(polluxControlledSelectionProject.project);
const brokenPolluxControlledSelectionStart = cloneProject(polluxControlledSelectionProject.project);
const brokenPolluxSelectorSource = brokenPolluxControlledSelectionStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'selector',
);
if (!brokenPolluxSelectorSource) {
  throw new Error('Expected pollux-controlled-selection demo project to contain a selector source.');
}
brokenPolluxSelectorSource.params.step = 2;

const brokenLorenzLfsr = brokenLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenLorenzLfsr) {
  throw new Error('Expected lorenz-foundation demo project to contain an LFSR module.');
}
brokenLorenzLfsr.params.seed = [0, 0, 0, 0, 1];

const brokenGatedLorenzGate = brokenGatedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gate',
);
if (!brokenGatedLorenzGate) {
  throw new Error('Expected gated-lorenz demo project to contain a gate LFSR module.');
}
brokenGatedLorenzGate.params.seed = [0, 1, 0, 1, 0];

const brokenPairedLorenzWheelB = brokenPairedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'wheel-b',
);
if (!brokenPairedLorenzWheelB) {
  throw new Error('Expected paired-lorenz demo project to contain wheel-b.');
}
brokenPairedLorenzWheelB.params.seed = [0, 0, 1, 1, 0];

const brokenBankedLorenzControlB = brokenBankedLorenzStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'control-b',
);
if (!brokenBankedLorenzControlB) {
  throw new Error('Expected banked-lorenz demo project to contain control-b.');
}
brokenBankedLorenzControlB.params.seed = [0, 1, 1, 0, 0];

brokenIteratedByteRoundsStart.connections = brokenIteratedByteRoundsStart.connections.filter(
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
brokenIteratedByteRoundsStart.connections.push({
  from: { moduleId: 'source', port: 'out' },
  to: { moduleId: 'round-2', port: 'in' },
});
brokenIteratedByteRoundsStart.connections.push({
  from: { moduleId: 'round-1', port: 'out' },
  to: { moduleId: 'encode', port: 'in' },
});

const brokenKeyedRoundKey = brokenKeyedByteRoundsStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'key-2',
);
if (!brokenKeyedRoundKey) {
  throw new Error('Expected keyed-byte-rounds demo project to contain key-2.');
}
brokenKeyedRoundKey.params.value = '00';

const brokenKeyBusModule = brokenKeyedByteIteratorStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'keybus',
);
if (!brokenKeyBusModule) {
  throw new Error('Expected keyed-byte-iterator demo project to contain keybus.');
}
brokenKeyBusModule.params.value = '1C00';

const brokenFeistelKeyBus = brokenFeistelStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'keybus',
);
if (!brokenFeistelKeyBus) {
  throw new Error('Expected feistel-network demo project to contain keybus.');
}
brokenFeistelKeyBus.params.value = '10';

const brokenPermutationModule = brokenByteRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'permute',
);
if (!brokenPermutationModule) {
  throw new Error('Expected byte-round demo project to contain a permutation module.');
}
brokenPermutationModule.params.order = '0,1,2,3,4,5,6,7';

const brokenSBoxTransformModule = brokenSBoxTableTransformStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'sbox',
);
if (!brokenSBoxTransformModule) {
  throw new Error('Expected sbox-table-transform demo project to contain an S-Box module.');
}
brokenSBoxTransformModule.params.table = '14,4,13,1,8,2,15,11,3,10,6,12,5,9,0,7';

const brokenHexSource = brokenHexRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenHexSource) {
  throw new Error('Expected hex-round demo project to contain a hex source.');
}
brokenHexSource.params.value = '3A';

const brokenAsciiSource = brokenAsciiRoundStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'source',
);
if (!brokenAsciiSource) {
  throw new Error('Expected ascii-round demo project to contain an ASCII source.');
}
brokenAsciiSource.params.value = 'C';

const brokenKeystreamLfsr = brokenKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenKeystreamLfsr) {
  throw new Error('Expected keystream demo project to contain an LFSR module.');
}
brokenKeystreamLfsr.params.seed = [0, 1, 1, 0, 1];

const brokenPredictabilitySource = brokenLfsrPredictabilityStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'prediction',
);
if (!brokenPredictabilitySource) {
  throw new Error('Expected lfsr-predictability demo project to contain a prediction source.');
}
brokenPredictabilitySource.params.stream = [0, 1, 1, 0, 1, 0, 0, 1, 0];

const brokenRandomnessLfsr = brokenRandomnessLabStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenRandomnessLfsr) {
  throw new Error('Expected lfsr-predictability demo project to contain an LFSR module for randomness analysis.');
}
brokenRandomnessLfsr.params.taps = '0';

const brokenGateLfsr = brokenGatedKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'gate',
);
if (!brokenGateLfsr) {
  throw new Error('Expected gated-keystream demo project to contain a gate LFSR.');
}
brokenGateLfsr.params.seed = [0, 1, 0, 1, 0];

const brokenMajorityControlB = brokenMajorityKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'control-b',
);
if (!brokenMajorityControlB) {
  throw new Error('Expected majority-keystream demo project to contain control-b.');
}
brokenMajorityControlB.params.seed = [0, 0, 0, 1, 0];

const brokenFilteredControl = brokenFilteredKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'control',
);
if (!brokenFilteredControl) {
  throw new Error('Expected filtered-keystream demo project to contain a control register.');
}
brokenFilteredControl.params.seed = [0];

const brokenRoutedControl = brokenRoutedClockKeystreamStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'control',
);
if (!brokenRoutedControl) {
  throw new Error('Expected routed-clock-keystream demo project to contain a control register.');
}
brokenRoutedControl.params.seed = [0];

const brokenClockModule = brokenSequentialStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'clock',
);
if (!brokenClockModule) {
  throw new Error('Expected sequential demo project to contain a clock module.');
}
brokenClockModule.params.period = 2;

const brokenTapModule = brokenSequentialTapsStart.modules.find(
  (moduleInstance) => moduleInstance.id === 'lfsr',
);
if (!brokenTapModule) {
  throw new Error('Expected sequential demo project to contain an LFSR module.');
}
brokenTapModule.params.taps = '1,4';

export const STARTER_CHALLENGES: GuidedChallenge[] = [
  {
    version: 1,
    id: 'repair-the-rsa-private-exponent',
    title: 'Repair the RSA Private Exponent',
    projectId: 'visible-rsa-key-generation',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory' as const,
    order: 226.5,
    difficulty: 'intermediate' as const,
    recommendedAfter: ['visible-rsa-key-generation'],
    prompt:
      'The ModInverse module is using the wrong modulus to compute the private exponent d. The decryption output should recover the original message 0x02, but it does not. Fix the ModInverse modulus to the correct value of φ(n), then watch the full RSA round trip succeed.',
    startingProject: brokenRsaKeyGenStart,
    startingLayout: cloneProject(visibleRsaKeyGenProject.layout),
    targetProject: rsaKeyGenTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The private exponent d = e⁻¹ mod φ(n). The ModInverse modulus must be φ(n), not some other number.',
      'φ(n) = (p−1)(q−1) = 4×6 = 24. In hex, 24 = 0x18.',
      "Click d-inv, open the Inspector, and change the modulus parameter from '16' to '18'.",
    ],
  },
  {
    version: 1,
    id: 'repair-the-transposition-order',
    title: 'Repair the Transposition Order',
    projectId: 'columnar-transposition-cipher',
    group: 'Classical Machines',
    stage: 'classical-symbol-machines' as const,
    order: 55.5,
    difficulty: 'beginner' as const,
    recommendedAfter: ['columnar-transposition-cipher'],
    prompt:
      'The column reading order is wrong. The current permutation reads columns in keyword-position order (K first, then E, then Y) instead of alphabetical-rank order. With keyword "KEY", the correct rank order is E=1st, K=2nd, Y=3rd. Fix the SymbolPermutation order so the ciphertext matches the reference.',
    startingProject: brokenTranspositionStart,
    startingLayout: cloneProject(columnarTranspositionProject.layout),
    targetProject: transpositionTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The keyword is KEY. Rank each letter alphabetically: E=1st (column 1), K=2nd (column 0), Y=3rd (column 2).',
      'Read column 1 first (positions 1 and 4 in a 6-char input), then column 0 (positions 0,3), then column 2 (positions 2,5).',
      "Click the transpose module, open the Inspector, and set the order parameter to '1,4,0,3,2,5'.",
    ],
  },
  {
    version: 1,
    id: 'repair-the-vigenere-key',
    title: 'Repair the Vigenere Key',
    projectId: 'visible-vigenere-cipher',
    group: 'Classical Machines',
    stage: 'classical-symbol-machines' as const,
    order: 50.5,
    difficulty: 'beginner' as const,
    recommendedAfter: ['visible-vigenere-cipher'],
    prompt:
      'The second key letter in the Vigenere board is wrong. The second character should encrypt I with E to produce M, but the current key letter shifts it incorrectly. Fix the key letter in lane B so the ciphertext output matches the reference.',
    startingProject: brokenVigenereStart,
    startingLayout: cloneProject(visibleVigenereProject.layout),
    targetProject: vigenereTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The keyword is KEY. Lane B is the second character, which should use key letter E.',
      "Click the k-b module (the second key input) and check what letter it currently holds. Change it to E.",
      "I+E = 8+4 = 12 → M. The current wrong letter shifts I to N instead. Fix k-b's value to 'E'.",
    ],
  },
  {
    version: 1,
    id: 'repair-mask-word',
    title: 'Repair the Word Mask',
    projectId: 'beyond-xor',
    group: 'Foundations',
    difficulty: 'beginner',
    prompt:
      'This machine no longer relies on XOR alone. The word addition and rotation are still correct, but the boolean mask is wrong. Restore the mask source so the final hex output matches the captured reference machine again.',
    startingProject: brokenBeyondXorStart,
    startingLayout: cloneProject(beyondXorProject.layout),
    targetProject: beyondXorTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The ADD mod 2^n and rotate stages are already correct in this lab.',
      'Focus on the visible bit mask feeding the AND stage.',
      'A boolean operator is only as useful as the mask word it receives.',
    ],
  },
  {
    version: 1,
    id: 'repair-control-threshold',
    title: 'Repair the Control Threshold',
    projectId: 'counter-pulse-gate',
    group: 'Control Foundations',
    difficulty: 'beginner',
    prompt:
      'This machine should keep its data register frozen for the first few ticks, then allow it to advance once the counter reaches the right threshold word. The gate and comparison are wired correctly, but the threshold symbol is wrong. Restore it so the output stream matches the reference machine again.',
    startingProject: brokenControlStart,
    startingLayout: cloneProject(controlProject.layout),
    targetProject: controlTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The clock, counter, comparator, and gate are already connected correctly.',
      'Focus on the symbol feeding SymbolToBits before the AtLeast comparison.',
      'Step through ticks: the data register should stay still at first, then begin advancing only after the threshold is reached.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-iv',
    title: 'Repair the IV',
    projectId: 'protocol-material-mixer',
    group: 'Protocol Materials',
    difficulty: 'beginner',
    prompt:
      'This framed mixer keeps the message and key intact, but its IV has been replaced with the wrong value. Restore the IV so the graph once again matches the captured reference output and the upper branch is labeled by the right protocol material.',
    startingProject: brokenProtocolMaterialStart,
    startingLayout: cloneProject(protocolMaterialProject.layout),
    targetProject: protocolMaterialTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The message path, pad, split, and key source are already correct.',
      'Focus on the IV module, not the generic HexSource key.',
      'The captured reference machine uses a non-zero 8-bit IV value on the upper branch.',
    ],
  },
  {
    version: 1,
    id: 'repair-split-width',
    title: 'Repair the Split Width',
    projectId: 'split-transform-rejoin',
    group: 'Block Framing',
    difficulty: 'beginner',
    prompt:
      'This machine splits a 16-bit message into two blocks for independent processing, but the split boundary is wrong. The left block is too small and the right block is too large. Restore the split width so each half gets the right number of bits and the final hex output matches the captured reference machine again.',
    startingProject: brokenSplitTransformStart,
    startingLayout: cloneProject(splitTransformProject.layout),
    targetProject: splitTransformTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The XOR keys and join module are already wired correctly.',
      'Focus on the leftWidth parameter of the BitSplit module.',
      'A 16-bit message split into two equal halves means each half should be 8 bits.',
    ],
  },
  {
    version: 1,
    id: 'repair-pad-width',
    title: 'Repair the Pad Width',
    projectId: 'pad-and-split',
    group: 'Block Framing',
    difficulty: 'beginner',
    prompt:
      'This machine pads a short 8-bit input up to 16 bits before splitting it into two blocks, but the pad target is wrong. The padded output is too short for the split to produce two equal 8-bit halves. Fix the pad target width so the downstream split and transforms produce the correct output again.',
    startingProject: brokenPadAndSplitStart,
    startingLayout: cloneProject(padAndSplitProject.layout),
    targetProject: padAndSplitTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The split, XOR keys, and join are already correct.',
      'Focus on the targetWidth parameter of the BitPad module.',
      'An 8-bit source needs to be padded to 16 bits so the split can produce two 8-bit halves.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-hash-substitution',
    title: 'Repair the Hash Substitution',
    projectId: 'visible-compression-hash',
    group: 'Hash Foundations',
    difficulty: 'beginner',
    prompt:
      'The left path substitution has been replaced with an identity mapping — input passes through unchanged. The final digest no longer matches the reference. Restore the correct inverting S-Box on the left path so the output matches the expected digest.',
    startingProject: brokenVisibleCompressionHashStart,
    startingLayout: cloneProject(visibleCompressionHashProject.layout),
    targetProject: visibleCompressionHashTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the left path S-Box (l-sub) is wrong. The right path and compress step are correct.',
      'The correct S-Box for this hash is the inverting table: each byte is replaced by 255 minus itself.',
      'Click l-sub, open the Inspector, and find the table parameter. It currently reads 0,1,2,...,255. Change it to the inverse: 255,254,...,0.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-iv-reuse-attack',
    title: 'Repair the IV Reuse Attack',
    projectId: 'stream-cipher-iv-reuse-consequence',
    group: 'Stream Cipher Security',
    stage: 'modern-bit-machines' as const,
    order: 181.5,
    difficulty: 'beginner' as const,
    recommendedAfter: ['stream-cipher-iv-reuse-consequence'],
    prompt:
      "Two messages were encrypted with the same LFSR keystream. XORing the ciphertexts gives mA⊕mB. The attacker's crib (known-plaintext guess) is wrong — all zeros instead of Alice's real message. The recovery output does not match Bob's secret. Fix the crib to match Alice's actual message and watch the Equals module confirm recovery.",
    startingProject: brokenIvReuseStart,
    startingLayout: { ...ivReuseProject.layout, crib: { x: 1300, y: 540 } },
    targetProject: ivReuseTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      "The crib module is the attacker's guess of Alice's message. It currently reads all zeros, which is wrong.",
      "Look at the msg-a module — that shows Alice's actual plaintext bits. Set crib to the same bit pattern.",
      'Click crib, open the Inspector, and change the stream parameter to 0,1,1,0,1,0,1,0.',
    ],
  },
  {
    version: 1,
    id: 'find-the-oracle-c1-guess',
    title: 'Find the Oracle C1 Guess',
    projectId: 'cbc-padding-oracle-consequence',
    group: 'Stream Cipher Security',
    stage: 'modern-bit-machines' as const,
    order: 182.5,
    difficulty: 'intermediate' as const,
    recommendedAfter: ['cbc-padding-oracle-consequence'],
    prompt:
      "The padding oracle query is broken. c1-guess is set to all zeros, so the oracle decrypts to the wrong value and returns 0 (invalid padding). Find the correct c1-guess value that forces oracle-p = 0x01. Hint: look at i-out to read the intermediate value I, then compute I XOR 0x01.",
    startingProject: brokenCbcPaddingOracleStart,
    startingLayout: cloneProject(cbcPaddingOracleProject.layout),
    targetProject: cbcPaddingOracleTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The oracle checks whether I XOR c1-guess equals 0x01. You need to find c1-guess such that this holds.',
      'Read I from the i-out module. XOR each bit of I with the corresponding bit of 0x01 (00000001) to get the attack c1-guess.',
      "I = 00100011. XOR with 00000001 gives 00100010. Set c1-guess stream to 0,0,1,0,0,0,1,0.",
    ],
  },
  {
    version: 1,
    id: 'find-hash-collision',
    title: 'Find A Hash Collision',
    projectId: 'toy-compression-hash',
    group: 'Hash Foundations',
    difficulty: 'intermediate',
    prompt:
      'The Toy Compression Hash starts from a seeded 2-byte message. Change at least one of the two message bytes so the final digest stays exactly the same. Success means: different input, same digest.',
    startingProject: toyCompressionHashCollisionStart,
    startingLayout: cloneProject(toyCompressionHashProject.layout),
    targetProject: toyCompressionHashTarget,
    success: {
      kind: 'output-match-target-with-module-difference',
      moduleIds: ['left-source', 'right-source'],
    },
    hints: [
      'You are not trying to preserve the whole intermediate trace. Only the final digest has to match.',
      'At least one of the two HexSource values must change, or the challenge will not count as solved.',
      'A one-byte digest has only 256 possible outputs, so different 2-byte messages must eventually overlap.',
      'After you find one, keep both messages in view and open Analyze or Modern Cryptanalysis. Look for where the traces first diverge, then where the compression path folds those differences back into the same digest byte.',
    ],
  },
  {
    version: 1,
    id: 'find-sponge-collision',
    title: 'Find A Sponge Collision',
    projectId: 'toy-sponge-hash',
    group: 'Hash Foundations',
    difficulty: 'expert',
    prompt:
      'The Toy Sponge Hash begins from a seeded 2-byte message. Change at least one of the two message bytes so the final digest stays exactly the same. This should feel harder than the compression-hash collision because the message disturbs a larger internal state before the digest is squeezed out.',
    startingProject: toySpongeHashCollisionStart,
    startingLayout: cloneProject(toySpongeHashProject.layout),
    targetProject: toySpongeHashTarget,
    success: {
      kind: 'output-match-target-with-module-difference',
      moduleIds: ['left-source', 'right-source'],
    },
    hints: [
      'The goal is still simple: different message, same digest. You are not matching the whole internal trace.',
      'Use the HexSource stepping buttons to walk the message space instead of retyping every value.',
      'A richer internal structure can make the search feel harder without changing the fact that a 1-byte digest has only 256 outputs.',
      'After you find one, open Analyze or Modern Cryptanalysis and compare where the sponge absorbs the two messages differently, then where the later squeeze/fold path hides those differences behind the same digest.',
    ],
  },
  {
    version: 1,
    id: 'repair-bridge-key',
    title: 'Repair the Bridge Key',
    projectId: 'bridge',
    group: 'Foundations',
    difficulty: 'beginner',
    prompt:
      'The bridge pipeline was working, but the bit source changed. Adjust the machine until its output matches the reference behavior again.',
    startingProject: brokenBridgeStart,
    startingLayout: cloneProject(bridgeProject.layout),
    targetProject: fixedBridgeTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The problem is on the bit-domain side of the bridge pipeline, not the text input side.',
      'Compare the BitSource stream against the target behavior and follow it through XOR.',
    ],
  },
  {
    version: 1,
    id: 'restore-the-shift-stage',
    title: 'Restore the Shift Stage',
    projectId: 'bypass-workshop',
    group: 'Modern Rounds',
    difficulty: 'beginner',
    prompt:
      'The shift stage is still wired into the machine, but it was bypassed. Restore the original transformed output without deleting anything from the chain.',
    startingProject: brokenBypassWorkshopStart,
    startingLayout: cloneProject(bypassWorkshopProject.layout),
    targetProject: bypassWorkshopTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The graph topology is already correct in this lab.',
      'Select the BitShifter and inspect its module controls instead of editing the connections.',
      'Bypass is useful for comparison, but this challenge wants the transform active again.',
    ],
  },
  {
    version: 1,
    id: 'repair-pollux-fractionation',
    title: 'Repair the Pollux Fractionation',
    projectId: 'pollux-fractionation',
    group: 'Historical Bridges',
    difficulty: 'beginner',
    prompt:
      'The bit stream is still correct, but the one-symbol alphabet drifted away from the reference machine. Restore the fractionation mapping so the output matches the captured Pollux baseline again.',
    startingProject: brokenPolluxFractionationStart,
    startingLayout: cloneProject(polluxFractionationProject.layout),
    targetProject: polluxFractionationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The input bits are already correct in this lab.',
      'This is a symbol-set repair, not a wiring repair.',
      'Only the oneAlphabet drifted; the zeroAlphabet is still correct.',
    ],
  },
  {
    version: 1,
    id: 'repair-pollux-round-trip',
    title: 'Repair the Pollux Round Trip',
    projectId: 'pollux-round-trip',
    group: 'Historical Bridges',
    difficulty: 'beginner',
    prompt:
      'The sender still encodes the bit stream correctly, but the receiver no longer agrees on one of the Pollux alphabets. Repair the decoder so the recovered bits match the original source again and the verification sink returns to PASS.',
    startingProject: brokenPolluxRoundTripStart,
    startingLayout: cloneProject(polluxRoundTripProject.layout),
    targetProject: polluxRoundTripTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'This lab is about alphabet agreement, not rewiring the graph.',
      'Compare the encoder and decoder zeroAlphabet / oneAlphabet strings directly before changing anything else.',
      'PolluxInverse normalizes symbols to uppercase, so casing is not the real problem here.',
      'Use the recovered-bit sink and the verification sink together: the round-trip is only fixed when both line up with the original source again.',
    ],
  },
  {
    version: 1,
    id: 'repair-pollux-selector',
    title: 'Repair the Pollux Selector',
    projectId: 'pollux-controlled-selection',
    group: 'Historical Bridges',
    difficulty: 'beginner',
    prompt:
      'The sender and receiver still agree on the Pollux alphabets, so the recovered bit stream is fine, but the live selector counter drifted and the visible ciphertext no longer matches the captured reference machine. Restore the selector source so the controlled Pollux output matches the expected disguise again.',
    startingProject: brokenPolluxControlledSelectionStart,
    startingLayout: cloneProject(polluxControlledSelectionProject.layout),
    targetProject: polluxControlledSelectionTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'This lab is about the live selector source, not the zeroAlphabet / oneAlphabet strings.',
      'The receiver can still recover the message because PolluxInverse only cares about set membership.',
      'Compare the selector counter parameters against the intended stepping pattern before rewiring anything.',
    ],
  },
  {
    version: 1,
    id: 'repair-baudot-source',
    title: 'Repair the Baudot Source',
    projectId: 'baudot-bridge',
    group: 'Historical Bridges',
    difficulty: 'beginner',
    prompt:
      'The teleprinter bridge is wired correctly, but the Baudot source text was changed. Restore the source so the decoded telegraph output matches the captured reference machine again.',
    startingProject: brokenBaudotStart,
    startingLayout: cloneProject(baudotProject.layout),
    targetProject: baudotTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The bridge and output modules are already correct in this lab.',
      'Focus on the very first teleprinter text entering the graph.',
      'A one-letter change in the Baudot source changes the decoded result immediately.',
    ],
  },
  {
    version: 1,
    id: 'teleprinter-tweak',
    title: 'The Teleprinter Tweak',
    projectId: 'lorenz-foundation',
    group: 'Historical Bridges',
    difficulty: 'intermediate',
    prompt:
      'The teleprinter ciphertext and bridge are correct, but the keystream no longer unmasks the message properly. Repair the LFSR seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenLorenzStart,
    startingLayout: cloneProject(lorenzProject.layout),
    targetProject: lorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The source ciphertext is already correct in this lab.',
      'Focus on the LFSR seed feeding the XOR stage.',
      'If the keystream is wrong, the first divergence appears as soon as the wrong 5-bit group is unmixed.',
    ],
  },
  {
    version: 1,
    id: 'repair-wheel-gate',
    title: 'Repair the Wheel Gate',
    projectId: 'gated-lorenz',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter ciphertext and data wheel are still correct, but the gate wheel is stepping the 5-bit keystream at the wrong moments. Repair the gate seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenGatedLorenzStart,
    startingLayout: cloneProject(gatedLorenzProject.layout),
    targetProject: gatedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first wheel does not decode the message directly; it controls when the second wheel advances.',
      'Watch the gate output on each tick and compare its rhythm against the target run.',
      'If the gate wheel pauses the data wheel on the wrong codeword, the recovered teleprinter text drifts immediately.',
    ],
  },
  {
    version: 1,
    id: 'repair-wheel-pair',
    title: 'Repair the Wheel Pair',
    projectId: 'paired-lorenz',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter bridge and first wheel are still correct, but the second wheel stream is no longer combining into the right keystream. Repair the second wheel seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenPairedLorenzStart,
    startingLayout: cloneProject(pairedLorenzProject.layout),
    targetProject: pairedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both wheels advance on every tick in this lab.',
      'The first XOR stage combines the two wheel streams before the teleprinter text is unmixed.',
      'If wheel B is wrong, the mixed keystream diverges before the decode stage ever sees a valid codeword.',
    ],
  },
  {
    version: 1,
    id: 'repair-control-bank',
    title: 'Repair the Control Bank',
    projectId: 'banked-lorenz',
    group: 'Historical Bridges',
    difficulty: 'expert',
    prompt:
      'The teleprinter bridge and data wheel are still correct, but one control wheel is generating the wrong gate rhythm. Repair the second control wheel seed so the recovered Baudot output matches the captured reference machine again.',
    startingProject: brokenBankedLorenzStart,
    startingLayout: cloneProject(bankedLorenzProject.layout),
    targetProject: bankedLorenzTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The two control wheels are mixed first, and only that mixed bit stream clocks the data wheel.',
      'Watch the gate-mix output to see when the data wheel should or should not advance.',
      'A wrong control wheel can leave the data wheel stepping on the wrong codewords even if the data seed itself is correct.',
    ],
  },
  {
    version: 1,
    id: 'restore-round-stack',
    title: 'Restore the Round Stack',
    projectId: 'iterated-byte-rounds',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The first reusable byte round still runs, but the second round has been bypassed. Restore the stacked round path so the final hex result matches the captured reference machine again.',
    startingProject: brokenIteratedByteRoundsStart,
    startingLayout: cloneProject(iteratedByteRoundsProject.layout),
    targetProject: iteratedByteRoundsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both Byte Round composites should participate in the final path.',
      'Right now the machine bridges back to hex too early.',
      'Reconnect the output of the first round through the second round before the final bridge.',
    ],
  },
  {
    version: 1,
    id: 'repair-round-key',
    title: 'Repair the Round Key',
    projectId: 'keyed-byte-rounds',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The repeated round structure is still wired correctly, but one visible sub-key was changed. Restore the wrong round key so the final byte matches the captured target machine again.',
    startingProject: brokenKeyedByteRoundsStart,
    startingLayout: cloneProject(keyedByteRoundsProject.layout),
    targetProject: keyedByteRoundsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The reusable round structure is already correct in this lab.',
      'Compare the first and second key sources separately.',
      'Only one round key needs to change to restore the target byte.',
    ],
  },
  {
    version: 1,
    id: 'repair-key-bus',
    title: 'Repair the Key Bus',
    projectId: 'keyed-byte-iterator',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'The keyed iterator is wired correctly, but the visible key bus was changed. Restore the key bus so each internal round receives the right sub-key again.',
    startingProject: brokenKeyedByteIteratorStart,
    startingLayout: cloneProject(keyedByteIteratorProject.layout),
    targetProject: keyedByteIteratorTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The iterator already knows how many rounds it has and how wide each round key should be.',
      'The problem is in the visible key bus entering the iterator, not in the data byte.',
      'Changing the second half of the bus changes only the later round key.',
    ],
  },
  {
    version: 1,
    id: 'restore-feistel-rounds',
    title: '[LAB-2.2A] Repair the Feistel Bus',
    projectId: 'feistel-network',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 140,
    recommendedAfter: ['modern-cipher-foundry'],
    difficulty: 'intermediate',
    prompt:
      'The Feistel network still has the right round structure, but the visible key bus no longer feeds the right sub-keys into its half-block swaps. Restore the bus so the final ciphertext matches the captured reference network again.',
    startingProject: brokenFeistelStart,
    startingLayout: cloneProject(feistelProject.layout),
    targetProject: feistelTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The iterator depth is already correct in this lab.',
      'Focus on the visible key source feeding the Feistel iterator.',
      'Each round still swaps halves, but the wrong sub-key changes the recombined output immediately.',
    ],
  },
  {
    version: 1,
    id: 'byte-scrambler',
    title: '[LAB-2.1A] Repair the Permutation',
    projectId: 'byte-round',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 130,
    recommendedAfter: ['byte-round'],
    difficulty: 'intermediate',
    prompt:
      'The byte-round machine still substitutes correctly, but its bit permutation was flattened. Restore the permutation order so the final bit output matches the captured reference round.',
    startingProject: brokenByteRoundStart,
    startingLayout: cloneProject(byteRoundProject.layout),
    targetProject: byteRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Use Cryptanalysis after the fix: the repaired permutation should help the change spread more visibly than the flattened order.',
      'The S-Box table is already correct in this lab.',
      'Focus on the permutation stage after substitution.',
      'The target round reverses the bit order after the byte leaves the S-Box.',
    ],
  },
  {
    version: 1,
    id: 'repair-hex-vector',
    title: 'Repair the Hex Vector',
    projectId: 'hex-round',
    group: 'Bridge Rounds',
    difficulty: 'beginner',
    prompt:
      'The byte round itself is wired correctly, but the injected hex test vector is wrong. Restore the input value so the final hex output matches the captured reference machine again.',
    startingProject: brokenHexRoundStart,
    startingLayout: cloneProject(hexRoundProject.layout),
    targetProject: hexRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The problem is at the very start of the graph, not in the S-Box or permutation.',
      'HexSource should inject the same byte the reference machine begins with.',
      'Compare the current source value against the expected output pattern.',
    ],
  },
  {
    version: 1,
    id: 'repair-sbox-table-transform',
    title: '[LAB-2.1B] Repair the S-Box Transform',
    projectId: 'sbox-table-transform',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 135,
    recommendedAfter: ['byte-scrambler'],
    difficulty: 'beginner',
    prompt:
      'The S-Box table is still a valid permutation, but one row was rotated out of place. Use the S-Box transform controls to restore the original table so the output matches the captured reference machine again.',
    startingProject: brokenSBoxTableTransformStart,
    startingLayout: cloneProject(sboxTableTransformProject.layout),
    targetProject: sboxTableTransformTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The source nibble is already correct in this lab.',
      'Select a cell inside the shifted row first so the active row is correct.',
      'This is a transform problem, not a raw CSV typing problem.',
    ],
  },
  {
    version: 1,
    id: 'repair-ascii-source',
    title: 'Repair the ASCII Source',
    projectId: 'ascii-round',
    group: 'Bridge Rounds',
    difficulty: 'beginner',
    prompt:
      'The byte round itself is wired correctly, but the starting ASCII character is wrong. Restore the source text so the final ASCII output matches the captured reference machine again.',
    startingProject: brokenAsciiRoundStart,
    startingLayout: cloneProject(asciiRoundProject.layout),
    targetProject: asciiRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The S-Box and permutation are already correct in this lab.',
      'Focus on the very first byte entering the graph.',
      'A one-character change at the source can change the entire byte result.',
    ],
  },
  {
    version: 1,
    id: 'repair-keystream-seed',
    title: 'Repair the Keystream Seed',
    projectId: 'keystream',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The plaintext bits are still correct, but the pseudo-random mask is drifting. Repair the LFSR seed so the running ciphertext stream matches the captured reference machine again.',
    startingProject: brokenKeystreamStart,
    startingLayout: cloneProject(keystreamProject.layout),
    targetProject: keystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The clock timing is already correct in this machine.',
      'The XOR stage simply mixes the plaintext bits with the current keystream bit.',
      'If the seed is wrong, the output starts diverging as soon as the first shifted bit changes.',
    ],
  },
  {
    version: 1,
    id: 'predict-the-ninth-bit',
    title: 'Predict the Ninth Bit',
    projectId: 'lfsr-predictability',
    stage: 'streams-and-scheduling',
    order: 135,
    recommendedAfter: ['modern-keystream'],
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The first eight LFSR output bits are already copied into the visible prediction stream, but the ninth guess is wrong. Infer the final bit so the prediction sink matches the live stream across all nine ticks.',
    startingProject: brokenLfsrPredictabilityStart,
    startingLayout: cloneProject(lfsrPredictabilityProject.layout),
    targetProject: lfsrPredictabilityTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'This is an educational predictability exercise, not a repair-the-cipher exercise.',
      'Open Trace on the LFSR and follow how the 5-bit seed shifts after each tick.',
      'With a 5-bit register, the maximum theoretical period is 31, so the stream is deterministic enough to extrapolate one more bit.',
    ],
  },
  {
    version: 1,
    id: 'repair-gate-seed',
    title: 'Repair the Gate Seed',
    projectId: 'gated-keystream',
    group: 'Conditional Clocking',
    difficulty: 'expert',
    prompt:
      'The gated keystream machine still has the right plaintext and data register, but the gate register is pulsing the second LFSR at the wrong moments. Repair the gate seed so the ciphertext rhythm matches the captured reference machine again.',
    startingProject: brokenGatedKeystreamStart,
    startingLayout: cloneProject(gatedKeystreamProject.layout),
    targetProject: gatedKeystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first LFSR is not the mask itself; it controls when the second LFSR advances.',
      'Watch the gate register output bit on each tick and compare it against the target rhythm.',
      'A wrong gate seed can leave the second register frozen on the wrong ticks.',
    ],
  },
  {
    version: 1,
    id: 'find-the-weak-stream',
    title: 'Find The Weak Stream',
    projectId: 'lfsr-predictability',
    stage: 'streams-and-scheduling',
    order: 138,
    recommendedAfter: ['reading-a-keystream'],
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'This naked LFSR stream now repeats too quickly because the tap pattern is wrong. Use the Randomness lab on the real stream sink to spot the weak rhythm, then restore the taps so the output matches the captured reference machine again.',
    startingProject: brokenRandomnessLabStart,
    startingLayout: cloneProject(lfsrPredictabilityProject.layout),
    targetProject: lfsrPredictabilityTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Open Cryptanalysis, switch to Randomness, and inspect the stream-out sink rather than the prediction helper.',
      'A visibly weak tap pattern often creates repeated short windows and an uneven transition rhythm.',
      'The seeded target machine uses the original 5-bit LFSR taps, not a one-tap shortcut.',
    ],
  },
  {
    version: 1,
    id: 'repair-symbol-order',
    title: 'Repair the Symbol Order',
    projectId: 'visible-symbol-scramble',
    group: 'Symbol Permutation',
    difficulty: 'beginner',
    prompt:
      'This symbol-scramble machine still has the right input word, but two output positions are reading the wrong input slots. Repair the symbol order so the output matches the captured reference again.',
    startingProject: brokenVisibleSymbolScrambleStart,
    startingLayout: cloneProject(visibleSymbolScrambleProject.layout),
    targetProject: visibleSymbolScrambleTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The letters themselves are already correct; only their positions are wrong.',
      'Focus on the SymbolPermutation order, not on changing the input word.',
      'A permutation reorders existing symbols. It does not replace M with another letter.',
    ],
  },
  {
    version: 1,
    id: 'repair-unpad-width',
    title: 'Repair the Unpad Width',
    projectId: 'multiply-compare-unpad',
    group: 'Arithmetic Expansion',
    difficulty: 'beginner',
    prompt:
      'This machine multiplies two hex values and then round-trips the product through pad and unpad, but the unpad is stripping the wrong number of bits. Fix the originalWidth so the round-trip recovers the correct product.',
    startingProject: brokenMultiplyCompareUnpadStart,
    startingLayout: cloneProject(multiplyCompareUnpadProject.layout),
    targetProject: multiplyCompareUnpadTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The MulMod and BitPad modules are already correct.',
      'Focus on the originalWidth parameter of BitUnpad.',
      'The input sources are 8-bit hex values, so the original width before padding was 8.',
    ],
  },
  {
    version: 1,
    id: 'repair-message-window',
    title: 'Repair the Message Window',
    projectId: 'visible-message-window',
    group: 'Symbol Structure',
    difficulty: 'beginner',
    prompt:
      'This machine should split one visible message into two contiguous symbol windows, but the second branch is reading the wrong part of the word. Restore the wrong SymbolWindow so both outputs match the captured reference machine again.',
    startingProject: brokenVisibleMessageWindowStart,
    startingLayout: cloneProject(visibleMessageWindowProject.layout),
    targetProject: visibleMessageWindowTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first SymbolWindow is already correct in this lab.',
      'Focus on the start value of window-2, not the TextInput message.',
      'The target machine splits MATH into MA on the upper branch and TH on the lower branch.',
    ],
  },
  {
    version: 1,
    id: 'repair-key-window',
    title: 'Repair the Key Window',
    projectId: 'visible-subkey-bus',
    group: 'Modern Rounds',
    difficulty: 'intermediate',
    prompt:
      'This two-round keyed machine still has the right data path and key bus, but the second sub-key window is reading the wrong slice. Restore the correct window so the final byte matches the captured reference again.',
    startingProject: brokenVisibleSubkeyBusStart,
    startingLayout: cloneProject(visibleSubkeyBusProject.layout),
    targetProject: visibleSubkeyBusTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The key bus itself is already correct in this lab.',
      'Only one BitWindow is wrong; compare the first and second window starts.',
      'Changing the second window changes only the sub-key entering round 2.',
    ],
  },
  {
    version: 1,
    id: 'repair-majority-vote',
    title: 'Repair the Majority Vote',
    projectId: 'majority-keystream',
    group: 'Conditional Clocking',
    difficulty: 'expert',
    prompt:
      'This majority-clocked keystream machine still has the right plaintext, data register, and vote wiring, but one control register is voting incorrectly. Repair the bad control seed so the majority gate opens on the right ticks and the output stream matches the captured reference again.',
    startingProject: brokenMajorityKeystreamStart,
    startingLayout: cloneProject(majorityKeystreamProject.layout),
    targetProject: majorityKeystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The Majority module and Gate wiring are already correct.',
      'Focus on the three 1-bit control registers feeding the vote.',
      'If one control stream is wrong, the majority decision flips only on the ticks where that stream should have been the deciding vote.',
    ],
  },
  {
    version: 1,
    id: 'repair-filter-selector',
    title: 'Repair the Filter Selector',
    projectId: 'filtered-keystream',
    group: 'Conditional Clocking',
    difficulty: 'expert',
    prompt:
      'This filtered keystream machine still has the right plaintext and candidate data streams, but the selector register is choosing the wrong source on each tick. Repair the bad control seed so the output stream matches the captured reference machine again.',
    startingProject: brokenFilteredKeystreamStart,
    startingLayout: cloneProject(filteredKeystreamProject.layout),
    targetProject: filteredKeystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both candidate data registers are already correct; the problem is in the select line.',
      'Mux does not vote and it does not gate time. It simply chooses input a or input b.',
      'If the selector bit flips, the machine keeps the same rhythm but chooses the wrong keystream source.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-clock-pulse',
    title: 'Repair the Clock Pulse',
    projectId: 'clocked-round-traversal',
    group: 'Conditional Clocking',
    stage: 'streams-and-scheduling',
    order: 165,
    recommendedAfter: ['clocked-round-traversal'],
    difficulty: 'beginner',
    prompt:
      'The clocked iterator is placed and wired to its input, but it never advances past the seed. Identify what is missing and restore the connection that drives the iterator forward.',
    startingProject: brokenClockedRoundTraversalStart,
    startingLayout: cloneProject(clockedRoundTraversalProject.layout),
    targetProject: clockedRoundTraversalTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The iterator has two inputs: one for the data and one for the clock signal.',
      'Without a clock connection the iterator stays frozen at step 0 on every tick.',
      'The Clock module is already in the workspace — connect its pulse output to the iterator clock input.',
    ],
  },
  {
    version: 1,
    id: 'repair-routed-clock',
    title: 'Repair the Routed Clock',
    projectId: 'routed-clock-keystream',
    group: 'Conditional Clocking',
    difficulty: 'expert',
    prompt:
      'This routed-clock keystream machine still has the right plaintext, route wiring, and data registers, but the control register is sending the live pulse to the wrong destination on each tick. Repair the selector seed so the output stream matches the captured reference machine again.',
    startingProject: brokenRoutedClockKeystreamStart,
    startingLayout: cloneProject(routedClockKeystreamProject.layout),
    targetProject: routedClockKeystreamTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Demux and both data registers are already wired correctly; the mistake is in the routing control stream.',
      'This lab is about which register advances, not which output bit gets selected afterward.',
      'If the routing bit flips, the machine keeps the same base clock but evolves the wrong downstream register.',
    ],
  },
  {
    version: 1,
    id: 'repair-rotor-notch',
    title: '[LAB-1.2A] Repair the Rotor Notch',
    projectId: 'advanced-rotor-stepping',
    group: 'Rotor Realism',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 180,
    recommendedAfter: ['advanced-rotor-stepping'],
    difficulty: 'expert',
    prompt:
      'This stepped rotor machine still has the right wiring, clock, and gate layout, but the middle rotor is turning over at the wrong window letter. Restore the notch so the visible stepping pattern and output stream match the reference machine again.',
    startingProject: brokenAdvancedRotorSteppingStart,
    startingLayout: cloneProject(advancedRotorSteppingProject.layout),
    targetProject: advancedRotorSteppingTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The OR and Gate wiring are already correct; the mistake lives inside the middle rotor params.',
      'Watch when the left gate opens. It should happen when the middle rotor turnover bit goes active, not one tick later.',
      'A wrong notch changes the stepping rhythm even if every wiring table stays the same.',
    ],
  },
  {
    version: 1,
    id: 'repair-ring-setting-vs-position',
    title: '[LAB-1.2B] Repair Ring Setting Versus Position',
    projectId: 'advanced-rotor-stepping',
    group: 'Rotor Realism',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 185,
    recommendedAfter: ['repair-rotor-notch'],
    difficulty: 'expert',
    prompt:
      'This stepped rotor machine still has the right wiring, notches, and clock logic, but the left rotor was configured as if position and ring setting meant the same thing. Restore the correct ringOffset and position so the captured reference output matches again.',
    startingProject: brokenRotorRingSettingStart,
    startingLayout: cloneProject(advancedRotorSteppingProject.layout),
    targetProject: advancedRotorSteppingTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Use Compare or Verification first: this lab is about parameter agreement, not rewiring the graph.',
      'The left rotor should keep the same visible window position as the target machine while its ringOffset handles the separate alignment shift.',
      'Position changes over time. Ring Offset changes the mapping without pretending to be the same motion.',
    ],
  },
  {
    version: 1,
    id: 'restore-sequential-pulse',
    title: 'Restore the Sequential Pulse',
    projectId: 'sequential',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The clocked keystream machine is no longer advancing on every tick. Repair the timing so its running output matches the captured reference stream again.',
    startingProject: brokenSequentialStart,
    startingLayout: cloneProject(sequentialProject.layout),
    targetProject: sequentialTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The LFSR only advances when the clock sends a live pulse.',
      'Compare the Clock settings to the expected rhythm of the output stream.',
      'A period of 2 means the register only shifts every other tick.',
    ],
  },
  {
    version: 1,
    id: 'repair-lfsr-taps',
    title: 'Repair the LFSR Taps',
    projectId: 'sequential',
    group: 'Sequential',
    difficulty: 'intermediate',
    prompt:
      'The clock is pulsing correctly, but the keystream itself is wrong. Fix the feedback taps so the running output stream matches the reference machine again.',
    startingProject: brokenSequentialTapsStart,
    startingLayout: cloneProject(sequentialProject.layout),
    targetProject: sequentialTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The clock timing is already correct in this lab.',
      'The feedback path inside the LFSR determines which new bit gets shifted into the register.',
      'Compare the tap indexes against the expected repeating pattern in the output stream.',
    ],
  },
  {
    version: 1,
    id: 'repair-rsa-exponent',
    title: 'Repair the RSA Exponent',
    projectId: 'toy-rsa',
    group: 'Number Theory',
    difficulty: 'intermediate',
    prompt:
      'The toy RSA round-trip no longer recovers the original message after decryption. The modulus and encryption exponent are correct, but the decryption side is wrong. Fix the private exponent so the output matches the plaintext again.',
    startingProject: brokenToyRsaStart,
    startingLayout: cloneProject(toyRsaProject.layout),
    targetProject: toyRsaTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The modulus and encryption exponent are already correct.',
      'The private exponent must satisfy e * d ≡ 1 (mod λ(n)). For n = 15, λ(15) = 4.',
      'Try d = 3. Check: 3 * 3 = 9, and 9 mod 4 = 1.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-shared-secret',
    title: 'Repair the Shared Secret',
    projectId: 'diffie-hellman-key-exchange',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 225,
    recommendedAfter: ['toy-rsa'],
    difficulty: 'intermediate',
    prompt:
      'This visible Diffie-Hellman exchange is producing the wrong shared secret. The shared generator and modulus are still correct, but Bob’s private exponent is wrong. Restore it so the exchange matches the reference values again.',
    startingProject: brokenDiffieHellmanStart,
    startingLayout: cloneProject(diffieHellmanProject.layout),
    targetProject: diffieHellmanTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The generator g and the shared modulus p are already correct on every ModExp.',
      'Only Bob’s private exponent source is wrong.',
      'The correct exponent is one hex word larger than 0E.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-gf-multiply',
    title: 'Repair the GF Multiply',
    projectId: 'gf2-multiply',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 225.7,
    recommendedAfter: ['diffie-hellman-key-exchange'],
    difficulty: 'beginner',
    prompt:
      'This GF(2⁸) multiplier is using the wrong reduction polynomial. The polynomial 0x11D is irreducible but it is not the AES polynomial, so the output byte no longer matches the AES spec. Restore the polynomial to the correct AES value so the multiplication result matches the reference output.',
    startingProject: brokenGf2MultiplyStart,
    startingLayout: cloneProject(gf2MultiplyProject.layout),
    targetProject: gf2MultiplyTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The GF2Mul module has a "poly" parameter. That is the only thing that needs to change.',
      'The AES reduction polynomial is x⁸ + x⁴ + x³ + x + 1.',
      'In hex, the AES polynomial is 11B.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-mix-columns-coefficient',
    title: 'Repair the MixColumns Coefficient',
    projectId: 'visible-mix-columns',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.85,
    recommendedAfter: ['gf2-aes-field'],
    difficulty: 'beginner',
    prompt:
      'One of the GF(2⁸) multipliers in row 0 is using the wrong reduction polynomial. The coefficient 0x02 is being multiplied under polynomial 0x11D instead of the AES polynomial, so the first output byte is wrong. Restore the correct polynomial so the column output matches the NIST FIPS 197 test vector.',
    startingProject: brokenVisibleMixColumnsStart,
    startingLayout: cloneProject(visibleMixColumnsProject.layout),
    targetProject: visibleMixColumnsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only one GF2Mul module has the wrong polynomial. Look at the modules in the top row (row 0).',
      'The module computing 2·s0 has its "poly" parameter set to 11D. Change it to the AES polynomial.',
      'The AES reduction polynomial in hex is 11B.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-affine-constant',
    title: 'Repair the Affine Constant',
    projectId: 'visible-subbytes',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.95,
    recommendedAfter: ['visible-mix-columns'],
    difficulty: 'beginner',
    prompt:
      'The AES affine transform ends with an XOR against a specific constant chosen by the Rijndael designers to eliminate fixed points. This board has the wrong constant: 0x65 instead of the correct value. Restore the affine constant so the SubBytes output matches the NIST-specified result for input 0x53.',
    startingProject: brokenVisibleSubBytesStart,
    startingLayout: cloneProject(visibleSubBytesProject.layout),
    targetProject: visibleSubBytesTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The constant is the HexSource labeled c63. Only its value parameter needs to change.',
      'The AES affine constant was chosen so that SubBytes has no fixed points — no input maps to itself.',
      'The correct constant in hex is 63.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-round-key',
    title: 'Repair the Round Key',
    projectId: 'visible-add-round-key',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.96,
    recommendedAfter: ['visible-add-round-key'],
    difficulty: 'beginner',
    prompt:
      'The first key byte has been changed from A0 to B0. The first XOR output no longer matches the NIST FIPS 197 expected result for the AddRoundKey step. Restore the correct key byte so all four output bytes match the specification again.',
    startingProject: brokenVisibleAddRoundKeyStart,
    startingLayout: cloneProject(visibleAddRoundKeyProject.layout),
    targetProject: visibleAddRoundKeyTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the first key byte (k0) needs to change.',
      'The NIST FIPS 197 round 1 key byte for the first column position is A0.',
      '04 XOR A0 = A4 is the expected first output byte.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-aes-rcon',
    title: 'Repair the AES Round Constant',
    projectId: 'visible-aes-key-schedule',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.96,
    recommendedAfter: ['visible-aes-key-schedule'],
    difficulty: 'beginner',
    prompt:
      'The AES key schedule is producing the wrong Round Key 1. The RotWord and SubWord steps are correct, but the round constant for the first round has been changed from 01000000 to 03000000. Restore the correct Rcon[1] value so all four Round Key 1 words match the NIST FIPS 197 Appendix A.1 test vector.',
    startingProject: brokenAesKeyScheduleStart,
    startingLayout: cloneProject(visibleAesKeyScheduleProject.layout),
    targetProject: visibleAesKeyScheduleTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the Rcon[1] source module (rcon1) needs to change.',
      'Rcon[1] is the first round constant in AES. It is defined as 0x01 in the first byte position, with the remaining bytes zero.',
      'The correct value for the rcon1 HexSource is 01000000.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-aes-round',
    title: 'Repair the AES Round',
    projectId: 'aes-round-full',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.97,
    recommendedAfter: ['repair-the-aes-rcon'],
    difficulty: 'intermediate',
    prompt:
      'One SubBytes board inside this full AES round has been replaced with the identity mapping, so one byte is no longer being substituted at all. The final round output now disagrees with FIPS 197 in exactly one output column. Find the broken S-box and restore the correct Rijndael table.',
    startingProject: brokenAesRoundFullStart,
    startingLayout: cloneProject(aesRoundFullProject.layout),
    targetProject: aesRoundFullTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Exactly four output bytes are wrong. That is the diffusion signature of one corrupted byte entering MixColumns.',
      'The wrong byte starts in the SubBytes stage, then ShiftRows moves it before MixColumns spreads it across one full output column.',
      'The broken module is sub-2-1. Its table should be the AES Rijndael table, not the identity mapping 0,1,2,3,...,255.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-shiftrows-rule',
    title: 'Repair the ShiftRows Rule',
    projectId: 'aes-row-perturbation',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.975,
    recommendedAfter: ['aes-row-perturbation'],
    difficulty: 'intermediate',
    prompt:
      'The lower AES branch should match the canonical branch, but its ShiftRows rule still leaves row 1 unrotated. Restore the canonical AES row-1 rotation so the ShiftRows comparison and final output comparison both agree again.',
    startingProject: brokenAesRowPerturbationStart,
    startingLayout: cloneProject(aesRowPerturbationProject.layout),
    targetProject: aesRowPerturbationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The canonical branch is already correct. Only the perturbed ShiftRows permutation needs to change.',
      'Row 1 should rotate left by one byte in AES, not stay at offset 0.',
      'When repaired, both comparison sinks flip high: the ShiftRows state matches and the final round output matches.',
    ],
  },
  {
    version: 1,
    id: 'repair-visible-point-mechanics',
    title: 'Repair the Visible Point Mechanics',
    projectId: 'visible-point-mechanics',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 226,
    recommendedAfter: ['diffie-hellman-key-exchange'],
    difficulty: 'intermediate',
    prompt:
      'This point mechanics workspace no longer shows P + (−P) = ∞. The negation module is still correct, but the wrong point is feeding the second port of the inverse-sum. Restore the connection so the sum of a point and its negation is visible infinity again.',
    startingProject: brokenVisiblePointMechanicsStart,
    startingLayout: cloneProject(visiblePointMechanicsProject.layout),
    targetProject: visiblePointMechanicsTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The inverse-sum module should receive P on its first port and −P on its second port.',
      'PointNegate outputs the negation of whatever point feeds it — that output, not the original point, should connect to port b.',
      'When P and −P are added, the result is the point at infinity, which PointOutput should display as ∞.',
    ],
  },
  {
    version: 1,
    id: 'repair-visible-scalar-multiplication',
    title: 'Repair the Visible Scalar Multiplication',
    projectId: 'visible-scalar-multiplication',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227,
    recommendedAfter: ['visible-point-mechanics'],
    difficulty: 'intermediate',
    prompt:
      'This scalar multiplication workspace no longer confirms that 2P + P = 3P. The third port of the verify-3-add module receives 2P twice instead of 2P and P. Restore the connection so the visible cross-check matches the direct scalar result.',
    startingProject: brokenVisibleScalarMultiplicationStart,
    startingLayout: cloneProject(visibleScalarMultiplicationProject.layout),
    targetProject: visibleScalarMultiplicationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The verify-3-add module should receive 2P on port a and P (the original base point) on port b.',
      'Port b currently receives 2P — trace back to find the source that produces the plain unscaled base point instead.',
      'When port b carries the original base point, 2P + P = 3P and the PointEquals cross-check should emit 1.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-double-and-add-path',
    title: 'Repair The Double-And-Add Path',
    projectId: 'visible-double-and-add',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227.5,
    recommendedAfter: ['visible-scalar-multiplication'],
    difficulty: 'intermediate',
    prompt:
      'This visible double-and-add board no longer lands on the same final point as shipped ScalarMultiply. One branch-selection step is listening to the wrong scalar bit. Restore the correct control bit so the explicit repeated-action machine agrees with the reference result again.',
    startingProject: brokenVisibleDoubleAndAddStart,
    startingLayout: cloneProject(visibleDoubleAndAddProject.layout),
    targetProject: visibleDoubleAndAddTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Each PointSelector should receive the one extracted scalar bit for its own step.',
      'The middle step should listen to the middle extracted bit, not the least-significant bit reused from the first step.',
      'When the branch pattern is restored to 1, then 0, then 1, the final PointEquals check should emit 1.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-point-walk',
    title: 'Repair The Point Walk',
    projectId: 'toy-curve-point-map',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 227.75,
    recommendedAfter: ['visible-double-and-add'],
    difficulty: 'intermediate',
    prompt:
      'This toy-curve point map no longer highlights the intended repeated-action walk for P = (5, 6). The ToyPointMap module is using the wrong selected-point parameter, so both the selected-point and 3P agreement checks fail. Restore the intended selected point.',
    startingProject: brokenToyCurvePointMapStart,
    startingLayout: cloneProject(toyCurvePointMapProject.layout),
    targetProject: toyCurvePointMapTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The independent PointSource branch still carries the intended point P = (5, 6).',
      'ToyPointMap currently highlights the opposite affine partner (5, 11) on the same curve.',
      'Restore the selected-point params so both PointEquals checks emit 1 again.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-keyed-sbox',
    title: 'Repair the Keyed S-Box',
    projectId: 'keyed-sbox-authoring',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.95,
    recommendedAfter: ['aes-row-perturbation'],
    difficulty: 'beginner',
    prompt:
      'The visible key source is selecting the intentionally invalid keyed S-box table. Restore the intended bounded key value so the keyed table becomes the baseline valid permutation again.',
    startingProject: brokenKeyedSBoxAuthoringStart,
    startingLayout: cloneProject(keyedSBoxAuthoringProject.layout),
    targetProject: keyedSBoxAuthoringTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The repair is not a rewiring task. The visible key source itself is wrong.',
      'Key 11 duplicates output value 0 and removes 14, so the validity sink should stay low until the key is corrected.',
      'Restore the key-source bits to 00, not 01 or 10.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-mixcolumns-rule',
    title: 'Repair the MixColumns Rule',
    projectId: 'aes-column-perturbation',
    group: 'AES Building Blocks',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228.96,
    recommendedAfter: ['aes-column-perturbation'],
    difficulty: 'intermediate',
    prompt:
      'The lower AES branch should match the canonical branch, but its first MixColumns row still uses 02 02 01 01 instead of the canonical 02 03 01 01. Restore the canonical coefficient rule so the post-MixColumns comparison and final output comparison both agree again.',
    startingProject: brokenAesColumnPerturbationStart,
    startingLayout: cloneProject(aesColumnPerturbationProject.layout),
    targetProject: aesColumnPerturbationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The canonical branch is already correct. Only the visible perturbed coefficient source needs to change.',
      'The wrong slot is the second coefficient in the first MixColumns row: it is 02 now, but AES expects 03 there.',
      'When repaired, both comparison sinks flip high: the post-MixColumns state matches and the final round output matches.',
    ],
  },
  {
    version: 1,
    id: 'repair-visible-ecdh',
    title: 'Repair the Visible ECDH',
    projectId: 'visible-ecdh-key-agreement',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 228,
    recommendedAfter: ['visible-double-and-add'],
    difficulty: 'intermediate',
    prompt:
      'This visible elliptic-curve key-agreement graph no longer lands on the same shared point on both sides. Restore the broken repeated point action leg so PointEquals returns the shared-point equality result again.',
    startingProject: brokenVisibleEcdhStart,
    startingLayout: cloneProject(visibleEcdhProject.layout),
    targetProject: visibleEcdhTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'There should be one shared base point G, but each shared-secret branch must consume the other side’s public point, not G directly.',
      'Alice should compute a(bG) and Bob should compute b(aG).',
      'The PointEquals output should be 1 only when both shared-point paths land on the same visible point. That confirms a shared point, not finished key material.',
    ],
  },
  {
    version: 1,
    id: 'repair-point-order-cycle',
    title: 'Repair The Point Order Cycle',
    projectId: 'visible-point-order-and-subgroups',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229,
    recommendedAfter: ['visible-ecdh-key-agreement'],
    difficulty: 'intermediate',
    prompt:
      'This subgroup workspace no longer verifies the second point order correctly. Restore the broken repeated point action leg so each point is tested against its own visible order and both verification branches land on infinity.',
    startingProject: brokenVisiblePointOrderStart,
    startingLayout: cloneProject(visiblePointOrderProject.layout),
    targetProject: visiblePointOrderTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Each verification branch should reuse the PointOrder result from the same point it is checking.',
      'The first branch verifies 9P = ∞ and the second verifies 18Q = ∞ on the same declared visible pedagogical curve.',
      'If one branch uses the other point’s order, the PointOutput will stop showing visible infinity and the point-local subgroup structure claim will fail.',
    ],
  },
  {
    version: 1,
    id: 'repair-low-order-ecdh-peer',
    title: 'Repair The Low-Order ECDH Peer',
    projectId: 'ecdh-low-order-point-consequence',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229.5,
    recommendedAfter: ['visible-point-order-and-subgroups'],
    difficulty: 'intermediate',
    prompt:
      'This ECDH consequence board is still feeding both shared-secret consequence lanes from the low-order peer point Q_low = (16, 0). Repair the two peer-point connections so both lanes use the honest peer public point B instead.',
    startingProject: brokenEcdhLowOrderPointStart,
    startingLayout: cloneProject(ecdhLowOrderPointProject.layout),
    targetProject: ecdhLowOrderPointTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The low-order peer point should stay visible on the board for comparison, but it should not feed the repaired shared-secret lanes.',
      'Both broken wires currently come from Q_low and land on the two collapse-shared modules.',
      'Reconnect both of those point inputs to the honest peer public-point source B so the collapse equality bit drops back to 0.',
    ],
  },
  {
    version: 1,
    id: 'repair-ecc-public-key-validation',
    title: 'Repair The ECC Public-Key Validation Acceptance',
    projectId: 'ecc-public-key-validation-consequence',
    group: 'Number Theory',
    stage: 'advanced-arithmetic-and-number-theory',
    order: 229.75,
    recommendedAfter: ['ecdh-low-order-point-consequence'],
    difficulty: 'intermediate',
    prompt:
      'This validation-consequence board still feeds both shared-secret consequence lanes from the broken accepted peer path, which only followed the on-curve check and still emits Q_low = (16, 0). Repair the two consequence-lane peer inputs so both lanes use the honest accepted peer output instead.',
    startingProject: brokenEccPublicKeyValidationStart,
    startingLayout: cloneProject(eccPublicKeyValidationProject.layout),
    targetProject: eccPublicKeyValidationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The peer-point comparison lane should stay visible. You are not deleting Q_low or the subgroup check.',
      'Only the two consequence-lane point inputs are wrong: both currently come from accepted-peer-broken.',
      'Reconnect both of those point inputs to accepted-peer-honest so the collapse equality bit drops to 0 and the honest shared points stay distinct.',
    ],
  },
  {
    version: 1,
    id: 'repair-visible-schnorr-verification',
    title: 'Repair The Visible Schnorr Verification',
    projectId: 'visible-schnorr-signature',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 230,
    recommendedAfter: ['visible-point-order-and-subgroups'],
    difficulty: 'intermediate',
    prompt:
      'This visible pedagogical Schnorr-style graph no longer verifies correctly. Repair the broken verification branch so the right-hand path really computes R + cP and PointEquals returns the visible equality result again.',
    startingProject: brokenVisibleSchnorrStart,
    startingLayout: cloneProject(visibleSchnorrProject.layout),
    targetProject: visibleSchnorrTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The left verification branch sG is still correct.',
      'The right verification branch should scale the public key P by c before adding R. It should not scale the shared base point G again.',
      'When the graph really compares sG against R + cP, PointEquals should emit 1 on this visible pedagogical curve.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-schnorr-nonce-reuse',
    title: 'Repair The Schnorr Nonce Reuse',
    projectId: 'schnorr-nonce-reuse-consequence',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 235,
    recommendedAfter: ['visible-schnorr-signature'],
    difficulty: 'intermediate',
    prompt:
      'This Schnorr misuse board is catastrophically reusing the same nonce across both signature lanes. Repair the second lane so it draws from its own distinct nonce source instead of sharing the first lane nonce.',
    startingProject: brokenSchnorrNonceReuseStart,
    startingLayout: cloneProject(schnorrNonceReuseProject.layout),
    targetProject: schnorrNonceReuseTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The first lane is allowed to keep the visible nonce r = 3.',
      'The second lane should use the separate nonce source that already exists on the board, not the reused first-lane source.',
      'After the repair, the two commitment points should stop matching and the recovery-equality sink should stop claiming the recovered scalar equals the original secret.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-schnorr-challenge-binding',
    title: 'Repair The Schnorr Challenge Binding',
    projectId: 'schnorr-challenge-binding-consequence',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 236,
    recommendedAfter: ['schnorr-nonce-reuse-consequence'],
    difficulty: 'intermediate',
    prompt:
      'This Schnorr verifier is falsely reporting success for the claimed message because its broken verifier challenge is still reading the original signed message source. Rewire that one message leg so the verifier really binds to the claimed message instead.',
    startingProject: brokenSchnorrChallengeBindingStart,
    startingLayout: cloneProject(schnorrChallengeBindingProject.layout),
    targetProject: schnorrChallengeBindingTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Do not change the signer transcript. The original signed message and signature are supposed to stay intact.',
      'Only the broken verifier challenge is wrong; the honest reference verifier already reads the claimed message source.',
      'Reconnect broken-verify-challenge.message from message-sig to message-claim so the false-looking success bit drops from 1 to 0.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-signature',
    title: 'Repair the Signature',
    projectId: 'visible-signature-verification',
    group: 'Asymmetric Verification',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 245,
    recommendedAfter: ['encrypting-is-not-enough'],
    difficulty: 'intermediate',
    prompt: 'This signature machine is failing at public verification. Restore the public exponent.',
    startingProject: brokenVisibleSignatureVerificationStart,
    startingLayout: cloneProject(visibleSignatureVerificationProject.layout),
    targetProject: visibleSignatureVerificationTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The correct exponent is one larger than 02.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-handshake',
    title: 'Repair the Handshake',
    projectId: 'visible-secure-handshake',
    group: 'Systems Composition',
    stage: 'asymmetric-verification-and-systems-composition',
    order: 255,
    recommendedAfter: ['visible-signature-verification'],
    difficulty: 'intermediate',
    prompt:
      'This handshake reaches the protection step, but the later message no longer depends on the derived shared key. Restore the derived-key link so the final verification bit matches the reference machine again.',
    startingProject: brokenVisibleSecureHandshakeStart,
    startingLayout: cloneProject(visibleSecureHandshakeProject.layout),
    targetProject: visibleSecureHandshakeTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The public exchange and signature check are already correct.',
      'Only the key input into the encrypt step is wrong.',
      'Reconnect encrypt to the derived shared-secret branch, not to a public value.',
    ],
  },
  {
    version: 1,
    id: 'repair-key-rotation',
    title: 'Repair the Key Rotation',
    projectId: 'key-schedule-workshop',
    group: 'Key Schedule',
    difficulty: 'beginner',
    prompt:
      'The key schedule workshop is producing the wrong round-2 ciphertext. The master key and round constant are correct, but the derivation step is rotating by the wrong amount. Fix the rotation so both round outputs match the reference.',
    startingProject: brokenKeyScheduleWorkshopStart,
    startingLayout: cloneProject(keyScheduleWorkshopProject.layout),
    targetProject: keyScheduleWorkshopTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The XOR mixing and round constant are already correct.',
      'Only the BitShifter rotation amount is wrong.',
      'The correct rotation is a small left shift — try values between 1 and 4.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-next-round-key',
    title: 'Repair the Next Round Key',
    projectId: 'recursive-key-schedule',
    group: 'Key Schedule',
    stage: 'framing-and-protocol-context',
    order: 125,
    recommendedAfter: ['key-schedule-workshop'],
    difficulty: 'intermediate',
    prompt:
      'This recursive key schedule is producing the wrong later-round output. The master key, iterator, and first derivation step are correct, but the final round-constant mix is wrong. Restore it so the visible key ladder and final ciphertext match the reference machine again.',
    startingProject: brokenRecursiveKeyScheduleStart,
    startingLayout: cloneProject(recursiveKeyScheduleProject.layout),
    targetProject: recursiveKeyScheduleTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The keyed iterator already has the correct round count and key width.',
      'The master key and the first round constant are already correct.',
      'Focus on the visible constant entering the final XOR derivation step.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-chaining-path',
    title: 'Repair the Chaining Path',
    projectId: 'visible-block-chaining',
    group: 'Framing',
    stage: 'framing-and-protocol-context',
    order: 135,
    recommendedAfter: ['recursive-key-schedule'],
    difficulty: 'intermediate',
    prompt:
      'This chained two-block machine is producing the wrong later-block ciphertext. The block split, IV, and first block path are correct, but the second chaining mix is wired to the wrong source. Restore the visible chaining edge so block 2 depends on block 1 again.',
    startingProject: brokenVisibleBlockChainingStart,
    startingLayout: cloneProject(visibleBlockChainingProject.layout),
    targetProject: visibleBlockChainingTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The IV should only seed the first block.',
      'The first block ciphertext is already being computed correctly.',
      'Follow the input into the second XOR and reconnect it to the earlier processed block.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-byte-order',
    title: 'Repair the Byte Order',
    projectId: 'visible-byte-order',
    group: 'Modern Rounds',
    stage: 'framing-and-protocol-context',
    order: 145,
    recommendedAfter: ['visible-block-chaining'],
    difficulty: 'intermediate',
    prompt:
      'This byte-order demo is no longer showing the swapped word correctly. The source, ByteRotate branch, and BitShifter comparison are fine, but the swap branch is bypassing the real byte-order transform. Restore the visible byte-swap path so the outputs match the reference machine again.',
    startingProject: brokenVisibleByteOrderStart,
    startingLayout: cloneProject(visibleByteOrderProject.layout),
    targetProject: visibleByteOrderTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the swap branch is wrong.',
      'The output sink is currently reading straight from the source word instead of the byte-order transform.',
      'Reconnect the swap output back into the hex bridge.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-tamper-check',
    title: 'Repair the Tamper Check',
    projectId: 'visible-tamper-check',
    group: 'Integrity',
    stage: 'framing-and-protocol-context',
    order: 155,
    recommendedAfter: ['visible-byte-order'],
    difficulty: 'intermediate',
    prompt:
      'This visible tamper-check machine is failing verification even though the sender message, received message, and transmitted tag path are correct. The receiver-side key/context is wrong. Restore the shared key so the recomputed tag matches the transmitted one again.',
    startingProject: brokenVisibleTamperCheckStart,
    startingLayout: cloneProject(visibleTamperCheckProject.layout),
    targetProject: visibleTamperCheckTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Both readable message paths are already correct.',
      'The sender tag path is already producing the reference tag.',
      'Focus on the receiver-side key feeding the second XOR before the receiver hash.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-protected-message',
    title: 'Repair the Protected Message',
    projectId: 'visible-authenticated-encryption',
    group: 'Integrity',
    stage: 'framing-and-protocol-context',
    order: 165,
    recommendedAfter: ['visible-tamper-check'],
    difficulty: 'expert',
    prompt:
      'This authenticated-encryption teaching machine is protecting the message with the right ciphertext and decrypting it correctly, but the receiver is authenticating the wrong data. Restore the verification path so the tag covers the ciphertext again and the pass/fail bit matches the reference.',
    startingProject: brokenVisibleAuthenticatedEncryptionStart,
    startingLayout: cloneProject(visibleAuthenticatedEncryptionProject.layout),
    targetProject: visibleAuthenticatedEncryptionTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'The encryption and decryption branches are already correct.',
      'Encrypt-then-MAC means the receiver should recompute the tag from ciphertext, not from recovered plaintext.',
      'Follow the input into the receiver-side XOR that feeds the verification hash and reconnect it to the protected message branch.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-key-selection',
    title: 'Repair the Key Selection',
    projectId: 'visible-key-selection',
    group: 'Key Routing',
    stage: 'streams-and-scheduling',
    order: 115,
    recommendedAfter: ['visible-subkey-bus'],
    difficulty: 'intermediate',
    prompt:
      'The BitSelect module in this workspace is selecting the wrong bit from position 6 onward. It is currently including position 7 instead of skipping it — but position 7 is the parity bit that should be dropped. Restore the selection order so only positions 0-6 and 8-14 are kept and the output matches the reference.',
    startingProject: brokenVisibleKeySelectionStart,
    startingLayout: cloneProject(visibleKeySelectionProject.layout),
    targetProject: visibleKeySelectionTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the BitSelect module needs changing.',
      'The original drops position 7 and keeps positions 0-6 and 8-14.',
      'The order param is a comma-separated list — count the entries and find the one that should be 6 not 7.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-enigma-rotor',
    title: 'Repair the Enigma Rotor',
    projectId: 'enigma-machine',
    group: 'Classical Machines',
    stage: 'rotor-realism-and-mechanized-systems',
    order: 186,
    recommendedAfter: ['enigma-machine'],
    difficulty: 'intermediate',
    prompt:
      'The right rotor wiring in this Enigma has been corrupted — two letters in Rotor III were swapped. As a result the machine is no longer self-reciprocal: encrypting a letter and then encrypting the result no longer gives back the original. Find the swap and restore the historical Rotor III wiring so the output matches the reference.',
    startingProject: brokenEnigmaMachineStart,
    startingLayout: cloneProject(enigmaMachineProject.layout),
    targetProject: enigmaMachineTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the right rotor (id: right) and its reverse (right-rev) need changing — both must carry the same wiring.',
      'Historical Rotor III maps A→B, B→D, C→F. In the broken version positions 0 and 1 were swapped.',
      'The Rotor wire editor shows which output letter each input position reaches — find the two that are out of place.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-e-expansion',
    title: 'Repair the E-Expansion',
    projectId: 'visible-key-expansion',
    group: 'Key Routing',
    stage: 'streams-and-scheduling',
    order: 114,
    recommendedAfter: ['visible-key-selection'],
    difficulty: 'intermediate',
    prompt:
      'The BitExpand module in this workspace should repeat two boundary bits — positions 3 and 0 — so the output slots are 3,0,1,2,3,0. It currently has one of those duplicates replaced by a non-boundary bit. Restore the expansion order so the correct boundary bits are repeated and the output matches the reference.',
    startingProject: brokenVisibleKeyExpansionStart,
    startingLayout: cloneProject(visibleKeyExpansionProject.layout),
    targetProject: visibleKeyExpansionTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only the BitExpand module needs changing.',
      'The correct order is 3,0,1,2,3,0 — bit 3 appears at slot 0 and slot 4, bit 0 appears at slot 1 and slot 5.',
      'The expansion order is a comma-separated list — find the slot that should be 3 and restore it.',
    ],
  },
  {
    version: 1,
    id: 'repair-the-feistel-round',
    title: 'Repair the Feistel Round',
    projectId: 'visible-feistel-round',
    group: 'Modern Rounds',
    stage: 'modern-bit-machines',
    order: 135,
    recommendedAfter: ['visible-feistel-round'],
    difficulty: 'intermediate',
    prompt:
      'The round 2 key in this Feistel workspace was reset to all zeros. When the key is all zeros, XOR with it is the identity — the S-box input leaks the unmodified right half, and the round provides no real mixing. Restore the correct 4-bit key2 so the final output matches the reference.',
    startingProject: brokenVisibleFeistelRoundStart,
    startingLayout: cloneProject(visibleFeistelRoundProject.layout),
    targetProject: visibleFeistelRoundTarget,
    success: {
      kind: 'output-match-target',
    },
    hints: [
      'Only key2 (BitSource id "key2") needs changing.',
      'The correct key is [1,1,0,0] — four bits, not all zeros.',
      'Find key2 in the inspector, edit the stream field, and re-run to compare against the reference output.',
    ],
  },
];
