export const OUTPUT_SINK_DEF_IDS = [
  'Output',
  'TextOutput',
  'HexOutput',
  'BaudotOutput',
  'BitOutput',
] as const;

export type OutputSinkDefId = (typeof OUTPUT_SINK_DEF_IDS)[number];

const OUTPUT_SINK_DEF_ID_SET = new Set<string>(OUTPUT_SINK_DEF_IDS);

export function isOutputSinkDefId(defId: string): defId is OutputSinkDefId {
  return OUTPUT_SINK_DEF_ID_SET.has(defId);
}

