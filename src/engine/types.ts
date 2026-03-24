import type { CompositeDef, IteratorDef } from './composites';

export type SignalType = 'symbol' | 'bits';

export interface SymbolSignal {
  type: 'symbol';
  value: string;
}

export interface BitsSignal {
  type: 'bits';
  value: number[];
}

export type Signal = SymbolSignal | BitsSignal;

export interface PortDef {
  name: string;
  type: SignalType;
}

export type ParamKind =
  | 'number'
  | 'string'
  | 'boolean'
  | 'select'
  | 'wiring'
  | 'bits';

export interface ParamOption {
  label: string;
  value: string;
}

export interface ParamFieldDef {
  key: string;
  label: string;
  kind: ParamKind;
  defaultValue: unknown;
  required?: boolean;
  options?: ParamOption[];
  description?: string;
}

export type ParamSchema = Record<string, ParamFieldDef>;
export type ModuleParams = Record<string, unknown>;
export type ModuleInputs = Record<string, Signal>;
export type ModuleOutputs = Record<string, Signal>;

export interface RuntimeState {
  [key: string]: unknown;
}

export interface ModuleDef {
  id: string;
  name: string;
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  evaluate: (inputs: ModuleInputs, params: ModuleParams) => ModuleOutputs;
}

export interface StatefulModuleDef extends ModuleDef {
  advance: (params: ModuleParams, tick: number) => ModuleParams;
}

export interface TickSliceableModuleDef extends ModuleDef {
  tickSlice: (params: ModuleParams, tick: number) => ModuleParams;
  tickLength: (params: ModuleParams) => number;
}

export type ModuleDefinition = ModuleDef | CompositeDef | IteratorDef;

export function isStatefulModule(def: ModuleDefinition): def is StatefulModuleDef {
  return 'advance' in def && typeof (def as StatefulModuleDef).advance === 'function';
}

export function isTickSliceable(def: ModuleDefinition): def is TickSliceableModuleDef {
  return (
    'tickSlice' in def &&
    typeof (def as TickSliceableModuleDef).tickSlice === 'function' &&
    'tickLength' in def &&
    typeof (def as TickSliceableModuleDef).tickLength === 'function'
  );
}

export interface ModuleInstance {
  id: string;
  defId: string;
  params: ModuleParams;
}

export interface ConnectionEndpoint {
  moduleId: string;
  port: string;
}

export interface Connection {
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
}

export interface Project {
  modules: ModuleInstance[];
  connections: Connection[];
}

export type ModuleRegistry = Record<string, ModuleDefinition>;

export interface ValidationIssue {
  code:
    | 'duplicate-module-id'
    | 'unknown-module-def'
    | 'unknown-module-instance'
    | 'unknown-port'
    | 'duplicate-external-port'
    | 'missing-required-param'
    | 'unknown-param'
    | 'invalid-param-type'
    | 'invalid-param-option'
    | 'invalid-wiring'
    | 'duplicate-input-connection'
    | 'signal-type-mismatch'
    | 'signal-width-mismatch'
    | 'cycle-detected'
    | 'invalid-composite-binding';
  message: string;
  moduleId?: string;
  connection?: Connection;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionTraceEntry {
  moduleId: string;
  defId: string;
  inputs: ModuleInputs;
  outputs: ModuleOutputs;
  scopeModuleId?: string;
  depth?: number;
}

export interface ExecutionResult {
  order: string[];
  outputsByModuleId: Record<string, ModuleOutputs>;
  trace: ExecutionTraceEntry[];
  analysisTrace: ExecutionTraceEntry[];
}

export interface TickedExecutionResult {
  ticks: ExecutionResult[];
  paramsByModuleByTick: Record<string, ModuleParams[]>;
}
