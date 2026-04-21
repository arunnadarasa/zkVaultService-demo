import { poseidon2 } from "./poseidon";
import { fieldToHex } from "./poseidon";

const MAX_DEPTH = 10;
const TREE_SIZE = 2 ** MAX_DEPTH;

const STORAGE_KEY = "shieldedPool:merkleEntries";

function parseHex(s: string): bigint {
  const m = String(s).match(/^0x([0-9a-fA-F]+)$/);
  return m ? BigInt("0x" + m[1]) : BigInt(s);
}

export function getStoredEntries(): bigint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return arr.map((x: string) =>
      x.startsWith("0x") ? parseHex(x) : BigInt(x),
    );
  } catch {
    return [];
  }
}

export function storeEntries(entries: bigint[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      entries.map(
        (e) => ("0x" + e.toString(16).padStart(64, "0")) as `0x${string}`,
      ),
    ),
  );
}

/** Build one level of the tree: parent[i] = hash(level[2*i], level[2*i+1]). */
async function hashLevel(level: bigint[]): Promise<bigint[]> {
  const next: bigint[] = [];
  for (let i = 0; i < level.length; i += 2) {
    next.push(await poseidon2(level[i], level[i + 1]));
  }
  return next;
}

/** Build full tree. levels[0] = padded leaves, levels[MAX_DEPTH] = [root]. */
async function buildTree(leaves: bigint[]): Promise<bigint[][]> {
  const padded = [...leaves];
  while (padded.length < TREE_SIZE) padded.push(0n);
  const levels: bigint[][] = [padded];
  let current = padded;
  for (let d = 0; d < MAX_DEPTH; d++) {
    current = await hashLevel(current);
    levels.push(current);
  }
  return levels;
}

export type MerkleProof = {
  root: bigint;
  rootHex: `0x${string}`;
  indices: number[];
  siblings: bigint[];
  siblingsHex: `0x${string}`[];
};

/** Get Merkle path for leaf at leafIndex. indices are 0 = left, 1 = right. */
export async function getMerkleProof(
  entries: bigint[],
  leafIndex: number,
): Promise<MerkleProof> {
  const padded = [...entries];
  while (padded.length < TREE_SIZE) padded.push(0n);
  const levels = await buildTree(padded);
  const indices: number[] = [];
  const siblings: bigint[] = [];
  let idx = leafIndex;
  for (let d = 0; d < MAX_DEPTH; d++) {
    const siblingIdx = idx ^ 1;
    indices.push(idx % 2);
    siblings.push(levels[d][siblingIdx]);
    idx = idx >> 1;
  }
  const root = levels[MAX_DEPTH][0];
  return {
    root,
    rootHex: fieldToHex(root),
    indices,
    siblings,
    siblingsHex: siblings.map((s) => fieldToHex(s)),
  };
}

/** Append entry to stored list and return new leaf index and proof. */
export async function appendEntryAndGetProof(
  entry: bigint,
): Promise<{ leafIndex: number; proof: MerkleProof }> {
  const entries = getStoredEntries();
  const leafIndex = entries.length;
  entries.push(entry);
  storeEntries(entries);
  const proof = await getMerkleProof(entries, leafIndex);
  return { leafIndex, proof };
}
