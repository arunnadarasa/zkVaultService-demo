import { EncodedNote } from "@/types/encodedNote.types";
import circuitManifest from "./generated/circuitManifest";
import { normalizeProof, normalizePublicInputs } from "./serialize";
import type {
  CircuitName,
  NoirInputMap,
  ProofRequest,
  ProofResponse,
} from "./types";
import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { HexString } from "@evvm/evvm-js";
import { toast } from "sonner";
import { buildWithdrawInputs } from "../shielded/withdrawInputs";

let browserApiPromise: Promise<Barretenberg> | undefined;

const getBrowserApi = () => {
  browserApiPromise ??= Barretenberg.new({
    threads:
      typeof navigator === "undefined"
        ? 4
        : Math.max(
            1,
            Math.min(8, Math.floor((navigator.hardwareConcurrency || 4) / 2)),
          ),
  });

  return browserApiPromise;
};

export const getCircuit = (circuitName: CircuitName) => {
  const circuit = circuitManifest[circuitName];
  if (!circuit) {
    throw new Error(`Unknown circuit: ${circuitName}`);
  }

  return circuit;
};

export async function proveWithApi<TInputs extends NoirInputMap>(
  request: ProofRequest<TInputs>,
  api: Barretenberg,
  mode: "browser" | "server",
): Promise<ProofResponse> {
  const circuit = getCircuit(request.circuitName);
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode, api);
  const { witness } = await noir.execute(request.inputs);
  const proofSettings = { verifierTarget: "evm" as const };
  const { proof, publicInputs } = await backend.generateProof(
    witness,
    proofSettings,
  );
  const verified = await backend.verifyProof(
    { proof, publicInputs },
    proofSettings,
  );

  return {
    circuitName: request.circuitName,
    proof: normalizeProof(proof),
    publicInputs: normalizePublicInputs(publicInputs),
    verified,
    backend: circuit.backend,
    noirVersion: circuit.noirVersion,
    proofFlavor: circuit.proofFlavor,
    mode,
  };
}

export const proveInBrowser = async <TInputs extends NoirInputMap>(
  request: ProofRequest<TInputs>,
): Promise<ProofResponse> => {
  const api = await getBrowserApi();
  return proveWithApi(request, api, "browser");
};

export const generateWithdrawProof = async (
  note: EncodedNote,
  address: HexString,
) => {
  if (!note.merkleRoot) {
    toast.error(
      "This note doesn't have a Merkle proof. Make a new deposit from this app.",
    );
    return;
  }
  const notifId = toast.loading(`Generating proof...`);
  try {
    const inputs = await buildWithdrawInputs(note, address as HexString);
    const result = await proveInBrowser({
      circuitName: "WithdrawFromPool",
      inputs,
      mode: "browser",
    });
    toast.success(
      result.verified ? "Proof generated and verified" : "Proof generated",
    );
    return result;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Error generating proof");
  } finally {
    toast.dismiss(notifId);
  }
};
