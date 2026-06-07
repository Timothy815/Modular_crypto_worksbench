import { useMemo } from 'react';

import {
  getSBoxAnalysisFromParams,
  getPermutationAnalysisFromParams,
  getToyPointMapAnalysis,
  getKeyedSBoxAnalysis,
  getAesConsequenceAnalysis,
  getLFSRAnalysis,
  getPlugboardAnalysis,
  getReflectorAnalysis,
  getModulusAnalysis,
} from '../inspector-analysis';
import type {
  SBoxAnalysis,
  PermutationAnalysis,
  ToyPointMapAnalysis,
  KeyedSBoxAnalysis,
  AesConsequenceAnalysis,
  LFSRAnalysis,
  PlugboardAnalysis,
  ReflectorAnalysis,
  ModulusAnalysis,
} from '../inspector-analysis';
import type { ExecutionTraceEntry, ModuleInstance } from '../../engine/types';

export interface InspectorModuleAnalysis {
  staticSBoxAnalysis: SBoxAnalysis | null;
  staticPermutationAnalysis: PermutationAnalysis | null;
  staticLFSRAnalysis: LFSRAnalysis | null;
  staticPlugboardAnalysis: PlugboardAnalysis | null;
  staticReflectorAnalysis: ReflectorAnalysis | null;
  staticModulusAnalysis: ModulusAnalysis | null;
  staticToyPointMapAnalysis: ToyPointMapAnalysis | null;
  staticKeyedSBoxAnalysis: KeyedSBoxAnalysis | null;
  staticAesConsequenceAnalysis: AesConsequenceAnalysis | null;
}

/**
 * Computes per-module static analysis values for the Analyze tab.
 * Each value is null when the tab is not active or the module type doesn't match.
 */
export function useInspectorModuleAnalysis(
  inspectorTab: 'configure' | 'analyze' | 'compare',
  moduleInstance: ModuleInstance | null,
  selectedTrace: ExecutionTraceEntry | null,
  permutationBlockSize: number | null,
): InspectorModuleAnalysis {
  const staticSBoxAnalysis: SBoxAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'SBox') {
      return null;
    }
    return getSBoxAnalysisFromParams(moduleInstance.params);
  }, [inspectorTab, moduleInstance]);

  const isPermutationModule =
    moduleInstance?.defId === 'Permutation' || moduleInstance?.defId === 'PermutationBits';
  const staticPermutationAnalysis: PermutationAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || !isPermutationModule || !moduleInstance) {
      return null;
    }
    return getPermutationAnalysisFromParams(
      moduleInstance.params,
      permutationBlockSize ?? undefined,
    );
  }, [inspectorTab, isPermutationModule, moduleInstance, permutationBlockSize]);

  const staticLFSRAnalysis: LFSRAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'LFSR' || !moduleInstance) {
      return null;
    }
    return getLFSRAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);

  const staticPlugboardAnalysis: PlugboardAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'Plugboard' || !moduleInstance) {
      return null;
    }
    return getPlugboardAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);

  const staticReflectorAnalysis: ReflectorAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'Reflector' || !moduleInstance) {
      return null;
    }
    return getReflectorAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);

  const staticModulusAnalysis: ModulusAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || !moduleInstance) {
      return null;
    }
    if (moduleInstance.defId !== 'ModExp' && moduleInstance.defId !== 'ModInverse') {
      return null;
    }
    return getModulusAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);

  const staticToyPointMapAnalysis: ToyPointMapAnalysis | null = useMemo(() => {
    if (inspectorTab !== 'analyze' || moduleInstance?.defId !== 'ToyPointMap' || !moduleInstance) {
      return null;
    }
    return getToyPointMapAnalysis(moduleInstance.params as Record<string, unknown>);
  }, [inspectorTab, moduleInstance]);

  const staticKeyedSBoxAnalysis: KeyedSBoxAnalysis | null = useMemo(() => {
    if (
      inspectorTab !== 'analyze' ||
      moduleInstance?.defId !== 'KeyedSBox4' ||
      !moduleInstance ||
      !selectedTrace
    ) {
      return null;
    }
    const keySignal = selectedTrace.inputs.key;
    if (
      selectedTrace.moduleId !== moduleInstance.id ||
      selectedTrace.defId !== 'KeyedSBox4' ||
      keySignal?.type !== 'bits'
    ) {
      return null;
    }
    return getKeyedSBoxAnalysis(keySignal.value);
  }, [inspectorTab, moduleInstance, selectedTrace]);

  const staticAesConsequenceAnalysis: AesConsequenceAnalysis | null = useMemo(() => {
    if (
      inspectorTab !== 'analyze' ||
      moduleInstance?.defId !== 'AesConsequenceSummary' ||
      !moduleInstance ||
      !selectedTrace
    ) {
      return null;
    }
    if (
      selectedTrace.moduleId !== moduleInstance.id ||
      selectedTrace.defId !== 'AesConsequenceSummary'
    ) {
      return null;
    }
    const canonicalStage0 = selectedTrace.inputs.canonicalStage0;
    const perturbedStage0 = selectedTrace.inputs.perturbedStage0;
    const canonicalStage1 = selectedTrace.inputs.canonicalStage1;
    const perturbedStage1 = selectedTrace.inputs.perturbedStage1;
    if (
      canonicalStage0?.type !== 'bits' ||
      perturbedStage0?.type !== 'bits' ||
      canonicalStage1?.type !== 'bits' ||
      perturbedStage1?.type !== 'bits'
    ) {
      return null;
    }
    return getAesConsequenceAnalysis({
      stage0Label: moduleInstance.params.stage0Label,
      stage1Label: moduleInstance.params.stage1Label,
      ruleChanged: moduleInstance.params.ruleChanged,
      claimBoundary: moduleInstance.params.claimBoundary,
      canonicalStage0,
      perturbedStage0,
      canonicalStage1,
      perturbedStage1,
    });
  }, [inspectorTab, moduleInstance, selectedTrace]);

  return {
    staticSBoxAnalysis,
    staticPermutationAnalysis,
    staticLFSRAnalysis,
    staticPlugboardAnalysis,
    staticReflectorAnalysis,
    staticModulusAnalysis,
    staticToyPointMapAnalysis,
    staticKeyedSBoxAnalysis,
    staticAesConsequenceAnalysis,
  };
}
