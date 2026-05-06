import { NextResponse } from "next/server";
import { HexString } from "@evvm/evvm-js";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chain/arcTestnet";

export const runtime = "nodejs";

const REGISTER_ROOT_ABI = parseAbi(["function registerRoot(bytes32 root)"]);

interface IRequestBody {
  root: string;
}

export async function POST(request: Request) {
  try {
    const pk = process.env.FISHER_PRIVATE_KEY;
    if (!pk) {
      return NextResponse.json(
        { success: false, error: "FISHER_PRIVATE_KEY not configured" },
        { status: 500 },
      );
    }

    const account = privateKeyToAccount(pk as HexString);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    const { root } = (await request.json()) as IRequestBody;
    if (!root || typeof root !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid root parameter" },
        { status: 400 },
      );
    }

    const shieldPoolAddress = process.env.NEXT_PUBLIC_ZKVAULT_ADDRESS;
    if (!shieldPoolAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing NEXT_PUBLIC_ZKVAULT_ADDRESS env variable",
        },
        { status: 500 },
      );
    }

    const tx = await client.writeContract({
      address: shieldPoolAddress as HexString,
      abi: REGISTER_ROOT_ABI,
      functionName: "registerRoot",
      args: [root as `0x${string}`],
    });

    return NextResponse.json({
      success: true,
      data: tx,
    });
  } catch (error) {
    console.error("Register root failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
