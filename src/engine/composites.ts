import type { ParamSchema, PortDef, Project } from './types';

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

export interface CompositeLibraryEntry {
  id: string;
  name: string;
  version: number;
  definition: CompositeDef;
}
