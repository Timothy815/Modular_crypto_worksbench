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

export type ModuleRegistry = Record<string, ModuleDef>;

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
}

export interface ExecutionResult {
  order: string[];
  outputsByModuleId: Record<string, ModuleOutputs>;
  trace: ExecutionTraceEntry[];
}
