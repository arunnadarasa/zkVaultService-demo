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

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
      body: JSON.stringify({
        sessionId: "c3dc23",
        runId: "split-pre",
        hypothesisId: "E",
        location: "fisher/route.ts:POST:pk",
        message: "Fisher route received request",
        data: { hasPk: Boolean(pk), pkLen: typeof pk === "string" ? pk.length : null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const account = privateKeyToAccount(pk as HexString);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    // @ts-ignore
    const signer = await createSignerWithViem(client);
    const payload = (await request.json()) as IPayload;

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
      body: JSON.stringify({
        sessionId: "c3dc23",
        runId: "split-pre",
        hypothesisId: "E",
        location: "fisher/route.ts:POST:execute:start",
        message: "About to execute signed action",
        data: {
          hasSignedAction: Boolean(payload?.signedAction),
          signedActionKeys: payload?.signedAction ? Object.keys(payload.signedAction).slice(0, 10) : null,
          functionName: payload?.signedAction?.functionName ?? null,
          contractAddress:
            typeof payload?.signedAction?.contractAddress === "string"
              ? payload.signedAction.contractAddress
              : null,
          dataPrefix:
            typeof payload?.signedAction?.data === "string"
              ? payload.signedAction.data.slice(0, 14)
              : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const txHash = await execute(signer, payload.signedAction);

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
      body: JSON.stringify({
        sessionId: "c3dc23",
        runId: "split-pre",
        hypothesisId: "E",
        location: "fisher/route.ts:POST:execute:ok",
        message: "Executed signed action",
        data: { txHashPrefix: typeof txHash === "string" ? txHash.slice(0, 10) : null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
      body: JSON.stringify({
        sessionId: "c3dc23",
        runId: "split-pre",
        hypothesisId: "E",
        location: "fisher/route.ts:POST:catch",
        message: "Fisher route failed",
        data: {
          message: error instanceof Error ? error.message.slice(0, 250) : String(error).slice(0, 250),
          normalizedError: typeof normalizedError === "string" ? normalizedError.slice(0, 250) : null,
          actionFunction: maybeError?.metaMessages?.find?.((x: unknown) =>
            typeof x === "string" ? x.includes("contract function") : false,
          ),
          revertDataPrefix: typeof revertData === "string" ? revertData.slice(0, 66) : null,
          decodedRevertName: decodedRevert?.errorName ?? null,
          decodedRevertArgs:
            Array.isArray(decodedRevert?.args) && decodedRevert.args.length > 0
              ? decodedRevert.args.slice(0, 3)
              : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
