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
  type SBoxAnalysis,
  type PermutationAnalysis,
  type ToyPointMapAnalysis,
  type KeyedSBoxAnalysis,
} from '../inspector-analysis';
import { KNOWN_SBOX_REFERENCES } from '../../engine/analysis/sbox-analysis';
import type { LFSRAnalysis, PlugboardAnalysis, ReflectorAnalysis, ModulusAnalysis } from '../inspector-analysis';
import type { TutorialStep } from '../tutorials';

function getNLConsequence(nl: number, maxNL: number): string {
  if (nl === 0) {
    return 'Every output bit is a linear function of the inputs. That gives linear attacks the strongest possible foothold and makes this substitution a very weak nonlinear layer in any SPN-style design.';
  }
  if (nl < maxNL * 0.5) {
    return 'Strong linear approximations exist. That gives linear cryptanalysis more useful bias to work with than a stronger box of the same size.';
  }
  if (nl < maxNL * 0.75) {
    return 'Moderate nonlinearity. Linear approximations are weaker than in a poor box, but there is still more linear structure here than in a stronger alternative.';
  }
  return 'High nonlinearity. Linear approximations are comparatively weak, which is what you want from a substitution layer. This helps locally, but it does not by itself establish whole-cipher strength.';
}

function getDDTConsequence(maxUniformity: number, maxIdeal: number, inputBits: number): string {
  const n = 1 << inputBits;
  if (maxUniformity === n) {
    return 'Every input difference produces a completely predictable output difference. That gives differential attacks the strongest possible propagation signal and makes this a very poor substitution layer.';
  }
  if (maxUniformity > maxIdeal * 2) {
    return 'High differential uniformity means some input differences propagate with noticeably elevated probability. That gives differential cryptanalysis more leverage than a stronger box of the same size.';
  }
  if (maxUniformity <= maxIdeal) {
    return 'Optimal for this size. Nonzero input differences spread to output differences as evenly as this box size allows, which is the local differential behavior you want from a strong substitution layer.';
  }
  return 'Above the ideal threshold. Some differential characteristics propagate with higher than necessary probability, so this box leaves more differential structure than an optimal design would.';
}

function getDegreeConsequence(degree: number, maxDegree: number): string {
  if (degree <= 1) {
    return 'Degree 1 means every output bit is affine in the inputs. That keeps the Boolean structure extremely simple and gives algebraic reasoning very little nonlinear complexity to fight through.';
  }
  if (degree < maxDegree - 1) {
    return `Low algebraic degree. The coordinate functions stay simpler than a ${maxDegree}-degree alternative, so this box contributes less algebraic complexity to the surrounding design.`;
  }
  return 'High algebraic degree. The coordinate functions are locally more complex, which is what you want from a substitution layer when trying to avoid overly simple Boolean structure.';
}

function getFixedPointConsequence(fixedPoints: number): string {
  if (fixedPoints === 0) {
    return 'No input maps to itself. That avoids one simple structural symmetry and is usually cleaner than leaving obvious unchanged values inside the substitution table.';
  }
  if (fixedPoints === 1) {
    return '1 input maps to itself (S(x) = x). A single fixed point is a local structural blemish: one value passes through this substitution unchanged.';
  }
  return `${fixedPoints} inputs map to themselves (S(x) = x). Multiple fixed points make the table look more self-similar than a cleaner substitution, which is usually undesirable in an SPN-style design.`;
}

function getLFSRPrimitivityConsequence(isPrimitive: boolean | null, period: number | null, maxPeriod: number, degree: number): string {
  if (isPrimitive === null || period === null) return '';
  if (isPrimitive) {
    return `Maximum-length LFSR. Period ${period} = 2^${degree} − 1. Every non-zero state is visited exactly once before the sequence repeats. An attacker who observes ${2 * degree} consecutive output bits can recover the full internal state and predict all future output using the Berlekamp-Massey algorithm.`;
  }
  const fraction = maxPeriod > 0 ? `${period} / ${maxPeriod}` : String(period);
  return `Non-maximum period: ${fraction}. The sequence repeats after only ${period} bits. If the period is short enough to observe in full, the attacker sees the entire keystream repeat — destroying secrecy. Even without observing the full period, Berlekamp-Massey recovers the state from ${2 * degree} bits regardless.`;
}

function getPlugboardConsequence(fixedPoints: number, pairCount: number): string {
  if (fixedPoints === 0) {
    return `All ${pairCount * 2} letters wired in ${pairCount} pairs. No fixed points — no letter encrypts to itself. In the Bombe attack, Turing used this property as a hard constraint: if any crib position implied a letter mapped to itself, that wheel setting was immediately eliminated.`;
  }
  return `${fixedPoints} unpaired letter${fixedPoints !== 1 ? 's' : ''} (fixed points). A fixed-point letter passes through the plugboard unchanged, leaving its full substitution to the rotor stack and reflector alone. In Bombe analysis, fixed points reduce the number of constraints available for menu construction — a weaker plugboard makes crib attacks easier.`;
}

function getReflectorConsequence(isValidInvolution: boolean, pairCount: number): string {
  if (!isValidInvolution) {
    return 'This wiring is not a valid involution. A reflector must pair every letter with exactly one other letter, with no letter mapping to itself. An invalid reflector will cause encryption to be non-self-reciprocal, breaking decryption.';
  }
  return `${pairCount} reciprocal pairs. A valid involution: encrypt and decrypt are the same operation. This self-reciprocal property was Enigma's key mechanical feature — and its key weakness. It made every letter pair bidirectional and made crib attacks possible because no letter could ever encrypt to itself.`;
}

function getModulusConsequence(isPrime: boolean, modulus: number, groupOrder: number): string {
  if (!isPrime) {
    const phi = groupOrder > 0 ? `φ(${modulus}) = ${groupOrder}` : `φ(${modulus})`;
    return `Modulus ${modulus} is not prime. ${phi}. Not every non-zero input has a modular inverse — inputs sharing a factor with ${modulus} will cause ModInverse to fail. For RSA, the modulus is the product of two primes (n = p·q), so this is expected — but the exponent must be coprime to φ(n) = (p−1)(q−1).`;
  }
  return `Modulus ${modulus} is prime. Every non-zero element 1 through ${modulus - 1} has a multiplicative inverse mod ${modulus}. The multiplicative group has order φ(${modulus}) = ${groupOrder}. For Diffie-Hellman, a prime modulus guarantees the full group structure needed for discrete-log hardness.`;
}

