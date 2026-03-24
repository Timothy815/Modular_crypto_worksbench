import { buildProtocolMaterialSource } from './protocol-material';

export const IV = buildProtocolMaterialSource(
  'IV',
  'IV',
  'IV Value',
  'Initialization-vector value as hex. Short values are zero-padded on the right to the declared width.',
);
