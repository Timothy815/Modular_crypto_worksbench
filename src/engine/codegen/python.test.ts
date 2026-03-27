/// <reference types="node" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { deriveTickCount, executeProject, executeTickedProject } from '../executor';
import { V1_REGISTRY } from '../modules';
import { generatePythonExport, getPythonExportCompatibility } from './python';
import type { ModuleRegistry, Project, Signal } from '../types';

function formatExpectedSinkValue(defId: string, signal: Signal) {
  if (defId === 'Output' || defId === 'TextOutput' || defId === 'BaudotOutput') {
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
      ['Output', 'TextOutput', 'BaudotOutput', 'BitOutput', 'HexOutput'].includes(moduleInstance.defId),
    )
    .map((moduleInstance) => {
      const traceEntry = traceByModuleId.get(moduleInstance.id);
      if (!traceEntry?.inputs.in) {
        throw new Error(`Missing sink input for ${moduleInstance.id}`);
      }
      return `${moduleInstance.id}: ${formatExpectedSinkValue(moduleInstance.defId, traceEntry.inputs.in)}`;
    });
}

function getExpectedTickedSinkLines(project: Project, registry: ModuleRegistry) {
  const tickCount = deriveTickCount(project, registry);
  if (tickCount === null) {
    throw new Error('Expected a derived tick count for a ticked parity workspace');
  }

  const result = executeTickedProject(project, registry, tickCount);

  return result.ticks.flatMap((tickResult, tickIndex) => {
    const traceByModuleId = new Map(tickResult.trace.map((entry) => [entry.moduleId, entry]));

    return project.modules
      .filter((moduleInstance) =>
        ['Output', 'TextOutput', 'BaudotOutput', 'BitOutput', 'HexOutput'].includes(moduleInstance.defId),
      )
      .map((moduleInstance) => {
        const traceEntry = traceByModuleId.get(moduleInstance.id);
        if (!traceEntry?.inputs.in) {
          throw new Error(`Missing sink input for ${moduleInstance.id} at tick ${tickIndex}`);
        }
        return `tick ${tickIndex} | ${moduleInstance.id}: ${formatExpectedSinkValue(moduleInstance.defId, traceEntry.inputs.in)}`;
      });
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
        { id: 'lfsr-1', defId: 'LFSR', params: { width: 4, taps: '0,1', value: '1,0,0,1' } },
        { id: 'bits-1', defId: 'BitSource', params: { stream: [1, 0, 1, 0] }, bypass: true },
      ],
      connections: [],
    };

    const compatibility = getPythonExportCompatibility(incompatibleProject, V1_REGISTRY);

    expect(compatibility.ok).toBe(false);
    expect(compatibility.issues).toEqual([
      {
        moduleId: 'lfsr-1',
        defId: 'LFSR',
        reason: 'This stateful or ticked primitive is outside the Python export stateful supported subset.',
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

  it('matches executeProject for an s-box workspace', () => {
    const project: Project = {
      modules: [
        { id: 'nibble-src', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'sbox-1', defId: 'SBox', params: { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'nibble-src', port: 'out' },
          to: { moduleId: 'sbox-1', port: 'in' },
        },
        {
          from: { moduleId: 'sbox-1', port: 'out' },
          to: { moduleId: 'bits-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a modular arithmetic workspace', () => {
    const project: Project = {
      modules: [
        { id: 'left-word', defId: 'BitSource', params: { stream: [1, 1, 0, 1] } },
        { id: 'right-word', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'add-1', defId: 'AddMod', params: {} },
        { id: 'sub-1', defId: 'SubMod', params: {} },
        { id: 'mod-1', defId: 'Modulo', params: { modulus: 7 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        {
          from: { moduleId: 'left-word', port: 'out' },
          to: { moduleId: 'add-1', port: 'a' },
        },
        {
          from: { moduleId: 'right-word', port: 'out' },
          to: { moduleId: 'add-1', port: 'b' },
        },
        {
          from: { moduleId: 'add-1', port: 'out' },
          to: { moduleId: 'sub-1', port: 'a' },
        },
        {
          from: { moduleId: 'right-word', port: 'out' },
          to: { moduleId: 'sub-1', port: 'b' },
        },
        {
          from: { moduleId: 'sub-1', port: 'out' },
          to: { moduleId: 'mod-1', port: 'in' },
        },
        {
          from: { moduleId: 'mod-1', port: 'out' },
          to: { moduleId: 'bits-out', port: 'in' },
        },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a control and arithmetic workspace', () => {
    const project: Project = {
      modules: [
        { id: 'bit-a', defId: 'BitSource', params: { stream: [1] } },
        { id: 'bit-b', defId: 'BitSource', params: { stream: [0] } },
        { id: 'bit-c', defId: 'BitSource', params: { stream: [1] } },
        { id: 'majority-1', defId: 'Majority', params: {} },
        { id: 'left-word', defId: 'BitSource', params: { stream: [1, 0, 1, 1] } },
        { id: 'right-word', defId: 'BitSource', params: { stream: [0, 1, 1, 0] } },
        { id: 'mul-1', defId: 'MulMod', params: {} },
        { id: 'gt-1', defId: 'GreaterThan', params: {} },
        { id: 'decision-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'bit-a', port: 'out' }, to: { moduleId: 'majority-1', port: 'a' } },
        { from: { moduleId: 'bit-b', port: 'out' }, to: { moduleId: 'majority-1', port: 'b' } },
        { from: { moduleId: 'bit-c', port: 'out' }, to: { moduleId: 'majority-1', port: 'c' } },
        { from: { moduleId: 'left-word', port: 'out' }, to: { moduleId: 'mul-1', port: 'a' } },
        { from: { moduleId: 'right-word', port: 'out' }, to: { moduleId: 'mul-1', port: 'b' } },
        { from: { moduleId: 'mul-1', port: 'out' }, to: { moduleId: 'gt-1', port: 'a' } },
        { from: { moduleId: 'left-word', port: 'out' }, to: { moduleId: 'gt-1', port: 'b' } },
        { from: { moduleId: 'gt-1', port: 'out' }, to: { moduleId: 'decision-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a byte-structure workspace', () => {
    const project: Project = {
      modules: [
        { id: 'payload', defId: 'HexSource', params: { value: '12345678' } },
        { id: 'rotate-1', defId: 'ByteRotate', params: { amount: 1, direction: 'left' } },
        { id: 'swap-1', defId: 'ByteSwap', params: {} },
        { id: 'unpad-1', defId: 'BitUnpad', params: { originalWidth: 16, side: 'right' } },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'payload', port: 'out' }, to: { moduleId: 'rotate-1', port: 'in' } },
        { from: { moduleId: 'rotate-1', port: 'out' }, to: { moduleId: 'swap-1', port: 'in' } },
        { from: { moduleId: 'swap-1', port: 'out' }, to: { moduleId: 'unpad-1', port: 'in' } },
        { from: { moduleId: 'unpad-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a protocol-material workspace', () => {
    const project: Project = {
      modules: [
        { id: 'iv-1', defId: 'IV', params: { value: '1C', width: 8 } },
        { id: 'nonce-1', defId: 'Nonce', params: { value: 'A', width: 8 } },
        { id: 'join-1', defId: 'BitJoin', params: {} },
        { id: 'hex-1', defId: 'BitsToHex', params: {} },
        { id: 'hex-out', defId: 'HexOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'iv-1', port: 'out' }, to: { moduleId: 'join-1', port: 'a' } },
        { from: { moduleId: 'nonce-1', port: 'out' }, to: { moduleId: 'join-1', port: 'b' } },
        { from: { moduleId: 'join-1', port: 'out' }, to: { moduleId: 'hex-1', port: 'in' } },
        { from: { moduleId: 'hex-1', port: 'out' }, to: { moduleId: 'hex-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a symbol-structure workspace', () => {
    const project: Project = {
      modules: [
        { id: 'text-1', defId: 'TextInput', params: { value: 'MATH' } },
        { id: 'permute-1', defId: 'SymbolPermutation', params: { order: '2,0,3,1' } },
        { id: 'window-1', defId: 'SymbolWindow', params: { start: 1, width: 2 } },
        { id: 'text-out', defId: 'TextOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'text-1', port: 'out' }, to: { moduleId: 'permute-1', port: 'in' } },
        { from: { moduleId: 'permute-1', port: 'out' }, to: { moduleId: 'window-1', port: 'in' } },
        { from: { moduleId: 'window-1', port: 'out' }, to: { moduleId: 'text-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeProject for a stateless baudot decoding workspace', () => {
    const project: Project = {
      modules: [
        { id: 'baudot-bits', defId: 'BitSource', params: { stream: [0, 0, 0, 1, 1, 1, 0, 0, 0, 0] } },
        { id: 'decode-1', defId: 'BitsToBaudot', params: {} },
        { id: 'baudot-out', defId: 'BaudotOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'baudot-bits', port: 'out' }, to: { moduleId: 'decode-1', port: 'in' } },
        { from: { moduleId: 'decode-1', port: 'out' }, to: { moduleId: 'baudot-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a clocked counter workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 4 } },
        { id: 'counter-1', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-1', port: 'clock' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });

  it('matches executeTickedProject for a gated counter workspace', () => {
    const project: Project = {
      modules: [
        { id: 'clock-1', defId: 'Clock', params: { period: 1, offset: 0, length: 6 } },
        { id: 'counter-1', defId: 'Counter', params: { width: 3, value: 0, step: 1 } },
        { id: 'counter-2', defId: 'Counter', params: { width: 3, value: 0, step: 2 } },
        { id: 'gt-1', defId: 'GreaterThan', params: {} },
        { id: 'gate-1', defId: 'Gate', params: {} },
        { id: 'bits-out', defId: 'BitOutput', params: {} },
      ],
      connections: [
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-1', port: 'clock' } },
        { from: { moduleId: 'clock-1', port: 'pulse' }, to: { moduleId: 'counter-2', port: 'clock' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'gt-1', port: 'a' } },
        { from: { moduleId: 'counter-2', port: 'out' }, to: { moduleId: 'gt-1', port: 'b' } },
        { from: { moduleId: 'counter-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'in' } },
        { from: { moduleId: 'gt-1', port: 'out' }, to: { moduleId: 'gate-1', port: 'control' } },
        { from: { moduleId: 'gate-1', port: 'out' }, to: { moduleId: 'bits-out', port: 'in' } },
      ],
    };

    const pythonSource = generatePythonExport(project, V1_REGISTRY);
    const execution = executeGeneratedPython(pythonSource);

    expect(execution.status).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual(getExpectedTickedSinkLines(project, V1_REGISTRY));
  });
});
