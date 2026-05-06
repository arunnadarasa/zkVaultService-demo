import { NextResponse } from "next/server";
import { HexString } from "@evvm/evvm-js";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chain/arcTestnet";

export const runtime = "nodejs";

const CORE_ABI = parseAbi([
  "function addBalance(address user, address token, uint256 quantity)",
]);

interface IRequestBody {
  userAddress: HexString;
  amount: string;
}

export async function POST(request: Request) {
  try {
    const pk = process.env.FISHER_PRIVATE_KEY;
    const coreAddress = process.env.NEXT_PUBLIC_EVVM_CORE_ADDRESS;
    const tokenAddress = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS;

    if (!pk) {
      return NextResponse.json(
        { success: false, error: "FISHER_PRIVATE_KEY not configured" },
        { status: 500 },
      );
    }
    if (!coreAddress || !tokenAddress) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NEXT_PUBLIC_EVVM_CORE_ADDRESS or NEXT_PUBLIC_USDC_TOKEN_ADDRESS not configured",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as IRequestBody;
    if (!body?.userAddress || !body?.amount) {
      return NextResponse.json(
        { success: false, error: "Missing userAddress or amount" },
        { status: 400 },
      );
    }

    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    const account = privateKeyToAccount(pk as HexString);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    const txHash = await client.writeContract({
      address: coreAddress as HexString,
      abi: CORE_ABI,
      functionName: "addBalance",
      args: [body.userAddress, tokenAddress as HexString, amount],
    });

    return NextResponse.json({
      success: true,
      data: txHash,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown funding error",
      },
      { status: 500 },
    );
  }
}

