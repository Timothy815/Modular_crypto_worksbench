import { Fragment, type RefObject, type ReactNode } from 'react';

import type { ExecutionResult, ExecutionTraceEntry, ModuleInstance, ValidationIssue } from '../../engine/types';
import { formatSignal } from '../formatters';
import {
  formatIteratorRoundLabel,
  formatSBoxAxisLabel,
  formatSBoxHexValue,
  getDisplayTraceModuleId,
  getIteratorRoundPath,
  getNestedTracePath,
  getTopLevelTraceModuleId,
  type TransformationView,
} from '../inspector-analysis';
import type { TutorialStep } from '../tutorials';

interface CollapsedAnalyzeSections {
  tick: boolean;
  selectedIssues: boolean;
  graphIssues: boolean;
  traceList: boolean;
  pinned: boolean;
  tutorial: boolean;
  transformation: boolean;
}

interface GroupedIssue {
  targetModuleId: string | null;
  title: string;
  messages: string[];
}

interface RoundFocusOption {
  path: string;
  label: string;
}

interface LookupChunk {
  index: number;
  inputBits: number[];
  inputValue: number;
  outputValue: number;
  outputBits: number[];
}

function InspectorSection({
  label,
  collapsible = false,
  collapsed = false,
  onToggle,
  children,
}: {
  label: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`analysis-section${collapsed ? ' analysis-section-collapsed' : ''}`}>
      <div className="analysis-section-head">
        <span className="meta-label">{label}</span>
        {collapsible ? (
          <button
            type="button"
            className="collapse-toggle-button analysis-section-toggle"
            aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            onClick={onToggle}
          >
            {collapsed ? '+' : '\u2212'}
          </button>
        ) : null}
      </div>
      {!collapsed ? children : null}
    </section>
  );
}

interface InspectorAnalyzeDetailsProps {
  inspectorTab: 'configure' | 'analyze' | 'compare';
  transformationView: TransformationView | null;
  activeLookupChunk: LookupChunk | null;
  effectiveLookupChunkIndex: number;
  setRequestedLookupChunkIndex: (index: number) => void;
  collapsedAnalyzeSections: CollapsedAnalyzeSections;
  toggleAnalyzeSection: (key: keyof CollapsedAnalyzeSections) => void;
  groupedSelectedIssues: GroupedIssue[];
  groupedGlobalIssues: GroupedIssue[];
  executionError: string | null;
  validationIssues: ValidationIssue[];
  selectedTrace: ExecutionTraceEntry | null;
  selectedTraceOrder: number | null;
  analysisTrace: ExecutionTraceEntry[];
  roundFocusOptions: RoundFocusOption[];
  effectiveFocusedRoundPath: string;
  setFocusedRoundPath: (path: string) => void;
  effectiveTraceMode: 'focused' | 'full' | 'upstream' | 'downstream';
  setTraceMode: (mode: 'focused' | 'full' | 'upstream' | 'downstream') => void;
  traceEntries: ExecutionTraceEntry[];
  execution: ExecutionResult | null;
  steppedAnalysisEntry: ExecutionTraceEntry | null;
  steppedTrace: ExecutionTraceEntry | null;
  effectiveStepperMode: 'top-level' | 'nested';
  moduleInstance: ModuleInstance | null;
  tutorialStep: TutorialStep | null;
  tutorialTraceRef: RefObject<HTMLLIElement | null>;
  onTraceHover: (moduleId: string | null) => void;
  setRequestedNestedStepIndex: (index: number | null) => void;
  onStepChange: (index: number | null) => void;
  onRequestFocusModule?: (moduleId: string) => void;
  onSelectIssueTarget: (moduleId: string) => void;
}

