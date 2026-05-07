import { NextResponse } from "next/server";
import {
  HexString,
  ISerializableSignedAction,
  createSignerWithViem,
  execute,
} from "@evvm/evvm-js";
import { createWalletClient, decodeErrorResult, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chain/arcTestnet";
import zkVaultABI from "@/lib/service/zkVaultABI.json";

export const runtime = "nodejs";

interface IPayload {
  signedAction: ISerializableSignedAction<any>;
}

export async function POST(request: Request) {
  try {
    const pk = process.env.FISHER_PRIVATE_KEY;

    const account = privateKeyToAccount(pk as HexString);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    // @ts-ignore
    const signer = await createSignerWithViem(client);
    const payload = (await request.json()) as IPayload;

    const txHash = await execute(signer, payload.signedAction);

    return NextResponse.json({
      success: true,
      data: txHash,
    });
  } catch (error) {
    const maybeError = error as any;
    const serializedError = JSON.stringify(
      error,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
    const revertDataCandidates = [
      maybeError?.raw,
      maybeError?.data,
      maybeError?.cause?.data,
      maybeError?.cause?.raw,
      maybeError?.cause?.cause?.data,
      maybeError?.cause?.cause?.raw,
      maybeError?.details,
      maybeError?.cause?.details,
      maybeError?.shortMessage,
      maybeError?.cause?.shortMessage,
      serializedError,
      error instanceof Error ? error.message : String(error),
    ];
    const revertData = revertDataCandidates
      .flatMap((v) => (typeof v === "string" ? v.match(/0x[a-fA-F0-9]{8,}/g) ?? [] : []))
      .sort((a, b) => b.length - a.length)[0] ?? null;
    let decodedRevert: { errorName: string; args?: unknown[] } | null = null;
    try {
      if (revertData) {
        const decoded = decodeErrorResult({
          abi: zkVaultABI.abi as any,
          data: revertData as HexString,
        });
        decodedRevert = {
          errorName: decoded.errorName,
          args: Array.isArray(decoded.args)
            ? decoded.args.map((x) => (typeof x === "bigint" ? x.toString() : x))
            : undefined,
        };
      }
    } catch {
      decodedRevert = null;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown proof generation error";
    const normalizedError = errorMessage.includes("0xf4d678b8")
      ? "Insufficient EVVM balance for deposit payment (selector 0xf4d678b8: InsufficientBalance). Fund EVVM balance first."
      : decodedRevert?.errorName === "ProofLengthWrongWithLogN" &&
          Array.isArray(decodedRevert.args) &&
          decodedRevert.args.length === 3
        ? `Proof length mismatch (ProofLengthWrongWithLogN): logN=${decodedRevert.args[0]}, actualLength=${decodedRevert.args[1]}, expectedLength=${decodedRevert.args[2]}. Your deployed verifier and frontend Noir artifacts are from different builds.`
      : errorMessage.includes("ProofLengthWrongWithLogN") ||
          errorMessage.includes("0x59895a53")
        ? "Proof length mismatch between the app's Noir circuit/prover and the on-chain verifier. This usually means the deployed verifier was generated from a different circuit build than the one your frontend is using."
        : errorMessage;

    console.error("Fisher route failed: ", error);
    return NextResponse.json(
      {
        success: false,
        error: normalizedError,
      },
      { status: 500 },
    );
  }
}
