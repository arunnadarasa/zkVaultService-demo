import type { EncodedNote } from "../../types/encodedNote.types";
import {
  BN254_FR_MODULUS,
  computeEntry,
  computeNullifier,
  fieldToHex,
} from "./poseidon";

export type SplitInputMap = {
  nullifier_in: `0x${string}`;
  merkle_proof_length: number;
  expected_merkle_root: `0x${string}`;
  new_commitment_1: `0x${string}`;
  new_commitment_2: `0x${string}`;
  new_commitment_3: `0x${string}`;
  new_commitment_4: `0x${string}`;
  value_in: `0x${string}`;
  pk_sender: `0x${string}`;
  random_in: `0x${string}`;
  merkle_proof_indices: number[];
  merkle_proof_siblings: `0x${string}`[];
  value_1: `0x${string}`;
  pk_1: `0x${string}`;
  random_1: `0x${string}`;
  value_2: `0x${string}`;
  pk_2: `0x${string}`;
  random_2: `0x${string}`;
  value_3: `0x${string}`;
  pk_3: `0x${string}`;
  random_3: `0x${string}`;
  value_4: `0x${string}`;
  pk_4: `0x${string}`;
  random_4: `0x${string}`;
};

export type SplitOutputNote = {
  value: bigint;
  pk: bigint;
  random: bigint;
  nullifier: bigint;
  entry: bigint;
  commitment: `0x${string}`;
};

/** Reduce random scalar to BN254 field. */
const randomField = (): bigint => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let x = 0n;
  for (const b of bytes) x = (x << 8n) + BigInt(b);
  const r = x % BN254_FR_MODULUS;
  return r >= 0n ? r : r + BN254_FR_MODULUS;
};

/** Build Noir SplitNote inputs from a stored note. Simple equal-ish split into 4 parts. */
export async function buildSplitInputs(
  note: EncodedNote,
): Promise<{ inputs: SplitInputMap; outputs: SplitOutputNote[] }> {
  if (
    !note.merkleRoot ||
    !note.merkleProofIndices ||
    !note.merkleProofSiblings
  ) {
    throw new Error(
      "Note missing merkle proof (deposit must complete and include tree data)",
    );
  }

  const valueIn = note.value;
  if (valueIn <= 0n) {
    throw new Error("Note value must be positive");
  }

  // Split en 4 partes casi iguales.
  const v1 = valueIn / 4n;
  const v2 = valueIn / 4n;
  const v3 = valueIn / 4n;
  const v4 = valueIn - v1 - v2 - v3;

  const pk = note.pk;

  const candidates: Array<{ value: bigint; pk: bigint; random: bigint }> = [
    { value: v1, pk, random: randomField() },
    { value: v2, pk, random: randomField() },
    { value: v3, pk, random: randomField() },
    { value: v4, pk, random: randomField() },
  ];

  const outputs: SplitOutputNote[] = [];
  for (const c of candidates) {
    const nullifier = await computeNullifier(c.random, c.pk);
    const entry = await computeEntry(c.value, c.pk, c.random, nullifier);
    const commitment = fieldToHex(entry);
    outputs.push({
      value: c.value,
      pk: c.pk,
      random: c.random,
      nullifier,
      entry,
      commitment,
    });
  }

  const [o1, o2, o3, o4] = outputs;

  const inputs: SplitInputMap = {
    nullifier_in: fieldToHex(note.nullifier),
    merkle_proof_length: 10,
    expected_merkle_root: note.merkleRoot,
    new_commitment_1: o1.commitment,
    new_commitment_2: o2.commitment,
    new_commitment_3: o3.commitment,
    new_commitment_4: o4.commitment,
    value_in: fieldToHex(valueIn),
    pk_sender: fieldToHex(note.pk),
    random_in: fieldToHex(note.random),
    merkle_proof_indices: note.merkleProofIndices,
    merkle_proof_siblings: note.merkleProofSiblings,
    value_1: fieldToHex(o1.value),
    pk_1: fieldToHex(o1.pk),
    random_1: fieldToHex(o1.random),
    value_2: fieldToHex(o2.value),
    pk_2: fieldToHex(o2.pk),
    random_2: fieldToHex(o2.random),
    value_3: fieldToHex(o3.value),
    pk_3: fieldToHex(o3.pk),
    random_3: fieldToHex(o3.random),
    value_4: fieldToHex(o4.value),
    pk_4: fieldToHex(o4.pk),
    random_4: fieldToHex(o4.random),
  };

  return { inputs, outputs };
}
