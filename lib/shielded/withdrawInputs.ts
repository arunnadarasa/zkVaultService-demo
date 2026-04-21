import { EncodedNote } from "../../types/encodedNote.types";
import { fieldToHex, withdrawCommitmentHash } from "./poseidon";
import { encodePacked, keccak256, toHex } from "viem";

const POOL_SALT = keccak256(toHex(new TextEncoder().encode("ShieldedPool.v2b")) as `0x${string}`);

/** Recipient address as bytes32 (left-padded). */
function recipientToField(recipient: `0x${string}`): `0x${string}` {
  const addr = recipient.slice(2).toLowerCase().padStart(40, "0");
  return ("0x" + "0".repeat(24) + addr) as `0x${string}`;
}

/** Ciphertext so that on-chain amount = ciphertext XOR stream matches note.value. */
export function computeWithdrawCiphertext(note: EncodedNote, recipient: `0x${string}`): `0x${string}` {
  const nullifierHex = fieldToHex(note.nullifier) as `0x${string}`;
  const recipientField = recipientToField(recipient);
  const key = keccak256(encodePacked(["bytes32", "bytes32", "bytes32"], [nullifierHex, recipientField, POOL_SALT]));
  const stream = keccak256(encodePacked(["bytes32", "uint256"], [key, 0n]));
  const valueXor = note.value ^ BigInt(stream);
  return ("0x" + valueXor.toString(16).padStart(64, "0")) as `0x${string}`;
}

export type WithdrawInputMap = {
  nullifier: `0x${string}`;
  merkle_proof_length: number;
  expected_merkle_root: `0x${string}`;
  recipient: `0x${string}`;
  commitment: `0x${string}`;
  decrypted_amount: `0x${string}`;
  value: `0x${string}`;
  pk_b: `0x${string}`;
  random: `0x${string}`;
  merkle_proof_indices: number[];
  merkle_proof_siblings: `0x${string}`[];
};

/** Build Noir WithdrawFromPool input map from stored note and recipient. */
export async function buildWithdrawInputs(note: EncodedNote, recipient: `0x${string}`): Promise<WithdrawInputMap> {
  if (!note.merkleRoot || !note.merkleProofIndices || !note.merkleProofSiblings) {
    throw new Error("Note missing merkle proof (deposit must complete and include tree data)");
  }
  const commitmentField = await withdrawCommitmentHash(note.value, note.nullifier);
  const recipientField = recipientToField(recipient);

  return {
    nullifier: fieldToHex(note.nullifier) as `0x${string}`,
    merkle_proof_length: 10,
    expected_merkle_root: note.merkleRoot,
    recipient: recipientField,
    commitment: fieldToHex(commitmentField) as `0x${string}`,
    decrypted_amount: fieldToHex(note.value) as `0x${string}`,
    value: fieldToHex(note.value) as `0x${string}`,
    pk_b: fieldToHex(note.pk) as `0x${string}`,
    random: fieldToHex(note.random) as `0x${string}`,
    merkle_proof_indices: note.merkleProofIndices,
    merkle_proof_siblings: note.merkleProofSiblings,
  };
}
