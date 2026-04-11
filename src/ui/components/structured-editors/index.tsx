import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import type { ParamFieldDef } from '../../../engine/types';
import {
  buildIdentityPermutationOrder,
  buildReversePermutationOrder,
  rotatePermutationOrder,
  serializePermutationOrder,
  swapPermutationOrderPositions,
  buildInversePermutationOrder,
} from '../../../engine/modules/permutation';
import {
  buildIdentityPlugboardWiring,
  normalizePlugboardReciprocalWiring,
  pairPlugboardLetters,
  serializePlugboardWiring,
  unpairPlugboardLetter,
} from '../../../engine/modules/plugboard';
import {
  normalizeReflectorReciprocalWiring,
  pairReflectorLetters,
  serializeReflectorWiring,
} from '../../../engine/modules/reflector';
import { serializeRotorWiring, swapRotorWiringTargets } from '../../../engine/modules/rotor';
import { serializeSBoxTable, swapSBoxEntry } from '../../../engine/modules/s-box';
import { parseParamValue } from '../../formatters';
import { areParameterValuesEqual } from '../../parameter-comparison';
import {
  buildPairStyles,
  formatSBoxAxisLabel,
  formatSBoxHexValue,
  getEditablePermutationOrder,
  getEditablePlugboardWiring,
  getEditableReflectorWiring,
  getEditableRotorWiring,
  getEditableSBoxTable,
  getPairKey,
  getPermutationWireColor,
  isSimplePermutationOrder,
  measureWireLayout,
  PERMUTATION_EDITOR_HEADER_OFFSET,
  PERMUTATION_EDITOR_PORT_GAP,
  PERMUTATION_EDITOR_PORT_HEIGHT,
} from '../../inspector-analysis';
import {
  countSBoxFixedPoints,
  generateSBoxTable,
  getSBoxGridColumn,
  getSBoxGridColumns,
  getSBoxGridRow,
  invertSBoxTable,
  isSBoxInvolution,
  rotateSBoxColumn,
  rotateSBoxRow,
  SBOX_GENERATION_PRESETS,
  SBOX_GENERATION_SIZES,
  swapSBoxColumns,
  swapSBoxRows,
} from '../../sbox-transforms';
import { WiringEditor } from '../editors/wiring-editor';

type ToolIconName = 'identity' | 'reverse' | 'rotate-left' | 'rotate-right' | 'inverse';

interface StructuredEditorProps {
  label: ReactNode;
  field: ParamFieldDef;
  moduleId: string;
  value: unknown;
  baselineValue: unknown;
  renderedValue: string;
  fieldError: string | null;
  isReadOnlyMode: boolean;
  rawExpanded: boolean;
  onToggleRawEditor: () => void;
  onParamDraftChange: (moduleId: string, key: string, rawValue: string) => void;
  onParamChange: (moduleId: string, key: string, value: unknown) => void;
}

interface PermutationOrderEditorProps extends StructuredEditorProps {
  renderToolButton: (props: {
    icon: ToolIconName;
    label: string;
    onClick: () => void;
  }) => ReactNode;
}

function renderRawWiringEditor(props: StructuredEditorProps, rawLabel: string) {
  const {
    field,
    moduleId,
    renderedValue,
    fieldError,
    rawExpanded,
    onToggleRawEditor,
    onParamDraftChange,
    onParamChange,
  } = props;

  return (
    <div className="inspector-raw-editor">
      <button
        type="button"
        className="mini-action-button inspector-raw-toggle"
        onClick={onToggleRawEditor}
      >
        {rawExpanded ? `Hide ${rawLabel}` : `Show ${rawLabel}`}
      </button>
      {rawExpanded ? (
        <label className="param-field permutation-editor-raw">
          <span>{rawLabel}</span>
          <textarea
            value={renderedValue}
            onChange={(event) => {
              const rawValue = event.target.value;
              onParamDraftChange(moduleId, field.key, rawValue);
              const parsed = parseParamValue(rawValue, field);
              if (parsed.ok) {
                onParamChange(moduleId, field.key, parsed.value);
              }
            }}
          />
          {fieldError ? <p className="field-error">{fieldError}</p> : null}
        </label>
      ) : fieldError ? (
        <p className="field-error">{fieldError}</p>
      ) : null}
    </div>
  );
}