function getBranchNumberConsequence(branchNumber: number, blockCount: number): string {
  if (branchNumber <= 2) {
    return 'Minimum branch number. A single active difference in one input block stays isolated in one output block after this permutation. Full avalanche requires many rounds — this P-layer is not doing useful diffusion work.';
  }
  const roundsEstimate = Math.ceil(Math.log(blockCount) / Math.log(branchNumber - 1));
  if (branchNumber >= blockCount) {
    return `Maximum branch number for this block structure. Any single active difference reaches every output block in one pass — one round through this permutation achieves complete diffusion. This is what AES\'s ShiftRows+MixColumns combination targets.`;
  }
  return `Each active difference activates at least ${branchNumber - 1} output blocks. Roughly ${roundsEstimate} rounds needed to fully diffuse a single-block difference across all ${blockCount} blocks. Higher branch numbers reduce the number of rounds needed for security.`;
}

interface CollapsedAnalyzeSections {
  tick: boolean;
  selectedIssues: boolean;
  graphIssues: boolean;
  traceList: boolean;
  pinned: boolean;
  tutorial: boolean;
  transformation: boolean;
  toyPointMapProperties: boolean;
  keyedSBoxProperties: boolean;
  sboxProperties: boolean;
  permutationProperties: boolean;
  lfsrProperties: boolean;
  plugboardProperties: boolean;
  reflectorProperties: boolean;
  modulusProperties: boolean;
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
  staticSBoxAnalysis: SBoxAnalysis | null;
  staticPermutationAnalysis: PermutationAnalysis | null;
  permutationBlockSize: number | null;
  setPermutationBlockSize: (size: number | null) => void;
  staticLFSRAnalysis: LFSRAnalysis | null;
  staticPlugboardAnalysis: PlugboardAnalysis | null;
  staticReflectorAnalysis: ReflectorAnalysis | null;
  staticModulusAnalysis: ModulusAnalysis | null;
  staticToyPointMapAnalysis: ToyPointMapAnalysis | null;
  staticKeyedSBoxAnalysis: KeyedSBoxAnalysis | null;
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
  staticSBoxAnalysis,
  staticPermutationAnalysis,
  permutationBlockSize,
  setPermutationBlockSize,
  staticLFSRAnalysis,
  staticPlugboardAnalysis,
  staticReflectorAnalysis,
  staticModulusAnalysis,
  staticToyPointMapAnalysis,
  staticKeyedSBoxAnalysis,
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
            ) : transformationView.kind === 'point-compare' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">Rule</span>
                  <code>Left point == right point -&gt; [1], else [0]</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Result</span>
                  <code>{transformationView.outputBit}</code>
                </div>
                <div className="xor-grid xor-grid--ec-point">
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">Left</span>
                    <div className="ec-point-value">
                      <span className="ec-point-text">{transformationView.leftText}</span>
                      <span className="ec-point-hex">{transformationView.leftHex}</span>
                    </div>
                  </div>
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">Right</span>
                    <div className="ec-point-value">
                      <span className="ec-point-text">{transformationView.rightText}</span>
                      <span className="ec-point-hex">{transformationView.rightHex}</span>
                    </div>
                  </div>
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
            ) : transformationView.kind === 'integer-arithmetic' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.operationLabel}</span>
                  <code>{transformationView.operationExpression}</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Modulus</span>
                  <code>{transformationView.modulusDecimal} ({transformationView.modulusHex})</code>
                </div>
                <div className="xor-grid">
                  <div className="xor-grid-head">
                    <span className="meta-label">Value</span>
                    <span className="meta-label">Decimal</span>
                    <span className="meta-label">Hex</span>
                  </div>
                  {transformationView.operands.map((operand) => (
                    <div key={`int-arith-${operand.label}`} className="xor-grid-row">
                      <span className="xor-grid-index">{operand.label}</span>
                      <span className="xor-grid-bit">{operand.decimal}</span>
                      <span className="xor-grid-compare">{operand.hex}</span>
                    </div>
                  ))}
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">Out</span>
                    <span className="xor-grid-bit xor-grid-bit-active">{transformationView.resultDecimal}</span>
                    <span className="xor-grid-compare xor-grid-compare-different">{transformationView.resultHex}</span>
                  </div>
                </div>
              </>
            ) : transformationView.kind === 'point-action' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.operationLabel}</span>
                  <code>{transformationView.operationExpression}</code>
                </div>
                <div className="transformation-order">
                  <span className="meta-label">Scalar</span>
                  <code>{transformationView.scalarDecimal} ({transformationView.scalarHex})</code>
                </div>
                <div className="xor-grid xor-grid--ec-point">
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">P</span>
                    <div className="ec-point-value">
                      <span className="ec-point-text">{transformationView.pointText}</span>
                      <span className="ec-point-hex">{transformationView.pointHex}</span>
                    </div>
                  </div>
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">kP</span>
                    <div className="ec-point-value ec-point-value--active">
                      <span className="ec-point-text">{transformationView.resultText}</span>
                      <span className="ec-point-hex">{transformationView.resultHex}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : transformationView.kind === 'point-order' ? (
              <>
                <div className="transformation-order">
                  <span className="meta-label">{transformationView.operationLabel}</span>
                  <code>{transformationView.operationExpression}</code>
                </div>
                <div className="xor-grid xor-grid--ec-point">
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">P</span>
                    <div className="ec-point-value">
                      <span className="ec-point-text">{transformationView.pointText}</span>
                      <span className="ec-point-hex">{transformationView.pointHex}</span>
                    </div>
                  </div>
                  <div className="xor-grid-row">
                    <span className="xor-grid-index">ord(P)</span>
                    <div className="ec-point-value ec-point-value--active">
                      <span className="ec-point-text">{transformationView.orderDecimal}</span>
                      <span className="ec-point-hex">{transformationView.orderHex}</span>
                    </div>
                  </div>
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

      {inspectorTab === 'analyze' && staticToyPointMapAnalysis ? (
        <InspectorSection
          label="Toy Curve Point Map"
          collapsible
          collapsed={collapsedAnalyzeSections.toyPointMapProperties}
          onToggle={() => toggleAnalyzeSection('toyPointMapProperties')}
        >
          <div className="toy-point-map-panel">
            <p className="sbox-analysis-disclaimer">
              This is a finite-field point map for one small visible curve, not a continuous real-number curve drawing. The grid shows discrete coordinate pairs over mod p only.
            </p>
            <div className="toy-point-map-strip">
              <div className="toy-point-map-strip-cell">
                <span className="meta-label">Curve</span>
                <strong>{staticToyPointMapAnalysis.curveLabel}</strong>
              </div>
              <div className="toy-point-map-strip-cell">
                <span className="meta-label">Affine points</span>
                <strong>{staticToyPointMapAnalysis.totalAffinePoints}</strong>
              </div>
              <div className="toy-point-map-strip-cell">
                <span className="meta-label">Selected</span>
                <strong>{staticToyPointMapAnalysis.selectedPointText}</strong>
              </div>
              <div className="toy-point-map-strip-cell">
                <span className="meta-label">Walk length</span>
                <strong>{staticToyPointMapAnalysis.walkLength}</strong>
              </div>
            </div>
            <div className="toy-point-map-grid-shell">
              <svg
                className="toy-point-map-svg"
                viewBox={`0 0 ${staticToyPointMapAnalysis.fieldSize * 20 + 36} ${staticToyPointMapAnalysis.fieldSize * 20 + 36}`}
                role="img"
                aria-label={`Toy curve point map for ${staticToyPointMapAnalysis.curveLabel}`}
              >
                {Array.from({ length: staticToyPointMapAnalysis.fieldSize }, (_, index) => {
                  const x = 28 + index * 20;
                  const y = 28 + index * 20;
                  const max = 28 + (staticToyPointMapAnalysis.fieldSize - 1) * 20;
                  return (
                    <Fragment key={`grid-${index}`}>
                      <line className="toy-point-map-grid-line" x1={28} y1={y} x2={max} y2={y} />
                      <line className="toy-point-map-grid-line" x1={x} y1={28} x2={x} y2={max} />
                      <text className="toy-point-map-axis-label" x={x} y={18} textAnchor="middle">{index}</text>
                      <text className="toy-point-map-axis-label" x={14} y={y + 4} textAnchor="middle">{index}</text>
                    </Fragment>
                  );
                })}
                {staticToyPointMapAnalysis.validPoints.map((point) => {
                  const cx = 28 + point.x * 20;
                  const cy = 28 + (staticToyPointMapAnalysis.fieldSize - 1 - point.y) * 20;
                  const walkLabel = point.walkLabels[0] ?? null;
                  return (
                    <Fragment key={point.label}>
                      <circle
                        className={
                          point.isSelected
                            ? 'toy-point-map-dot toy-point-map-dot-selected'
                            : point.walkLabels.length > 0
                              ? 'toy-point-map-dot toy-point-map-dot-walk'
                              : 'toy-point-map-dot'
                        }
                        cx={cx}
                        cy={cy}
                        r={point.isSelected ? 6 : point.walkLabels.length > 0 ? 5 : 3.5}
                      />
                      {walkLabel ? (
                        <text className="toy-point-map-walk-label" x={cx + 8} y={cy - 8}>
                          {walkLabel}
                        </text>
                      ) : null}
                    </Fragment>
                  );
                })}
              </svg>
            </div>
            <div className="toy-point-map-legend">
              <span className="toy-point-map-chip">
                <span className="toy-point-map-chip-dot" />
                Valid affine point
              </span>
              <span className="toy-point-map-chip">
                <span className="toy-point-map-chip-dot selected" />
                Selected point
              </span>
              <span className="toy-point-map-chip">
                <span className="toy-point-map-chip-dot walk" />
                Repeated-action walk
              </span>
            </div>
            <div className="toy-point-map-walk-list">
              {staticToyPointMapAnalysis.walkEntries.map((entry) => (
                <div key={entry.label} className="toy-point-map-walk-row">
                  <strong>{entry.label}</strong>
                  <span>{entry.pointText}</span>
                </div>
              ))}
            </div>
            {staticToyPointMapAnalysis.walkEntries.some((entry) => entry.isInfinity) ? (
              <p className="toy-point-map-infinity-note">
                If the walk reaches ∞, MCW shows it as a labeled non-affine result in the list rather than placing it on the coordinate grid.
              </p>
            ) : null}
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticKeyedSBoxAnalysis ? (
        <InspectorSection
          label="Keyed S-Box"
          collapsible
          collapsed={collapsedAnalyzeSections.keyedSBoxProperties}
          onToggle={() => toggleAnalyzeSection('keyedSBoxProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              This board keeps the table choice bounded and explicit. A changed table, a valid permutation, and local S-box quality are separate questions.
            </p>
            <div className="sbox-analysis-strip">
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">Key</span>
                <strong>{staticKeyedSBoxAnalysis.keyBits}</strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">Variant</span>
                <strong>{staticKeyedSBoxAnalysis.keyLabel}</strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">Permutation</span>
                <strong className={staticKeyedSBoxAnalysis.selectedVariant.isValidPermutation ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}>
                  {staticKeyedSBoxAnalysis.selectedVariant.isValidPermutation ? 'valid' : 'invalid'}
                </strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">NL</span>
                <strong className="sbox-analysis-value">{staticKeyedSBoxAnalysis.sboxAnalysis.lat.nonlinearity}</strong>
              </div>
            </div>
            <div className="keyed-sbox-compare-grid">
              <div className="keyed-sbox-table-block">
                <span className="meta-label">Baseline table</span>
                <div className="keyed-sbox-table-grid">
                  {staticKeyedSBoxAnalysis.baselineTable.map((value, index) => (
                    <div key={`baseline-${index}`} className="keyed-sbox-table-cell">
                      <span className="meta-label">{index.toString(16).toUpperCase()}</span>
                      <strong>{value.toString(16).toUpperCase()}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="keyed-sbox-table-block">
                <span className="meta-label">Selected keyed table</span>
                <div className="keyed-sbox-table-grid">
                  {staticKeyedSBoxAnalysis.selectedTable.map((value, index) => (
                    <div key={`selected-${index}`} className="keyed-sbox-table-cell">
                      <span className="meta-label">{index.toString(16).toUpperCase()}</span>
                      <strong>{value.toString(16).toUpperCase()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="sbox-analysis-note">{staticKeyedSBoxAnalysis.selectedVariant.explanation}</p>
            {!staticKeyedSBoxAnalysis.selectedVariant.isValidPermutation ? (
              <p className="sbox-analysis-consequence">
                This keyed table is not invertible: repeated values {staticKeyedSBoxAnalysis.repeatedValues.map((value) => value.toString(16).toUpperCase()).join(', ')} appear and values {staticKeyedSBoxAnalysis.missingValues.map((value) => value.toString(16).toUpperCase()).join(', ')} disappear.
              </p>
            ) : (
              <p className="sbox-analysis-consequence">
                This keyed table is still a valid 4-bit permutation, but that only means every input still has one output and every output appears once. It does not by itself prove this is a stronger substitution layer.
              </p>
            )}
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticSBoxAnalysis ? (
        <InspectorSection
          label="S-Box Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.sboxProperties}
          onToggle={() => toggleAnalyzeSection('sboxProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              These measurements describe this S-box table in isolation. They do not account for how surrounding cipher components interact with this substitution.
            </p>
            <p className="sbox-analysis-disclaimer">
              A strong-looking S-box helps locally, but it does not prove the full cipher is strong. Round structure, diffusion, key schedule, and round count still matter.
            </p>

            {/* At-a-glance property strip */}
            <div className="sbox-analysis-strip">
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">NL</span>
                <strong
                  className={
                    staticSBoxAnalysis.lat.nonlinearity >= staticSBoxAnalysis.lat.maxTheoreticalNonlinearity * 0.75
                      ? 'sbox-analysis-value-good'
                      : 'sbox-analysis-value-warn'
                  }
                >
                  {staticSBoxAnalysis.lat.nonlinearity}
                </strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">DDT max</span>
                <strong
                  className={
                    staticSBoxAnalysis.ddt.maxUniformity <= staticSBoxAnalysis.ddt.maxIdealUniformity
                      ? 'sbox-analysis-value-good'
                      : 'sbox-analysis-value-warn'
                  }
                >
                  {staticSBoxAnalysis.ddt.maxUniformity}
                </strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">Degree</span>
                <strong
                  className={
                    staticSBoxAnalysis.algebraicDegree.degree >= staticSBoxAnalysis.algebraicDegree.maxTheoreticalDegree - 1
                      ? 'sbox-analysis-value-good'
                      : 'sbox-analysis-value-warn'
                  }
                >
                  {staticSBoxAnalysis.algebraicDegree.degree}
                </strong>
              </div>
              <div className="sbox-analysis-strip-cell">
                <span className="meta-label">Fixed pts</span>
                <strong
                  className={staticSBoxAnalysis.fixedPoints === 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                >
                  {staticSBoxAnalysis.fixedPoints}
                </strong>
              </div>
            </div>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Nonlinearity</span>
                <span className="sbox-analysis-value">
                  <strong>{staticSBoxAnalysis.lat.nonlinearity}</strong>
                  <span className="sbox-analysis-ref">
                    {' '}/ {staticSBoxAnalysis.lat.maxTheoreticalNonlinearity} max for {staticSBoxAnalysis.inputBits}-bit
                  </span>
                </span>
              </div>
              <p className="sbox-analysis-note">
                Measures distance from all affine (linear) functions. Higher values indicate less linear structure.
              </p>
              <p className="sbox-analysis-consequence">
                {getNLConsequence(staticSBoxAnalysis.lat.nonlinearity, staticSBoxAnalysis.lat.maxTheoreticalNonlinearity)}
              </p>
              {staticSBoxAnalysis.lat.componentNonlinearity.length > 0 ? (
                <div className="sbox-comp-nl-row">
                  {staticSBoxAnalysis.lat.componentNonlinearity.map((nl, j) => {
                    const ratio = staticSBoxAnalysis.lat.maxTheoreticalNonlinearity > 0
                      ? nl / staticSBoxAnalysis.lat.maxTheoreticalNonlinearity
                      : 0;
                    return (
                      <div key={`comp-nl-${j}`} className="sbox-comp-nl-chip" title={`Output bit ${j}: NL = ${nl}`}>
                        <span className="meta-label">b{j}</span>
                        <strong
                          style={{
                            color: ratio >= 0.75
                              ? 'var(--color-good, #38a169)'
                              : ratio >= 0.5
                                ? 'var(--color-warn-mild, #d97706)'
                                : 'var(--color-warn, #c53030)',
                          }}
                        >
                          {nl}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Max Differential Uniformity</span>
                <span className="sbox-analysis-value">
                  <strong
                    className={
                      staticSBoxAnalysis.ddt.maxUniformity <= staticSBoxAnalysis.ddt.maxIdealUniformity
                        ? 'sbox-analysis-value-good'
                        : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticSBoxAnalysis.ddt.maxUniformity}
                  </strong>
                  <span className="sbox-analysis-ref">
                    {' '}(target ≤ {staticSBoxAnalysis.ddt.maxIdealUniformity} for this size)
                  </span>
                </span>
              </div>
              <p className="sbox-analysis-note">
                For each nonzero input difference Δ_in, counts how many input pairs produce a given output difference Δ_out. Lower is better.
              </p>
              <p className="sbox-analysis-consequence">
                {getDDTConsequence(staticSBoxAnalysis.ddt.maxUniformity, staticSBoxAnalysis.ddt.maxIdealUniformity, staticSBoxAnalysis.inputBits)}
              </p>
            </div>

            {staticSBoxAnalysis.ddt.fullMatrix ? (
              <div className="sbox-ddt-section">
                <span className="meta-label">Differential Distribution Table</span>
                <p className="sbox-analysis-note">
                  Rows: Δ_in 1–{(1 << staticSBoxAnalysis.inputBits) - 1}. Columns: Δ_out 0–{(1 << staticSBoxAnalysis.outputBits) - 1}. Outlined cells equal the maximum.
                </p>
                <div
                  className="sbox-ddt-grid"
                  style={{ gridTemplateColumns: `28px repeat(${1 << staticSBoxAnalysis.outputBits}, minmax(0, 1fr))` }}
                >
                  <span className="sbox-ddt-corner">Δin\Δout</span>
                  {Array.from({ length: 1 << staticSBoxAnalysis.outputBits }, (_, col) => (
                    <span key={`ddt-col-${col}`} className="sbox-ddt-axis">{col}</span>
                  ))}
                  {staticSBoxAnalysis.ddt.fullMatrix.map((row, deltaIn) => (
                    <Fragment key={`ddt-row-${deltaIn}`}>
                      <span className="sbox-ddt-axis sbox-ddt-row-axis">{deltaIn + 1}</span>
                      {row.map((cell, deltaOut) => {
                        const isMax = cell > 0 && cell === staticSBoxAnalysis.ddt.maxUniformity;
                        const intensity = staticSBoxAnalysis.ddt.maxUniformity > 0
                          ? cell / staticSBoxAnalysis.ddt.maxUniformity
                          : 0;
                        return (
                          <div
                            key={`ddt-cell-${deltaIn}-${deltaOut}`}
                            className="sbox-ddt-cell"
                            title={`Δin=${deltaIn + 1}, Δout=${deltaOut}: ${cell}`}
                            style={{
                              backgroundColor: cell === 0
                                ? 'transparent'
                                : `rgba(220, 100, 40, ${0.12 + intensity * 0.72})`,
                              outline: isMax ? '1.5px solid rgba(200, 60, 20, 0.75)' : undefined,
                              outlineOffset: isMax ? '-1px' : undefined,
                              zIndex: isMax ? 1 : undefined,
                            }}
                          >
                            {cell > 0 ? cell : ''}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            ) : staticSBoxAnalysis.ddt.thumbnail ? (
              <div className="sbox-ddt-section">
                <span className="meta-label">DDT Thumbnail (16×16 macro-blocks)</span>
                <p className="sbox-analysis-note">
                  Each cell shows the maximum DDT value in a 16×16 region of the full 255×256 table. Outlined cells equal the global maximum.
                </p>
                <div
                  className="sbox-ddt-grid"
                  style={{ gridTemplateColumns: `repeat(16, minmax(0, 1fr))` }}
                >
                  {staticSBoxAnalysis.ddt.thumbnail.map((row, ri) => (
                    <Fragment key={`thumb-row-${ri}`}>
                      {row.map((cell, ci) => {
                        const isMax = cell > 0 && cell === staticSBoxAnalysis.ddt.maxUniformity;
                        const intensity = staticSBoxAnalysis.ddt.maxUniformity > 0
                          ? cell / staticSBoxAnalysis.ddt.maxUniformity
                          : 0;
                        return (
                          <div
                            key={`thumb-cell-${ri}-${ci}`}
                            className="sbox-ddt-cell"
                            title={`Region (${ri},${ci}): max = ${cell}`}
                            style={{
                              backgroundColor: cell === 0
                                ? 'transparent'
                                : `rgba(220, 100, 40, ${0.12 + intensity * 0.72})`,
                              outline: isMax ? '1.5px solid rgba(200, 60, 20, 0.75)' : undefined,
                              outlineOffset: isMax ? '-1px' : undefined,
                              zIndex: isMax ? 1 : undefined,
                            }}
                          >
                            {cell > 0 ? cell : ''}
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sbox-analysis-metric">
                <div className="sbox-analysis-metric-row">
                  <span className="meta-label">DDT Histogram</span>
                </div>
                <div className="sbox-ddt-histogram">
                  {Object.entries(staticSBoxAnalysis.ddt.histogram)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([value, count]) => (
                      <div key={`hist-${value}`} className="sbox-ddt-hist-row">
                        <span className="sbox-ddt-hist-value">{value}</span>
                        <span className="sbox-ddt-hist-count">{count} cell{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                </div>
                <p className="sbox-analysis-note">
                  Non-zero cell counts across the full {(1 << staticSBoxAnalysis.inputBits) - 1} × {1 << staticSBoxAnalysis.outputBits} DDT.
                </p>
              </div>
            )}

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Algebraic Degree</span>
                <span className="sbox-analysis-value">
                  <strong
                    className={
                      staticSBoxAnalysis.algebraicDegree.degree >= staticSBoxAnalysis.algebraicDegree.maxTheoreticalDegree - 1
                        ? 'sbox-analysis-value-good'
                        : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticSBoxAnalysis.algebraicDegree.degree}
                  </strong>
                  <span className="sbox-analysis-ref">
                    {' '}/ {staticSBoxAnalysis.algebraicDegree.maxTheoreticalDegree} max for {staticSBoxAnalysis.inputBits}-bit
                  </span>
                </span>
              </div>
              <p className="sbox-analysis-note">
                Maximum degree of the Boolean coordinate functions in algebraic normal form. Higher degree resists algebraic attacks.
              </p>
              <p className="sbox-analysis-consequence">
                {getDegreeConsequence(staticSBoxAnalysis.algebraicDegree.degree, staticSBoxAnalysis.algebraicDegree.maxTheoreticalDegree)}
              </p>
            </div>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Fixed Points</span>
                <span className="sbox-analysis-value">
                  <strong className={staticSBoxAnalysis.fixedPoints === 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}>
                    {staticSBoxAnalysis.fixedPoints}
                  </strong>
                  <span className="sbox-analysis-ref">
                    {' '}(S(x) = x for {staticSBoxAnalysis.fixedPoints} input{staticSBoxAnalysis.fixedPoints !== 1 ? 's' : ''})
                  </span>
                </span>
              </div>
              <p className="sbox-analysis-note">
                Positions where the output equals the input unchanged. A fixed point at zero can simplify certain attack models.
              </p>
              <p className="sbox-analysis-consequence">
                {getFixedPointConsequence(staticSBoxAnalysis.fixedPoints)}
              </p>
            </div>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Bit Dependency</span>
                <span className="sbox-analysis-ref">SAC target: 0.50 per cell</span>
              </div>
              <p className="sbox-analysis-note">
                Probability that flipping input bit <em>i</em> (row) changes output bit <em>j</em> (column). Green = near 0.50. Orange = deviation from target.
              </p>
              <div
                className="sbox-dep-grid"
                style={{ gridTemplateColumns: `28px repeat(${staticSBoxAnalysis.outputBits}, minmax(0, 1fr))` }}
              >
                <span className="sbox-ddt-corner">in\out</span>
                {Array.from({ length: staticSBoxAnalysis.outputBits }, (_, j) => (
                  <span key={`dep-col-${j}`} className="sbox-ddt-axis">{j}</span>
                ))}
                {staticSBoxAnalysis.bitDependency.matrix.map((row, i) => (
                  <Fragment key={`dep-row-${i}`}>
                    <span className="sbox-ddt-axis sbox-ddt-row-axis">{i}</span>
                    {row.map((prob, j) => {
                      const deviation = Math.abs(prob - 0.5);
                      const alpha = deviation / 0.5;
                      const bg = alpha < 0.05
                        ? 'rgba(50, 160, 80, 0.28)'
                        : `rgba(210, 95, 30, ${0.12 + alpha * 0.72})`;
                      return (
                        <div
                          key={`dep-cell-${i}-${j}`}
                          className="sbox-ddt-cell"
                          title={`Flip input bit ${i} → output bit ${j} changes: ${(prob * 100).toFixed(1)}%`}
                          style={{ backgroundColor: bg }}
                        >
                          {prob.toFixed(2)}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="sbox-analysis-metric-row" style={{ marginTop: '6px' }}>
                <span className="meta-label">Max SAC Deviation</span>
                <span className="sbox-analysis-value">
                  <strong
                    className={
                      staticSBoxAnalysis.bitDependency.sacDeviation < 0.125
                        ? 'sbox-analysis-value-good'
                        : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticSBoxAnalysis.bitDependency.sacDeviation.toFixed(3)}
                  </strong>
                  <span className="sbox-analysis-ref"> (0.000 = perfect SAC)</span>
                </span>
              </div>
              <p className="sbox-analysis-note">
                These local properties are useful for comparing substitution tables. They do not by themselves prove attack cost, adequate round count, or full-cipher security.
              </p>
            </div>

            {/* Reference row */}
            {(() => {
              const refs = KNOWN_SBOX_REFERENCES.filter(
                (r) => r.inputBits === staticSBoxAnalysis.inputBits && r.outputBits === staticSBoxAnalysis.outputBits,
              );
              if (refs.length === 0) return null;
              return (
                <div className="sbox-analysis-metric">
                  <div className="sbox-analysis-metric-row">
                    <span className="meta-label">Reference Designs</span>
                  </div>
                  <div className="sbox-ref-table">
                    <div className="sbox-ref-row sbox-ref-header">
                      <span>Name</span>
                      <span>NL</span>
                      <span>DDT max</span>
                      <span>Deg</span>
                      <span>Fixed</span>
                    </div>
                    {refs.map((ref) => (
                      <div key={ref.name} className="sbox-ref-row">
                        <span className="sbox-ref-name">{ref.name}</span>
                        <span>{ref.nonlinearity}</span>
                        <span>{ref.maxDifferentialUniformity}</span>
                        <span>{ref.algebraicDegree}</span>
                        <span>{ref.fixedPoints}</span>
                      </div>
                    ))}
                    <div className="sbox-ref-row sbox-ref-yours">
                      <span className="sbox-ref-name">Yours</span>
                      <span
                        className={
                          staticSBoxAnalysis.lat.nonlinearity >= staticSBoxAnalysis.lat.maxTheoreticalNonlinearity * 0.75
                            ? 'sbox-analysis-value-good'
                            : 'sbox-analysis-value-warn'
                        }
                      >
                        {staticSBoxAnalysis.lat.nonlinearity}
                      </span>
                      <span
                        className={
                          staticSBoxAnalysis.ddt.maxUniformity <= staticSBoxAnalysis.ddt.maxIdealUniformity
                            ? 'sbox-analysis-value-good'
                            : 'sbox-analysis-value-warn'
                        }
                      >
                        {staticSBoxAnalysis.ddt.maxUniformity}
                      </span>
                      <span
                        className={
                          staticSBoxAnalysis.algebraicDegree.degree >= staticSBoxAnalysis.algebraicDegree.maxTheoreticalDegree - 1
                            ? 'sbox-analysis-value-good'
                            : 'sbox-analysis-value-warn'
                        }
                      >
                        {staticSBoxAnalysis.algebraicDegree.degree}
                      </span>
                      <span
                        className={staticSBoxAnalysis.fixedPoints === 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                      >
                        {staticSBoxAnalysis.fixedPoints}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticPermutationAnalysis ? (
        <InspectorSection
          label="Permutation Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.permutationProperties}
          onToggle={() => toggleAnalyzeSection('permutationProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              These measurements describe the permutation routing in isolation — diffusion structure, not cryptographic security by itself.
            </p>

            {/* Cycle structure */}
            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Cycle Structure</span>
                <span className="sbox-analysis-ref">{staticPermutationAnalysis.length}-bit permutation</span>
              </div>
              <div className="sbox-analysis-strip">
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Cycles</span>
                  <strong>{staticPermutationAnalysis.cycles.count}</strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Fixed pts</span>
                  <strong
                    className={staticPermutationAnalysis.cycles.fixedPoints === 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                  >
                    {staticPermutationAnalysis.cycles.fixedPoints}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Min len</span>
                  <strong>{staticPermutationAnalysis.cycles.minLength}</strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Max len</span>
                  <strong>{staticPermutationAnalysis.cycles.maxLength}</strong>
                </div>
              </div>
              <p className="sbox-analysis-note">
                Permutation decomposes into {staticPermutationAnalysis.cycles.count} orbit{staticPermutationAnalysis.cycles.count !== 1 ? 's' : ''} · avg length {staticPermutationAnalysis.cycles.avgLength.toFixed(2)} · {staticPermutationAnalysis.cycles.fixedPoints} fixed point{staticPermutationAnalysis.cycles.fixedPoints !== 1 ? 's' : ''} (bit goes nowhere).
              </p>
            </div>

            {/* Displacement */}
            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Displacement</span>
                <span className="sbox-analysis-ref">how far each bit travels</span>
              </div>
              <div className="sbox-analysis-strip">
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Min</span>
                  <strong
                    className={staticPermutationAnalysis.displacement.min > 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                  >
                    {staticPermutationAnalysis.displacement.min}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Max</span>
                  <strong>{staticPermutationAnalysis.displacement.max}</strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Avg</span>
                  <strong>{staticPermutationAnalysis.displacement.avg.toFixed(1)}</strong>
                </div>
              </div>
              <p className="sbox-analysis-note">
                Distance |output_position − input_position| per bit. Min &gt; 0 means no bit stays in place.
              </p>
            </div>

            {/* Block spread configuration */}
            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Inter-Block Spread</span>
                <span className="sbox-analysis-ref">configure block size to analyse</span>
              </div>
              <div className="sbox-block-size-row">
                <span className="meta-label">Block size (bits)</span>
                <div className="sbox-block-size-chips">
                  {[1, 2, 4, 8].filter((bs) => staticPermutationAnalysis.length % bs === 0).map((bs) => (
                    <button
                      key={`bs-${bs}`}
                      type="button"
                      className={permutationBlockSize === bs ? 'sbox-chunk-chip active' : 'sbox-chunk-chip'}
                      onClick={() => setPermutationBlockSize(permutationBlockSize === bs ? null : bs)}
                    >
                      {bs}
                    </button>
                  ))}
                  {staticPermutationAnalysis.length >= 16 ? [16, 32].filter((bs) => staticPermutationAnalysis.length % bs === 0).map((bs) => (
                    <button
                      key={`bs-${bs}`}
                      type="button"
                      className={permutationBlockSize === bs ? 'sbox-chunk-chip active' : 'sbox-chunk-chip'}
                      onClick={() => setPermutationBlockSize(permutationBlockSize === bs ? null : bs)}
                    >
                      {bs}
                    </button>
                  )) : null}
                </div>
              </div>
              {staticPermutationAnalysis.blockSpread ? (() => {
                const bs = staticPermutationAnalysis.blockSpread;
                const blockCount = bs.blockCount;
                return (
                  <>
                    <div className="sbox-analysis-metric-row" style={{ marginTop: '8px' }}>
                      <span className="meta-label">Branch Number</span>
                      <span className="sbox-analysis-value">
                        <strong
                          className={bs.branchNumber >= 3 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                        >
                          {bs.branchNumber}
                        </strong>
                        <span className="sbox-analysis-ref">
                          {' '}{bs.branchNumberIsExact ? '(exact)' : '(lower bound)'} · {blockCount} blocks of {bs.blockSize}
                        </span>
                      </span>
                    </div>
                    <p className="sbox-analysis-note">
                      Min over all nonempty input-block subsets A of (|A| + |activated output blocks|). Higher = better diffusion. Minimum possible = 2.
                    </p>
                    <p className="sbox-analysis-consequence">
                      {getBranchNumberConsequence(bs.branchNumber, blockCount)}
                    </p>
                    {blockCount <= 16 ? (
                      <div className="sbox-ddt-section">
                        <span className="meta-label">Spread Matrix</span>
                        <p className="sbox-analysis-note">
                          Cells: how many bits from input block (row) land in output block (col). Zero = no contribution.
                        </p>
                        <div
                          className="sbox-ddt-grid"
                          style={{ gridTemplateColumns: `28px repeat(${blockCount}, minmax(0, 1fr))` }}
                        >
                          <span className="sbox-ddt-corner">in\out</span>
                          {Array.from({ length: blockCount }, (_, col) => (
                            <span key={`sm-col-${col}`} className="sbox-ddt-axis">{col}</span>
                          ))}
                          {bs.spreadMatrix.map((row, ri) => (
                            <Fragment key={`sm-row-${ri}`}>
                              <span className="sbox-ddt-axis sbox-ddt-row-axis">{ri}</span>
                              {row.map((cell, ci) => {
                                const intensity = bs.blockSize > 0 ? cell / bs.blockSize : 0;
                                return (
                                  <div
                                    key={`sm-cell-${ri}-${ci}`}
                                    className="sbox-ddt-cell"
                                    title={`Block ${ri} → Block ${ci}: ${cell} bit${cell !== 1 ? 's' : ''}`}
                                    style={{
                                      backgroundColor: cell === 0
                                        ? 'transparent'
                                        : `rgba(60, 130, 200, ${0.12 + intensity * 0.72})`,
                                    }}
                                  >
                                    {cell > 0 ? cell : ''}
                                  </div>
                                );
                              })}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="sbox-analysis-note">
                        Spread matrix omitted for {blockCount} blocks — too wide to display clearly.
                      </p>
                    )}
                  </>
                );
              })() : (
                <p className="sbox-analysis-note" style={{ marginTop: '6px' }}>
                  Select a block size above to see the inter-block spread matrix and branch number.
                </p>
              )}
            </div>
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticLFSRAnalysis ? (
        <InspectorSection
          label="LFSR Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.lfsrProperties}
          onToggle={() => toggleAnalyzeSection('lfsrProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              These measurements describe the feedback polynomial's period structure — how long the keystream runs before repeating.
            </p>

            {staticLFSRAnalysis.allZerosSeed ? (
              <p className="sbox-analysis-consequence" style={{ marginTop: '8px' }}>
                All-zero seed: the LFSR is locked at zero and will never advance. Every XOR-feedback register produces 0 forever from this state. Set at least one seed bit to 1 before using this in a cipher.
              </p>
            ) : (
              <>
                <div className="sbox-analysis-metric">
                  <div className="sbox-analysis-metric-row">
                    <span className="meta-label">Degree / Period</span>
                    <span className="sbox-analysis-ref">{staticLFSRAnalysis.degree}-stage register</span>
                  </div>
                  <div className="sbox-analysis-strip">
                    <div className="sbox-analysis-strip-cell">
                      <span className="meta-label">Degree</span>
                      <strong>{staticLFSRAnalysis.degree}</strong>
                    </div>
                    <div className="sbox-analysis-strip-cell">
                      <span className="meta-label">Max period</span>
                      <strong>{staticLFSRAnalysis.maxPeriod}</strong>
                    </div>
                    <div className="sbox-analysis-strip-cell">
                      <span className="meta-label">Actual period</span>
                      <strong
                        className={
                          staticLFSRAnalysis.period === staticLFSRAnalysis.maxPeriod
                            ? 'sbox-analysis-value-good'
                            : 'sbox-analysis-value-warn'
                        }
                      >
                        {staticLFSRAnalysis.period !== null
                          ? (staticLFSRAnalysis.isExact ? String(staticLFSRAnalysis.period) : `≤ ${staticLFSRAnalysis.period}`)
                          : '—'}
                      </strong>
                    </div>
                    <div className="sbox-analysis-strip-cell">
                      <span className="meta-label">Primitive</span>
                      <strong
                        className={
                          staticLFSRAnalysis.isPrimitive === true
                            ? 'sbox-analysis-value-good'
                            : staticLFSRAnalysis.isPrimitive === false
                              ? 'sbox-analysis-value-warn'
                              : undefined
                        }
                      >
                        {staticLFSRAnalysis.isPrimitive === true
                          ? 'Yes'
                          : staticLFSRAnalysis.isPrimitive === false
                            ? 'No'
                            : '—'}
                      </strong>
                    </div>
                  </div>
                  <p className="sbox-analysis-note">
                    Taps: [{staticLFSRAnalysis.taps.join(', ')}] · {staticLFSRAnalysis.tapCount} feedback connections
                    {staticLFSRAnalysis.period !== null && staticLFSRAnalysis.period < staticLFSRAnalysis.maxPeriod
                      ? ` · period ${staticLFSRAnalysis.period} of ${staticLFSRAnalysis.maxPeriod} possible`
                      : ''}
                  </p>
                </div>

                {getLFSRPrimitivityConsequence(
                  staticLFSRAnalysis.isPrimitive,
                  staticLFSRAnalysis.period,
                  staticLFSRAnalysis.maxPeriod,
                  staticLFSRAnalysis.degree,
                ) ? (
                  <p className="sbox-analysis-consequence">
                    {getLFSRPrimitivityConsequence(
                      staticLFSRAnalysis.isPrimitive,
                      staticLFSRAnalysis.period,
                      staticLFSRAnalysis.maxPeriod,
                      staticLFSRAnalysis.degree,
                    )}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticPlugboardAnalysis ? (
        <InspectorSection
          label="Plugboard Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.plugboardProperties}
          onToggle={() => toggleAnalyzeSection('plugboardProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              A plugboard is a reciprocal permutation — every swapped pair is its own inverse. Fixed points (unwired letters) pass through unchanged.
            </p>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Wiring Structure</span>
                <span className="sbox-analysis-ref">{staticPlugboardAnalysis.alphabetSize}-letter alphabet</span>
              </div>
              <div className="sbox-analysis-strip">
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Pairs</span>
                  <strong
                    className={staticPlugboardAnalysis.pairCount > 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                  >
                    {staticPlugboardAnalysis.pairCount}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Fixed pts</span>
                  <strong
                    className={staticPlugboardAnalysis.fixedPoints === 0 ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'}
                  >
                    {staticPlugboardAnalysis.fixedPoints}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Wired</span>
                  <strong>{staticPlugboardAnalysis.pairCount * 2}</strong>
                </div>
              </div>
              {staticPlugboardAnalysis.pairs.length > 0 ? (
                <p className="sbox-analysis-note">
                  Active pairs: {staticPlugboardAnalysis.pairs.map(([a, b]) => `${a}↔${b}`).join(', ')}
                </p>
              ) : (
                <p className="sbox-analysis-note">No pairs wired — all letters pass through unchanged.</p>
              )}
            </div>

            <p className="sbox-analysis-consequence">
              {getPlugboardConsequence(staticPlugboardAnalysis.fixedPoints, staticPlugboardAnalysis.pairCount)}
            </p>
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticReflectorAnalysis ? (
        <InspectorSection
          label="Reflector Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.reflectorProperties}
          onToggle={() => toggleAnalyzeSection('reflectorProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              A reflector must be a fixed-point-free involution — every letter maps to a different letter, and every mapping is its own inverse.
            </p>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Involution Structure</span>
                <span className="sbox-analysis-ref">{staticReflectorAnalysis.alphabetSize}-letter alphabet</span>
              </div>
              <div className="sbox-analysis-strip">
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Pairs</span>
                  <strong
                    className={
                      staticReflectorAnalysis.isValidInvolution ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticReflectorAnalysis.pairCount}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Valid</span>
                  <strong
                    className={
                      staticReflectorAnalysis.isValidInvolution ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticReflectorAnalysis.isValidInvolution ? 'Yes' : 'No'}
                  </strong>
                </div>
              </div>
              {staticReflectorAnalysis.pairs.length > 0 ? (
                <p className="sbox-analysis-note">
                  Pairs: {staticReflectorAnalysis.pairs.map(([a, b]) => `${a}↔${b}`).join(', ')}
                </p>
              ) : null}
            </div>

            <p className="sbox-analysis-consequence">
              {getReflectorConsequence(staticReflectorAnalysis.isValidInvolution, staticReflectorAnalysis.pairCount)}
            </p>
          </div>
        </InspectorSection>
      ) : null}

      {inspectorTab === 'analyze' && staticModulusAnalysis ? (
        <InspectorSection
          label="Modulus Properties"
          collapsible
          collapsed={collapsedAnalyzeSections.modulusProperties}
          onToggle={() => toggleAnalyzeSection('modulusProperties')}
        >
          <div className="sbox-analysis-panel" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <p className="sbox-analysis-disclaimer">
              These measurements describe the group structure under this modulus — how many invertible elements exist and whether prime guarantees apply.
            </p>

            <div className="sbox-analysis-metric">
              <div className="sbox-analysis-metric-row">
                <span className="meta-label">Modulus Structure</span>
                <span className="sbox-analysis-ref">
                  mod {staticModulusAnalysis.modulus}
                  {!staticModulusAnalysis.isAnalysisExact ? ' (estimated)' : ''}
                </span>
              </div>
              <div className="sbox-analysis-strip">
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Modulus</span>
                  <strong>{staticModulusAnalysis.modulus}</strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">Prime</span>
                  <strong
                    className={
                      staticModulusAnalysis.isPrime ? 'sbox-analysis-value-good' : 'sbox-analysis-value-warn'
                    }
                  >
                    {staticModulusAnalysis.isPrime ? 'Yes' : 'No'}
                  </strong>
                </div>
                <div className="sbox-analysis-strip-cell">
                  <span className="meta-label">φ(n)</span>
                  <strong>{staticModulusAnalysis.groupOrder > 0 ? staticModulusAnalysis.groupOrder : '—'}</strong>
                </div>
              </div>
              {!staticModulusAnalysis.isPrime && staticModulusAnalysis.smallFactors.length > 0 ? (
                <p className="sbox-analysis-note">
                  Small factors: {staticModulusAnalysis.smallFactors.join(' · ')}
                  {staticModulusAnalysis.isAnalysisExact ? '' : ' (partial factorization)'}
                </p>
              ) : null}
            </div>

            <p className="sbox-analysis-consequence">
              {getModulusConsequence(
                staticModulusAnalysis.isPrime,
                staticModulusAnalysis.modulus,
                staticModulusAnalysis.groupOrder,
              )}
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
