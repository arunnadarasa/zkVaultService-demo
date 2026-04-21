import { poseidon2 as poseidon2Lite } from "poseidon-lite";

/** BN254 scalar field modulus (Noir/Circom use this field). */
export const BN254_FR_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const fieldToHex = (x: bigint): `0x${string}` =>
  ("0x" + x.toString(16).padStart(64, "0")) as `0x${string}`;

/** Reduce to field element [0, modulus). */
function toField(x: bigint): bigint {
  const r = x % BN254_FR_MODULUS;
  return r >= 0n ? r : r + BN254_FR_MODULUS;
}

/** Poseidon hash of 2 field elements. Uses poseidon-lite (Circom/Noir compatible, BN254). Sync. */
function poseidon2Sync(a: bigint, b: bigint): bigint {
  const a0 = toField(a);
  const b0 = toField(b);
  const hexA = "0x" + a0.toString(16);
  const hexB = "0x" + b0.toString(16);
  return poseidon2Lite([hexA, hexB]) as bigint;
}

/** Poseidon hash of 2 field elements (async wrapper for API compatibility). */
export const poseidon2 = async (a: bigint, b: bigint): Promise<bigint> => {
  return poseidon2Sync(a, b);
};

export const computeNullifier = async (
  random: bigint,
  pk: bigint,
): Promise<bigint> => {
  return poseidon2Sync(random, pk);
};

export const computeEntry = async (
  value: bigint,
  holder: bigint,
  random: bigint,
  nullifier: bigint,
): Promise<bigint> => {
  const a = poseidon2Sync(value, holder);
  const b = poseidon2Sync(random, nullifier);
  return poseidon2Sync(a, b);
};

/** Commitment for Withdraw circuit public input: H(value, nullifier). */
export const withdrawCommitmentHash = async (
  value: bigint,
  nullifier: bigint,
): Promise<bigint> => {
  return poseidon2Sync(value, nullifier);
};