export function RotorWiringEditor(props: StructuredEditorProps) {
  const {
    label,
    field,
    moduleId,
    value,
    baselineValue,
    renderedValue,
    fieldError,
    onParamDraftChange,
    onParamChange,
  } = props;
  const rotorWiring = getEditableRotorWiring(value);
  const baselineRotorWiring = getEditableRotorWiring(baselineValue);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [draggedRotorInputIndex, setDraggedRotorInputIndex] = useState<number | null>(null);
  const [hoveredRotorOutputIndex, setHoveredRotorOutputIndex] = useState<number | null>(null);
  const [armedRotorInputIndex, setArmedRotorInputIndex] = useState<number | null>(null);
  const rotorInputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const rotorInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rotorOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [rotorWireLayout, setRotorWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const rotorWiringKey = rotorWiring?.join(',') ?? '';

  useLayoutEffect(() => {
    if (!rotorWiring) {
      return;
    }

    const measure = () => {
      setRotorWireLayout(
        measureWireLayout(
          rotorInputLaneRef.current,
          rotorOutputLaneRef.current,
          rotorInputRefs.current,
          rotorOutputRefs.current,
        ),
      );
    };

    const frameId = window.requestAnimationFrame(measure);
    const observer =
      typeof ResizeObserver !== 'undefined' &&
      rotorInputLaneRef.current &&
      rotorOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (observer && rotorInputLaneRef.current && rotorOutputLaneRef.current) {
      observer.observe(rotorInputLaneRef.current);
      observer.observe(rotorOutputLaneRef.current);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [rotorWiring, rotorWiringKey]);

  if (!rotorWiring) {
    return (
      <label className="param-field">
        {label}
        <WiringEditor
          field={field}
          value={value}
          renderedValue={renderedValue}
          moduleId={moduleId}
          onParamDraftChange={onParamDraftChange}
          onParamChange={onParamChange}
        />
        {fieldError ? <p className="field-error">{fieldError}</p> : null}
      </label>
    );
  }

  const activeRotorInputIndex = draggedRotorInputIndex ?? armedRotorInputIndex;
  const rotorSvgHeight =
    rotorWireLayout?.height ??
    rotorWiring.length * PERMUTATION_EDITOR_PORT_HEIGHT +
      Math.max(0, rotorWiring.length - 1) * PERMUTATION_EDITOR_PORT_GAP;

  return (
    <label className="param-field">
      {label}
      {baselineRotorWiring && !areParameterValuesEqual(value, baselineValue) ? (
        <span className="baseline-chip">Baseline: {serializeRotorWiring(baselineRotorWiring)}</span>
      ) : null}
      <div className="permutation-editor">
        <div className="permutation-editor-meta structured-editor-meta">
          <span className="content-status-chip">
            Drag an input wire onto an output letter, or click an input then click an output to
            replug the rotor wiring
          </span>
          <span className="content-status-chip">Position stays separate from the authored wiring</span>
          {activeRotorInputIndex !== null ? (
            <span className="content-status-chip">
              {draggedRotorInputIndex !== null ? 'Dragging' : 'Armed'} input{' '}
              {alphabet[activeRotorInputIndex]}
              {hoveredRotorOutputIndex !== null
                ? ` → output ${alphabet[hoveredRotorOutputIndex]}`
                : ''}
            </span>
          ) : null}
        </div>
        <div
          className={
            activeRotorInputIndex !== null
              ? 'permutation-wire-editor permutation-wire-editor-dragging'
              : 'permutation-wire-editor'
          }
        >
          <div className="permutation-wire-lane" ref={rotorInputLaneRef}>
            <span className="meta-label permutation-wire-lane-label">Input</span>
            {alphabet.map((letter, inputIndex) => (
              <button
                key={`rotor-input-${letter}`}
                type="button"
                ref={(node) => {
                  rotorInputRefs.current[inputIndex] = node;
                }}
                draggable
                className={
                  activeRotorInputIndex === inputIndex
                    ? 'permutation-port permutation-port-input active'
                    : 'permutation-port permutation-port-input'
                }
                onClick={() =>
                  setArmedRotorInputIndex((current) => (current === inputIndex ? null : inputIndex))
                }
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', `rotor-input:${inputIndex}`);
                  setArmedRotorInputIndex(null);
                  setDraggedRotorInputIndex(inputIndex);
                }}
                onDragEnd={() => {
                  setDraggedRotorInputIndex(null);
                  setHoveredRotorOutputIndex(null);
                }}
              >
                <strong className="permutation-slot-value">{letter}</strong>
              </button>
            ))}
          </div>
          <div className="permutation-wire-canvas" aria-hidden="true" style={{ height: `${rotorSvgHeight}px` }}>
            <svg viewBox={`0 0 220 ${rotorSvgHeight}`} preserveAspectRatio="none">
              {rotorWiring.map((targetLetter, inputIndex) => {
                const y1 =
                  rotorWireLayout?.inputYs[inputIndex] ??
                  (PERMUTATION_EDITOR_HEADER_OFFSET +
                    PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                    inputIndex * (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                const outputIndex = alphabet.indexOf(targetLetter);
                const y2 =
                  rotorWireLayout?.outputYs[outputIndex] ??
                  (PERMUTATION_EDITOR_HEADER_OFFSET +
                    PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                    outputIndex * (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                const color = getPermutationWireColor(inputIndex);
                return (
                  <g key={`rotor-wire-${inputIndex}`}>
                    <line x1="18" y1={y1} x2="202" y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
                    <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                    <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="permutation-wire-lane" ref={rotorOutputLaneRef}>
            <span className="meta-label permutation-wire-lane-label">Output</span>
            {alphabet.map((outputLetter) => {
              const outputIndex = alphabet.indexOf(outputLetter);
              const sourceInputIndex = rotorWiring.findIndex((entry) => entry === outputLetter);
              return (
                <button
                  key={`rotor-output-${outputLetter}`}
                  type="button"
                  ref={(node) => {
                    rotorOutputRefs.current[outputIndex] = node;
                  }}
                  className={
                    activeRotorInputIndex !== null && hoveredRotorOutputIndex === outputIndex
                      ? 'permutation-port permutation-port-output drop-target'
                      : 'permutation-port permutation-port-output'
                  }
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (activeRotorInputIndex !== null) {
                      setHoveredRotorOutputIndex(outputIndex);
                    }
                  }}
                  onDragLeave={() => {
                    if (hoveredRotorOutputIndex === outputIndex) {
                      setHoveredRotorOutputIndex(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (activeRotorInputIndex === null) {
                      return;
                    }
                    const nextWiring = swapRotorWiringTargets(
                      rotorWiring,
                      activeRotorInputIndex,
                      sourceInputIndex,
                    );
                    const serialized = serializeRotorWiring(nextWiring);
                    setDraggedRotorInputIndex(null);
                    setArmedRotorInputIndex(null);
                    setHoveredRotorOutputIndex(null);
                    onParamDraftChange(moduleId, field.key, serialized);
                    onParamChange(moduleId, field.key, nextWiring);
                  }}
                  onClick={() => {
                    if (activeRotorInputIndex === null) {
                      return;
                    }
                    const nextWiring = swapRotorWiringTargets(
                      rotorWiring,
                      activeRotorInputIndex,
                      sourceInputIndex,
                    );
                    const serialized = serializeRotorWiring(nextWiring);
                    setDraggedRotorInputIndex(null);
                    setArmedRotorInputIndex(null);
                    setHoveredRotorOutputIndex(null);
                    onParamDraftChange(moduleId, field.key, serialized);
                    onParamChange(moduleId, field.key, nextWiring);
                  }}
                >
                  <strong className="permutation-slot-value">{outputLetter}</strong>
                </button>
              );
            })}
          </div>
        </div>
        {renderRawWiringEditor(props, 'Raw Wiring')}
      </div>
    </label>
  );
}

export function PlugboardEditor(props: StructuredEditorProps) {
  const {
    label,
    field,
    moduleId,
    value,
    baselineValue,
    renderedValue,
    fieldError,
    onParamDraftChange,
    onParamChange,
  } = props;
  const plugboardWiring = getEditablePlugboardWiring(value);
  const baselinePlugboardWiring = getEditablePlugboardWiring(baselineValue);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [selectedPlugboardLetter, setSelectedPlugboardLetter] = useState<string | null>(null);
  const [reciprocityNote, setReciprocityNote] = useState<string | null>(null);

  if (!plugboardWiring) {
    return (
      <label className="param-field">
        {label}
        <WiringEditor
          field={field}
          value={value}
          renderedValue={renderedValue}
          moduleId={moduleId}
          onParamDraftChange={onParamDraftChange}
          onParamChange={onParamChange}
        />
        {fieldError ? <p className="field-error">{fieldError}</p> : null}
      </label>
    );
  }

  const plugboardPairStyles = buildPairStyles(plugboardWiring, { includeSelfPairs: false });
  const activePlugboardPairs =
    alphabet.filter((letter, index) => plugboardWiring[index] !== letter).length / 2;
  const canUnpairSelectedPlugboardLetter =
    selectedPlugboardLetter &&
    plugboardWiring[alphabet.indexOf(selectedPlugboardLetter)] !== selectedPlugboardLetter;

  return (
    <label className="param-field">
      {label}
      {baselinePlugboardWiring && !areParameterValuesEqual(value, baselineValue) ? (
        <span className="baseline-chip">
          Baseline: {serializePlugboardWiring(baselinePlugboardWiring)}
        </span>
      ) : null}
      <div className="reflector-editor">
        <div className="reflector-editor-meta structured-editor-meta">
          <span className="content-status-chip">
            Click one letter, then another, to pair them. Unpaired letters pass straight through.
          </span>
          <span className="content-status-chip">Active pairs: {activePlugboardPairs}</span>
          <span className="content-status-chip">Selected: {selectedPlugboardLetter ?? 'none'}</span>
        </div>
        <p className="comparison-copy structured-editor-copy">
          Plugboard is reciprocal: every valid swap already undoes itself. The helper below confirms
          and normalizes that reciprocal structure.
        </p>
        <div className="structured-editor-utility-strip">
          <div className="structured-editor-utility-card">
            <span className="meta-label">Plugboard Utilities</span>
            <div className="permutation-editor-actions">
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  const nextWiring = buildIdentityPlugboardWiring();
                  const serialized = serializePlugboardWiring(nextWiring);
                  setSelectedPlugboardLetter(null);
                  onParamDraftChange(moduleId, field.key, serialized);
                  onParamChange(moduleId, field.key, nextWiring);
                }}
              >
                Reset To Identity
              </button>
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  const nextWiring = normalizePlugboardReciprocalWiring(plugboardWiring);
                  const serialized = serializePlugboardWiring(nextWiring);
                  setSelectedPlugboardLetter(null);
                  setReciprocityNote(
                    'Plugboard is self-reciprocal: the reciprocal mapping is identical to the current valid pairing.',
                  );
                  onParamDraftChange(moduleId, field.key, serialized);
                  onParamChange(moduleId, field.key, nextWiring);
                }}
              >
                Normalize Reciprocal Pairs
              </button>
              <button
                type="button"
                className="mini-action-button"
                disabled={!canUnpairSelectedPlugboardLetter}
                onClick={() => {
                  if (!selectedPlugboardLetter) {
                    return;
                  }
                  const nextWiring = unpairPlugboardLetter(plugboardWiring, selectedPlugboardLetter);
                  const serialized = serializePlugboardWiring(nextWiring);
                  setSelectedPlugboardLetter(null);
                  onParamDraftChange(moduleId, field.key, serialized);
                  onParamChange(moduleId, field.key, nextWiring);
                }}
              >
                Unpair Selected
              </button>
            </div>
          </div>
        </div>
        {reciprocityNote ? <p className="comparison-copy structured-editor-copy">{reciprocityNote}</p> : null}
        <div className="reflector-editor-grid">
          {alphabet.map((letter, index) => {
            const partner = plugboardWiring[index];
            const pairKey = partner === letter ? null : getPairKey(letter, partner);
            return (
              <button
                key={`plugboard-socket-${letter}`}
                type="button"
                style={pairKey ? plugboardPairStyles[pairKey] : undefined}
                className={
                  selectedPlugboardLetter === letter
                    ? 'reflector-socket active'
                    : partner === letter
                      ? 'reflector-socket reflector-socket-self'
                      : 'reflector-socket'
                }
                onClick={() => {
                  if (selectedPlugboardLetter === null) {
                    setSelectedPlugboardLetter(letter);
                    return;
                  }
                  if (selectedPlugboardLetter === letter) {
                    setSelectedPlugboardLetter(null);
                    return;
                  }
                  const nextWiring = pairPlugboardLetters(
                    plugboardWiring,
                    selectedPlugboardLetter,
                    letter,
                  );
                  const serialized = serializePlugboardWiring(nextWiring);
                  setSelectedPlugboardLetter(null);
                  onParamDraftChange(moduleId, field.key, serialized);
                  onParamChange(moduleId, field.key, nextWiring);
                }}
              >
                <span className="meta-label">Socket</span>
                <strong className="reflector-socket-letter">{letter}</strong>
                {partner === letter ? (
                  <>
                    <span className="reflector-socket-chip reflector-socket-chip-self">Pass Through</span>
                    <span className="reflector-socket-pair">
                      Unpaired <strong>{letter}</strong> remains itself
                    </span>
                  </>
                ) : (
                  <>
                    <span className="reflector-socket-chip">
                      {getPairKey(letter, partner).replace('-', ' ↔ ')}
                    </span>
                    <span className="reflector-socket-pair">
                      Paired with <strong>{partner}</strong>
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {renderRawWiringEditor(props, 'Raw Wiring')}
      </div>
    </label>
  );
}

export function ReflectorEditor(props: StructuredEditorProps) {
  const {
    label,
    field,
    moduleId,
    value,
    baselineValue,
    renderedValue,
    fieldError,
    onParamDraftChange,
    onParamChange,
  } = props;
  const reflectorWiring = getEditableReflectorWiring(value);
  const baselineReflectorWiring = getEditableReflectorWiring(baselineValue);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [selectedReflectorLetter, setSelectedReflectorLetter] = useState<string | null>(null);
  const [reciprocityNote, setReciprocityNote] = useState<string | null>(null);

  if (!reflectorWiring) {
    return (
      <label className="param-field">
        {label}
        <WiringEditor
          field={field}
          value={value}
          renderedValue={renderedValue}
          moduleId={moduleId}
          onParamDraftChange={onParamDraftChange}
          onParamChange={onParamChange}
        />
        {fieldError ? <p className="field-error">{fieldError}</p> : null}
      </label>
    );
  }

  const reflectorPairStyles = buildPairStyles(reflectorWiring);

  return (
    <label className="param-field">
      {label}
      {baselineReflectorWiring && !areParameterValuesEqual(value, baselineValue) ? (
        <span className="baseline-chip">
          Baseline: {serializeReflectorWiring(baselineReflectorWiring)}
        </span>
      ) : null}
      <div className="reflector-editor">
        <div className="reflector-editor-meta structured-editor-meta">
          <span className="content-status-chip">
            Click one letter, then another, to re-pair the sockets
          </span>
          <span className="content-status-chip">Selected: {selectedReflectorLetter ?? 'none'}</span>
        </div>
        <p className="comparison-copy structured-editor-copy">
          Reflector is involutive: every valid pair already maps back to itself. The helper below
          confirms and normalizes that reciprocal wiring.
        </p>
        <div className="structured-editor-utility-strip">
          <div className="structured-editor-utility-card">
            <span className="meta-label">Reflector Utilities</span>
            <div className="permutation-editor-actions">
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  const nextWiring = normalizeReflectorReciprocalWiring(reflectorWiring);
                  const serialized = serializeReflectorWiring(nextWiring);
                  setSelectedReflectorLetter(null);
                  setReciprocityNote(
                    'Reflector is self-reciprocal: the reciprocal mapping is identical to the current valid pairing.',
                  );
                  onParamDraftChange(moduleId, field.key, serialized);
                  onParamChange(moduleId, field.key, nextWiring);
                }}
              >
                Normalize Reciprocal Pairs
              </button>
            </div>
          </div>
        </div>
        {reciprocityNote ? <p className="comparison-copy structured-editor-copy">{reciprocityNote}</p> : null}
        <div className="reflector-editor-grid">
          {alphabet.map((letter, index) => (
            <button
              key={`reflector-socket-${letter}`}
              type="button"
              style={reflectorPairStyles[getPairKey(letter, reflectorWiring[index])]}
              className={
                selectedReflectorLetter === letter ? 'reflector-socket active' : 'reflector-socket'
              }
              onClick={() => {
                if (selectedReflectorLetter === null) {
                  setSelectedReflectorLetter(letter);
                  return;
                }
                if (selectedReflectorLetter === letter) {
                  setSelectedReflectorLetter(null);
                  return;
                }
                const nextWiring = pairReflectorLetters(
                  reflectorWiring,
                  selectedReflectorLetter,
                  letter,
                );
                const serialized = serializeReflectorWiring(nextWiring);
                setSelectedReflectorLetter(null);
                onParamDraftChange(moduleId, field.key, serialized);
                onParamChange(moduleId, field.key, nextWiring);
              }}
            >
              <span className="meta-label">Socket</span>
              <strong className="reflector-socket-letter">{letter}</strong>
              <span className="reflector-socket-chip">
                {getPairKey(letter, reflectorWiring[index]).replace('-', ' ↔ ')}
              </span>
              <span className="reflector-socket-pair">
                Paired with <strong>{reflectorWiring[index]}</strong>
              </span>
            </button>
          ))}
        </div>
        {renderRawWiringEditor(props, 'Raw Wiring')}
      </div>
    </label>
  );
}

export function SBoxEditor(props: StructuredEditorProps) {
  const {
    label,
    field,
    moduleId,
    value,
    baselineValue,
    renderedValue,
    fieldError,
    isReadOnlyMode,
    onParamDraftChange,
    onParamChange,
  } = props;
  const editableTable = getEditableSBoxTable(value);
  const currentEditableTable = editableTable ?? [];
  const baselineTable = getEditableSBoxTable(baselineValue);
  const [requestedSBoxEditIndex, setRequestedSBoxEditIndex] = useState(0);
  const [cellMode, setCellMode] = useState<'select' | 'swap'>('select');
  const [hoveredSwapTargetIndex, setHoveredSwapTargetIndex] = useState<number | null>(null);
  const [draggedAxis, setDraggedAxis] = useState<{ axis: 'row' | 'column'; index: number } | null>(
    null,
  );
  const [hoveredAxisDropTarget, setHoveredAxisDropTarget] = useState<{
    axis: 'row' | 'column';
    index: number;
  } | null>(null);
  const [generationSize, setGenerationSize] = useState<16 | 256>(
    editableTable?.length === 256 ? 256 : 16,
  );
  const [generationPreset, setGenerationPreset] = useState<
    'identity' | 'reverse' | 'random' | 'pair-swap'
  >('identity');

  if (!editableTable) {
    return (
      <label className="param-field">
        {label}
        <input
          type="text"
          value={renderedValue}
          onChange={(event) => {
            const rawValue = event.target.value;
            onParamDraftChange(moduleId, field.key, rawValue);
            const parsed = parseParamValue(rawValue, field);
            if (parsed.ok) {
              onParamChange(moduleId, field.key, parsed.value);
            }
          }}
        />
        <p className="field-error">
          {fieldError ?? 'S-Box editor is unavailable until the table parses again.'}
        </p>
      </label>
    );
  }

  const selectedEntryIndex =
    currentEditableTable.length > 0
      ? Math.min(Math.max(0, requestedSBoxEditIndex), currentEditableTable.length - 1)
      : 0;
  const selectedEntryValue = currentEditableTable[selectedEntryIndex] ?? 0;
  const usesHexGrid = currentEditableTable.length === 256;
  const gridColumns =
    currentEditableTable.length > 0 ? getSBoxGridColumns(currentEditableTable.length) : 4;
  const selectedRow = getSBoxGridRow(selectedEntryIndex, gridColumns);
  const selectedColumn = getSBoxGridColumn(selectedEntryIndex, gridColumns);

  const applyNextTable = (nextTable: number[]) => {
    const serialized = serializeSBoxTable(nextTable);
    onParamDraftChange(moduleId, field.key, serialized);
    onParamChange(moduleId, field.key, serialized);
  };
  const focusSBoxRow = (rowIndex: number) => {
    const nextIndex = Math.min(rowIndex * gridColumns + selectedColumn, currentEditableTable.length - 1);
    setRequestedSBoxEditIndex(nextIndex);
  };
  const focusSBoxColumn = (columnIndex: number) => {
    const nextIndex = Math.min(selectedRow * gridColumns + columnIndex, currentEditableTable.length - 1);
    setRequestedSBoxEditIndex(nextIndex);
  };

  return (
    <label className="param-field">
      {label}
      {baselineTable && !areParameterValuesEqual(value, baselineValue) ? (
        <span className="baseline-chip">Baseline: {baselineTable.length} entries</span>
      ) : null}
      <div className={cellMode === 'swap' ? 'sbox-editor sbox-editor-swap-mode' : 'sbox-editor'}>
        <div className="sbox-editor-meta structured-editor-meta">
          <span className="content-status-chip">{editableTable.length} entries</span>
          <span className="content-status-chip">Drag row or column headers onto each other to swap them in place</span>
          <span className="content-status-chip">Use the edge arrows on the selected row/column to rotate what you are viewing</span>
          <span className="content-status-chip">Cell mode: {cellMode === 'swap' ? 'Swap on click' : 'Selection only'}</span>
          <span className="content-status-chip">
            Active row {formatSBoxAxisLabel(selectedRow, gridColumns)} · column {formatSBoxAxisLabel(selectedColumn, gridColumns)}
          </span>
        </div>
        <div className="sbox-editor-grid sbox-editor-grid-interactive" style={{ gridTemplateColumns: `108px repeat(${gridColumns}, minmax(0, 1fr))` }}>
          <span className="sbox-table-corner" />
          {Array.from({ length: gridColumns }, (_, columnIndex) => (
            <div
              key={`sbox-editor-col-${columnIndex}`}
              className={
                hoveredAxisDropTarget?.axis === 'column' &&
                hoveredAxisDropTarget.index === columnIndex &&
                draggedAxis?.axis === 'column' &&
                draggedAxis.index !== columnIndex
                  ? selectedColumn === columnIndex
                    ? 'sbox-table-header-shell active drop-target'
                    : 'sbox-table-header-shell drop-target'
                  : draggedAxis?.axis === 'column' && draggedAxis.index === columnIndex
                    ? selectedColumn === columnIndex
                      ? 'sbox-table-header-shell active dragging'
                      : 'sbox-table-header-shell dragging'
                    : selectedColumn === columnIndex
                      ? 'sbox-table-header-shell active'
                      : 'sbox-table-header-shell'
              }
            >
              {selectedColumn === columnIndex ? (
                <span className="sbox-axis-actions sbox-axis-actions-column">
                  <button type="button" className="sbox-axis-button" onClick={() => applyNextTable(rotateSBoxColumn(editableTable, selectedColumn, gridColumns, 'up'))}>↑</button>
                  <button type="button" className="sbox-axis-button" onClick={() => applyNextTable(rotateSBoxColumn(editableTable, selectedColumn, gridColumns, 'down'))}>↓</button>
                </span>
              ) : null}
              <button
                type="button"
                draggable={!isReadOnlyMode}
                className="sbox-table-header sbox-table-column-header"
                onClick={() => focusSBoxColumn(columnIndex)}
                onDragStart={() => !isReadOnlyMode && setDraggedAxis({ axis: 'column', index: columnIndex })}
                onDragEnd={() => setDraggedAxis(null)}
                onDragOver={(event) => {
                  if (draggedAxis?.axis === 'column') {
                    event.preventDefault();
                    setHoveredAxisDropTarget({ axis: 'column', index: columnIndex });
                  }
                }}
                onDragLeave={() => {
                  if (hoveredAxisDropTarget?.axis === 'column' && hoveredAxisDropTarget.index === columnIndex) {
                    setHoveredAxisDropTarget(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!draggedAxis || draggedAxis.axis !== 'column') return;
                  if (draggedAxis.index !== columnIndex) {
                    applyNextTable(swapSBoxColumns(currentEditableTable, draggedAxis.index, columnIndex, gridColumns));
                    focusSBoxColumn(columnIndex);
                  }
                  setDraggedAxis(null);
                  setHoveredAxisDropTarget(null);
                }}
              >
                <span className="sbox-axis-label">{formatSBoxAxisLabel(columnIndex, gridColumns)}</span>
              </button>
            </div>
          ))}
          {editableTable.map((entryValue, index) => (
            <Fragment key={`sbox-editor-cell-wrap-${index}`}>
              {index % gridColumns === 0 ? (
                <div
                  className={
                    hoveredAxisDropTarget?.axis === 'row' &&
                    hoveredAxisDropTarget.index === Math.floor(index / gridColumns) &&
                    draggedAxis?.axis === 'row' &&
                    draggedAxis.index !== Math.floor(index / gridColumns)
                      ? Math.floor(index / gridColumns) === selectedRow
                        ? 'sbox-table-header-shell active drop-target'
                        : 'sbox-table-header-shell drop-target'
                      : draggedAxis?.axis === 'row' &&
                          draggedAxis.index === Math.floor(index / gridColumns)
                        ? Math.floor(index / gridColumns) === selectedRow
                          ? 'sbox-table-header-shell active dragging'
                          : 'sbox-table-header-shell dragging'
                        : Math.floor(index / gridColumns) === selectedRow
                          ? 'sbox-table-header-shell active'
                          : 'sbox-table-header-shell'
                  }
                >
                  <button
                    type="button"
                    draggable={!isReadOnlyMode}
                    className="sbox-table-header sbox-table-row-header"
                    onClick={() => focusSBoxRow(Math.floor(index / gridColumns))}
                    onDragStart={() => !isReadOnlyMode && setDraggedAxis({ axis: 'row', index: Math.floor(index / gridColumns) })}
                    onDragEnd={() => setDraggedAxis(null)}
                    onDragOver={(event) => {
                      if (draggedAxis?.axis === 'row') {
                        event.preventDefault();
                        setHoveredAxisDropTarget({ axis: 'row', index: Math.floor(index / gridColumns) });
                      }
                    }}
                    onDragLeave={() => {
                      const rowIndex = Math.floor(index / gridColumns);
                      if (hoveredAxisDropTarget?.axis === 'row' && hoveredAxisDropTarget.index === rowIndex) {
                        setHoveredAxisDropTarget(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!draggedAxis || draggedAxis.axis !== 'row') return;
                      const rowIndex = Math.floor(index / gridColumns);
                      if (draggedAxis.index !== rowIndex) {
                        applyNextTable(swapSBoxRows(currentEditableTable, draggedAxis.index, rowIndex, gridColumns));
                        focusSBoxRow(rowIndex);
                      }
                      setDraggedAxis(null);
                      setHoveredAxisDropTarget(null);
                    }}
                  >
                    <span className="sbox-axis-label">{formatSBoxAxisLabel(Math.floor(index / gridColumns), gridColumns)}</span>
                  </button>
                  {Math.floor(index / gridColumns) === selectedRow ? (
                    <span className="sbox-axis-actions sbox-axis-actions-row">
                      <button type="button" className="sbox-axis-button" onClick={() => applyNextTable(rotateSBoxRow(editableTable, selectedRow, gridColumns, 'left'))}>←</button>
                      <button type="button" className="sbox-axis-button" onClick={() => applyNextTable(rotateSBoxRow(editableTable, selectedRow, gridColumns, 'right'))}>→</button>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                className={
                  cellMode === 'swap' && index === hoveredSwapTargetIndex && index !== selectedEntryIndex
                    ? 'sbox-table-cell swap-preview sbox-editor-cell'
                    : index === selectedEntryIndex
                      ? cellMode === 'swap'
                        ? 'sbox-table-cell active swap-armed sbox-editor-cell'
                        : 'sbox-table-cell active sbox-editor-cell'
                      : Math.floor(index / gridColumns) === selectedRow || index % gridColumns === selectedColumn
                        ? 'sbox-table-cell context sbox-editor-cell'
                        : 'sbox-table-cell sbox-editor-cell'
                }
                onClick={() => {
                  if (cellMode === 'swap' && index !== selectedEntryIndex) {
                    applyNextTable(swapSBoxEntry(currentEditableTable, selectedEntryIndex, entryValue));
                    setRequestedSBoxEditIndex(index);
                    setHoveredSwapTargetIndex(null);
                    return;
                  }
                  setRequestedSBoxEditIndex(index);
                }}
                onMouseEnter={() => {
                  if (cellMode === 'swap' && index !== selectedEntryIndex) {
                    setHoveredSwapTargetIndex(index);
                  }
                }}
                onMouseLeave={() => {
                  if (hoveredSwapTargetIndex === index) {
                    setHoveredSwapTargetIndex(null);
                  }
                }}
              >
                <strong className="sbox-table-value">{formatSBoxAxisLabel(entryValue, gridColumns)}</strong>
              </button>
            </Fragment>
          ))}
        </div>
        <div className="sbox-editor-detail">
          <div className="sbox-detail-chip">
            <span className="meta-label">Selected Entry</span>
            <strong className="sbox-bits">
              {usesHexGrid ? `table[0x${formatSBoxHexValue(selectedEntryIndex, 8)}]` : `table[${selectedEntryIndex}]`}
            </strong>
            <span className="sbox-detail-metric">
              {usesHexGrid
                ? `current output 0x${formatSBoxHexValue(selectedEntryValue, 8)} · decimal ${selectedEntryValue}`
                : `current output ${selectedEntryValue}`}
            </span>
            <div className="sbox-cell-mode-toggle" role="group" aria-label="S-box cell interaction mode">
              <button type="button" className={cellMode === 'select' ? 'sbox-mode-button active' : 'sbox-mode-button'} onClick={() => setCellMode('select')}>Select</button>
              <button type="button" className={cellMode === 'swap' ? 'sbox-mode-button active' : 'sbox-mode-button'} onClick={() => setCellMode('swap')}>Swap</button>
            </div>
          </div>
          <div className="sbox-detail-chip">
            <span className="meta-label">Cell Interaction</span>
            <span className="sbox-detail-metric">
              {cellMode === 'swap'
                ? 'Hover another cell to preview the target, then click to swap outputs.'
                : 'Click cells to inspect them. Turn on swap mode to exchange two outputs directly.'}
            </span>
          </div>
        </div>
        <div className="sbox-editor-utility-strip structured-editor-utility-strip">
          <div className="sbox-editor-utility-card structured-editor-utility-card">
            <span className="meta-label">Generate</span>
            <div className="sbox-generate-controls">
              <select value={String(generationSize)} onChange={(event) => setGenerationSize(Number(event.target.value) as 16 | 256)}>
                {SBOX_GENERATION_SIZES.map((size) => (
                  <option key={size.entryCount} value={size.entryCount}>{size.label}</option>
                ))}
              </select>
              <select value={generationPreset} onChange={(event) => setGenerationPreset(event.target.value as typeof generationPreset)}>
                {SBOX_GENERATION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="mini-action-button"
                onClick={() => {
                  setRequestedSBoxEditIndex(0);
                  applyNextTable(generateSBoxTable(generationSize, generationPreset));
                }}
              >
                Generate
              </button>
            </div>
            <span className="content-status-chip">
              {generationPreset === 'random'
                ? 'Random changes order only.'
                : 'Use generation to seed a table, then refine it directly above.'}
            </span>
          </div>
          <div className="sbox-editor-utility-card structured-editor-utility-card">
            <span className="meta-label">Analyze</span>
            <div className="sbox-generate-controls">
              <span className="content-status-chip">
                {countSBoxFixedPoints(editableTable)} fixed point{countSBoxFixedPoints(editableTable) === 1 ? '' : 's'}
              </span>
              <span className="content-status-chip">
                {isSBoxInvolution(editableTable) ? 'Involution' : 'Not involution'}
              </span>
              <button type="button" className="mini-action-button" onClick={() => applyNextTable(invertSBoxTable(editableTable))}>
                Build Inverse
              </button>
            </div>
          </div>
        </div>
        <div className="inspector-raw-editor">
          <button type="button" className="mini-action-button inspector-raw-toggle" onClick={props.onToggleRawEditor}>
            {props.rawExpanded ? 'Hide Raw CSV Table' : 'Show Raw CSV Table'}
          </button>
          {props.rawExpanded ? (
            <label className="param-field sbox-editor-raw">
              <span>Raw CSV Table</span>
              <textarea
                value={renderedValue}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  onParamDraftChange(moduleId, field.key, rawValue);
                  const parsed = parseParamValue(rawValue, field);
                  if (parsed.ok) {
                    onParamChange(moduleId, field.key, parsed.value);
                  }
                }}
              />
              {fieldError ? <p className="field-error">{fieldError}</p> : null}
            </label>
          ) : fieldError ? (
            <p className="field-error">{fieldError}</p>
          ) : null}
        </div>
      </div>
    </label>
  );
}

export function PermutationOrderEditor(props: PermutationOrderEditorProps) {
  const {
    label,
    field,
    moduleId,
    value,
    baselineValue,
    renderedValue,
    fieldError,
    renderToolButton,
    onParamDraftChange,
    onParamChange,
  } = props;
  const editableOrder = getEditablePermutationOrder(value);
  const baselineOrder = getEditablePermutationOrder(baselineValue);
  const canUseVisualPermutationEditor = editableOrder ? isSimplePermutationOrder(editableOrder) : false;
  const [draggedPermutationInputIndex, setDraggedPermutationInputIndex] = useState<number | null>(null);
  const [hoveredPermutationOutputIndex, setHoveredPermutationOutputIndex] = useState<number | null>(null);
  const [armedPermutationInputIndex, setArmedPermutationInputIndex] = useState<number | null>(null);
  const permutationInputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationOutputLaneRef = useRef<HTMLDivElement | null>(null);
  const permutationInputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const permutationOutputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [permutationWireLayout, setPermutationWireLayout] = useState<{
    height: number;
    inputYs: number[];
    outputYs: number[];
  } | null>(null);
  const editableOrderKey = editableOrder?.join(',') ?? '';

  useLayoutEffect(() => {
    if (!editableOrder) {
      return;
    }
    const measure = () => {
      setPermutationWireLayout(
        measureWireLayout(
          permutationInputLaneRef.current,
          permutationOutputLaneRef.current,
          permutationInputRefs.current,
          permutationOutputRefs.current,
        ),
      );
    };
    const frameId = window.requestAnimationFrame(measure);
    const observer =
      typeof ResizeObserver !== 'undefined' &&
      permutationInputLaneRef.current &&
      permutationOutputLaneRef.current
        ? new ResizeObserver(() => measure())
        : null;
    if (observer && permutationInputLaneRef.current && permutationOutputLaneRef.current) {
      observer.observe(permutationInputLaneRef.current);
      observer.observe(permutationOutputLaneRef.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [editableOrder, editableOrderKey]);

  if (!editableOrder) {
    return (
      <label className="param-field">
        {label}
        <input
          type="text"
          value={renderedValue}
          onChange={(event) => {
            const rawValue = event.target.value;
            onParamDraftChange(moduleId, field.key, rawValue);
            const parsed = parseParamValue(rawValue, field);
            if (parsed.ok) {
              onParamChange(moduleId, field.key, parsed.value);
            }
          }}
        />
        <p className="field-error">
          {fieldError ?? 'Permutation editor is unavailable until the order parses again.'}
        </p>
      </label>
    );
  }

  const activePermutationInputIndex = draggedPermutationInputIndex ?? armedPermutationInputIndex;
  const permutationSvgHeight =
    permutationWireLayout?.height ??
    (canUseVisualPermutationEditor
      ? editableOrder.length * PERMUTATION_EDITOR_PORT_HEIGHT +
        Math.max(0, editableOrder.length - 1) * PERMUTATION_EDITOR_PORT_GAP
      : 0);

  return (
    <label className="param-field">
      {label}
      {baselineOrder && !areParameterValuesEqual(value, baselineValue) ? (
        <span className="baseline-chip">Baseline: {serializePermutationOrder(baselineOrder)}</span>
      ) : null}
      <div className="permutation-editor">
        <div className="permutation-editor-meta structured-editor-meta">
          <span className="content-status-chip">{editableOrder.length} output slots</span>
          <span className="content-status-chip">
            {canUseVisualPermutationEditor
              ? 'Drag an input wire onto an output slot, or click an input then click an output to replug the routing'
              : 'Raw CSV remains available until the permutation order parses again'}
          </span>
          {activePermutationInputIndex !== null ? (
            <span className="content-status-chip">
              {draggedPermutationInputIndex !== null ? 'Dragging' : 'Armed'} input {activePermutationInputIndex}
              {hoveredPermutationOutputIndex !== null ? ` → output ${hoveredPermutationOutputIndex}` : ''}
            </span>
          ) : null}
        </div>
        <div className="permutation-inline-tools" role="group" aria-label="Permutation tools">
          {renderToolButton({
            icon: 'identity',
            label: 'Reset To Identity',
            onClick: () => {
              const nextValue = serializePermutationOrder(buildIdentityPermutationOrder(editableOrder.length));
              onParamDraftChange(moduleId, field.key, nextValue);
              onParamChange(moduleId, field.key, nextValue);
            },
          })}
          {renderToolButton({
            icon: 'reverse',
            label: 'Reset To Reverse',
            onClick: () => {
              const nextValue = serializePermutationOrder(buildReversePermutationOrder(editableOrder.length));
              onParamDraftChange(moduleId, field.key, nextValue);
              onParamChange(moduleId, field.key, nextValue);
            },
          })}
          {renderToolButton({
            icon: 'rotate-left',
            label: 'Rotate Left',
            onClick: () => {
              const nextValue = serializePermutationOrder(rotatePermutationOrder(editableOrder, 'left'));
              onParamDraftChange(moduleId, field.key, nextValue);
              onParamChange(moduleId, field.key, nextValue);
            },
          })}
          {renderToolButton({
            icon: 'rotate-right',
            label: 'Rotate Right',
            onClick: () => {
              const nextValue = serializePermutationOrder(rotatePermutationOrder(editableOrder, 'right'));
              onParamDraftChange(moduleId, field.key, nextValue);
              onParamChange(moduleId, field.key, nextValue);
            },
          })}
          {renderToolButton({
            icon: 'inverse',
            label: 'Build Inverse',
            onClick: () => {
              const nextValue = serializePermutationOrder(buildInversePermutationOrder(editableOrder));
              onParamDraftChange(moduleId, field.key, nextValue);
              onParamChange(moduleId, field.key, nextValue);
            },
          })}
        </div>
        {canUseVisualPermutationEditor ? (
          <div
            className={
              activePermutationInputIndex !== null
                ? 'permutation-wire-editor permutation-wire-editor-dragging'
                : 'permutation-wire-editor'
            }
          >
            <div className="permutation-wire-lane" ref={permutationInputLaneRef}>
              {editableOrder.map((_, inputIndex) => (
                <button
                  key={`perm-input-${inputIndex}`}
                  type="button"
                  ref={(node) => {
                    permutationInputRefs.current[inputIndex] = node;
                  }}
                  draggable
                  className={
                    activePermutationInputIndex === inputIndex
                      ? 'permutation-port permutation-port-input active'
                      : 'permutation-port permutation-port-input'
                  }
                  onClick={() =>
                    setArmedPermutationInputIndex((current) => (current === inputIndex ? null : inputIndex))
                  }
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', `permutation-input:${inputIndex}`);
                    setArmedPermutationInputIndex(null);
                    setDraggedPermutationInputIndex(inputIndex);
                  }}
                  onDragEnd={() => {
                    setDraggedPermutationInputIndex(null);
                    setHoveredPermutationOutputIndex(null);
                  }}
                >
                  <span className="meta-label">Input</span>
                  <strong className="permutation-slot-value">{inputIndex}</strong>
                </button>
              ))}
            </div>
            <div className="permutation-wire-canvas" aria-hidden="true" style={{ height: `${permutationSvgHeight}px` }}>
              <svg viewBox={`0 0 220 ${permutationSvgHeight}`} preserveAspectRatio="none">
                {editableOrder.map((inputIndex, outputIndex) => {
                  const y1 =
                    permutationWireLayout?.inputYs[inputIndex] ??
                    (PERMUTATION_EDITOR_HEADER_OFFSET +
                      PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                      inputIndex * (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                  const y2 =
                    permutationWireLayout?.outputYs[outputIndex] ??
                    (PERMUTATION_EDITOR_HEADER_OFFSET +
                      PERMUTATION_EDITOR_PORT_HEIGHT / 2 +
                      outputIndex * (PERMUTATION_EDITOR_PORT_HEIGHT + PERMUTATION_EDITOR_PORT_GAP));
                  const color = getPermutationWireColor(inputIndex);
                  return (
                    <g key={`perm-wire-${outputIndex}`}>
                      <line x1="18" y1={y1} x2="202" y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
                      <circle cx="18" cy={y1} r="4" fill={color} opacity="0.98" />
                      <circle cx="202" cy={y2} r="4" fill={color} opacity="0.98" />
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="permutation-wire-lane" ref={permutationOutputLaneRef}>
              {editableOrder.map((inputIndex, outputIndex) => (
                <button
                  key={`perm-output-${outputIndex}`}
                  type="button"
                  ref={(node) => {
                    permutationOutputRefs.current[outputIndex] = node;
                  }}
                  className={
                    activePermutationInputIndex !== null && hoveredPermutationOutputIndex === outputIndex
                      ? 'permutation-port permutation-port-output drop-target'
                      : 'permutation-port permutation-port-output'
                  }
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (activePermutationInputIndex !== null) {
                      setHoveredPermutationOutputIndex(outputIndex);
                    }
                  }}
                  onDragLeave={() => {
                    if (hoveredPermutationOutputIndex === outputIndex) {
                      setHoveredPermutationOutputIndex(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (activePermutationInputIndex === null) {
                      return;
                    }
                    const sourceOutputIndex = editableOrder.findIndex((entry) => entry === activePermutationInputIndex);
                    if (sourceOutputIndex < 0) {
                      setDraggedPermutationInputIndex(null);
                      setArmedPermutationInputIndex(null);
                      return;
                    }
                    const nextOrder = swapPermutationOrderPositions(editableOrder, sourceOutputIndex, outputIndex);
                    const serialized = serializePermutationOrder(nextOrder);
                    setDraggedPermutationInputIndex(null);
                    setArmedPermutationInputIndex(null);
                    setHoveredPermutationOutputIndex(null);
                    onParamDraftChange(moduleId, field.key, serialized);
                    onParamChange(moduleId, field.key, serialized);
                  }}
                  onClick={() => {
                    if (activePermutationInputIndex === null) {
                      return;
                    }
                    const sourceOutputIndex = editableOrder.findIndex((entry) => entry === activePermutationInputIndex);
                    if (sourceOutputIndex < 0) {
                      setArmedPermutationInputIndex(null);
                      return;
                    }
                    const nextOrder = swapPermutationOrderPositions(editableOrder, sourceOutputIndex, outputIndex);
                    const serialized = serializePermutationOrder(nextOrder);
                    setDraggedPermutationInputIndex(null);
                    setArmedPermutationInputIndex(null);
                    setHoveredPermutationOutputIndex(null);
                    onParamDraftChange(moduleId, field.key, serialized);
                    onParamChange(moduleId, field.key, serialized);
                  }}
                >
                  <span className="meta-label">Output {outputIndex}</span>
                  <strong className="permutation-slot-value">Input {inputIndex}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="inspector-raw-editor">
          <button type="button" className="mini-action-button inspector-raw-toggle" onClick={props.onToggleRawEditor}>
            {props.rawExpanded ? 'Hide Raw CSV Order' : 'Show Raw CSV Order'}
          </button>
          {props.rawExpanded ? (
            <label className="param-field permutation-editor-raw">
              <span>Raw CSV Order</span>
              <textarea
                value={renderedValue}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  onParamDraftChange(moduleId, field.key, rawValue);
                  const parsed = parseParamValue(rawValue, field);
                  if (parsed.ok) {
                    onParamChange(moduleId, field.key, parsed.value);
                  }
                }}
              />
              {fieldError ? <p className="field-error">{fieldError}</p> : null}
            </label>
          ) : fieldError ? (
            <p className="field-error">{fieldError}</p>
          ) : null}
        </div>
      </div>
    </label>
  );
}
