/// <reference types="node" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { executeProject } from '../executor';
import { V1_REGISTRY } from '../modules';
import { generatePythonExport, getPythonExportCompatibility } from './python';
import type { ModuleRegistry, Project, Signal } from '../types';

function formatExpectedSinkValue(defId: string, signal: Signal) {
  if (defId === 'Output' || defId === 'TextOutput') {
    return String(signal.value);
  }

  if (defId === 'BitOutput') {
    if (signal.type !== 'bits') {
      throw new Error('BitOutput expects a bits signal');
    }
    return signal.value.join('');
  }

  if (defId === 'HexOutput') {
    return String(signal.value).toUpperCase();
  }

  throw new Error(`Unsupported sink ${defId}`);
}

function getExpectedSinkLines(project: Project, registry: ModuleRegistry) {
  const result = executeProject(project, registry);
  const traceByModuleId = new Map(result.trace.map((entry) => [entry.moduleId, entry]));

  return project.modules
    .filter((moduleInstance) =>
      ['Output', 'TextOutput', 'BitOutput', 'HexOutput'].includes(moduleInstance.defId),
    )
    .map((moduleInstance) => {
      const traceEntry = traceByModuleId.get(moduleInstance.id);
      if (!traceEntry?.inputs.in) {
        throw new Error(`Missing sink input for ${moduleInstance.id}`);
      }
      return `${moduleInstance.id}: ${formatExpectedSinkValue(moduleInstance.defId, traceEntry.inputs.in)}`;
    });
}

function executeGeneratedPython(source: string) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `mcw-python-export-${Date.now()}-${Math.random().toString(16).slice(2)}.py`,
  );
  fs.writeFileSync(tempFilePath, source, 'utf8');
  const result = spawnSync('python3', [tempFilePath], { encoding: 'utf8' });
  fs.unlinkSync(tempFilePath);
  return result;
}

const pythonAvailability = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const hasPython3 = pythonAvailability.status === 0;
const parityDescribe = hasPython3 ? describe : describe.skip;

describe('getPythonExportCompatibility', () => {
  it('rejects unsupported stateful modules and bypassed modules', () => {
    const incompatibleProject: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: {} },
        { id: 'bits-1', defId: 'BitSource', params: { stream: [1, 0, 1, 0] }, bypass: true },
      ],
      connections: [],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, V1_REGISTRY);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toEqual([
      {
        moduleId: 'clock-1',
        defId: 'Clock',
        reason: 'Stateful or ticked execution is not exportable in V1.',
      },
      {
        moduleId: 'bits-1',
        defId: 'BitSource',
        reason: 'Bypass behavior is not exportable in V1.',
      },
    ]);
  });
});

parityDescribe('generatePythonExport', () => {
  it('matches executeProject for a bridge-heavy stateless workspace', () => {
    const project: Project = {
      modules: [
        { id: 'ascii-src', defId: 'AsciiSource', params: { value: 'A' } },
        { id: 'bits-to-ascii', defId: 'BitsToAscii', params: {} },
        { id: 'ascii-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'ascii-src', port: 'out' },
          to: { moduleId: 'bits-to-ascii', port: 'in' },
        },
        {
          from: { moduleId: 'bits-to-ascii', port: 'out' },
          to: { moduleId: 'ascii-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a routing and structural transform workspace', () => {
    const project: Project = {
      modules: [
        { id: 'payload-bits', defId: 'BitSource', params: { stream: [1] } },
        { id: 'route-select', defId: 'BitSource', params: { stream: [1, 0] } },
        { id: 'router-1', defId: 'MultiRouter', params: { routeCount: '4' } },
        { id: 'join-left', defId: 'BitSource', params: { stream: [0, 1] } },
        { id: 'join-1', defId: 'BitJoin', params: {} },
        { id: 'pad-1', defId: 'BitPad', params: { targetWidth: 8, side: 'left', padBit: '0' } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'route-select', port: 'out' },
          to: { moduleId: 'router-1', port: 'select' },
        },
        {
          from: { moduleId: 'payload-bits', port: 'out' },
          to: { moduleId: 'router-1', port: 'in' },
        },
        {
          from: { moduleId: 'join-left', port: 'out' },
          to: { moduleId: 'join-1', port: 'a' },
        },
        {
          from: { moduleId: 'router-1', port: 'out2' },
          to: { moduleId: 'join-1', port: 'b' },
        },
        {
          from: { moduleId: 'join-1', port: 'out' },
          to: { moduleId: 'pad-1', port: 'in' },
        },
        {
          from: { moduleId: 'pad-1', port: 'out' },
          to: { moduleId: 'hex-1', port: 'in' },
        },
        {
          from: { moduleId: 'hex-1', port: 'out' },
          to: { moduleId: 'hex-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });
});
