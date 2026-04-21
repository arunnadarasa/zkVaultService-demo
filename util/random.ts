import { BN254_FR_MODULUS } from "../lib/shielded/poseidon";


/** Random scalar in BN254 Fr (strictly in [0, modulus)). */
export const getRandomField = (): bigint => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let x = 0n;
  for (const b of bytes) x = (x << 8n) + BigInt(b);
  return x % BN254_FR_MODULUS;
};
