import { useMemo } from "react";
import { useEffect, useState } from "react";
import {
  Core,
  HexString,
  type ISigner,
  createSignerWithViem,
} from "@evvm/evvm-js";
import { useAccount, useWalletClient } from "wagmi";
import { ZkVaultService } from "@/lib/service/zkVaultService";

const CHAIN_ID = 5042002;
const EVVM_ADDRESS = process.env.NEXT_PUBLIC_EVVM_CORE_ADDRESS;
const ZKVAULT_ADDRESS = process.env.NEXT_PUBLIC_ZKVAULT_ADDRESS;

export const useEvvm = () => {
  const account = useAccount();
  const walletClient = useWalletClient();
  const [signer, setSigner] = useState<ISigner | null>(null);
  const [core, setCore] = useState<Core | null>(null);

  useEffect(() => {
    const setupEvvm = async () => {
      console.log({
        isConnected: account.isConnected,
        walletClient: walletClient.data,
      });
      if (!EVVM_ADDRESS)
        throw new Error(
          "EVVM_ADDRESS is not defined. Please set NEXT_PUBLIC_EVVM_CORE_ADDRESS in your environment variables.",
        );
      if (!account.isConnected || !walletClient.data) return;

      // setup signer
      const _signer = await createSignerWithViem(walletClient.data as any);
      setSigner(_signer);

      // setup core
      setCore(
        new Core({
          signer: _signer,
          address: EVVM_ADDRESS as HexString,
          chainId: Number(CHAIN_ID),
        }),
      );

      console.log("[useEvvm]: Core and signer creted!");
    };
    void setupEvvm();
  }, [account.isConnected, walletClient.data]);

  const zkVault = useMemo(
    () =>
      core && signer
        ? new ZkVaultService({
            signer,
            address: ZKVAULT_ADDRESS as HexString,
            chainId: core.chainId,
          })
        : null,
    [core, signer],
  );

  const ready = useMemo(
    () => core && zkVault && signer,
    [core, zkVault, signer],
  );

  return {
    core,
    zkVault,
    signer,
    ready,
  };
};
