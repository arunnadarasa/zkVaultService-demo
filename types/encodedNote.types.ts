export type EncodedNote = {
  id: string;
  value: bigint;
  pk: bigint;
  random: bigint;
  nullifier: bigint;
  commitment: `0x${string}`;
  merkleRoot?: `0x${string}`;
  merkleProofIndices?: number[];
  merkleProofSiblings?: `0x${string}`[];
  createdAt: number;
};
