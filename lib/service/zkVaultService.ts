import {
  BaseService,
  HexString,
  IAbi,
  IBaseServiceProps,
  IPayData,
  SignMethod,
  SignedAction,
} from "@evvm/evvm-js";
import { zeroAddress } from "viem";
import {
  IDepositData,
  ISplitData,
  ITransferIntentData,
  IWithdrawData,
} from "@/types/zkVaultService.types";
import zkVaultABI from "./zkVaultABI.json";

export class ZkVaultService extends BaseService {
  constructor(props: Omit<IBaseServiceProps, "abi">) {
    super({ ...props, abi: zkVaultABI.abi as IAbi });
  }

  @SignMethod
  async deposit({
    amount,
    commitment,
    senderExecutor = zeroAddress,
    originExecutor = zeroAddress,
    nonce,
    paySignedAction,
  }: {
    amount: bigint;
    commitment: string;
    senderExecutor?: HexString;
    originExecutor?: HexString;
    nonce: bigint;
    paySignedAction: SignedAction<IPayData>;
  }): Promise<SignedAction<IDepositData>> {
    const evvmId = await this.getEvvmID();
    const functionName = "deposit";

    const hashPayload = this.buildHashPayload(functionName, {
      amount,
      commitment,
    });

    const message = this.buildMessageToSign(
      evvmId,
      senderExecutor,
      hashPayload,
      originExecutor,
      nonce,
      true,
    );
    const signature = await this.signer.signMessage(message);

    return new SignedAction(this, evvmId, functionName, {
      from: this.signer.address,
      amount,
      commitment,
      senderExecutor,
      originExecutor,
      nonce,
      signature,
      priorityFeePay: paySignedAction.data.priorityFee,
      noncePay: paySignedAction.data.nonce,
      signaturePay: paySignedAction.data.signature,
    });
  }

  @SignMethod
  async withdraw({
    recipient,
    proof,
    publicInputs,
    ciphertext,
    senderExecutor = zeroAddress,
    originExecutor = zeroAddress,
    nonce,
  }: {
    recipient: HexString;
    proof: HexString;
    publicInputs: HexString[];
    ciphertext: HexString;
    senderExecutor?: HexString;
    originExecutor?: HexString;
    nonce: bigint;
  }): Promise<SignedAction<IWithdrawData>> {
    const evvmId = await this.getEvvmID();
    const functionName = "withdraw";

    const hashPayload = this.buildHashPayload(
      functionName,
      {
        proof,
        recipient,
      },
      {
        customAbiParams: [
          { name: "recipient", type: "address", insertAfter: "proof" },
        ],
      },
    );

    const message = this.buildMessageToSign(
      evvmId,
      senderExecutor,
      hashPayload,
      originExecutor,
      nonce,
      true,
    );
    const signature = await this.signer.signMessage(message);

    return new SignedAction(this, evvmId, functionName, {
      from: this.signer.address,
      proof,
      publicInputs,
      ciphertext,
      senderExecutor,
      originExecutor,
      nonce,
      signature,
    });
  }

  @SignMethod
  async transferIntent({
    expectedRoot,
    proof,
    nullifierIn,
    merkleProofLength,
    newCommitment,
    senderExecutor = zeroAddress,
    originExecutor = zeroAddress,
    nonce,
    paySignedAction,
  }: {
    expectedRoot: string;
    proof: string;
    nullifierIn: string;
    merkleProofLength: number;
    newCommitment: string;
    senderExecutor?: HexString;
    originExecutor?: HexString;
    nonce: bigint;
    paySignedAction: SignedAction<IPayData>;
  }): Promise<SignedAction<ITransferIntentData>> {
    const evvmId = await this.getEvvmID();
    const functionName = "transferIntent";

    const hashPayload = this.buildHashPayload(functionName, {
      expectedRoot,
      proof,
      nullifierIn,
      merkleProofLength,
      newCommitment,
    });

    const message = this.buildMessageToSign(
      evvmId,
      senderExecutor,
      hashPayload,
      originExecutor,
      nonce,
      true,
    );
    const signature = await this.signer.signMessage(message);

    return new SignedAction(this, evvmId, functionName, {
      from: this.signer.address,
      expectedRoot,
      proof,
      nullifierIn,
      merkleProofLength,
      newCommitment,
      senderExecutor,
      originExecutor,
      nonce,
      signature,
      priorityFeePay: paySignedAction.data.priorityFee,
      noncePay: paySignedAction.data.nonce,
      signaturePay: paySignedAction.data.signature,
    });
  }

  @SignMethod
  async split({
    expectedRoot,
    nullifierIn,
    merkleProofLength,
    newCommitment1,
    newCommitment2,
    newCommitment3,
    newCommitment4,
    proof,
    senderExecutor = zeroAddress,
    originExecutor = zeroAddress,
    nonce,
  }: {
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
  }): Promise<SignedAction<ISplitData>> {
    const evvmId = await this.getEvvmID();
    const functionName = "split";

    const hashPayload = this.buildHashPayload(functionName, {
      nullifierIn,
      newCommitment1,
      newCommitment2,
      newCommitment3,
      newCommitment4,
    });

    const message = this.buildMessageToSign(
      evvmId,
      senderExecutor,
      hashPayload,
      originExecutor,
      nonce,
      true,
    );
    const signature = await this.signer.signMessage(message);

    return new SignedAction(this, evvmId, functionName, {
      from: this.signer.address,
      expectedRoot,
      nullifierIn,
      merkleProofLength,
      newCommitment1,
      newCommitment2,
      newCommitment3,
      newCommitment4,
      proof,
      senderExecutor,
      originExecutor,
      nonce,
      signature,
    });
  }
}
