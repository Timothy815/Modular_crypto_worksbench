import type { Signal } from '../types';

export function expectControlBits(signal: Signal, moduleName: string): number[] {
  if (signal.type !== 'bits') {
    throw new Error(`${moduleName} expects a bits control signal`);
  }

  return signal.value;
}

export function isActiveControlPulse(bits: number[]): boolean {
  return bits.length === 1 && bits[0] === 1;
}

export function singleBitControl(active: boolean) {
  return { type: 'bits' as const, value: [active ? 1 : 0] };
}
