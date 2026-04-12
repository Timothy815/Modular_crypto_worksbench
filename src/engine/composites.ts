import type { ModuleDefinition, ParamSchema, PortDef, Project } from './types';

export interface CompositeLayoutPosition {
  x: number;
  y: number;
}

export interface CompositePortBinding {
  externalPort: string;
  internalModuleId: string;
  internalPort: string;
}

export interface ForwardedParamBinding {
  externalParam: string;
  internalModuleId: string;
  internalParamKey: string;
}

export interface CompositeDef {
  id: string;
  name: string;
  kind: 'composite';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  project: Project;
  layout?: Record<string, CompositeLayoutPosition>;
  inputBindings: CompositePortBinding[];
  outputBindings: CompositePortBinding[];
  forwardedParams?: ForwardedParamBinding[];
  purpose?: string;
  version: number;
}

export interface IteratorDef {
  id: string;
  name: string;
  kind: 'iterator';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  roundDefId: string;
  iterationCount: number;
  roundKeyWidth?: number;
  version: number;
}

export interface ConditionalDef {
  id: string;
  name: string;
  kind: 'conditional';
  inputs: PortDef[];
  outputs: PortDef[];
  paramSchema: ParamSchema;
  thenDefId: string;
  elseDefId: string;
  version: number;
}

export interface CompositeLibraryEntry {
  id: string;
  name: string;
  version: number;
  source?: 'built-in' | 'user';
  definition: CompositeDef | IteratorDef | ConditionalDef;
}

export function isBuiltInCompositeLibraryEntry(entry: CompositeLibraryEntry) {
  return entry.source === 'built-in';
}

export function isCompositeDefinition(definition: ModuleDefinition): definition is CompositeDef {
  return 'kind' in definition && definition.kind === 'composite';
}

export function isIteratorDefinition(definition: ModuleDefinition): definition is IteratorDef {
  return 'kind' in definition && definition.kind === 'iterator';
}

export function isConditionalDefinition(definition: ModuleDefinition): definition is ConditionalDef {
  return 'kind' in definition && definition.kind === 'conditional';
}
