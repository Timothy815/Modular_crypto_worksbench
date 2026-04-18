export function formatRequireLengthMatchMessage(
  moduleName: string,
  inputLength: number,
  referenceLength: number,
  unit: 'bit' | 'char',
): string {
  const difference = inputLength - referenceLength;
  const magnitude = Math.abs(difference);
  const pluralUnit = magnitude === 1 ? unit : `${unit}s`;
  const direction = difference < 0 ? 'shorter' : 'longer';
  const inputUnit = inputLength === 1 ? unit : `${unit}s`;
  const referenceUnit = referenceLength === 1 ? unit : `${unit}s`;
  const repairHint =
    unit === 'bit'
      ? ' Use RepeatBitsToMatch, PadBitsToMatch, or TruncateBitsToMatch if the graph should repair the mismatch explicitly instead.'
      : ' Use RepeatSymbolToMatch, PadSymbolToMatch, or TruncateSymbolToMatch if the graph should repair the mismatch explicitly instead.';

  return `${moduleName} mismatch: input ${inputLength} ${inputUnit}; reference ${referenceLength} ${referenceUnit} — input is ${magnitude} ${pluralUnit} ${direction}.${repairHint}`;
}