export function InspectorAnalyzeDetails({
  inspectorTab,
  transformationView,
  activeLookupChunk,
  effectiveLookupChunkIndex,
  setRequestedLookupChunkIndex,
  collapsedAnalyzeSections,
  toggleAnalyzeSection,
  groupedSelectedIssues,
  groupedGlobalIssues,
  executionError,
  validationIssues,
  selectedTrace,
  selectedTraceOrder,
  analysisTrace,
  roundFocusOptions,
  effectiveFocusedRoundPath,
  setFocusedRoundPath,
  effectiveTraceMode,
  setTraceMode,
  traceEntries,
  execution,
  steppedAnalysisEntry,
  steppedTrace,
  effectiveStepperMode,
  moduleInstance,
  tutorialStep,
  tutorialTraceRef,
  onTraceHover,
  setRequestedNestedStepIndex,
  onStepChange,
  onRequestFocusModule,
  onSelectIssueTarget,
}: InspectorAnalyzeDetailsProps) {
  return (
    <>
      {inspectorTab === 'analyze' && transformationView ? (
        <InspectorSection
          label="Transformation"
          collapsible
          collapsed={collapsedAnalyzeSections.transformation}
          onToggle={() => toggleAnalyzeSection('transformation')}
        >
          <div className="transformation-card">
            <div className="transformation-card-head">
              <strong>{transformationView.title}</strong>
              <span>
                {getDisplayTraceModuleId(transformationView.entry)} ({transformationView.entry.defId})
              </span>
            </div>
            <p className="transformation-copy">{transformationView.copy}</p>
            {transformationView.kind === 'routing' ? (
              <>
                {transformationView.configLabel && transformationView.configValue ? (
                  <div className="transformation-order">
                    <span className="meta-label">{transformationView.configLabel}</span>
                    <code>{transformationView.configValue}</code>
                  </div>
                ) : null}
                <div className="transformation-routing-head">
                  <span className="meta-label">Input</span>
                  <span className="meta-label">{transformationView.middleLabel}</span>
                  <span className="meta-label">Output</span>
                </div>
                <div className="transformation-routing">
                  <div className="transformation-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.inputLane.map((row) => (
                        <div key={`input-${row.inputIndex}`} className="transformation-lane-cell">
                          <span className="transformation-index">{row.inputIndex}</span>
                          <strong>{row.inputValue}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="transformation-wire-canvas"
                    aria-hidden="true"
                    style={{ height: `${transformationView.svgHeight}px` }}
                  >
                    <svg viewBox={`0 0 220 ${transformationView.svgHeight}`} preserveAspectRatio="none">
                      {transformationView.rows.map((row) =>
                        row.kind === 'line' ? (
                          <line
                            key={`wire-${row.inputIndex}-${row.outputIndex}`}
                            x1="18"
                            y1={row.inputY}
                            x2="202"
                            y2={row.outputY}
                            stroke={row.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.92"
                          />
                        ) : (
                          <g key={`fill-${row.outputIndex}`}>
                            <line
                              x1="18"
                              y1={row.outputY}
                              x2="202"
                              y2={row.outputY}
                              stroke={row.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeDasharray="7 6"
                              opacity="0.88"
                            />
                            <text
                              x="110"
                              y={row.outputY - 6}
                              textAnchor="middle"
                              className="transformation-wire-label"
                            >
                              0-fill
                            </text>
                          </g>
                        ),
                      )}
                    </svg>
                  </div>
                  <div className="transformation-lane transformation-output-lane">
                    <div className="transformation-lane-cells">
                      {transformationView.outputLane.map((row) => (
                        <div
                          key={`output-${row.outputIndex}`}
                          className={
                            row.kind === 'fill'
                              ? 'transformation-lane-cell transformation-output-cell transformation-output-fill'
                              : 'transformation-lane-cell transformation-output-cell'
                          }
                        >
                          <span className="transformation-index">{row.outputIndex}</span>
                          <strong>{row.outputValue}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : transformationView.kind === 'xor' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>same {'->'} 0, different {'->'} 1</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`xor-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                      <span
                        className={
                          row.resultBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.resultBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'compare' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.ruleLabel}</span>
                  <code>{transformationView.ruleValue}</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Unsigned Words</span>
                  <code>
                    A = {transformationView.leftValue} · B = {transformationView.rightValue} · out = {transformationView.outputBit}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input A</span>
                    <span className="meta-label">Input B</span>
                    <span className="meta-label">Compare</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`compare-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.aBit}</span>
                      <span className="xor-grid-bit">{row.bBit}</span>
                      <span
                        className={
                          row.explanation === 'different'
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {row.explanation}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'gate' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Control</span>
                  <code>
                    {transformationView.controlValue.join('') || '[]'} {'->'} {transformationView.active ? 'open' : 'closed'}
                  </code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Gate</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.rows.map((row) => (
                    <div key={`gate-${row.index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.index}</span>
                      <span className="xor-grid-bit">{row.inputBit}</span>
                      <span
                        className={
                          transformationView.active
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {transformationView.active ? 'pass' : 'block'}
                      </span>
                      <span
                        className={
                          row.outputBit === 1
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {row.outputBit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'majority' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>at least 2 active gives 1, otherwise 0</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Active Count</span>
                  <code>{transformationView.activeCount} / 3 gives {transformationView.outputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {transformationView.inputs.map((input) => (
                    <div key={`majority-${input.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{input.label}</span>
                      <span className={input.bit === 1 ? 'xor-grid-bit xor-grid-bit-active' : 'xor-grid-bit'}>
                        {input.bit}
                      </span>
                      <span
                        className={
                          input.bit === 1
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {input.bit === 1 ? 'active' : 'inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'mux' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>select = 0 {'->'} a · select = 1 {'->'} b</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Chosen Input</span>
                  <code>{transformationView.chosenInput} gives {transformationView.outputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {[
                    { label: 'select', bit: transformationView.selectBit, chosen: false },
                    { label: 'a', bit: transformationView.aBit, chosen: transformationView.chosenInput === 'a' },
                    { label: 'b', bit: transformationView.bBit, chosen: transformationView.chosenInput === 'b' },
                  ].map((input) => (
                    <div key={`mux-${input.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{input.label}</span>
                      <span className={input.bit === 1 ? 'xor-grid-bit xor-grid-bit-active' : 'xor-grid-bit'}>
                        {input.bit}
                      </span>
                      <span
                        className={
                          input.chosen
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {input.label === 'select' ? 'control' : input.chosen ? 'chosen' : 'ignored'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'demux' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>select = 0 {'->'} a · select = 1 {'->'} b</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Chosen Output</span>
                  <code>{transformationView.chosenOutput} receives {transformationView.inputBit}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Lane</span>
                    <span className="meta-label">Bit</span>
                    <span className="meta-label">State</span>
                  </div>
                  {[
                    { label: 'select', bit: transformationView.selectBit, active: false, state: 'control' },
                    { label: 'in', bit: transformationView.inputBit, active: false, state: 'source' },
                    { label: 'a', bit: transformationView.outputABit, active: transformationView.chosenOutput === 'a', state: transformationView.chosenOutput === 'a' ? 'routed' : 'zeroed' },
                    { label: 'b', bit: transformationView.outputBBit, active: transformationView.chosenOutput === 'b', state: transformationView.chosenOutput === 'b' ? 'routed' : 'zeroed' },
                  ].map((row) => (
                    <div key={`demux-${row.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{row.label}</span>
                      <span className={row.bit === 1 ? 'xor-grid-bit xor-grid-bit-active' : 'xor-grid-bit'}>
                        {row.bit}
                      </span>
                      <span className={row.active ? 'xor-grid-compare xor-grid-compare-different' : 'xor-grid-compare'}>
                        {row.state}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'split' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Split Point</span>
                  <code>leftWidth = {transformationView.leftWidth}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Block</span>
                  </div>
                  {transformationView.inputBits.map((bit, index) => (
                    <div key={`split-${index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{index}</span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {bit}
                      </span>
                      <span
                        className={
                          index < transformationView.leftWidth
                            ? 'xor-grid-compare xor-grid-compare-different'
                            : 'xor-grid-compare'
                        }
                      >
                        {index < transformationView.leftWidth ? 'left' : 'right'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'pad' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Target Width</span>
                  <code>{transformationView.targetWidth} bits</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Pad</span>
                  <code>{transformationView.padCount} × {transformationView.padBit} on {transformationView.side}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Output</span>
                    <span className="meta-label">Source</span>
                  </div>
                  {transformationView.outputBits.map((bit, index) => {
                    const isPad = transformationView.side === 'left'
                      ? index < transformationView.padCount
                      : index >= transformationView.inputBits.length;
                    return (
                      <div key={`pad-${index}`} className="xor-grid-row">
                        <span className="xor-grid-index">{index}</span>
                        <span className={isPad ? 'xor-grid-bit' : 'xor-grid-bit xor-grid-bit-active'}>
                          {bit}
                        </span>
                        <span
                          className={
                            isPad
                              ? 'xor-grid-compare'
                              : 'xor-grid-compare xor-grid-compare-different'
                          }
                        >
                          {isPad ? 'pad' : 'original'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : transformationView.kind === 'arithmetic' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.operationLabel}</span>
                  <code>{transformationView.operationExpression}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Output</span>
                  </div>
                  {transformationView.outputBits.map((bit, index) => (
                    <div key={`arith-${index}`} className="xor-grid-row">
                      <span className="xor-grid-index">{index}</span>
                      <span className="xor-grid-bit">
                        {index < transformationView.inputBits.length ? transformationView.inputBits[index] : '-'}
                      </span>
                      <span
                        className={
                          index < transformationView.inputBits.length && bit !== transformationView.inputBits[index]
                            ? 'xor-grid-bit xor-grid-bit-active'
                            : 'xor-grid-bit'
                        }
                      >
                        {bit}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : transformationView.kind === 'unpad' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Original Width</span>
                  <code>{transformationView.originalWidth} bits</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Strip</span>
                  <code>{transformationView.strippedCount} bit{transformationView.strippedCount === 1 ? '' : 's'} from {transformationView.side}</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Index</span>
                    <span className="meta-label">Input</span>
                    <span className="meta-label">Source</span>
                  </div>
                  {transformationView.inputBits.map((bit, index) => {
                    const isKept = transformationView.side === 'left'
                      ? index >= transformationView.strippedCount
                      : index < transformationView.outputBits.length;
                    return (
                      <div key={`unpad-${index}`} className="xor-grid-row">
                        <span className="xor-grid-index">{index}</span>
                        <span className={isKept ? 'xor-grid-bit xor-grid-bit-active' : 'xor-grid-bit'}>
                          {bit}
                        </span>
                        <span
                          className={
                            isKept
                              ? 'xor-grid-compare xor-grid-compare-different'
                              : 'xor-grid-compare'
                          }
                        >
                          {isKept ? 'kept' : 'stripped'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Chunk Shape</span>
                  <code>{transformationView.inputWidth} → {transformationView.outputWidth} bits</code>
                </div>
                {transformationView.chunks.length > 1 ? (
                  <div className="sbox-chunk-selector">
                    {transformationView.chunks.map((chunk) => (
                      <button
                        key={`sbox-chunk-${chunk.index}`}
                        type="button"
                        className={
                          chunk.index === effectiveLookupChunkIndex
                            ? 'sbox-chunk-chip active'
                            : 'sbox-chunk-chip'
                        }
                        onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                      >
                        Chunk {chunk.index + 1}
                      </button>
                    ))}
                  </div>
                ) : null}
                {activeLookupChunk ? (
                  <div className="sbox-view">
                    {(() => {
                      const activeDisplayIndex =
                        transformationView.displayIndexByInputValue[activeLookupChunk.inputValue] ?? 0;
                      return (
                    <>
                    <div
                      className="sbox-table-wrap"
                      style={{ gridTemplateColumns: `56px repeat(${transformationView.gridColumns}, minmax(0, 1fr))` }}
                    >
                      <span className="sbox-table-corner" />
                      {Array.from({ length: transformationView.gridColumns }, (_, columnIndex) => (
                        <span
                          key={`sbox-col-${columnIndex}`}
                          className={
                            columnIndex === activeDisplayIndex % transformationView.gridColumns
                              ? 'sbox-table-header active'
                              : 'sbox-table-header'
                          }
                        >
                          {formatSBoxAxisLabel(columnIndex, transformationView.gridColumns)}
                        </span>
                      ))}
                      {transformationView.displayOrder.map((tableIndex, displayIndex) => (
                        <Fragment key={`sbox-cell-wrap-${tableIndex}`}>
                          {displayIndex % transformationView.gridColumns === 0 ? (
                            <span
                              className={
                                Math.floor(displayIndex / transformationView.gridColumns) ===
                                  Math.floor(activeDisplayIndex / transformationView.gridColumns)
                                  ? 'sbox-table-header sbox-table-row-header active'
                                  : 'sbox-table-header sbox-table-row-header'
                              }
                            >
                              {formatSBoxAxisLabel(
                                Math.floor(displayIndex / transformationView.gridColumns),
                                transformationView.gridColumns,
                              )}
                            </span>
                          ) : null}
                          <div
                            key={`sbox-cell-${tableIndex}`}
                            className={
                              tableIndex === activeLookupChunk.inputValue
                                ? 'sbox-table-cell active'
                                : Math.floor(displayIndex / transformationView.gridColumns) ===
                                      Math.floor(activeDisplayIndex / transformationView.gridColumns) ||
                                    displayIndex % transformationView.gridColumns ===
                                      activeDisplayIndex % transformationView.gridColumns
                                  ? 'sbox-table-cell context'
                                  : 'sbox-table-cell'
                            }
                            title={`table[${tableIndex}] = ${transformationView.table[tableIndex]}`}
                          >
                            <strong className="sbox-table-value">
                              {formatSBoxAxisLabel(transformationView.table[tableIndex], transformationView.gridColumns)}
                            </strong>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="sbox-lookup-banner">
                      <span className="meta-label">Active Lookup</span>
                      <strong className="sbox-lookup-index">
                        {transformationView.usesHexGrid
                          ? `table[0x${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.inputWidth)}] = 0x${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.outputWidth)}`
                          : `table[${activeLookupChunk.inputValue}] = ${activeLookupChunk.outputValue}`}
                      </strong>
                      {transformationView.inputWidth === 6 && transformationView.outputWidth === 4 ? (
                        <p className="comparison-copy">
                          DES-style layout uses the outer two bits for the row and the inner four bits for the column.
                        </p>
                      ) : transformationView.usesHexGrid ? (
                        <p className="comparison-copy">
                          Hex <strong>{formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.inputWidth)}</strong> means row{' '}
                          <strong>{formatSBoxAxisLabel(Math.floor(activeDisplayIndex / transformationView.gridColumns), transformationView.gridColumns)}</strong>{' '}
                          and column{' '}
                          <strong>{formatSBoxAxisLabel(activeDisplayIndex % transformationView.gridColumns, transformationView.gridColumns)}</strong>.
                        </p>
                      ) : null}
                    </div>
                    <div className="sbox-detail-row">
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Input Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.inputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.inputValue, transformationView.inputWidth)} · decimal ${activeLookupChunk.inputValue}`
                            : `decimal ${activeLookupChunk.inputValue}`}
                        </span>
                      </div>
                      <div className="sbox-detail-chip">
                        <span className="meta-label">Output Chunk</span>
                        <strong className="sbox-bits">{activeLookupChunk.outputBits.join('')}</strong>
                        <span className="sbox-detail-metric">
                          {transformationView.usesHexGrid
                            ? `hex ${formatSBoxHexValue(activeLookupChunk.outputValue, transformationView.outputWidth)} · decimal ${activeLookupChunk.outputValue}`
                            : `decimal ${activeLookupChunk.outputValue}`}
                        </span>
                      </div>
                    </div>
                    </>
                      );
                    })()}
                    <div className="sbox-chunk-grid">
                      {transformationView.chunks.map((chunk) => (
                        <button
                          key={`sbox-summary-${chunk.index}`}
                          type="button"
                          className={
                            chunk.index === effectiveLookupChunkIndex
                              ? 'sbox-chunk-summary active'
                              : 'sbox-chunk-summary'
                          }
                          onClick={() => setRequestedLookupChunkIndex(chunk.index)}
                        >
                          <span className="meta-label">Chunk {chunk.index + 1}</span>
                          <p className="comparison-copy">
                            {chunk.inputBits.join('')} ({chunk.inputValue}) {'->'} {chunk.outputBits.join('')} ({chunk.outputValue})
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <p className="transformation-summary">
              {transformationView.kind === 'lookup' && activeLookupChunk
                ? `Input chunk ${activeLookupChunk.inputBits.join('')} is index ${activeLookupChunk.inputValue}. The substitution table maps ${activeLookupChunk.inputValue} to ${activeLookupChunk.outputValue}, so the output chunk becomes ${activeLookupChunk.outputBits.join('')}.`
                : transformationView.summary}
            </p>
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && groupedSelectedIssues.length > 0 ? (
        <InspectorSection
          label="Selected Module Issues"
          collapsible
          collapsed={collapsedAnalyzeSections.selectedIssues}
          onToggle={() => toggleAnalyzeSection('selectedIssues')}
        >
          <ul className="issue-list">
            {groupedSelectedIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? <span className="issue-target-chip">{group.targetModuleId}</span> : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && executionError ? (
        <p className={validationIssues.length > 0 ? 'inspector-warning' : 'inspector-runtime-error'}>
          {validationIssues.length > 0
            ? 'Current edits make the graph invalid. Resolve the issues below to restore execution.'
            : `Execution failed even though the graph is valid. ${executionError}`}
        </p>
      ) : inspectorTab === 'analyze' && selectedTrace ? (
        <div className="selected-trace">
          <span className="meta-label">Selected Trace</span>
          <p className="selected-trace-order">
            Step {selectedTraceOrder ?? '?'} of {analysisTrace.length}
          </p>
          <p>
            inputs:{' '}
            {Object.entries(selectedTrace.inputs)
              .map(([, signal]) => formatSignal(signal))
              .join(' | ') || 'none'}
          </p>
          <p>
            outputs:{' '}
            {Object.entries(selectedTrace.outputs)
              .map(([, signal]) => formatSignal(signal))
              .join(' | ') || 'none'}
          </p>
        </div>
      ) : null}

      {inspectorTab === 'analyze' && groupedGlobalIssues.length > 0 ? (
        <InspectorSection
          label="Graph Issues"
          collapsible
          collapsed={collapsedAnalyzeSections.graphIssues}
          onToggle={() => toggleAnalyzeSection('graphIssues')}
        >
          <ul className="issue-list">
            {groupedGlobalIssues.map((group, index) => (
              <li
                key={`${group.targetModuleId ?? 'global'}-${index}`}
                className={group.targetModuleId ? 'issue-card issue-card-actionable' : 'issue-card'}
                onClick={() => {
                  if (group.targetModuleId) {
                    onSelectIssueTarget(group.targetModuleId);
                  }
                }}
              >
                <strong>{group.title}</strong>
                {group.targetModuleId ? <span className="issue-target-chip">{group.targetModuleId}</span> : null}
                <p>{group.messages.join(' ')}</p>
              </li>
            ))}
          </ul>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' ? (
        <InspectorSection
          label="Execution Trace"
          collapsible
          collapsed={collapsedAnalyzeSections.traceList}
          onToggle={() => toggleAnalyzeSection('traceList')}
        >
          <div className="trace-toolbar">
            <div className="trace-toolbar-controls">
              {roundFocusOptions.length > 0 ? (
                <label className="trace-round-select">
                  <span className="meta-label">Focus Round</span>
                  <select
                    value={effectiveFocusedRoundPath}
                    onChange={(event) => setFocusedRoundPath(event.target.value)}
                  >
                    <option value="all">All Rounds</option>
                    {roundFocusOptions.map((option) => (
                      <option key={option.path} value={option.path}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="trace-mode-toggle">
                <button
                  type="button"
                  className={effectiveTraceMode === 'focused' ? 'trace-mode-button active' : 'trace-mode-button'}
                  disabled={!selectedTrace}
                  onClick={() => setTraceMode('focused')}
                >
                  Focused
                </button>
                <button
                  type="button"
                  className={effectiveTraceMode === 'full' ? 'trace-mode-button active' : 'trace-mode-button'}
                  onClick={() => setTraceMode('full')}
                >
                  Full
                </button>
                <button
                  type="button"
                  className={effectiveTraceMode === 'upstream' ? 'trace-mode-button active' : 'trace-mode-button'}
                  disabled={!selectedTrace}
                  onClick={() => setTraceMode('upstream')}
                >
                  Upstream
                </button>
                <button
                  type="button"
                  className={effectiveTraceMode === 'downstream' ? 'trace-mode-button active' : 'trace-mode-button'}
                  disabled={!selectedTrace}
                  onClick={() => setTraceMode('downstream')}
                >
                  Downstream
                </button>
              </div>
            </div>
          </div>
          {!collapsedAnalyzeSections.traceList ? (
            <ol className="trace-list">
              {traceEntries.map((entry, analysisIndex) => {
                const isNested = (entry.depth ?? 0) > 0;
                const topLevelModuleId = getTopLevelTraceModuleId(entry);
                const nestedPath = getNestedTracePath(entry);
                const roundPath = getIteratorRoundPath(entry);
                const previousRoundPath =
                  analysisIndex > 0 ? getIteratorRoundPath(traceEntries[analysisIndex - 1]) : null;
                const isRoundBoundary = roundPath !== null && roundPath !== previousRoundPath;
                const traceIndex = analysisTrace.findIndex(
                  (traceEntry) => traceEntry.moduleId === entry.moduleId,
                );
                const topLevelIndex = execution?.trace.findIndex(
                  (traceEntry) => traceEntry.moduleId === topLevelModuleId,
                ) ?? -1;

                return (
                  <li
                    key={entry.moduleId}
                    ref={entry.moduleId === tutorialStep?.focusModuleId ? tutorialTraceRef : null}
                    className={
                      effectiveStepperMode === 'nested' && steppedAnalysisEntry?.moduleId === entry.moduleId
                        ? entry.moduleId === tutorialStep?.focusModuleId
                          ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                          : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                        : topLevelModuleId === steppedTrace?.moduleId
                          ? entry.moduleId === tutorialStep?.focusModuleId
                            ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped trace-card-tutorial`
                            : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-stepped`
                          : entry.moduleId === tutorialStep?.focusModuleId
                            ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-tutorial`
                            : topLevelModuleId === moduleInstance?.id
                              ? `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''} trace-card-active`
                              : `trace-card${isNested ? ' trace-card-nested' : ''}${isRoundBoundary ? ' trace-card-round-boundary' : ''}`
                    }
                    style={{ marginLeft: `${Math.max(0, (entry.depth ?? 0) * 14)}px` }}
                    onMouseEnter={() => onTraceHover(topLevelModuleId)}
                    onMouseLeave={() => onTraceHover(null)}
                    onClick={() => {
                      if (effectiveStepperMode === 'nested') {
                        setRequestedNestedStepIndex(analysisIndex);
                      } else {
                        onStepChange(topLevelIndex >= 0 ? topLevelIndex : null);
                      }

                      onRequestFocusModule?.(topLevelModuleId);
                    }}
                  >
                    <div className="trace-head">
                      <div className="trace-head-labels">
                        <strong>{getDisplayTraceModuleId(entry)}</strong>
                        <div className="trace-chip-row">
                          {isNested ? <span className="trace-nested-chip">Inside {topLevelModuleId}</span> : null}
                          {roundPath ? (
                            <span className="trace-round-chip">{formatIteratorRoundLabel(roundPath)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="trace-head-actions">
                        <span>
                          #{traceIndex >= 0 ? traceIndex + 1 : analysisIndex + 1} {entry.defId}
                        </span>
                        <button
                          type="button"
                          className="trace-focus-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRequestFocusModule?.(topLevelModuleId);
                          }}
                        >
                          Focus In Workspace
                        </button>
                      </div>
                    </div>
                    {nestedPath ? <p className="trace-nested-path">{nestedPath}</p> : null}
                    <p>
                      inputs:{' '}
                      {Object.entries(entry.inputs)
                        .map(([, signal]) => formatSignal(signal))
                        .join(' | ') || 'none'}
                    </p>
                    <p>
                      outputs:{' '}
                      {Object.entries(entry.outputs)
                        .map(([, signal]) => formatSignal(signal))
                        .join(' | ') || 'none'}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </InspectorSection>
      ) : null}
    </>
  );
}
