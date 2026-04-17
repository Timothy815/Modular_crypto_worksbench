import { useEffect, useMemo, useRef, useState } from 'react';

import { isCompositeDefinition, isConditionalDefinition } from '../../engine/composites';
import { getBypassIneligibilityReason, isBypassEligibleDefinition } from '../../engine/bypass';
import { isOutputSinkDefId } from '../../engine/output-sinks';
import type {
  ExecutionResult,
  ExecutionTraceEntry,
  ModuleDefinition,
  ModuleRegistry,
  ModuleInstance,
  Project,
  ValidationIssue,
} from '../../engine/types';
import { BitsEditor } from './editors/bits-editor';
import { WiringEditor } from './editors/wiring-editor';
import { formatParamValue, parseParamValue } from '../formatters';
import { buildLiveStateSummary } from '../live-state-display';
import {
  getSinkRepresentationOptions,
  type SinkRepresentation,
} from '../sink-representations';
import {
  getModuleDetail,
  getModulePurpose,
  matchesModuleDomainTab,
  matchesModuleSearch,
} from '../module-library';
import {
  getModuleInstanceIdValidationError,
  normalizeModuleInstanceIdCandidate,
} from '../module-instance-id';
import {
  areParameterValuesEqual,
  buildParameterComparisonSummary,
} from '../parameter-comparison';
import type { TutorialStep } from '../tutorials';
import { InspectorAnalyzeView } from './inspector-analyze-view';
import { InspectorAnalyzeDetails } from './inspector-analyze-details';
import { InspectorCompareView, InspectorOutputSummary } from './inspector-analysis-output';
import {
  PermutationOrderEditor,
  PlugboardEditor,
  ReflectorEditor,
  RotorWiringEditor,
  SBoxEditor,
} from './structured-editors';
import type {
  ComparisonBaselineDocument,
  WorkbenchLayoutDirection,
  WorkbenchPortLayoutPreset,
  WorkbenchPortSide,
  WorkbenchPosition,
} from '../workbench-document';
import type { ExecutionComparison } from '../execution-compare';
import {
  getNodeOrientation,
  getPortSideForModulePort,
} from '../node-orientation';
import { getOrderedPorts } from '../port-ordering';
import { getModuleRole, getModuleRoleDetail, getModuleTypicalPath } from '../module-role-language';
import { getIteratorRoundSummary } from '../iterator-workflow';
import type {
  VerificationCase,
  VerificationCaseResult,
  VerificationSourceOption,
} from '../verification-workflow';
import {
  formatLinkedRotorFieldValue,
  formatParameterComparisonChipLabel,
  getIssueTargetModuleId,
  getIteratorRoundOptions,
  getTraceEntries,
  getTransformationView,
  groupIssuesByTarget,
  stepHexString,
} from '../inspector-analysis';

interface ParameterInspectorProps {
  execution: ExecutionResult | null;
  registry: ModuleRegistry;
  executionError: string | null;
  validationIssues: ValidationIssue[];
  stepIndex: number | null;
  project: Project;
  tutorialStep: TutorialStep | null;
  projectName: string;
  comparisonBaseline: ComparisonBaselineDocument | null;
  executionComparison: ExecutionComparison | null;
  baselineOutput: string;
  variantOutput: string;
  verificationSourceOptions: VerificationSourceOption[];
  verificationCases: VerificationCase[];
  verificationResults: VerificationCaseResult[];
  baselineExecutionError: string | null;
  baselineModuleInstance: ModuleInstance | null;
  moduleDef: ModuleDefinition | null;
  moduleInstance: ModuleInstance | null;
  modulePosition?: WorkbenchPosition | null;
  layoutDirection?: WorkbenchLayoutDirection;
  selectedModuleIds: string[];
  parameterClipboard: {
    sourceModuleId: string;
    sourceDefId: string;
    params: Record<string, unknown>;
    paramKeys: string[];
  } | null;
  getParamDraft: (moduleId: string, key: string) => string | undefined;
  onCopyParams: (moduleId: string) => void;
  onApplyCopiedParams: (
    sourceModuleId: string,
    sourceDefId: string,
    targetModuleIds: string[],
    params: Record<string, unknown>,
    paramKeys: string[],
  ) => void;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
  onSetModuleBypass: (moduleId: string, bypass: boolean) => void;
  onRotateModuleClockwise?: (moduleId: string) => void;
  onSetModulePortLayoutPreset?: (
    moduleId: string,
    preset: WorkbenchPortLayoutPreset | null,
  ) => void;
  onMoveModulePortOrder?: (
    moduleId: string,
    direction: 'input' | 'output',
    portName: string,
    delta: -1 | 1,
  ) => void;
  onSetModulePortSide?: (
    moduleId: string,
    direction: 'input' | 'output',
    portName: string,
    side: WorkbenchPortSide | null,
  ) => void;
  onDuplicateModule?: (moduleId: string) => void;
  onReplaceModule?: (moduleId: string, nextDefId: string) => void;
  onRenameModuleInstance?: (moduleId: string, nextModuleId: string) => void;
  onDeleteModule: (moduleId: string) => void;
  canRenameModuleIds?: boolean;
  onUnzipComposite?: (moduleId: string) => void;
  onOpenCompositeInstanceDrilldown?: (moduleId: string) => void;
  onOpenCompositeDefinition?: (definitionId: string) => void;
  isReadOnlyMode?: boolean;
  onSelectIssueTarget: (moduleId: string) => void;
  onTraceHover: (moduleId: string | null) => void;
  onStepChange: (nextIndex: number | null) => void;
  onActiveAnalysisTraceChange?: (entry: ExecutionTraceEntry | null) => void;
  onRequestFocusModule?: (moduleId: string) => void;
  onCaptureBaseline: () => void;
  onClearBaseline: () => void;
  onAddVerificationCase: (
    sourceModuleId: string,
    inputValue: string,
    tickCount?: number | null,
  ) => string | null;
  onImportVerificationCases: (cases: VerificationCase[]) => void;
  onRemoveVerificationCase: (caseId: string) => void;
  onClearVerificationCases: () => void;
  probedModuleIds: string[];
  isTickedMode?: boolean;
  currentTick?: number;
  tickCount?: number;
  tickedParamsByModule?: Record<string, Record<string, unknown>[]> | null;
  tickHistoryByModule?: Record<string, string[]> | null;
  collectedOutput?: string | null;
  onToggleProbe: (moduleId: string) => void;
  onClearProbes: () => void;
}

const PORT_SIDE_ORDER: WorkbenchPortSide[] = ['left', 'right', 'top', 'bottom'];

type InspectorIconName =
  | 'rotate'
  | 'rotate-left'
  | 'rotate-right'
  | 'duplicate'
  | 'delete'
  | 'copy'
  | 'rename'
  | 'bypass'
  | 'move-up'
  | 'move-down'
  | 'identity'
  | 'reverse'
  | 'inverse'
  | 'configure'
  | 'analyze'
  | 'compare'
  | 'ports-default'
  | 'ports-horizontal'
  | 'ports-vertical';

