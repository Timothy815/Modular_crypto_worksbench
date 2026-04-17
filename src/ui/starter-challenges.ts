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
const multiplyCompareUnpadProject = demoProjects.find((project) => project.id === 'multiply-compare-unpad');
const visibleMessageWindowProject = demoProjects.find((project) => project.id === 'visible-message-window');
const toyRsaProject = demoProjects.find((project) => project.id === 'toy-rsa');
const diffieHellmanProject = demoProjects.find((project) => project.id === 'diffie-hellman-key-exchange');
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
const toyCompressionHashProject = demoProjects.find((project) => project.id === 'toy-compression-hash');
const toySpongeHashProject = demoProjects.find((project) => project.id === 'toy-sponge-hash');

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
if (!multiplyCompareUnpadProject) {
  throw new Error('Expected multiply-compare-unpad demo project to seed starter challenges.');
}
if (!visibleMessageWindowProject) {
  throw new Error('Expected visible-message-window demo project to seed starter challenges.');
}
if (!sequentialProject) {
  throw new Error('Expected sequential demo project to seed starter challenges.');
}
if (!toyCompressionHashProject) {
  throw new Error('Expected toy-compression-hash project to seed starter challenges.');
}
if (!toySpongeHashProject) {
  throw new Error('Expected toy-sponge-hash project to seed starter challenges.');
}
if (!toyRsaProject) {
  throw new Error('Expected toy-rsa demo project to seed starter challenges.');
}
if (!diffieHellmanProject) {
  throw new Error('Expected diffie-hellman-key-exchange demo project to seed starter challenges.');
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
const multiplyCompareUnpadTarget = cloneProject(multiplyCompareUnpadProject.project);
const brokenMultiplyCompareUnpadStart = cloneProject(multiplyCompareUnpadProject.project);
const visibleMessageWindowTarget = cloneProject(visibleMessageWindowProject.project);
const brokenVisibleMessageWindowStart = cloneProject(visibleMessageWindowProject.project);
const sequentialTarget = cloneProject(sequentialProject.project);
const brokenSequentialStart = cloneProject(sequentialProject.project);
const brokenSequentialTapsStart = cloneProject(sequentialProject.project);
const toyCompressionHashTarget = cloneProject(toyCompressionHashProject.project);
const toyCompressionHashCollisionStart = cloneProject(toyCompressionHashProject.project);
const toySpongeHashTarget = cloneProject(toySpongeHashProject.project);
const toySpongeHashCollisionStart = cloneProject(toySpongeHashProject.project);
const toyRsaTarget = cloneProject(toyRsaProject.project);
const brokenToyRsaStart = cloneProject(toyRsaProject.project);
const diffieHellmanTarget = cloneProject(diffieHellmanProject.project);
const brokenDiffieHellmanStart = cloneProject(diffieHellmanProject.project);
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
];
