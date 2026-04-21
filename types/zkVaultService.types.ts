import { HexString } from "@evvm/evvm-js";

export interface IDepositData {
  from: HexString;
  amount: bigint;
  commitment: string;
  senderExecutor?: HexString;
  originExecutor?: HexString;
  nonce: bigint;
  signature: string;
  priorityFeePay?: bigint;
  noncePay: bigint;
  signaturePay: string;
}

export interface ITransferIntentData {
  from: HexString;
  expectedRoot: string;
  proof: string;
  nullifierIn: string;
  merkleProofLength: number;
  newCommitment: string;
  senderExecutor?: HexString;
  originExecutor?: HexString;
  nonce: bigint;
  signature: string;
}

export interface ISplitData {
  from: HexString;

  expectedRoot: string;
  nullifierIn: string;
  merkleProofLength: number;
  newCommitment1: string;
  newCommitment2: string;
  newCommitment3: string;
  newCommitment4: string;
  proof: string;

  senderExecutor?: HexString;
  originExecutor?: HexString;
  nonce: bigint;
  signature: string;
}

export interface IWithdrawData {
  from: HexString;
  proof: HexString;
  publicInputs: HexString[];
  ciphertext: HexString;
  senderExecutor?: HexString;
  originExecutor?: HexString;
  nonce: bigint;
  signature: string;
}
