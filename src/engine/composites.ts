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

export interface CompositeLibraryEntry {
  id: string;
  name: string;
  version: number;
  definition: CompositeDef | IteratorDef;
}

export function isCompositeDefinition(definition: ModuleDefinition): definition is CompositeDef {
  return 'kind' in definition && definition.kind === 'composite';
}

export function isIteratorDefinition(definition: ModuleDefinition): definition is IteratorDef {
  return 'kind' in definition && definition.kind === 'iterator';
}
