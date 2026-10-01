"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  connectAdminWallet,
  getReadContract,
  hasPelagus,
} from "@/lib/quai";

function shortenAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AdminWallet() {
  const [mounted, setMounted] = useState(false);

  const [address, setAddress] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function connect() {
    try {
      setLoading(true);
      setError("");

      const wallet =
        await connectAdminWallet();

      const readContract =
        getReadContract(wallet.provider);

      const owner =
        await readContract.owner();

      const matches =
        owner.toLowerCase() ===
        wallet.address.toLowerCase();

      setAddress(wallet.address);
      setIsAdmin(matches);

      if (!matches) {
        setError(
          "Connected wallet is not the Soapy Miners admin wallet."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wallet connection failed."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.pelagus
    ) {
      return;
    }

    function handleAccountsChanged() {
      setAddress("");
      setIsAdmin(false);
      setError("");
    }

    window.pelagus.on?.(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.pelagus.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-lg border border-[#3a392f] px-4 py-3 text-sm text-[#9f9b83]">
        Checking wallet...
      </div>
    );
  }

  if (!hasPelagus()) {
    return (
      <div className="rounded-lg border border-[#3a392f] px-4 py-3 text-sm">
        Pelagus wallet required
      </div>
    );
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={loading}
        className="rounded-lg bg-[#e4c657] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading
          ? "Connecting..."
          : "Connect Admin Wallet"}
      </button>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3">
        <p className="text-xs text-[#9f9b83]">
          Connected Wallet
        </p>

        <p className="mt-1 font-mono text-sm">
          {shortenAddress(address)}
        </p>

        <p
          className={`mt-1 text-xs ${
            isAdmin
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {isAdmin
            ? "ADMIN VERIFIED"
            : "NOT ADMIN"}
        </p>
      </div>

      {error && (
        <p className="mt-2 max-w-xs text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
