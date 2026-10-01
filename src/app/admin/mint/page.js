"use client";

import {
  useEffect,
  useState,
} from "react";

import { quais } from "quais";

import {
  getAdminContract,
  getReadContract,
} from "@/lib/quai";

export default function MintControlsPage() {
  const [price, setPrice] =
    useState("");

  const [currentPrice, setCurrentPrice] =
    useState("0");

  const [enabled, setEnabled] =
    useState(false);

  const [publicMinted, setPublicMinted] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadState() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getReadContract();

      const [
        rawPrice,
        mintEnabled,
        minted,
      ] =
        await Promise.all([
          contract.mintPrice(),
          contract.publicMintEnabled(),
          contract.publicMinted(),
        ]);

      const formattedPrice =
        quais.formatQuai(
          rawPrice
        );

      setCurrentPrice(
        formattedPrice
      );

      setPrice(
        formattedPrice
      );

      setEnabled(
        mintEnabled
      );

      setPublicMinted(
        Number(minted)
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to read contract."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadState();
  }, []);

  async function updatePrice() {
    try {
      setProcessing(true);
      setError("");
      setMessage("");

      if (
        !price ||
        Number(price) <= 0
      ) {
        throw new Error(
          "Enter a valid QUAI price."
        );
      }

      const {
        contract,
        address,
      } =
        await getAdminContract();

      const owner =
        await contract.owner();

      if (
        owner.toLowerCase() !==
        address.toLowerCase()
      ) {
        throw new Error(
          "Connected wallet is not the contract owner."
        );
      }

      const newPrice =
        quais.parseQuai(
          price
        );

      const transaction =
        await contract.setMintPrice(
          newPrice
        );

      setMessage(
        "Waiting for price update confirmation..."
      );

      await transaction.wait();

      setMessage(
        `Mint price updated to ${price} QUAI.`
      );

      await loadState();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Price update failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function toggleMint() {
    try {
      setProcessing(true);
      setError("");
      setMessage("");

      const {
        contract,
        address,
      } =
        await getAdminContract();

      const owner =
        await contract.owner();

      if (
        owner.toLowerCase() !==
        address.toLowerCase()
      ) {
        throw new Error(
          "Connected wallet is not the contract owner."
        );
      }

      const newState =
        !enabled;

      const transaction =
        await contract.setPublicMintEnabled(
          newState
        );

      setMessage(
        "Waiting for transaction confirmation..."
      );

      await transaction.wait();

      setMessage(
        newState
          ? "Public mint is now OPEN."
          : "Public mint is now PAUSED."
      );

      await loadState();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Mint control update failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div>
        Loading mint controls...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">
          Mint Controls
        </h2>

        <p className="mt-2 text-[#9f9b83]">
          Control the public Soapy Miners sale.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Mint Price"
          value={`${currentPrice} QUAI`}
        />

        <Stat
          label="Public Minted"
          value={`${publicMinted} / 235`}
        />

        <Stat
          label="Mint Status"
          value={
            enabled
              ? "OPEN"
              : "PAUSED"
          }
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 rounded-lg border border-green-900 bg-green-950/30 p-4 text-green-300">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Mint Price
          </h3>

          <p className="mt-2 text-sm text-[#9f9b83]">
            Current:
            {" "}
            {currentPrice} QUAI
          </p>

          <div className="mt-5 flex gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              className="flex-1 rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3"
            />

            <button
              type="button"
              onClick={
                updatePrice
              }
              disabled={
                processing
              }
              className="rounded-lg bg-[#e4c657] px-6 font-semibold text-black disabled:opacity-50"
            >
              Update Price
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Public Mint
          </h3>

          <div className="mt-4">
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                enabled
                  ? "bg-green-950 text-green-300"
                  : "bg-red-950 text-red-300"
              }`}
            >
              {enabled
                ? "OPEN"
                : "PAUSED"}
            </span>
          </div>

          <button
            type="button"
            onClick={
              toggleMint
            }
            disabled={
              processing
            }
            className="mt-6 rounded-lg border border-[#e4c657] px-5 py-3 disabled:opacity-50"
          >
            {enabled
              ? "Pause Public Mint"
              : "Open Public Mint"}
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-5">
      <p className="text-sm text-[#9f9b83]">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}
