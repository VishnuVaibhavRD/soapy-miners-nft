"use client";

import {
  useEffect,
  useState,
} from "react";

import { quais } from "quais";

import {
  getReadContract,
} from "@/lib/quai";

import {
  loadDashboardStats,
} from "@/lib/collection";

export default function AdminDashboard() {
  const [stats, setStats] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getReadContract();

      const data =
        await loadDashboardStats(
          contract
        );

      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="text-[#9f9b83]">
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-red-300">
        {error ||
          "Failed to load dashboard."}
      </div>
    );
  }

  const topStats = [
    {
      label: "Total Supply",
      value: stats.maxSupply,
    },
    {
      label: "Public Allocation",
      value: stats.publicAllocation,
    },
    {
      label: "Reserved",
      value: stats.reservedAllocation,
    },
    {
      label: "Mint Price",
      value: `${quais.formatQuai(
        stats.mintPrice
      )} QUAI`,
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Collection Dashboard
          </h2>

          <p className="mt-2 text-[#9f9b83]">
            Manage Soapy Miners NFTs, releases and mint settings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-5"
          >
            <p className="text-sm text-[#9f9b83]">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-bold">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Collection Status
          </h3>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="Registered NFTs"
              value={`${stats.registered} / ${stats.maxSupply}`}
            />

            <Row
              label="Pending Release"
              value={stats.pendingRelease}
            />

            <Row
              label="Available NFTs"
              value={stats.available}
            />

            <Row
              label="Total Minted"
              value={`${stats.totalMinted} / ${stats.maxSupply}`}
            />

            <Row
              label="Public Minted"
              value={`${stats.publicMinted} / ${stats.publicAllocation}`}
            />

            <Row
              label="Reserved Minted"
              value={`${stats.reservedMinted} / ${stats.reservedAllocation}`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <h3 className="text-lg font-semibold">
            Mint Status
          </h3>

          <div className="mt-5">
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                stats.mintEnabled
                  ? "bg-green-950 text-green-300"
                  : "bg-red-950 text-red-300"
              }`}
            >
              {stats.mintEnabled
                ? "Public Mint Open"
                : "Public Mint Paused"}
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="Mint Price"
              value={`${quais.formatQuai(
                stats.mintPrice
              )} QUAI`}
            />

            <Row
              label="Public Remaining"
              value={
                stats.publicAllocation -
                stats.publicMinted
              }
            />

            <Row
              label="Reserved Remaining"
              value={
                stats.reservedAllocation -
                stats.reservedMinted
              }
            />

            <Row
              label="Contract Balance"
              value={`${quais.formatQuai(
                stats.contractBalance
              )} QUAI`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[#9f9b83]">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}
