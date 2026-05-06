import { NextResponse } from "next/server";
import {
  HexString,
  ISerializableSignedAction,
  createSignerWithViem,
  execute,
} from "@evvm/evvm-js";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chain/arcTestnet";

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
    console.error("Fisher route failed: ", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown proof generation error",
      },
      { status: 500 },
    );
  }
}
