import { quais } from "quais";

import {
  SOAPPY_MINERS_ABI,
} from "@/contracts/SoapyMinersABI";

import { getRpcUrl } from "@/lib/quai";

export function getPublicReadContract() {
  const address =
    process.env.NEXT_PUBLIC_SOAPY_MINERS_CONTRACT;

  if (!address) {
    throw new Error(
      "Contract address is missing."
    );
  }

  const provider =
    new quais.JsonRpcProvider(
      getRpcUrl(),
      undefined,
      {
        usePathing: true,
      }
    );

  return new quais.Contract(
    address,
    SOAPPY_MINERS_ABI,
    provider
  );
}
