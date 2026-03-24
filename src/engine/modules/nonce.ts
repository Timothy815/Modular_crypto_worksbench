import { buildProtocolMaterialSource } from './protocol-material';

export const Nonce = buildProtocolMaterialSource(
  'Nonce',
  'Nonce',
  'Nonce Value',
  'Nonce value as hex. Short values are zero-padded on the right to the declared width.',
);
