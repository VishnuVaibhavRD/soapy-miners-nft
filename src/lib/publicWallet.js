import { quais } from "quais";

import {
  SOAPPY_MINERS_ABI,
} from "@/contracts/SoapyMinersABI";

export function getSoapyContractAddress() {
  const address =
    process.env.NEXT_PUBLIC_SOAPY_MINERS_CONTRACT;

  if (!address) {
    throw new Error(
      "Soapy Miners contract address is not configured."
    );
  }

  return address;
}

export async function connectWallet() {
  if (
    typeof window === "undefined" ||
    !window.pelagus
  ) {
    throw new Error(
      "Pelagus wallet is required."
    );
  }

  const provider =
    new quais.BrowserProvider(
      window.pelagus
    );

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

export async function getMintContract() {
  const {
    signer,
    address,
  } = await connectWallet();

  const contract =
    new quais.Contract(
      getSoapyContractAddress(),
      SOAPPY_MINERS_ABI,
      signer
    );

  return {
    contract,
    address,
    signer,
  };
}
