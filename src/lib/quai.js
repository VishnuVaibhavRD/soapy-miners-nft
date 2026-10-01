import { quais } from "quais";

import {
  SOAPPY_MINERS_ABI,
} from "@/contracts/SoapyMinersABI";

const DEFAULT_ORCHARD_RPC =
  "https://orchard.rpc.quai.network";

export function getRpcUrl() {
  return (
    process.env.NEXT_PUBLIC_QUAI_RPC_URL ||
    DEFAULT_ORCHARD_RPC
  );
}

export function getContractAddress() {
  const address =
    process.env.NEXT_PUBLIC_SOAPY_MINERS_CONTRACT;

  if (!address) {
    throw new Error(
      "Soapy Miners contract address is not configured."
    );
  }

  return address;
}

export function hasPelagus() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.pelagus);
}

export async function connectAdminWallet() {
  if (!hasPelagus()) {
    throw new Error(
      "Pelagus wallet is not installed."
    );
  }

  const provider =
    new quais.BrowserProvider(
      window.pelagus
    );

  // Ask the wallet for permission.
  await provider.send(
    "quai_requestAccounts",
    []
  );

  const signer =
    await provider.getSigner();

  const address =
    await signer.getAddress();

  return {
    provider,
    signer,
    address,
  };
}

export function getReadProvider() {
  return new quais.JsonRpcProvider(
    getRpcUrl(),
    undefined,
    {
      usePathing: true,
    }
  );
}

export function getReadContract(provider) {
  const readProvider =
    provider || getReadProvider();

  return new quais.Contract(
    getContractAddress(),
    SOAPPY_MINERS_ABI,
    readProvider
  );
}

export async function getAdminContract() {
  const {
    signer,
    address,
    provider,
  } = await connectAdminWallet();

  const contract =
    new quais.Contract(
      getContractAddress(),
      SOAPPY_MINERS_ABI,
      signer
    );

  return {
    contract,
    signer,
    address,
    provider,
  };
}
