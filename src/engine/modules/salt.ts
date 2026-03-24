import { buildProtocolMaterialSource } from './protocol-material';

export const Salt = buildProtocolMaterialSource(
  'Salt',
  'Salt',
  'Salt Value',
  'Salt value as hex. Short values are zero-padded on the right to the declared width.',
);
