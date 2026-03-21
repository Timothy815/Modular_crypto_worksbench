import type { Project } from '../engine/types';
import type { CompositeLibraryEntry } from '../engine/composites';

export interface WorkbenchPosition {
  x: number;
  y: number;
}

export interface WorkbenchAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface WorkbenchUiMetadata {
  layout: Record<string, WorkbenchPosition>;
  annotations: WorkbenchAnnotation[];
}

export interface WorkbenchDocument {
  version: 1;
  project: Project;
  ui: WorkbenchUiMetadata;
}

export interface CompositeLibraryDocument {
  version: 1;
  entries: CompositeLibraryEntry[];
}
