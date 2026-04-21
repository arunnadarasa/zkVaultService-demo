"use client";

import { EncodedNote } from "../../types/encodedNote.types";
import { getRandomField } from "../../util/random";
import { appendEntryAndGetProof } from "./merkle";
import { computeEntry, computeNullifier, fieldToHex } from "./poseidon";
import type { SplitOutputNote } from "./splitInputs";

const NOTES_STORAGE_KEY = "zkVault::notes";

/**
 * Creates a new note
 */
export const createNote = async (value: bigint): Promise<EncodedNote> => {
  const pk = 2n; // demo: mismo pk fijo para todas las notas
  const random = getRandomField();
  const nullifier = await computeNullifier(random, pk);
  const entry = await computeEntry(value, pk, random, nullifier);
  const commitment = fieldToHex(entry);

  const { proof } = await appendEntryAndGetProof(entry);

  const note: EncodedNote = {
    id: crypto.randomUUID(),
    value,
    pk,
    random,
    nullifier,
    commitment,
    merkleRoot: proof.rootHex,
    merkleProofIndices: proof.indices,
    merkleProofSiblings: proof.siblingsHex,
    createdAt: Date.now(),
  };

  return note;
};

/** Create and persist notes arising from a SplitNote operation. */
export const createNotesFromSplit = async (
  outputs: SplitOutputNote[],
): Promise<EncodedNote[]> => {
  const created: EncodedNote[] = [];

  for (const o of outputs) {
    const { proof } = await appendEntryAndGetProof(o.entry);
    const note: EncodedNote = {
      id: crypto.randomUUID(),
      value: o.value,
      pk: o.pk,
      random: o.random,
      nullifier: o.nullifier,
      commitment: o.commitment,
      merkleRoot: proof.rootHex,
      merkleProofIndices: proof.indices,
      merkleProofSiblings: proof.siblingsHex,
      createdAt: Date.now(),
    };
    created.push(note);
  }
  return created;
};
