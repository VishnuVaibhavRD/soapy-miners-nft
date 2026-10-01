"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  scanAllMiners,
} from "@/lib/collection";

import {
  ipfsToGateway,
} from "@/lib/ipfs";

import {
  getAdminContract,
  getReadContract,
} from "@/lib/quai";

const RESERVED_ALLOCATION = 21;

export default function ReservedMintPage() {
  const [wallet, setWallet] =
    useState("");

  const [selectedTokenId, setSelectedTokenId] =
    useState("");

  const [availableNFTs, setAvailableNFTs] =
    useState([]);

  const [reservedMinted, setReservedMinted] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadReservedData() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getReadContract();

      const reserved =
        await contract.reservedMinted();

      setReservedMinted(
        Number(reserved)
      );

      const miners =
        await scanAllMiners(
          contract,
          {
            fetchMetadata: true,
            registeredOnly: true,
          }
        );

      const unmintedNFTs =
        miners
          .filter(
            (miner) =>
              !miner.minted &&
              miner.tokenId >= 236
          )
          .map(
            (miner) => ({
              tokenId:
                miner.tokenId,
              metadataURI:
                miner.metadataURI,
              metadata:
                miner.metadata,
            })
          )
          .sort(
            (a, b) =>
              a.tokenId -
              b.tokenId
          );

      setAvailableNFTs(
        unmintedNFTs
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reserved mint data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservedData();
  }, []);

  const selectedNFT =
    useMemo(
      () =>
        availableNFTs.find(
          (nft) =>
            String(
              nft.tokenId
            ) ===
            selectedTokenId
        ),
      [
        availableNFTs,
        selectedTokenId,
      ]
    );

  async function handleReservedMint() {
    try {
      setError("");
      setMessage("");

      if (!selectedTokenId) {
        throw new Error(
          "Select an NFT."
        );
      }

      if (!wallet.trim()) {
        throw new Error(
          "Recipient wallet is required."
        );
      }

      if (
        reservedMinted >=
        RESERVED_ALLOCATION
      ) {
        throw new Error(
          "Reserved allocation has been fully used."
        );
      }

      setProcessing(true);

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

      const tokenId =
        Number(
          selectedTokenId
        );

      const nft =
        await contract.getNFT(
          tokenId
        );

      if (!nft[0]) {
        throw new Error(
          "NFT is not registered."
        );
      }

      if (nft[2]) {
        throw new Error(
          "NFT has already been minted."
        );
      }

      const currentReserved =
        await contract.reservedMinted();

      if (
        Number(currentReserved) >=
        RESERVED_ALLOCATION
      ) {
        throw new Error(
          "Reserved allocation has been fully used."
        );
      }

      const transaction =
        await contract.reservedMint(
          wallet.trim(),
          tokenId
        );

      setMessage(
        "Reserved mint transaction submitted..."
      );

      await transaction.wait();

      setMessage(
        `Soapy Miner #${tokenId} minted successfully to ${wallet.trim()}.`
      );

      setWallet("");
      setSelectedTokenId("");

      await loadReservedData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Reserved mint failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  const remaining =
    Math.max(
      RESERVED_ALLOCATION -
        reservedMinted,
      0
    );

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">
            Reserved Mint
          </h2>

          <p className="mt-2 text-[#9f9b83]">
            Mint from the 21 NFT admin allocation.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadReservedData
          }
          disabled={loading}
          className="rounded-lg border border-[#3a392f] px-4 py-2 text-sm disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Reserved Allocation"
          value={RESERVED_ALLOCATION}
        />

        <Stat
          label="Reserved Minted"
          value={`${reservedMinted} / ${RESERVED_ALLOCATION}`}
        />

        <Stat
          label="Remaining"
          value={remaining}
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

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Select NFT
              </label>

              <select
                value={
                  selectedTokenId
                }
                onChange={(
                  event
                ) =>
                  setSelectedTokenId(
                    event.target
                      .value
                  )
                }
                disabled={
                  loading ||
                  remaining === 0
                }
                className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3 disabled:opacity-50"
              >
                <option value="">
                  {loading
                    ? "Loading registered NFTs..."
                    : "Select an unminted Soapy"}
                </option>

                {availableNFTs.map(
                  (nft) => (
                    <option
                      key={
                        nft.tokenId
                      }
                      value={
                        nft.tokenId
                      }
                    >
                      Soapy Miner #
                      {nft.tokenId}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Recipient Wallet
              </label>

              <input
                type="text"
                value={wallet}
                onChange={(
                  event
                ) =>
                  setWallet(
                    event.target
                      .value
                  )
                }
                placeholder="0x..."
                className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3"
              />
            </div>

            <div className="rounded-lg border border-[#3a392f] bg-[#11110f] p-4 text-sm text-[#9f9b83]">
              Reserved mint does not require the NFT to be publicly available.
              It only needs to be registered and unminted.
            </div>

            <button
              type="button"
              onClick={
                handleReservedMint
              }
              disabled={
                processing ||
                remaining === 0 ||
                loading
              }
              className="w-full rounded-lg bg-[#e4c657] px-6 py-3 font-semibold text-black disabled:opacity-50"
            >
              {processing
                ? "Waiting for Wallet..."
                : "Reserved Mint"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-5">
          <p className="mb-4 text-sm text-[#9f9b83]">
            Selected NFT
          </p>

          {!selectedNFT ? (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#3a392f] bg-[#11110f] text-sm text-[#777462]">
              Select an NFT
            </div>
          ) : (
            <>
              <div className="aspect-square overflow-hidden rounded-lg bg-[#11110f]">
                {selectedNFT
                  .metadata
                  ?.image ? (
                  <img
                    src={ipfsToGateway(
                      selectedNFT
                        .metadata
                        .image
                    )}
                    alt={
                      selectedNFT
                        .metadata
                        ?.name ||
                      `Soapy Miner #${selectedNFT.tokenId}`
                    }
                    className="h-full w-full object-cover [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#777462]">
                    Image unavailable
                  </div>
                )}
              </div>

              <p className="mt-4 font-semibold">
                {selectedNFT
                  .metadata
                  ?.name ||
                  `Soapy Miner #${selectedNFT.tokenId}`}
              </p>

              <p className="mt-1 text-xs text-[#777462]">
                TOKEN #
                {selectedNFT.tokenId}
              </p>
            </>
          )}
        </div>
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

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
