"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  connectAdminWallet,
  getReadContract,
} from "@/lib/quai";

export default function AdminGuard({
  children,
}) {
  const [status, setStatus] =
    useState("checking");

  const [error, setError] =
    useState("");

  async function verifyAdmin() {
    try {
      setStatus(
        "checking"
      );

      setError("");

      if (
        typeof window ===
          "undefined" ||
        !window.pelagus
      ) {
        setStatus(
          "wallet-required"
        );

        return;
      }

      const wallet =
        await connectAdminWallet();

      const contract =
        getReadContract();

      const owner =
        await contract.owner();

      const matches =
        owner.toLowerCase() ===
        wallet.address.toLowerCase();

      if (!matches) {
        setStatus(
          "denied"
        );

        return;
      }

      setStatus(
        "authorized"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Admin verification failed."
      );

      setStatus(
        "error"
      );
    }
  }

  useEffect(() => {
    verifyAdmin();
  }, []);

  if (
    status ===
    "checking"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0b] text-[#f5f0d7]">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Verifying Admin Wallet
          </p>

          <p className="mt-2 text-sm text-[#9f9b83]">
            Checking Soapy Miners contract ownership...
          </p>
        </div>
      </div>
    );
  }

  if (
    status ===
    "wallet-required"
  ) {
    return (
      <AdminAccessScreen
        title="Admin Wallet Required"
        description="Connect the Soapy Miners admin wallet to continue."
        action={
          verifyAdmin
        }
        actionText="Connect Admin Wallet"
      />
    );
  }

  if (
    status ===
    "denied"
  ) {
    return (
      <AdminAccessScreen
        title="Access Denied"
        description="The connected wallet is not authorized to access the Soapy Miners admin panel."
      />
    );
  }

  if (
    status ===
    "error"
  ) {
    return (
      <AdminAccessScreen
        title="Verification Failed"
        description={
          error ||
          "Admin verification failed."
        }
        action={
          verifyAdmin
        }
        actionText="Retry"
      />
    );
  }

  return children;
}

function AdminAccessScreen({
  title,
  description,
  action,
  actionText,
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0b] px-6 text-[#f5f0d7]">
      <div className="max-w-md text-center">
        <div className="mb-6 text-5xl">
          ⛏
        </div>

        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        <p className="mt-4 text-[#9f9b83]">
          {description}
        </p>

        {action && (
          <button
            type="button"
            onClick={
              action
            }
            className="mt-8 rounded-lg bg-[#e4c657] px-6 py-3 font-semibold text-black"
          >
            {actionText}
          </button>
        )}

        <Link
          href="/"
          className="mt-5 block text-sm text-[#9f9b83]"
        >
          Return to Soapy Miners
        </Link>
      </div>
    </div>
  );
}
