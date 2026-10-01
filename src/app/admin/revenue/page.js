"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { quais } from "quais";

import {
  getAdminContract,
  getContractAddress,
  getReadContract,
} from "@/lib/quai";

function shortenAddress(address) {
  if (!address) return "";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function RevenuePage() {
  const [balance, setBalance] =
    useState("0");

  const [mintPrice, setMintPrice] =
    useState("0");

  const [publicMinted, setPublicMinted] =
    useState(0);

  const [ownerAddress, setOwnerAddress] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const estimatedGrossRevenue =
    useMemo(() => {
      const price =
        Number(mintPrice);

      if (
        !Number.isFinite(price) ||
        publicMinted <= 0
      ) {
        return "0";
      }

      return String(
        price * publicMinted
      );
    }, [
      mintPrice,
      publicMinted,
    ]);

  async function loadRevenueData() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getReadContract();

      const contractAddress =
        getContractAddress();

      const provider =
        contract.runner;

      const [
        rawBalance,
        rawMintPrice,
        minted,
        owner,
      ] =
        await Promise.all([
          provider.getBalance(
            contractAddress
          ),

          contract.mintPrice(),

          contract.publicMinted(),

          contract.owner(),
        ]);

      setBalance(
        quais.formatQuai(
          rawBalance
        )
      );

      setMintPrice(
        quais.formatQuai(
          rawMintPrice
        )
      );

      setPublicMinted(
        Number(minted)
      );

      setOwnerAddress(
        owner
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load revenue data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenueData();
  }, []);

  async function handleWithdraw() {
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

      const currentBalance =
        Number(balance);

      if (
        !Number.isFinite(
          currentBalance
        ) ||
        currentBalance <= 0
      ) {
        throw new Error(
          "There is no QUAI available to withdraw."
        );
      }

      const confirmed =
        window.confirm(
          `Withdraw ${balance} QUAI to the admin wallet?\n\n${owner}`
        );

      if (!confirmed) {
        return;
      }

      const transaction =
        await contract.withdraw();

      setMessage(
        "Withdrawal transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setMessage(
        `${balance} QUAI withdrawn successfully to the admin wallet.`
      );

      await loadRevenueData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Withdrawal failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="text-[#9f9b83]">
        Loading revenue data...
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">
            Revenue
          </h2>

          <p className="mt-2 text-[#9f9b83]">
            View contract balance and withdraw mint revenue.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadRevenueData
          }
          disabled={
            loading ||
            processing
          }
          className="rounded-lg border border-[#3a392f] px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Contract Balance"
          value={`${balance} QUAI`}
          highlight
        />

        <Stat
          label="Current Mint Price"
          value={`${mintPrice} QUAI`}
        />

        <Stat
          label="Public Minted"
          value={`${publicMinted} / 235`}
        />

        <Stat
          label="Est. Gross Mint Revenue"
          value={`${estimatedGrossRevenue} QUAI`}
          hint="Informational only — uses current price × public minted"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Contract Treasury
          </h3>

          <p className="mt-2 text-sm text-[#9f9b83]">
            Mint payments remain inside the NFT contract until the admin withdraws them.
            Contract balance is the real withdrawable amount.
          </p>

          <div className="mt-8">
            <p className="text-sm text-[#9f9b83]">
              Withdrawable Balance
            </p>

            <p className="mt-2 text-5xl font-bold">
              {balance}
            </p>

            <p className="mt-1 text-lg text-[#9f9b83]">
              QUAI
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleWithdraw
            }
            disabled={
              processing ||
              Number(balance) <= 0
            }
            className="mt-8 rounded-lg bg-[#e4c657] px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processing
              ? "Waiting for Wallet..."
              : "Withdraw to Admin Wallet"}
          </button>
        </section>

        <aside className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Admin Wallet
          </h3>

          <p className="mt-5 text-xs text-[#777462]">
            Contract Owner
          </p>

          <p
            className="mt-2 font-mono text-sm"
            title={ownerAddress}
          >
            {ownerAddress ||
              "—"}
          </p>

          <p className="mt-1 font-mono text-xs text-[#777462]">
            {shortenAddress(
              ownerAddress
            )}
          </p>

          <p className="mt-6 text-sm text-[#9f9b83]">
            All withdrawals are sent directly to this wallet by the smart contract.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  hint,
}) {
  return (
    <div
      className={`rounded-xl border bg-[#1d1d18] p-5 ${
        highlight
          ? "border-[#5c5430]"
          : "border-[#3a392f]"
      }`}
    >
      <p className="text-sm text-[#9f9b83]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      {hint && (
        <p className="mt-2 text-xs text-[#777462]">
          {hint}
        </p>
      )}
    </div>
  );
}
