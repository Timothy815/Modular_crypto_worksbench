import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { ExecutionTraceEntry } from '../engine/types';
import type { UiAction } from './store';
import type { CryptanalysisMode } from './cryptanalysis-mode';
import type { LearningPanelTab } from './learning-orchestration';
import type { WorkspaceMode } from './workspace-mode';
import {
  createDetachedPanelGroup,
  createDetachedPanelUrl,
  createDetachedPanelWindowName,
  getDetachedPanelGroupByKind,
  moveDetachedPanelKindEarlier,
  moveDetachedPanelKindLater,
  moveDetachedPanelKindToGroup,
  removeDetachedPanelGroup,
  removeDetachedPanelKind,
  setDetachedPanelGroupActiveKind,
  setDetachedPanelGroupPresentationMode,
  setDetachedPanelGroupSplitRatio,
  setDetachedPanelGroupSplitSide,
  swapDetachedPanelGroupSplitSides,
  type DetachedPanelKind,
  type DetachedPanelMessage,
  type DetachedPanelPayloadByKind,
  type DetachedPanelStateSnapshot,
  type DetachedPanelWindowGroup,
} from './multi-window';
import type { VerificationCase } from './verification-workflow';

export function createWindowSessionId() {
  return `window-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDetachedSnapshot(args: {
  hostId: string;
  panelWindowId: string;
  groups: DetachedPanelWindowGroup[];
  payloadByKind: DetachedPanelPayloadByKind;
}): DetachedPanelStateSnapshot | null {
  const group = args.groups.find((candidate) => candidate.panelWindowId === args.panelWindowId);
  if (!group) {
    return null;
  }

  const payloadSubset = Object.fromEntries(
    group.tabs.map((kind) => [kind, args.payloadByKind[kind]]),
  ) as Partial<DetachedPanelPayloadByKind>;

  return {
    hostId: args.hostId,
    panelWindowId: args.panelWindowId,
    tabs: group.tabs,
    activeKind: group.activeKind,
    presentationMode: group.presentationMode,
    splitLeftKind: group.splitLeftKind,
    splitRightKind: group.splitRightKind,
    splitRatio: group.splitRatio,
    payloadByKind: payloadSubset,
  };
}

export function openDetachedPanelInNewWindow(args: {
  kind: DetachedPanelKind;
  currentHref: string;
  hostWindowId: string;
  groups: DetachedPanelWindowGroup[];
  detachedWindowsRef: MutableRefObject<Record<string, Window | null>>;
  setGroups: Dispatch<SetStateAction<DetachedPanelWindowGroup[]>>;
  setError: (message: string | null) => void;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const previousGroup = getDetachedPanelGroupByKind(args.groups, args.kind);
  const panelWindowId = createWindowSessionId();
  const detachedWindow = window.open(
    createDetachedPanelUrl(args.currentHref, args.kind, args.hostWindowId, panelWindowId),
    createDetachedPanelWindowName(args.kind, panelWindowId),
    'popup=yes,width=520,height=980,resizable=yes,scrollbars=yes',
  );

  if (!detachedWindow) {
    args.setError(`Unable to open the ${args.kind} window.`);
    return;
  }

  args.detachedWindowsRef.current[panelWindowId] = detachedWindow;
  args.setGroups((current) => createDetachedPanelGroup(current, panelWindowId, args.kind));
  if (previousGroup) {
    const remainingTabs = previousGroup.tabs.filter((tab) => tab !== args.kind);
    if (remainingTabs.length === 0) {
      args.detachedWindowsRef.current[previousGroup.panelWindowId]?.close();
      delete args.detachedWindowsRef.current[previousGroup.panelWindowId];
    }
  }
}

export function moveDetachedPanelToExistingWindow(args: {
  kind: DetachedPanelKind;
  panelWindowId: string;
  groups: DetachedPanelWindowGroup[];
  detachedWindowsRef: MutableRefObject<Record<string, Window | null>>;
  setGroups: Dispatch<SetStateAction<DetachedPanelWindowGroup[]>>;
}) {
  const previousGroup = getDetachedPanelGroupByKind(args.groups, args.kind);
  args.setGroups((current) => moveDetachedPanelKindToGroup(current, args.kind, args.panelWindowId));
  if (previousGroup && previousGroup.panelWindowId !== args.panelWindowId) {
    const remainingTabs = previousGroup.tabs.filter((tab) => tab !== args.kind);
    if (remainingTabs.length === 0) {
      args.detachedWindowsRef.current[previousGroup.panelWindowId]?.close();
      delete args.detachedWindowsRef.current[previousGroup.panelWindowId];
    }
  }
  args.detachedWindowsRef.current[args.panelWindowId]?.focus();
}

export function returnDetachedPanelToMain(args: {
  kind: DetachedPanelKind;
  groups: DetachedPanelWindowGroup[];
  detachedWindowsRef: MutableRefObject<Record<string, Window | null>>;
  setGroups: Dispatch<SetStateAction<DetachedPanelWindowGroup[]>>;
}) {
  const targetGroup = getDetachedPanelGroupByKind(args.groups, args.kind);
  if (!targetGroup) {
    return;
  }

  const nextGroups = removeDetachedPanelKind(args.groups, args.kind);
  args.setGroups(nextGroups);
  if (!nextGroups.some((group) => group.panelWindowId === targetGroup.panelWindowId)) {
    args.detachedWindowsRef.current[targetGroup.panelWindowId]?.close();
    delete args.detachedWindowsRef.current[targetGroup.panelWindowId];
  }
}

export interface DetachedPanelCommandHandlers {
  dispatch: (action: UiAction) => void;
  togglePaletteViewMode: () => void;
  addModuleByDefId: (defId: string) => void;
  startPaletteCanvasDrag: (
    defId: string,
    panelWindowId: string,
    screenX: number,
    screenY: number,
  ) => void;
  updatePaletteCanvasDrag: (panelWindowId: string, screenX: number, screenY: number) => void;
  endPaletteCanvasDrag: (panelWindowId: string, screenX: number, screenY: number) => void;
  cancelPaletteCanvasDrag: (panelWindowId: string) => void;
  insertStarterChain: (starterId: string) => void;
  openComposite: (defId: string) => void;
  editClockedIterator: (defId: string) => void;
  openReusableReferenceProject: (projectId: string, moduleId: string) => void;
  duplicateReusable: (defId: string) => void;
  renameReusable: (defId: string, nextName: string) => void;
  promoteReusable: (defId: string) => void;
  openPrimitiveMicroDemo: (defId: string) => void;
  openPipelineMicroDemo: (pipelineId: string) => void;
  exportCompositeLibrary: () => void;
  removeComposite: (defId: string) => void;
  copyParams: (moduleId: string) => void;
  applyCopiedParams: (
    sourceModuleId: string,
    sourceDefId: string,
    targetModuleIds: string[],
    params: Record<string, unknown>,
    paramKeys: string[],
  ) => void;
  deleteModule: (moduleId: string) => void;
  setTraceHover: (moduleId: string | null) => void;
  setStepChange: (nextIndex: number | null) => void;
  setActiveAnalysisTraceChange: (entry: ExecutionTraceEntry | null) => void;
  requestFocusModule: (moduleId: string) => void;
  captureBaseline: () => void;
  clearBaseline: () => void;
  addVerificationCase: (sourceModuleId: string, inputValue: string, tickCount: number | null) => void;
  removeVerificationCase: (caseId: string) => void;
  clearVerificationCases: () => void;
  importVerificationCases: (cases: VerificationCase[]) => void;
  unzipComposite: (moduleId: string) => void;
  setLearningTab: (tab: LearningPanelTab) => void;
  selectChallenge: (challengeId: string) => void;
  loadChallengeStart: () => void;
  exportChallenge: () => void;
  importChallengeRaw: (rawValue: string) => void;
  captureChallenge: () => void;
  setCryptanalysisMode: (mode: CryptanalysisMode) => void;
  setCryptanalysisInput: (value: string) => void;
  setModernAnalysisBaseline: (value: string) => void;
  setModernAnalysisFlipBit: (value: number) => void;
  setModernAnalysisSourceId: (value: string | null) => void;
  setModernAnalysisSinkId: (value: string | null) => void;
  setRandomnessAnalysisSinkId: (value: string | null) => void;
  setClassicalSelectedPeriod: (value: number) => void;
  setClassicalSelectedColumnIndex: (value: number) => void;
  setClassicalSelectedShift: (key: string, value: number) => void;
  saveAnalysisCase: (name: string) => void;
  updateAnalysisCase: (caseId: string) => void;
  renameAnalysisCase: (caseId: string, name: string) => void;
  deleteAnalysisCase: (caseId: string) => void;
  loadAnalysisCase: (savedCase: import('./workbench-document').SavedAnalysisCase) => void;
  selectTutorial: (tutorialId: string, projectId?: string) => void;
  setTutorialStep: (stepIndex: number) => void;
  switchProject: (projectId: string) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setTutorialNotesVisible: (visible: boolean) => void;
  focusStepModule: (moduleId: string) => void;
  resetTutorialProgress: () => void;
  setGroups: Dispatch<SetStateAction<DetachedPanelWindowGroup[]>>;
  returnDetachedTabToMain: (kind: DetachedPanelKind) => void;
  detachedWindowsRef: MutableRefObject<Record<string, Window | null>>;
}

export interface DetachedPanelChannelBridgeArgs {
  channelName: string;
  hostWindowId: string;
  groups: DetachedPanelWindowGroup[];
  payloadByKind: DetachedPanelPayloadByKind;
  commandHandlers: DetachedPanelCommandHandlers;
}

export function connectDetachedPanelChannel(args: DetachedPanelChannelBridgeArgs) {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => undefined;
  }

  const channel = new BroadcastChannel(args.channelName);

  const postSnapshot = (panelWindowId: string) => {
    const snapshot = createDetachedSnapshot({
      hostId: args.hostWindowId,
      panelWindowId,
      groups: args.groups,
      payloadByKind: args.payloadByKind,
    });
    if (!snapshot) {
      return;
    }

    const message: DetachedPanelMessage = {
      type: 'snapshot',
      snapshot,
    };
    channel.postMessage(message);
  };

  const handleMessage = (event: MessageEvent<DetachedPanelMessage>) => {
    const message = event.data;

    if ('hostId' in message && message.hostId !== args.hostWindowId) {
      return;
    }

    if (message.type === 'requestSnapshot') {
      postSnapshot(message.panelWindowId);
      return;
    }

    if (message.type === 'dispatchAction') {
      args.commandHandlers.dispatch(message.action);
      return;
    }

    if (message.type === 'panelClosed') {
      args.commandHandlers.cancelPaletteCanvasDrag(message.panelWindowId);
      delete args.commandHandlers.detachedWindowsRef.current[message.panelWindowId];
      args.commandHandlers.setGroups((current) =>
        removeDetachedPanelGroup(current, message.panelWindowId),
      );
      return;
    }

    if (message.type !== 'command') {
      return;
    }

    const command = message.command;
    switch (command.type) {
      case 'togglePaletteViewMode':
        args.commandHandlers.togglePaletteViewMode();
        return;
      case 'addModule':
        args.commandHandlers.addModuleByDefId(command.defId);
        return;
      case 'startPaletteCanvasDrag':
        args.commandHandlers.startPaletteCanvasDrag(
          command.defId,
          message.panelWindowId,
          command.screenX,
          command.screenY,
        );
        return;
      case 'updatePaletteCanvasDrag':
        args.commandHandlers.updatePaletteCanvasDrag(
          message.panelWindowId,
          command.screenX,
          command.screenY,
        );
        return;
      case 'endPaletteCanvasDrag':
        args.commandHandlers.endPaletteCanvasDrag(
          message.panelWindowId,
          command.screenX,
          command.screenY,
        );
        return;
      case 'cancelPaletteCanvasDrag':
        args.commandHandlers.cancelPaletteCanvasDrag(message.panelWindowId);
        return;
      case 'insertStarterChain':
        args.commandHandlers.insertStarterChain(command.starterId);
        return;
      case 'openComposite':
        args.commandHandlers.openComposite(command.defId);
        return;
      case 'editClockedIterator':
        args.commandHandlers.editClockedIterator(command.defId);
        return;
      case 'openRefProject':
        args.commandHandlers.openReusableReferenceProject(command.projectId, command.moduleId);
        return;
      case 'duplicateReusable':
        args.commandHandlers.duplicateReusable(command.defId);
        return;
      case 'renameReusable':
        args.commandHandlers.renameReusable(command.defId, command.nextName);
        return;
      case 'promoteReusable':
        args.commandHandlers.promoteReusable(command.defId);
        return;
      case 'openPrimitiveMicroDemo':
        args.commandHandlers.openPrimitiveMicroDemo(command.defId);
        return;
      case 'openPipelineMicroDemo':
        args.commandHandlers.openPipelineMicroDemo(command.pipelineId);
        return;
      case 'exportCompositeLibrary':
        args.commandHandlers.exportCompositeLibrary();
        return;
      case 'removeComposite':
        args.commandHandlers.removeComposite(command.defId);
        return;
      case 'copyParams':
        args.commandHandlers.copyParams(command.moduleId);
        return;
      case 'applyCopiedParams':
        args.commandHandlers.applyCopiedParams(
          command.sourceModuleId,
          command.sourceDefId,
          command.targetModuleIds,
          command.params,
          command.paramKeys,
        );
        return;
      case 'deleteModule':
        args.commandHandlers.deleteModule(command.moduleId);
        return;
      case 'traceHover':
        args.commandHandlers.setTraceHover(command.moduleId);
        return;
      case 'stepChange':
        args.commandHandlers.setStepChange(command.nextIndex);
        return;
      case 'activeAnalysisTraceChange':
        args.commandHandlers.setActiveAnalysisTraceChange(command.entry);
        return;
      case 'requestFocusModule':
        args.commandHandlers.requestFocusModule(command.moduleId);
        return;
      case 'captureBaseline':
        args.commandHandlers.captureBaseline();
        return;
      case 'clearBaseline':
        args.commandHandlers.clearBaseline();
        return;
      case 'addVerificationCase':
        args.commandHandlers.addVerificationCase(
          command.sourceModuleId,
          command.inputValue,
          command.tickCount,
        );
        return;
      case 'removeVerificationCase':
        args.commandHandlers.removeVerificationCase(command.caseId);
        return;
      case 'clearVerificationCases':
        args.commandHandlers.clearVerificationCases();
        return;
      case 'importVerificationCases':
        args.commandHandlers.importVerificationCases(command.cases);
        return;
      case 'unzipComposite':
        args.commandHandlers.unzipComposite(command.moduleId);
        return;
      case 'setLearningTab':
        args.commandHandlers.setLearningTab(command.tab);
        return;
      case 'selectChallenge':
        args.commandHandlers.selectChallenge(command.challengeId);
        return;
      case 'loadChallengeStart':
        args.commandHandlers.loadChallengeStart();
        return;
      case 'exportChallenge':
        args.commandHandlers.exportChallenge();
        return;
      case 'importChallengeRaw':
        args.commandHandlers.importChallengeRaw(command.rawValue);
        return;
      case 'captureChallenge':
        args.commandHandlers.captureChallenge();
        return;
      case 'setCryptanalysisMode':
        args.commandHandlers.setCryptanalysisMode(command.mode);
        return;
      case 'setCryptanalysisInput':
        args.commandHandlers.setCryptanalysisInput(command.value);
        return;
      case 'setModernAnalysisBaseline':
        args.commandHandlers.setModernAnalysisBaseline(command.value);
        return;
      case 'setModernAnalysisFlipBit':
        args.commandHandlers.setModernAnalysisFlipBit(command.value);
        return;
      case 'setModernAnalysisSourceId':
        args.commandHandlers.setModernAnalysisSourceId(command.value);
        return;
      case 'setModernAnalysisSinkId':
        args.commandHandlers.setModernAnalysisSinkId(command.value);
        return;
      case 'setRandomnessAnalysisSinkId':
        args.commandHandlers.setRandomnessAnalysisSinkId(command.value);
        return;
      case 'setClassicalSelectedPeriod':
        args.commandHandlers.setClassicalSelectedPeriod(command.value);
        return;
      case 'setClassicalSelectedColumnIndex':
        args.commandHandlers.setClassicalSelectedColumnIndex(command.value);
        return;
      case 'setClassicalSelectedShift':
        args.commandHandlers.setClassicalSelectedShift(command.key, command.value);
        return;
      case 'saveAnalysisCase':
        args.commandHandlers.saveAnalysisCase(command.name);
        return;
      case 'updateAnalysisCase':
        args.commandHandlers.updateAnalysisCase(command.caseId);
        return;
      case 'renameAnalysisCase':
        args.commandHandlers.renameAnalysisCase(command.caseId, command.name);
        return;
      case 'deleteAnalysisCase':
        args.commandHandlers.deleteAnalysisCase(command.caseId);
        return;
      case 'loadAnalysisCase':
        args.commandHandlers.loadAnalysisCase(command.savedCase);
        return;
      case 'selectTutorial':
        args.commandHandlers.selectTutorial(command.tutorialId, command.projectId);
        return;
      case 'setTutorialStep':
        args.commandHandlers.setTutorialStep(command.stepIndex);
        return;
      case 'switchProject':
        args.commandHandlers.switchProject(command.projectId);
        return;
      case 'setWorkspaceMode':
        args.commandHandlers.setWorkspaceMode(command.mode);
        return;
      case 'setTutorialNotesVisible':
        args.commandHandlers.setTutorialNotesVisible(command.visible);
        return;
      case 'focusStepModule':
        args.commandHandlers.focusStepModule(command.moduleId);
        return;
      case 'resetTutorialProgress':
        args.commandHandlers.resetTutorialProgress();
        return;
      case 'setActiveDetachedTab':
        args.commandHandlers.setGroups((current) =>
          setDetachedPanelGroupActiveKind(current, message.panelWindowId, command.kind),
        );
        return;
      case 'setDetachedPresentationMode':
        args.commandHandlers.setGroups((current) =>
          setDetachedPanelGroupPresentationMode(
            current,
            message.panelWindowId,
            command.presentationMode,
          ),
        );
        return;
      case 'moveDetachedPaneEarlier':
        args.commandHandlers.setGroups((current) =>
          moveDetachedPanelKindEarlier(current, message.panelWindowId, command.kind),
        );
        return;
      case 'moveDetachedPaneLater':
        args.commandHandlers.setGroups((current) =>
          moveDetachedPanelKindLater(current, message.panelWindowId, command.kind),
        );
        return;
      case 'setDetachedSplitSide':
        args.commandHandlers.setGroups((current) =>
          setDetachedPanelGroupSplitSide(
            current,
            message.panelWindowId,
            command.side,
            command.kind,
          ),
        );
        return;
      case 'swapDetachedSplitSides':
        args.commandHandlers.setGroups((current) =>
          swapDetachedPanelGroupSplitSides(current, message.panelWindowId),
        );
        return;
      case 'setDetachedSplitRatio':
        args.commandHandlers.setGroups((current) =>
          setDetachedPanelGroupSplitRatio(current, message.panelWindowId, command.ratio),
        );
        return;
      case 'returnDetachedTabToMain':
        args.commandHandlers.returnDetachedTabToMain(command.kind);
        return;
    }
  };

  channel.addEventListener('message', handleMessage);

  return () => {
    channel.removeEventListener('message', handleMessage);
    channel.close();
  };
}

export function broadcastDetachedSnapshots(args: {
  channelName: string;
  hostWindowId: string;
  groups: DetachedPanelWindowGroup[];
  payloadByKind: DetachedPanelPayloadByKind;
}) {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }

  const channel = new BroadcastChannel(args.channelName);
  for (const group of args.groups) {
    const snapshot = createDetachedSnapshot({
      hostId: args.hostWindowId,
      panelWindowId: group.panelWindowId,
      groups: args.groups,
      payloadByKind: args.payloadByKind,
    });
    if (!snapshot) {
      continue;
    }

    channel.postMessage({
      type: 'snapshot',
      snapshot,
    } satisfies DetachedPanelMessage);
  }
  channel.close();
}