function InspectorIcon({ name }: { name: InspectorIconName }) {
  switch (name) {
    case 'rotate':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M13.8 4.4a5.9 5.9 0 1 0 1.7 7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.8 2.9h3.8v3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rotate-left':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M14.2 10.2a4.4 4.4 0 1 1-4.4-4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 5.8H5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 4.1 5 5.8l2.2 1.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rotate-right':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.8 10.2a4.4 4.4 0 1 0 4.4-4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.8 5.8h3.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m12.8 4.1 2.2 1.7-2.2 1.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'duplicate':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="6.5"
            y="4.5"
            width="8"
            height="8"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="3.5"
            y="7.5"
            width="8"
            height="8"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.5 6.2h9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 6.2V4.7h4v1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 6.2l.5 8h4.6l.5-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.5v3.8M11 8.5v3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'copy':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="6.5"
            y="4"
            width="8"
            height="10"
            rx="1.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 7.2H4.4A1.4 1.4 0 0 0 3 8.6v6A1.4 1.4 0 0 0 4.4 16h6A1.4 1.4 0 0 0 11.8 14.6V14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rename':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4.5 14.3l.6-2.8 6.8-6.8 2.2 2.2-6.8 6.8-2.8.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.9 5.8l2.2 2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'bypass':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4 6h5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10.5 6h5.5v8H10.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 14H4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.8 6l2.7 4-2.7 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'move-up':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 15V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.8 8.2 10 5l3.2 3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'move-down':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 5v10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.8 11.8 10 15l3.2-3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'identity':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4.2" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <path
            d="M5.8 5.3h8.4M5.8 10h8.4M5.8 14.7h8.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'reverse':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4.2" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <path
            d="M5.8 5.3h2.7c2.8 0 5 2.2 5.7 4.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.8 10h8.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5.8 14.7h2.7c2.8 0 5-2.2 5.7-4.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'inverse':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6 4.8v10.4M14 4.8v10.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.4 7.2h5.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10.2 5l2.2 2.2-2.2 2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.6 12.8H7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.8 15l-2.2-2.2 2.2-2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'configure':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5 5.2h10M5 10h10M5 14.8h10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="7.2" cy="5.2" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12.8" cy="10" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="9.2" cy="14.8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'analyze':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle
            cx="8.5"
            cy="8.5"
            r="4.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M11.7 11.7L15.5 15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.6 8.7l1.4 1.5 2.5-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'compare':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="3.5"
            y="4.5"
            width="5.5"
            height="11"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="11"
            y="4.5"
            width="5.5"
            height="11"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-default':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4.5 6.5h4M11.5 6.5h4M4.5 13.5h4M11.5 13.5h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="8.2"
            y="5"
            width="3.6"
            height="10"
            rx="1.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-horizontal':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M3.5 6.5h3M13.5 6.5h3M3.5 13.5h3M13.5 13.5h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="6.5"
            y="4.7"
            width="7"
            height="10.6"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-vertical':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6.5 3.5v3M13.5 3.5v3M6.5 13.5v3M13.5 13.5v3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="4.7"
            y="6.5"
            width="10.6"
            height="7"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

interface InspectorIconButtonProps {
  icon: InspectorIconName;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

function InspectorIconButton({
  icon,
  label,
  onClick,
  tone = 'default',
  disabled = false,
}: InspectorIconButtonProps) {
  return (
    <button
      type="button"
      className={`inspector-icon-button inspector-icon-button-${tone}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <InspectorIcon name={icon} />
    </button>
  );
}

interface InspectorTabButtonProps {
  icon: Extract<InspectorIconName, 'configure' | 'analyze' | 'compare'>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function InspectorTabButton({ icon, label, active, onClick }: InspectorTabButtonProps) {
  return (
    <button
      type="button"
      className={`inspector-tab-button${active ? ' active' : ''}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <InspectorIcon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function ScrubNumberInput({
  renderedValue,
  onRawChange,
}: {
  renderedValue: string;
  onRawChange: (raw: string) => void;
}) {
  const scrubRef = useRef<{
    pointerId: number;
    startX: number;
    startValue: number;
    input: HTMLInputElement;
    active: boolean;
  } | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  return (
    <input
      type="number"
      className={isScrubbing ? 'param-input-number param-input-scrubbing' : 'param-input-number'}
      value={renderedValue}
      onChange={(e) => onRawChange(e.target.value)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if (e.pointerType !== 'mouse') return;
        if (document.activeElement === e.currentTarget) return;
        const startValue = parseFloat(renderedValue);
        scrubRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startValue: isNaN(startValue) ? 0 : startValue,
          input: e.currentTarget,
          active: false,
        };
      }}
      onPointerMove={(e) => {
        if (!scrubRef.current) return;
        if (scrubRef.current.pointerId !== e.pointerId) return;
        const dx = e.clientX - scrubRef.current.startX;
        if (!scrubRef.current.active) {
          if (Math.abs(dx) < 6) {
            return;
          }
          e.preventDefault();
          scrubRef.current.input.setPointerCapture(e.pointerId);
          scrubRef.current.active = true;
          setIsScrubbing(true);
        }
        const steps = Math.round(dx / 4);
        onRawChange(String(scrubRef.current.startValue + steps));
      }}
      onPointerUp={(e) => {
        if (scrubRef.current?.active && scrubRef.current.input.hasPointerCapture(e.pointerId)) {
          scrubRef.current.input.releasePointerCapture(e.pointerId);
        }
        scrubRef.current = null;
        setIsScrubbing(false);
      }}
      onPointerCancel={(e) => {
        if (scrubRef.current?.active && scrubRef.current.input.hasPointerCapture(e.pointerId)) {
          scrubRef.current.input.releasePointerCapture(e.pointerId);
        }
        scrubRef.current = null;
        setIsScrubbing(false);
      }}
    />
  );
}

export function ParameterInspector({
  execution,
  registry,
  executionError,
  validationIssues,
  stepIndex,
  project,
  tutorialStep,
  projectName,
  comparisonBaseline,
  executionComparison,
  baselineOutput,
  variantOutput,
  verificationSourceOptions,
  verificationCases,
  verificationResults,
  baselineExecutionError,
  baselineModuleInstance,
  moduleDef,
  moduleInstance,
  modulePosition = null,
  layoutDirection = 'horizontal',
  selectedModuleIds,
  parameterClipboard,
  getParamDraft,
  onCopyParams,
  onApplyCopiedParams,
  onParamDraftChange,
  onParamChange,
  onSetModuleBypass,
  onRotateModuleClockwise,
  onSetModulePortLayoutPreset,
  onMoveModulePortOrder,
  onSetModulePortSide,
  onDuplicateModule,
  onReplaceModule,
  onRenameModuleInstance,
  onDeleteModule,
  canRenameModuleIds = true,
  onUnzipComposite,
  onOpenCompositeInstanceDrilldown,
  onOpenCompositeDefinition,
  isReadOnlyMode = false,
  onSelectIssueTarget,
  onTraceHover,
  onStepChange,
  onActiveAnalysisTraceChange,
  onRequestFocusModule,
  onCaptureBaseline,
  onClearBaseline,
  onAddVerificationCase,
  onImportVerificationCases,
  onRemoveVerificationCase,
  onClearVerificationCases,
  probedModuleIds,
  isTickedMode = false,
  currentTick = 0,
  tickCount = 0,
  tickedParamsByModule = null,
  tickHistoryByModule = null,
  collectedOutput = null,
  onToggleProbe,
  onClearProbes,
}: ParameterInspectorProps) {
  const [traceMode, setTraceMode] = useState<'focused' | 'upstream' | 'downstream' | 'full'>('focused');
  const [inspectorTab, setInspectorTab] = useState<'configure' | 'analyze' | 'compare'>('configure');
  const [focusedRoundPath, setFocusedRoundPath] = useState<string>('all');
  const [requestedStepperMode, setRequestedStepperMode] = useState<'top-level' | 'nested'>('top-level');
  const [requestedNestedStepIndex, setRequestedNestedStepIndex] = useState<number | null>(null);
  const [requestedLookupChunkIndex, setRequestedLookupChunkIndex] = useState(0);
  const [expandedRawEditors, setExpandedRawEditors] = useState<Record<string, boolean>>({});
  const [sinkRepresentationsByModuleId, setSinkRepresentationsByModuleId] = useState<
    Record<string, SinkRepresentation>
  >({});
  const [activeOutputSummaryModuleId, setActiveOutputSummaryModuleId] = useState<string | null>(null);
  const [isOutputSummaryCollapsed, setIsOutputSummaryCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('mcw:inspector-output-collapsed') === 'true';
  });
  const [showCollectedOutput, setShowCollectedOutput] = useState(true);
  const [renameState, setRenameState] = useState<{
    moduleId: string | null;
    draft: string;
    error: string | null;
  }>({
    moduleId: null,
    draft: '',
    error: null,
  });
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');
  const [selectedReplacementDefId, setSelectedReplacementDefId] = useState<string>('');
  const [collapsedAnalyzeSections, setCollapsedAnalyzeSections] = useState({
    tick: false,
    selectedIssues: false,
    graphIssues: false,
    traceList: true,
    pinned: false,
    tutorial: true,
    transformation: false,
  });

  const toggleAnalyzeSection = (key: keyof typeof collapsedAnalyzeSections) => {
    setCollapsedAnalyzeSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };
  const liveStateSummary = useMemo(() => {
    if (
      !moduleDef ||
      !moduleInstance ||
      !isTickedMode ||
      tickCount <= 0 ||
      !tickedParamsByModule?.[moduleInstance.id]
    ) {
      return null;
    }

    const tickParams = tickedParamsByModule[moduleInstance.id]?.[currentTick];
    if (!tickParams) {
      return null;
    }

    return buildLiveStateSummary(
      moduleDef,
      moduleInstance,
      tickParams,
      currentTick > 0 ? tickedParamsByModule[moduleInstance.id]?.[currentTick - 1] : undefined,
    );
  }, [currentTick, isTickedMode, moduleDef, moduleInstance, tickCount, tickedParamsByModule]);
  const replacementCandidates = useMemo(() => {
    if (!moduleDef) {
      return [];
    }

    return Object.values(registry)
      .filter(
        (definition) =>
          definition.id !== moduleDef.id &&
          (matchesModuleDomainTab(definition, 'all') || matchesModuleDomainTab(definition, 'composites')),
      )
      .filter((definition) => matchesModuleSearch(definition, replaceSearchQuery))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [moduleDef, registry, replaceSearchQuery]);
  const selectedReplacementDef =
    selectedReplacementDefId && replacementCandidates.some((candidate) => candidate.id === selectedReplacementDefId)
      ? registry[selectedReplacementDefId]
      : replacementCandidates[0] ?? null;
  const replacementConnectionSummary = useMemo(() => {
    if (!moduleDef || !moduleInstance || !selectedReplacementDef) {
      return null;
    }

    const currentInputPorts = new Map(
      moduleDef.inputs.map((port) => [port.name, `${port.type}:${port.kind ?? 'scalar'}`]),
    );
    const currentOutputPorts = new Map(
      moduleDef.outputs.map((port) => [port.name, `${port.type}:${port.kind ?? 'scalar'}`]),
    );
    const nextInputPorts = new Set(
      selectedReplacementDef.inputs.map((port) => `${port.name}:${port.type}:${port.kind ?? 'scalar'}`),
    );
    const nextOutputPorts = new Set(
      selectedReplacementDef.outputs.map((port) => `${port.name}:${port.type}:${port.kind ?? 'scalar'}`),
    );

    let retained = 0;
    let dropped = 0;
    for (const connection of project.connections) {
      if (connection.from.moduleId === moduleInstance.id) {
        const currentSignature = currentOutputPorts.get(connection.from.port);
        if (currentSignature && nextOutputPorts.has(`${connection.from.port}:${currentSignature}`)) {
          retained += 1;
        } else {
          dropped += 1;
        }
      } else if (connection.to.moduleId === moduleInstance.id) {
        const currentSignature = currentInputPorts.get(connection.to.port);
        if (currentSignature && nextInputPorts.has(`${connection.to.port}:${currentSignature}`)) {
          retained += 1;
        } else {
          dropped += 1;
        }
      }
    }

    return { retained, dropped };
  }, [moduleDef, moduleInstance, project.connections, selectedReplacementDef]);
  useEffect(() => {
    setReplaceSearchQuery('');
    setSelectedReplacementDefId('');
  }, [moduleDef?.id, moduleInstance?.id]);
  useEffect(() => {
    if (!selectedReplacementDefId && replacementCandidates[0]) {
      setSelectedReplacementDefId(replacementCandidates[0].id);
      return;
    }

    if (
      selectedReplacementDefId &&
      !replacementCandidates.some((candidate) => candidate.id === selectedReplacementDefId)
    ) {
      setSelectedReplacementDefId(replacementCandidates[0]?.id ?? '');
    }
  }, [replacementCandidates, selectedReplacementDefId]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      'mcw:inspector-output-collapsed',
      isOutputSummaryCollapsed ? 'true' : 'false',
    );
  }, [isOutputSummaryCollapsed]);
  const analysisTrace = useMemo(
    () => execution?.analysisTrace ?? execution?.trace ?? [],
    [execution],
  );
  const tutorialTraceRef = useRef<HTMLLIElement | null>(null);
  const outputTrace = useMemo(() => {
    if (!execution) return undefined;
    const sinkModules = project.modules.filter((module) => isOutputSinkDefId(module.defId));
    for (const sinkModule of sinkModules) {
      const found = execution.trace.find((entry) => entry.moduleId === sinkModule.id);
      const signal = execution.outputsByModuleId[sinkModule.id]?.out ?? found?.inputs.in;
      if (found && signal) {
        return found;
      }
    }
    const fallbackOutputModuleId = sinkModules[0]?.id;
    if (fallbackOutputModuleId) {
      const found = execution.trace.find((entry) => entry.moduleId === fallbackOutputModuleId);
      if (found) return found;
    }
    return execution.trace.at(-1);
  }, [execution, project.modules]);
  const outputSignal = outputTrace?.inputs.in;
  const outputSummaries = useMemo(() => {
    const sinkModules = project.modules.filter((module) => isOutputSinkDefId(module.defId));
    const summaries = sinkModules.map((module) => {
      const traceEntry = execution?.trace.find((entry) => entry.moduleId === module.id);
      const signal = execution?.outputsByModuleId[module.id]?.out ?? traceEntry?.inputs.in;
      const sinkDefId = isOutputSinkDefId(module.defId) ? module.defId : undefined;
      const representationOptions = getSinkRepresentationOptions(sinkDefId, signal);
      const preferredRepresentation = sinkRepresentationsByModuleId[module.id] ?? 'bits';
      const effectiveRepresentation = representationOptions.some(
        (option) => option.id === preferredRepresentation && option.available,
      )
        ? preferredRepresentation
        : representationOptions[0]?.id ?? 'bits';
      const effectiveRepresentationOption =
        representationOptions.find((option) => option.id === effectiveRepresentation) ?? null;

      return {
        moduleId: module.id,
        signal,
        representationOptions,
        effectiveRepresentation,
        effectiveRepresentationOption,
      };
    });

    if (summaries.length > 0) {
      return summaries;
    }

    const fallbackOptions = outputTrace && isOutputSinkDefId(outputTrace.defId)
      ? getSinkRepresentationOptions(outputTrace.defId, outputSignal)
      : [];
    const fallbackPreferred = sinkRepresentationsByModuleId.__fallback ?? 'bits';
    const fallbackRepresentation = fallbackOptions.some(
      (option) => option.id === fallbackPreferred && option.available,
    )
      ? fallbackPreferred
      : fallbackOptions[0]?.id ?? 'bits';
    const fallbackRepresentationOption =
      fallbackOptions.find((option) => option.id === fallbackRepresentation) ?? null;

    return [
      {
        moduleId: outputTrace?.moduleId ?? 'output',
        signal: outputSignal,
        representationOptions: fallbackOptions,
        effectiveRepresentation: fallbackRepresentation,
        effectiveRepresentationOption: fallbackRepresentationOption,
      },
    ];
  }, [execution, outputSignal, outputTrace, project.modules, sinkRepresentationsByModuleId]);
  const activeOutputSummary = useMemo(() => {
    if (outputSummaries.length === 0) {
      return null;
    }

    if (
      activeOutputSummaryModuleId &&
      outputSummaries.some((summary) => summary.moduleId === activeOutputSummaryModuleId)
    ) {
      return (
        outputSummaries.find((summary) => summary.moduleId === activeOutputSummaryModuleId) ?? null
      );
    }

    return (
      outputSummaries.find(
        (summary) =>
          summary.signal !== null &&
          summary.effectiveRepresentationOption !== null &&
          summary.effectiveRepresentationOption.available,
      ) ??
      outputSummaries[0] ??
      null
    );
  }, [activeOutputSummaryModuleId, outputSummaries]);
  const hasCollectedOutput = isTickedMode && collectedOutput !== null;
  const selectedTrace =
    execution?.trace.find((entry) => entry.moduleId === moduleInstance?.id) ?? null;
  const linkedRotorSourceInstance = useMemo(() => {
    if (moduleDef?.id !== 'RotorReverse' || !moduleInstance) {
      return null;
    }

    const linkedRotorId = moduleInstance.params.linkedRotorId;
    if (typeof linkedRotorId !== 'string' || linkedRotorId.trim().length === 0) {
      return null;
    }

    return (
      project.modules.find(
        (candidate) => candidate.id === linkedRotorId && candidate.defId === 'Rotor',
      ) ?? null
    );
  }, [moduleDef?.id, moduleInstance, project.modules]);
  const selectedTraceOrder = selectedTrace
    ? (execution?.order.findIndex((moduleId) => moduleId === selectedTrace.moduleId) ?? -1) + 1
    : null;
  const selectedIssues = moduleInstance
    ? validationIssues.filter((issue) => getIssueTargetModuleId(issue) === moduleInstance.id)
    : [];
  const globalIssues = moduleInstance
    ? validationIssues.filter((issue) => !selectedIssues.includes(issue))
    : validationIssues;
  const effectiveRenameDraft =
    moduleInstance && renameState.moduleId === moduleInstance.id
      ? renameState.draft
      : moduleInstance?.id ?? '';
  const effectiveRenameError =
    moduleInstance && renameState.moduleId === moduleInstance.id ? renameState.error : null;
  const iteratorRoundSummary =
    moduleDef &&
    moduleInstance &&
    'kind' in moduleDef &&
    moduleDef.kind === 'iterator'
      ? getIteratorRoundSummary(moduleDef, moduleInstance.params)
      : null;
  const renameValidationError = useMemo(() => {
    if (!moduleInstance) {
      return null;
    }

    return getModuleInstanceIdValidationError(
      effectiveRenameDraft,
      project.modules.map((projectModule) => projectModule.id),
      moduleInstance.id,
    );
  }, [effectiveRenameDraft, moduleInstance, project.modules]);
  const compatibleParamApplyTargetIds = useMemo(() => {
    if (!moduleInstance || !moduleDef || !parameterClipboard) {
      return [];
    }

    if (
      parameterClipboard.sourceModuleId !== moduleInstance.id ||
      parameterClipboard.sourceDefId !== moduleDef.id
    ) {
      return [];
    }

    return selectedModuleIds.filter((moduleId) => {
      if (moduleId === moduleInstance.id) {
        return false;
      }

      const targetModule = project.modules.find((projectModule) => projectModule.id === moduleId);
      return targetModule?.defId === moduleDef.id;
    });
  }, [moduleDef, moduleInstance, parameterClipboard, project.modules, selectedModuleIds]);
  const selectedIncompatibleParamTargetCount = useMemo(() => {
    if (!moduleInstance || !moduleDef || compatibleParamApplyTargetIds.length === 0) {
      return 0;
    }

    const nonSourceSelectionCount = selectedModuleIds.filter((moduleId) => moduleId !== moduleInstance.id).length;
    return Math.max(0, nonSourceSelectionCount - compatibleParamApplyTargetIds.length);
  }, [compatibleParamApplyTargetIds.length, moduleDef, moduleInstance, selectedModuleIds]);
  const parameterComparisonSummary = useMemo(
    () =>
      buildParameterComparisonSummary({
        project,
        moduleDef,
        moduleInstance,
        selectedModuleIds,
      }),
    [moduleDef, moduleInstance, project, selectedModuleIds],
  );
  const groupedSelectedIssues = groupIssuesByTarget(selectedIssues);
  const groupedGlobalIssues = groupIssuesByTarget(globalIssues);

  const effectiveTraceMode = selectedTrace ? traceMode : 'full';
  const roundFocusOptions = useMemo(
    () =>
      moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance
        ? getIteratorRoundOptions(analysisTrace, moduleInstance.id)
        : [],
    [analysisTrace, moduleDef, moduleInstance],
  );
  const effectiveFocusedRoundPath =
    focusedRoundPath !== 'all' && roundFocusOptions.some((option) => option.path === focusedRoundPath)
      ? focusedRoundPath
      : 'all';
  const traceEntries = getTraceEntries({
    execution,
    project,
    selectedModuleId: moduleInstance?.id ?? null,
    traceMode: effectiveTraceMode,
    focusedRoundPath: effectiveFocusedRoundPath,
  });
  const canUseNestedStepper =
    Boolean(moduleDef && 'kind' in moduleDef && moduleDef.kind === 'iterator' && moduleInstance) &&
    traceEntries.some((entry) => entry.moduleId.startsWith(`${moduleInstance?.id}/`));
  const effectiveStepperMode = canUseNestedStepper ? requestedStepperMode : 'top-level';
  const steppedTrace = stepIndex !== null ? execution?.trace[stepIndex] ?? null : null;
  const steppedAnalysisEntry =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? traceEntries[
          requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
            ? requestedNestedStepIndex
            : Math.max(0, traceEntries.length - 1)
        ] ?? null
      : null;
  const effectiveNestedStepIndex =
    effectiveStepperMode === 'nested' && requestedNestedStepIndex !== null
      ? requestedNestedStepIndex >= 0 && requestedNestedStepIndex < traceEntries.length
        ? requestedNestedStepIndex
        : traceEntries.length > 0
          ? traceEntries.length - 1
          : null
      : null;
  const tutorialTraceEntry = tutorialStep?.focusModuleId
    ? execution?.trace.find((entry) => entry.moduleId === tutorialStep.focusModuleId) ?? null
    : null;
  const tutorialTraceIndex = tutorialTraceEntry
    ? (execution?.trace.findIndex((entry) => entry.moduleId === tutorialTraceEntry.moduleId) ?? -1) + 1
    : null;
  const activeTransformationEntry =
    inspectorTab === 'analyze'
      ? effectiveStepperMode === 'nested'
        ? steppedAnalysisEntry
        : selectedTrace
      : null;
  const transformationView = activeTransformationEntry
    ? getTransformationView(activeTransformationEntry, project, registry)
    : null;
  const canBypassSelectedModule = moduleDef ? isBypassEligibleDefinition(moduleDef) : false;
  const orderedInputPorts = useMemo(
    () =>
      moduleDef
        ? getOrderedPorts(moduleDef.inputs, modulePosition?.inputOrder)
        : [],
    [moduleDef, modulePosition],
  );
  const orderedOutputPorts = useMemo(
    () =>
      moduleDef
        ? getOrderedPorts(moduleDef.outputs, modulePosition?.outputOrder)
        : [],
    [moduleDef, modulePosition],
  );
  const activePortLayoutPreset = modulePosition?.portLayoutPreset ?? null;
  const activeNodeOrientation = getNodeOrientation(modulePosition?.orientation, layoutDirection);
  const [draggingPortSide, setDraggingPortSide] = useState<{
    direction: 'input' | 'output';
    portName: string;
  } | null>(null);
  const inputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedInputPorts.filter(
            (port) =>
              getPortSideForModulePort(modulePosition ?? undefined, activeNodeOrientation, 'in', port.name) ===
              side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedInputPorts>,
    [activeNodeOrientation, modulePosition, orderedInputPorts],
  );
  const outputPortsBySide = useMemo(
    () =>
      Object.fromEntries(
        PORT_SIDE_ORDER.map((side) => [
          side,
          orderedOutputPorts.filter(
            (port) =>
              getPortSideForModulePort(modulePosition ?? undefined, activeNodeOrientation, 'out', port.name) ===
              side,
          ),
        ]),
      ) as Record<WorkbenchPortSide, typeof orderedOutputPorts>,
    [activeNodeOrientation, modulePosition, orderedOutputPorts],
  );
  const explicitInputPortSides = modulePosition?.inputPortSides ?? {};
  const explicitOutputPortSides = modulePosition?.outputPortSides ?? {};
  const bypassIneligibilityReason =
    moduleDef && !canBypassSelectedModule ? getBypassIneligibilityReason(moduleDef) : null;
  const effectiveLookupChunkIndex =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks[
          requestedLookupChunkIndex >= 0 &&
          requestedLookupChunkIndex < transformationView.chunks.length
            ? requestedLookupChunkIndex
            : 0
        ]?.index ?? 0
      : 0;
  const activeLookupChunk =
    transformationView?.kind === 'lookup'
      ? transformationView.chunks.find((chunk) => chunk.index === effectiveLookupChunkIndex) ?? null
      : null;
  useEffect(() => {
    if (inspectorTab !== 'analyze' || !tutorialTraceRef.current) {
      return;
    }

    tutorialTraceRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [inspectorTab, tutorialStep?.id, tutorialTraceEntry?.moduleId]);

  useEffect(() => {
    if (!onActiveAnalysisTraceChange) {
      return;
    }

    if (inspectorTab !== 'analyze' || !execution) {
      onActiveAnalysisTraceChange(null);
      return;
    }

    onActiveAnalysisTraceChange(
      effectiveStepperMode === 'nested' ? steppedAnalysisEntry : steppedTrace,
    );
  }, [
    execution,
    inspectorTab,
    onActiveAnalysisTraceChange,
    effectiveStepperMode,
    steppedAnalysisEntry,
    steppedTrace,
  ]);


  const renderParameterComparisonChip = (fieldKey: string) => {
    const fieldComparison = parameterComparisonSummary?.fieldsByKey[fieldKey];
    if (!fieldComparison) {
      return null;
    }

    return (
      <span
        className={
          fieldComparison.status === 'aligned'
            ? 'parameter-comparison-chip parameter-comparison-chip-aligned'
            : 'parameter-comparison-chip parameter-comparison-chip-divergent'
        }
      >
        {formatParameterComparisonChipLabel(fieldComparison)}
      </span>
    );
  };

  const renderParamFieldLabel = (
    fieldLabel: string,
    fieldKey: string,
    isForwardedParam: boolean,
  ) => (
    <span className="param-field-label">
      <span className="param-field-label-text">{fieldLabel}</span>
      {isForwardedParam ? <span className="forwarded-param-chip">Forwarded</span> : null}
      {renderParameterComparisonChip(fieldKey)}
    </span>
  );

  const isRawEditorExpanded = (moduleId: string, fieldKey: string) =>
    expandedRawEditors[`${moduleId}:${fieldKey}`] ?? false;

  const toggleRawEditor = (moduleId: string, fieldKey: string) => {
    const rawEditorKey = `${moduleId}:${fieldKey}`;
    setExpandedRawEditors((current) => ({
      ...current,
      [rawEditorKey]: !(current[rawEditorKey] ?? false),
    }));
  };

  return (
    <aside className="panel inspector-panel">
      <div className="panel-head">
        <p className="panel-label">Inspector</p>
        <h2>Inspector</h2>
      </div>

      <div className="inspector-tab-strip" role="tablist" aria-label="Inspector View">
        <InspectorTabButton
          icon="configure"
          label="Configure"
          active={inspectorTab === 'configure'}
          onClick={() => setInspectorTab('configure')}
        />
        <InspectorTabButton
          icon="analyze"
          label="Analyze"
          active={inspectorTab === 'analyze'}
          onClick={() => setInspectorTab('analyze')}
        />
        <InspectorTabButton
          icon="compare"
          label="Compare"
          active={inspectorTab === 'compare'}
          onClick={() => setInspectorTab('compare')}
        />
      </div>

      <InspectorOutputSummary
        isOutputSummaryCollapsed={isOutputSummaryCollapsed}
        setIsOutputSummaryCollapsed={setIsOutputSummaryCollapsed}
        hasCollectedOutput={hasCollectedOutput}
        showCollectedOutput={showCollectedOutput}
        setShowCollectedOutput={setShowCollectedOutput}
        collectedOutput={collectedOutput}
        validationIssuesCount={validationIssues.length}
        executionTraceCount={execution?.trace.length ?? 0}
        executionPresent={Boolean(execution)}
        isTickedMode={isTickedMode}
        outputSummaries={outputSummaries}
        activeOutputSummary={activeOutputSummary}
        setActiveOutputSummaryModuleId={setActiveOutputSummaryModuleId}
        setSinkRepresentationsByModuleId={setSinkRepresentationsByModuleId}
        tickHistoryByModule={tickHistoryByModule}
      />

      {inspectorTab === 'analyze' ? (
        <InspectorAnalyzeView
          execution={execution}
          moduleInstance={moduleInstance}
          isTickedMode={isTickedMode}
          currentTick={currentTick}
          tickCount={tickCount}
          tickedParamsByModule={tickedParamsByModule}
          tickHistoryByModule={tickHistoryByModule}
          collapsedAnalyzeSections={collapsedAnalyzeSections}
          toggleAnalyzeSection={toggleAnalyzeSection}
          canUseNestedStepper={canUseNestedStepper}
          effectiveStepperMode={effectiveStepperMode}
          effectiveNestedStepIndex={effectiveNestedStepIndex}
          traceEntries={traceEntries}
          steppedAnalysisEntry={steppedAnalysisEntry}
          steppedTrace={steppedTrace}
          stepIndex={stepIndex}
          setRequestedStepperMode={setRequestedStepperMode}
          setRequestedNestedStepIndex={setRequestedNestedStepIndex}
          onStepChange={onStepChange}
          probedModuleIds={probedModuleIds}
          onClearProbes={onClearProbes}
          onToggleProbe={onToggleProbe}
          tutorialStep={tutorialStep}
          tutorialTraceIndex={tutorialTraceIndex}
        />
      ) : null}

      <InspectorAnalyzeDetails
        inspectorTab={inspectorTab}
        transformationView={transformationView}
        activeLookupChunk={activeLookupChunk}
        effectiveLookupChunkIndex={effectiveLookupChunkIndex}
        setRequestedLookupChunkIndex={setRequestedLookupChunkIndex}
        collapsedAnalyzeSections={collapsedAnalyzeSections}
        toggleAnalyzeSection={toggleAnalyzeSection}
        groupedSelectedIssues={groupedSelectedIssues}
        groupedGlobalIssues={groupedGlobalIssues}
        executionError={executionError}
        validationIssues={validationIssues}
        selectedTrace={selectedTrace}
        selectedTraceOrder={selectedTraceOrder}
        analysisTrace={analysisTrace}
        roundFocusOptions={roundFocusOptions}
        effectiveFocusedRoundPath={effectiveFocusedRoundPath}
        setFocusedRoundPath={setFocusedRoundPath}
        effectiveTraceMode={effectiveTraceMode}
        setTraceMode={setTraceMode}
        traceEntries={traceEntries}
        execution={execution}
        steppedAnalysisEntry={steppedAnalysisEntry}
        steppedTrace={steppedTrace}
        effectiveStepperMode={effectiveStepperMode}
        moduleInstance={moduleInstance}
        tutorialStep={tutorialStep}
        tutorialTraceRef={tutorialTraceRef}
        onTraceHover={onTraceHover}
        setRequestedNestedStepIndex={setRequestedNestedStepIndex}
        onStepChange={onStepChange}
        onRequestFocusModule={onRequestFocusModule}
        onSelectIssueTarget={onSelectIssueTarget}
      />

      {moduleDef && moduleInstance && inspectorTab === 'configure' ? (
        <section className="inspector-section">
          <span className="meta-label">Module</span>
          <strong className="selected-module-name">{moduleInstance.id}</strong>
          <p className="selected-module-type">{moduleDef.id}</p>
          <div className="inspector-module-role-summary">
            <span className="content-status-chip">Role: {getModuleRole(moduleDef)}</span>
            <p className="comparison-copy">{getModuleRoleDetail(moduleDef)}</p>
            {getModuleTypicalPath(moduleDef) ? (
              <p className="comparison-copy inspector-typical-path">
                <span className="meta-label">Typical path</span>{' '}
                {getModuleTypicalPath(moduleDef)}
              </p>
            ) : null}
          </div>
          {'kind' in moduleDef ? (
            moduleDef.kind === 'composite' ? (
              <p className="selected-module-kind">Composite definition</p>
            ) : moduleDef.kind === 'iterator' ? (
              <>
                <p className="selected-module-kind">
                  Iterator definition
                  {typeof moduleDef.roundKeyWidth === 'number'
                    ? ` • ${moduleDef.roundKeyWidth}-bit round keys`
                    : ''}
                </p>
                <p className="comparison-copy">
                  Body:{' '}
                  <strong>
                    {registry[moduleDef.roundDefId]?.name ?? moduleDef.roundDefId}
                  </strong>{' '}
                  <span className="meta-label">({moduleDef.roundDefId})</span>
                </p>
                <p className="comparison-copy">
                  Default rounds: <strong>{moduleDef.iterationCount}</strong>
                </p>
                {iteratorRoundSummary ? (
                  <>
                    <p className="comparison-copy">
                      Resolved rounds: <strong>{iteratorRoundSummary.resolvedRounds}</strong>
                    </p>
                    <p className="comparison-copy">
                      {iteratorRoundSummary.hasInstanceOverride ? (
                        <>
                          <span className="meta-label">Instance override active</span>{' '}
                          <strong>
                            ({iteratorRoundSummary.defaultRounds} → {iteratorRoundSummary.resolvedRounds})
                          </strong>
                        </>
                      ) : (
                        <>
                          <span className="meta-label">Using definition default</span>{' '}
                          <strong>({iteratorRoundSummary.defaultRounds})</strong>
                        </>
                      )}
                    </p>
                  </>
                ) : null}
              </>
            ) : null
          ) : null}
          {liveStateSummary ? (
            <div className="inspector-live-state-summary" title={liveStateSummary.title}>
              <span className="meta-label">Live State</span>
              <code className="inspector-live-state-value">
                {liveStateSummary.label} {liveStateSummary.displayText}
              </code>
            </div>
          ) : null}
          {isReadOnlyMode ? (
            <div className="param-field selected-module-rename-field">
              <span>Module ID</span>
              <code>{moduleInstance.id}</code>
              <p className="comparison-copy">Read-only inside the selected composite instance.</p>
            </div>
          ) : (
            <div className="param-field selected-module-rename-field">
              <span>Module ID</span>
              <input
                type="text"
                value={effectiveRenameDraft}
                onChange={(event) => {
                  setRenameState({
                    moduleId: moduleInstance.id,
                    draft: event.target.value,
                    error: null,
                  });
                }}
                placeholder="round-1-mixer"
                spellCheck={false}
                disabled={!canRenameModuleIds || !onRenameModuleInstance}
              />
              <p className="comparison-copy">
                Local ID. Use letters, numbers, hyphens, or underscores.
              </p>
              {effectiveRenameError || renameValidationError ? (
                <p className="field-error">{effectiveRenameError ?? renameValidationError}</p>
              ) : null}
              {!canRenameModuleIds ? (
                <p className="comparison-copy">
                  Rename is unavailable while editing a reusable composite.
                </p>
              ) : null}
            </div>
          )}
          <div className="selected-module-actions">
            {!isReadOnlyMode && Object.values(moduleDef.paramSchema).some((field) => !field.hidden) ? (
              <InspectorIconButton
                icon="copy"
                label="Copy Params"
                onClick={() => onCopyParams(moduleInstance.id)}
              />
            ) : null}
            {!isReadOnlyMode && parameterClipboard &&
            parameterClipboard.sourceModuleId === moduleInstance.id &&
            parameterClipboard.sourceDefId === moduleDef.id ? (
              <button
                type="button"
                className="mini-action-button"
                disabled={compatibleParamApplyTargetIds.length === 0}
                onClick={() =>
                  onApplyCopiedParams(
                    parameterClipboard.sourceModuleId,
                    parameterClipboard.sourceDefId,
                    compatibleParamApplyTargetIds,
                    parameterClipboard.params,
                    parameterClipboard.paramKeys,
                  )
                }
              >
                Apply To Selected
              </button>
            ) : null}
            {!isReadOnlyMode && canRenameModuleIds && onRenameModuleInstance ? (
              <InspectorIconButton
                icon="rename"
                label="Rename Module"
                onClick={() => {
                  const nextModuleId = normalizeModuleInstanceIdCandidate(effectiveRenameDraft);
                  const validationError = getModuleInstanceIdValidationError(
                    nextModuleId,
                    project.modules.map((projectModule) => projectModule.id),
                    moduleInstance.id,
                  );
                  if (validationError) {
                    setRenameState({
                      moduleId: moduleInstance.id,
                      draft: effectiveRenameDraft,
                      error: validationError,
                    });
                    return;
                  }

                  onRenameModuleInstance(moduleInstance.id, nextModuleId);
                  setRenameState({
                    moduleId: nextModuleId,
                    draft: nextModuleId,
                    error: null,
                  });
                }}
              />
            ) : null}
            {!isReadOnlyMode && canBypassSelectedModule ? (
              <InspectorIconButton
                icon="bypass"
                label={moduleInstance.bypass ? 'Disable Bypass' : 'Enable Bypass'}
                onClick={() => onSetModuleBypass(moduleInstance.id, !moduleInstance.bypass)}
              />
            ) : null}
            {!isReadOnlyMode && onRotateModuleClockwise ? (
              <InspectorIconButton
                icon="rotate"
                label="Rotate 90°"
                onClick={() => onRotateModuleClockwise(moduleInstance.id)}
              />
            ) : null}
            {!isReadOnlyMode && onDuplicateModule ? (
              <InspectorIconButton
                icon="duplicate"
                label="Duplicate Module"
                onClick={() => onDuplicateModule(moduleInstance.id)}
              />
            ) : null}
            {!isReadOnlyMode && onReplaceModule ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  if (selectedReplacementDef) {
                    onReplaceModule(moduleInstance.id, selectedReplacementDef.id);
                  }
                }}
                disabled={!selectedReplacementDef}
              >
                Replace with…
              </button>
            ) : null}
            {!isReadOnlyMode && (isCompositeDefinition(moduleDef) || isConditionalDefinition(moduleDef)) && onOpenCompositeInstanceDrilldown ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onOpenCompositeInstanceDrilldown(moduleInstance.id)}
              >
                Open Instance
              </button>
            ) : null}
            {!isReadOnlyMode && isCompositeDefinition(moduleDef) && onUnzipComposite ? (
              <button
                type="button"
                className="primitive-add-button"
                onClick={() => onUnzipComposite(moduleInstance.id)}
              >
                Unzip Composite
              </button>
            ) : null}
            {!isReadOnlyMode ? (
              <InspectorIconButton
                icon="delete"
                label="Delete Module"
                tone="danger"
                onClick={() => onDeleteModule(moduleInstance.id)}
              />
            ) : null}
            {isReadOnlyMode && isCompositeDefinition(moduleDef) && onOpenCompositeDefinition ? (
              <button
                type="button"
                className="mini-action-button"
                onClick={() => onOpenCompositeDefinition(moduleDef.id)}
              >
                Edit Shared Definition
              </button>
            ) : null}
          </div>
          {!isReadOnlyMode && onReplaceModule ? (
            <div className="content-selector-card">
              <div className="param-field">
                <label className="param-field-label" htmlFor="replace-module-search">
                  <span className="param-field-label-text">Replace With</span>
                </label>
                <input
                  id="replace-module-search"
                  type="search"
                  value={replaceSearchQuery}
                  onChange={(event) => setReplaceSearchQuery(event.target.value)}
                  placeholder="Search modules by name, role, or purpose"
                />
              </div>
              <div className="param-field">
                <label className="param-field-label" htmlFor="replace-module-select">
                  <span className="param-field-label-text">Candidate</span>
                </label>
                <select
                  id="replace-module-select"
                  value={selectedReplacementDef?.id ?? ''}
                  onChange={(event) => setSelectedReplacementDefId(event.target.value)}
                >
                  {replacementCandidates.length > 0 ? (
                    replacementCandidates.map((definition) => (
                      <option key={definition.id} value={definition.id}>
                        {definition.name} ({definition.id})
                      </option>
                    ))
                  ) : (
                    <option value="">No matching modules</option>
                  )}
                </select>
              </div>
              {selectedReplacementDef ? (
                <>
                  <div className="content-selector-meta">
                    <span className="content-status-chip">
                      Role: {getModuleRole(selectedReplacementDef)}
                    </span>
                    <span className="content-status-chip">
                      {selectedReplacementDef.inputs.length} in · {selectedReplacementDef.outputs.length} out
                    </span>
                  </div>
                  <p className="comparison-copy">{getModulePurpose(selectedReplacementDef)}</p>
                  <p className="comparison-copy">{getModuleDetail(selectedReplacementDef)}</p>
                </>
              ) : (
                <p className="comparison-copy">
                  No replacement candidates match the current search.
                </p>
              )}
              {replacementConnectionSummary ? (
                <p className="comparison-copy">
                  Replacement keeps <strong>{replacementConnectionSummary.retained}</strong> connection
                  {replacementConnectionSummary.retained === 1 ? '' : 's'} and removes{' '}
                  <strong>{replacementConnectionSummary.dropped}</strong> incompatible connection
                  {replacementConnectionSummary.dropped === 1 ? '' : 's'}.
                </p>
              ) : null}
            </div>
          ) : null}
          {!isReadOnlyMode && parameterClipboard &&
          parameterClipboard.sourceModuleId === moduleInstance.id &&
          parameterClipboard.sourceDefId === moduleDef.id ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Copied parameter set from <strong>{moduleInstance.id}</strong>. Apply will target{' '}
                <strong>{compatibleParamApplyTargetIds.length}</strong> selected {moduleDef.id}{' '}
                module{compatibleParamApplyTargetIds.length === 1 ? '' : 's'}.
              </p>
              {selectedIncompatibleParamTargetCount > 0 ? (
                <p className="comparison-copy">
                  {selectedIncompatibleParamTargetCount} selected module
                  {selectedIncompatibleParamTargetCount === 1 ? '' : 's'} will be skipped because
                  they are not {moduleDef.id} instances.
                </p>
              ) : null}
            </div>
          ) : null}

          {!isReadOnlyMode && canBypassSelectedModule ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Bypass keeps this module in the graph but passes its single input straight through unchanged.
              </p>
              <div className="content-selector-meta">
                <span className="content-status-chip">
                  {moduleInstance.bypass ? 'Bypass Active' : 'Bypass Off'}
                </span>
                <span className="content-status-chip">
                  Eligible: one-input / one-output / same-domain
                </span>
              </div>
            </div>
          ) : null}
          {!isReadOnlyMode && bypassIneligibilityReason ? (
            <div className="content-selector-card">
              <p className="comparison-copy">
                Bypass unavailable: {bypassIneligibilityReason}
              </p>
            </div>
          ) : null}
          {parameterComparisonSummary ? (
            <div className="content-selector-card parameter-comparison-summary-card">
              <p className="comparison-copy">
                Selected sibling comparison anchored to <strong>{moduleInstance.id}</strong>.
              </p>
              <div className="content-selector-meta">
                <span className="content-status-chip">
                  {parameterComparisonSummary.siblingModuleIds.length} same-definition sibling
                  {parameterComparisonSummary.siblingModuleIds.length === 1 ? '' : 's'}
                </span>
                <span className="content-status-chip">
                  {parameterComparisonSummary.alignedFieldCount} aligned field
                  {parameterComparisonSummary.alignedFieldCount === 1 ? '' : 's'}
                </span>
                <span className="content-status-chip">
                  {parameterComparisonSummary.divergentFieldCount} divergent field
                  {parameterComparisonSummary.divergentFieldCount === 1 ? '' : 's'}
                </span>
              </div>
              {parameterComparisonSummary.siblingModuleIds.length > 0 ? (
                <p className="comparison-copy">
                  Comparing against <strong>{parameterComparisonSummary.siblingModuleIds.join(', ')}</strong>.
                </p>
              ) : null}
              {parameterComparisonSummary.incompatibleSelectedCount > 0 ? (
                <p className="comparison-copy">
                  {parameterComparisonSummary.incompatibleSelectedCount} selected module
                  {parameterComparisonSummary.incompatibleSelectedCount === 1 ? '' : 's'} skipped because
                  they are not {moduleDef.id} instances.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="param-list">
            {Object.values(moduleDef.paramSchema).filter((field) => !field.hidden).length === 0 ? (
              <p className="empty-state">This module has no configurable parameters.</p>
            ) : (
              Object.values(moduleDef.paramSchema).filter((field) => !field.hidden).map((field) => {
                const isReadOnlyLinkedRotorField =
                  moduleDef.id === 'RotorReverse' &&
                  Boolean(linkedRotorSourceInstance) &&
                  (field.key === 'wiring' ||
                    field.key === 'position' ||
                    field.key === 'ringOffset' ||
                    field.key === 'notches');
                const value = isReadOnlyLinkedRotorField
                  ? linkedRotorSourceInstance?.params[field.key] ?? field.defaultValue
                  : moduleInstance.params[field.key] ?? field.defaultValue;
                const baselineValue =
                  baselineModuleInstance?.params[field.key] ?? field.defaultValue;
                const draftValue = getParamDraft(moduleInstance.id, field.key);
                const renderedValue =
                  draftValue ?? formatParamValue(value, field);
                const parsedDraft =
                  draftValue !== undefined ? parseParamValue(draftValue, field) : null;
                const fieldError = parsedDraft && !parsedDraft.ok ? parsedDraft.error : null;
                const isForwardedParam =
                  isCompositeDefinition(moduleDef) &&
                  (moduleDef.forwardedParams ?? []).some(
                    (binding) => binding.externalParam === field.key,
                  );

                if (isReadOnlyMode) {
                  return (
                    <div key={field.key} className="param-field param-field-read-only">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      <code>{formatParamValue(value, field)}</code>
                    </div>
                  );
                }

                if (moduleDef.id === 'RotorReverse' && field.key === 'linkedRotorId') {
                  const rotorOptions = project.modules.filter((candidate) => candidate.defId === 'Rotor');

                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      <select
                        value={String(moduleInstance.params[field.key] ?? '')}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.value)
                        }
                      >
                        <option value="">Unlinked</option>
                        {rotorOptions.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.id}
                          </option>
                        ))}
                      </select>
                      {linkedRotorSourceInstance ? (
                        <div className="param-stepper-row">
                          <span className="content-status-chip">
                            Mirroring rotor state from {linkedRotorSourceInstance.id}
                          </span>
                          {onRequestFocusModule ? (
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() => onRequestFocusModule(linkedRotorSourceInstance.id)}
                            >
                              Go To Linked Rotor
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                if (isReadOnlyLinkedRotorField) {
                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <div className="readonly-param-value">
                        {formatLinkedRotorFieldValue(field.key, value)}
                      </div>
                      <p className="meta-copy">
                        Mirrored from the linked forward rotor. Edit the forward rotor to change this value.
                      </p>
                    </label>
                  );
                }

                if (field.kind === 'boolean') {
                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.checked)
                        }
                      />
                    </label>
                  );
                }

                if (field.kind === 'select') {
                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <select
                        value={String(value)}
                        onChange={(event) =>
                          onParamChange(moduleInstance.id, field.key, event.target.value)
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.kind === 'bits') {
                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <BitsEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                if (field.kind === 'wiring') {
                  const isRotorWiringField =
                    (moduleDef.id === 'Rotor' || moduleDef.id === 'RotorReverse') && field.key === 'wiring';
                  const isPlugboardWiringField =
                    moduleDef.id === 'Plugboard' && field.key === 'wiring';
                  const isReflectorWiringField =
                    moduleDef.id === 'Reflector' && field.key === 'wiring';

                  if (isRotorWiringField) {
                    return (
                      <RotorWiringEditor
                        key={field.key}
                        label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        field={field}
                        moduleId={moduleInstance.id}
                        value={value}
                        baselineValue={baselineValue}
                        renderedValue={renderedValue}
                        fieldError={fieldError ?? null}
                        isReadOnlyMode={isReadOnlyMode}
                        rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                        onToggleRawEditor={() => toggleRawEditor(moduleInstance.id, field.key)}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                    );
                  }

                  if (isPlugboardWiringField) {
                    return (
                      <PlugboardEditor
                        key={field.key}
                        label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        field={field}
                        moduleId={moduleInstance.id}
                        value={value}
                        baselineValue={baselineValue}
                        renderedValue={renderedValue}
                        fieldError={fieldError ?? null}
                        isReadOnlyMode={isReadOnlyMode}
                        rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                        onToggleRawEditor={() => toggleRawEditor(moduleInstance.id, field.key)}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                    );
                  }

                  if (isReflectorWiringField) {
                    return (
                      <ReflectorEditor
                        key={field.key}
                        label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                        field={field}
                        moduleId={moduleInstance.id}
                        value={value}
                        baselineValue={baselineValue}
                        renderedValue={renderedValue}
                        fieldError={fieldError ?? null}
                        isReadOnlyMode={isReadOnlyMode}
                        rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                        onToggleRawEditor={() => toggleRawEditor(moduleInstance.id, field.key)}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                    );
                  }

                  return (
                    <label key={field.key} className="param-field">
                      {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      {!areParameterValuesEqual(value, baselineValue) ? (
                        <span className="baseline-chip">
                          Baseline: {formatParamValue(baselineValue, field)}
                        </span>
                      ) : null}
                      <WiringEditor
                        field={field}
                        value={value}
                        renderedValue={renderedValue}
                        moduleId={moduleInstance.id}
                        onParamDraftChange={onParamDraftChange}
                        onParamChange={onParamChange}
                      />
                      {fieldError ? <p className="field-error">{fieldError}</p> : null}
                    </label>
                  );
                }

                const isSBoxTableField =
                  moduleDef.id === 'SBox' &&
                  field.key === 'table' &&
                  field.kind === 'string';

                if (isSBoxTableField) {
                  return (
                    <SBoxEditor
                      key={field.key}
                      label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      field={field}
                      moduleId={moduleInstance.id}
                      value={value}
                      baselineValue={baselineValue}
                      renderedValue={renderedValue}
                      fieldError={fieldError ?? null}
                      isReadOnlyMode={isReadOnlyMode}
                      rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                      onToggleRawEditor={() => toggleRawEditor(moduleInstance.id, field.key)}
                      onParamDraftChange={onParamDraftChange}
                      onParamChange={onParamChange}
                    />
                  );
                }

                const isPermutationOrderField =
                  (moduleDef.id === 'Permutation' || moduleDef.id === 'SymbolPermutation') &&
                  field.key === 'order' &&
                  field.kind === 'string';

                if (isPermutationOrderField) {
                  return (
                    <PermutationOrderEditor
                      key={field.key}
                      label={renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                      field={field}
                      moduleId={moduleInstance.id}
                      value={value}
                      baselineValue={baselineValue}
                      renderedValue={renderedValue}
                      fieldError={fieldError ?? null}
                      isReadOnlyMode={isReadOnlyMode}
                      rawExpanded={isRawEditorExpanded(moduleInstance.id, field.key)}
                      onToggleRawEditor={() => toggleRawEditor(moduleInstance.id, field.key)}
                      onParamDraftChange={onParamDraftChange}
                      onParamChange={onParamChange}
                      renderToolButton={({ icon, label, onClick }) => (
                        <InspectorIconButton
                          icon={icon}
                          label={label}
                          onClick={onClick}
                        />
                      )}
                    />
                  );
                }

                const isHexSourceValueField =
                  moduleDef.id === 'HexSource' &&
                  field.key === 'value' &&
                  field.kind === 'string';

                return (
                  <label key={field.key} className="param-field">
                    {renderParamFieldLabel(field.label, field.key, isForwardedParam)}
                    {!areParameterValuesEqual(value, baselineValue) ? (
                      <span className="baseline-chip">
                        Baseline: {formatParamValue(baselineValue, field)}
                      </span>
                    ) : null}
                    {field.kind === 'number' ? (
                      <ScrubNumberInput
                        renderedValue={renderedValue}
                        onRawChange={(rawValue) => {
                          onParamDraftChange(moduleInstance.id, field.key, rawValue);
                          const parsed = parseParamValue(rawValue, field);
                          if (parsed.ok) {
                            onParamChange(moduleInstance.id, field.key, parsed.value);
                          }
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={renderedValue}
                        onChange={(event) => {
                          const rawValue = event.target.value;
                          onParamDraftChange(moduleInstance.id, field.key, rawValue);
                          const parsed = parseParamValue(rawValue, field);
                          if (parsed.ok) {
                            onParamChange(moduleInstance.id, field.key, parsed.value);
                          }
                        }}
                      />
                    )}
                    {isHexSourceValueField ? (
                      <div className="param-stepper-row">
                        <button
                          type="button"
                          className="mini-action-button"
                          disabled={Boolean(fieldError)}
                          onClick={() => {
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), -1);
                            onParamDraftChange(moduleInstance.id, field.key, nextValue);
                            onParamChange(moduleInstance.id, field.key, nextValue);
                          }}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className="mini-action-button"
                          disabled={Boolean(fieldError)}
                          onClick={() => {
                            const nextValue = stepHexString(String(value ?? field.defaultValue ?? ''), 1);
                            onParamDraftChange(moduleInstance.id, field.key, nextValue);
                            onParamChange(moduleInstance.id, field.key, nextValue);
                          }}
                        >
                          +1
                        </button>
                      </div>
                    ) : null}
                    {fieldError ? <p className="field-error">{fieldError}</p> : null}
                  </label>
                );
              })
            )}
          </div>

          <div className="selected-ports">
            {moduleInstance && onSetModulePortLayoutPreset ? (
              <div className="port-layout-presets">
                <span className="meta-label">Port Layout</span>
                <div className="port-layout-preset-controls">
                  <button
                    type="button"
                    className={`port-layout-preset-button${
                      activePortLayoutPreset === null ? ' active' : ''
                    }`}
                    aria-pressed={activePortLayoutPreset === null}
                    title="Default port layout"
                    onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, null)}
                  >
                    <InspectorIcon name="ports-default" />
                    <span>Default</span>
                  </button>
                  <button
                    type="button"
                    className={`port-layout-preset-button${
                      activePortLayoutPreset === 'horizontal' ? ' active' : ''
                    }`}
                    aria-pressed={activePortLayoutPreset === 'horizontal'}
                    title="Inputs left, outputs right"
                    onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, 'horizontal')}
                  >
                    <InspectorIcon name="ports-horizontal" />
                    <span>Horizontal</span>
                  </button>
                  <button
                    type="button"
                    className={`port-layout-preset-button${
                      activePortLayoutPreset === 'vertical' ? ' active' : ''
                    }`}
                    aria-pressed={activePortLayoutPreset === 'vertical'}
                    title="Inputs top, outputs bottom"
                    onClick={() => onSetModulePortLayoutPreset(moduleInstance.id, 'vertical')}
                  >
                    <InspectorIcon name="ports-vertical" />
                    <span>Vertical</span>
                  </button>
                </div>
              </div>
            ) : null}
            {moduleInstance && onSetModulePortSide ? (
              <div className="port-side-authoring">
                <span className="meta-label">Port Sides</span>
                <div className="port-side-sections">
                  <div className="port-side-section">
                    <span className="meta-label">Inputs</span>
                    <div className="port-side-grid">
                      {PORT_SIDE_ORDER.map((side) => (
                        <div
                          key={`input-${side}`}
                          className={`port-side-bin${
                            draggingPortSide?.direction === 'input' ? ' port-side-bin-targetable' : ''
                          }`}
                          onDragOver={(event) => {
                            if (draggingPortSide?.direction !== 'input') {
                              return;
                            }
                            event.preventDefault();
                          }}
                          onDrop={(event) => {
                            if (draggingPortSide?.direction !== 'input') {
                              return;
                            }
                            event.preventDefault();
                            onSetModulePortSide(
                              moduleInstance.id,
                              'input',
                              draggingPortSide.portName,
                              side,
                            );
                            setDraggingPortSide(null);
                          }}
                        >
                          <span className="port-side-bin-label">{side}</span>
                          <div className="port-side-chip-list">
                            {inputPortsBySide[side].map((port) => (
                              <span
                                key={`${side}-input-${port.name}`}
                                className={`port-side-chip${
                                  draggingPortSide?.direction === 'input' &&
                                  draggingPortSide.portName === port.name
                                    ? ' dragging'
                                    : ''
                                }`}
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = 'move';
                                  event.dataTransfer.setData('text/plain', port.name);
                                  setDraggingPortSide({ direction: 'input', portName: port.name });
                                }}
                                onDragEnd={() => setDraggingPortSide(null)}
                              >
                                <span className="port-side-chip-name">{port.name}</span>
                                {explicitInputPortSides[port.name] ? (
                                  <button
                                    type="button"
                                    className="port-side-chip-reset"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onSetModulePortSide(moduleInstance.id, 'input', port.name, null);
                                    }}
                                  >
                                    Auto
                                  </button>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="port-side-section">
                    <span className="meta-label">Outputs</span>
                    <div className="port-side-grid">
                      {PORT_SIDE_ORDER.map((side) => (
                        <div
                          key={`output-${side}`}
                          className={`port-side-bin${
                            draggingPortSide?.direction === 'output' ? ' port-side-bin-targetable' : ''
                          }`}
                          onDragOver={(event) => {
                            if (draggingPortSide?.direction !== 'output') {
                              return;
                            }
                            event.preventDefault();
                          }}
                          onDrop={(event) => {
                            if (draggingPortSide?.direction !== 'output') {
                              return;
                            }
                            event.preventDefault();
                            onSetModulePortSide(
                              moduleInstance.id,
                              'output',
                              draggingPortSide.portName,
                              side,
                            );
                            setDraggingPortSide(null);
                          }}
                        >
                          <span className="port-side-bin-label">{side}</span>
                          <div className="port-side-chip-list">
                            {outputPortsBySide[side].map((port) => (
                              <span
                                key={`${side}-output-${port.name}`}
                                className={`port-side-chip${
                                  draggingPortSide?.direction === 'output' &&
                                  draggingPortSide.portName === port.name
                                    ? ' dragging'
                                    : ''
                                }`}
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = 'move';
                                  event.dataTransfer.setData('text/plain', port.name);
                                  setDraggingPortSide({ direction: 'output', portName: port.name });
                                }}
                                onDragEnd={() => setDraggingPortSide(null)}
                              >
                                <span className="port-side-chip-name">{port.name}</span>
                                {explicitOutputPortSides[port.name] ? (
                                  <button
                                    type="button"
                                    className="port-side-chip-reset"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      onSetModulePortSide(moduleInstance.id, 'output', port.name, null);
                                    }}
                                  >
                                    Auto
                                  </button>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="port-group">
              <span className="meta-label">Inputs</span>
              {moduleDef.inputs.length === 0 ? (
                <p className="empty-state">No input ports</p>
              ) : (
                <ul className="port-list">
                  {orderedInputPorts.map((port, index) => (
                    <li key={port.name}>
                      <div className="port-list-entry">
                        <div className="port-list-copy">
                          <strong>{port.name}</strong>
                          <span>{port.type}</span>
                        </div>
                        {onMoveModulePortOrder && moduleInstance && orderedInputPorts.length > 1 ? (
                          <div className="port-order-controls">
                            <InspectorIconButton
                              icon="move-up"
                              label={`Move ${port.name} up`}
                              onClick={() =>
                                onMoveModulePortOrder(moduleInstance.id, 'input', port.name, -1)
                              }
                              disabled={index === 0}
                            />
                            <InspectorIconButton
                              icon="move-down"
                              label={`Move ${port.name} down`}
                              onClick={() =>
                                onMoveModulePortOrder(moduleInstance.id, 'input', port.name, 1)
                              }
                              disabled={index === orderedInputPorts.length - 1}
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="port-group">
              <span className="meta-label">Outputs</span>
              {moduleDef.outputs.length === 0 ? (
                <p className="empty-state">No output ports</p>
              ) : (
                <ul className="port-list">
                  {orderedOutputPorts.map((port, index) => (
                    <li key={port.name}>
                      <div className="port-list-entry">
                        <div className="port-list-copy">
                          <strong>{port.name}</strong>
                          <span>{port.type}</span>
                        </div>
                        {onMoveModulePortOrder && moduleInstance && orderedOutputPorts.length > 1 ? (
                          <div className="port-order-controls">
                            <InspectorIconButton
                              icon="move-up"
                              label={`Move ${port.name} up`}
                              onClick={() =>
                                onMoveModulePortOrder(moduleInstance.id, 'output', port.name, -1)
                              }
                              disabled={index === 0}
                            />
                            <InspectorIconButton
                              icon="move-down"
                              label={`Move ${port.name} down`}
                              onClick={() =>
                                onMoveModulePortOrder(moduleInstance.id, 'output', port.name, 1)
                              }
                              disabled={index === orderedOutputPorts.length - 1}
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </section>
      ) : (
        inspectorTab === 'configure' ? (
          <p className="empty-state">Select a module to inspect and edit its parameters.</p>
        ) : null
      )}

      {inspectorTab === 'compare' ? (
        <InspectorCompareView
          projectName={projectName}
          comparisonBaseline={comparisonBaseline}
          baselineOutput={baselineOutput}
          variantOutput={variantOutput}
          baselineExecutionError={baselineExecutionError}
          executionError={executionError}
          executionComparison={executionComparison}
          project={project}
          registry={registry}
          isTickedMode={isTickedMode}
          verificationSourceOptions={verificationSourceOptions}
          verificationCases={verificationCases}
          verificationResults={verificationResults}
          onCaptureBaseline={onCaptureBaseline}
          onClearBaseline={onClearBaseline}
          onAddVerificationCase={onAddVerificationCase}
          onImportVerificationCases={onImportVerificationCases}
          onRemoveVerificationCase={onRemoveVerificationCase}
          onClearVerificationCases={onClearVerificationCases}
        />
      ) : null}
    </aside>
  );
}
