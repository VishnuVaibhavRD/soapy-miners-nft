"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getReadContract,
} from "@/lib/quai";

import {
  ipfsToGateway,
} from "@/lib/ipfs";

import {
  scanAllMiners,
  summarizeCollection,
} from "@/lib/collection";

const STATUS_FILTERS = [
  "ALL",
  "REGISTERED",
  "AVAILABLE",
  "MINTED",
];

const STATUS_STYLES = {
  REGISTERED:
    "bg-amber-950 text-amber-300",
  AVAILABLE:
    "bg-green-950 text-green-300",
  MINTED:
    "bg-blue-950 text-blue-300",
};

export default function NFTLibraryPage() {
  const [miners, setMiners] =
    useState([]);

  const [filter, setFilter] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadLibrary() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getReadContract();

      await scanAllMiners(
        contract,
        {
          fetchMetadata: true,
          registeredOnly: true,
          onBatch: (batch) => {
            setMiners(batch);
          },
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load NFT library."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const summary =
    useMemo(
      () =>
        summarizeCollection(
          miners
        ),
      [miners]
    );

  const filteredMiners =
    useMemo(() => {
      const sorted = [
        ...miners,
      ].sort(
        (a, b) =>
          a.tokenId -
          b.tokenId
      );

      if (filter === "ALL") {
        return sorted;
      }

      return sorted.filter(
        (miner) =>
          miner.status ===
          filter
      );
    }, [miners, filter]);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">
            NFT Library
          </h2>

          <p className="mt-2 text-[#9f9b83]">
            View registered and minted Soapy Miners.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLibrary}
          disabled={loading}
          className="rounded-lg border border-[#3a392f] px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Registered"
          value={summary.registered}
        />

        <SummaryCard
          label="Pending Release"
          value={summary.pendingRelease}
        />

        <SummaryCard
          label="Available"
          value={summary.available}
        />

        <SummaryCard
          label="Minted"
          value={summary.minted}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setFilter(status)
              }
              className={`rounded-lg px-4 py-2 text-sm ${
                filter === status
                  ? "bg-[#e4c657] font-semibold text-black"
                  : "border border-[#3a392f]"
              }`}
            >
              {status === "ALL"
                ? "All"
                : status.charAt(0) +
                  status
                    .slice(1)
                    .toLowerCase()}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">
          {error}
        </div>
      )}

      {loading &&
      miners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#3a392f] p-12 text-center text-[#9f9b83]">
          Loading NFT library...
        </div>
      ) : filteredMiners.length ===
        0 ? (
        <div className="rounded-xl border border-dashed border-[#3a392f] p-12 text-center">
          <p className="text-lg">
            No Soapy Miners match this filter.
          </p>

          <p className="mt-2 text-sm text-[#9f9b83]">
            Upload and register NFTs from the Upload NFT section.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
          {filteredMiners.map(
            (miner) => (
              <MinerCard
                key={
                  miner.tokenId
                }
                miner={miner}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-4">
      <p className="text-xs text-[#9f9b83]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function MinerCard({ miner }) {
  const name =
    miner.metadata?.name ||
    `Soapy Miner #${miner.tokenId}`;

  const image =
    ipfsToGateway(
      miner.metadata?.image
    );

  return (
    <article className="overflow-hidden rounded-xl border border-[#3a392f] bg-[#1d1d18]">
      <div className="aspect-square bg-[#0b0b09]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover [image-rendering:pixelated]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#777462]">
            Image unavailable
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#777462]">
              TOKEN #{miner.tokenId}
            </p>

            <h3 className="mt-1 font-semibold">
              {name}
            </h3>
          </div>

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              STATUS_STYLES[
                miner.status
              ] ||
              "bg-[#2a2922]"
            }`}
          >
            {miner.status}
          </span>
        </div>

        <p className="mt-3 truncate font-mono text-xs text-[#777462]">
          {miner.metadataURI ||
            "No metadata URI"}
        </p>
      </div>
    </article>
  );
}
