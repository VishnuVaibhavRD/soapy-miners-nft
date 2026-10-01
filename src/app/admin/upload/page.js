"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { getAdminContract } from "@/lib/quai";

export default function UploadNFTPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [tokenId, setTokenId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState(
    "Soapy Miners NFT Collection on Quai Network."
  );

  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [txHash, setTxHash] = useState("");

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function resetOnChainState() {
    setRegistered(false);
    setTxHash("");
  }

  function handleTokenIdChange(event) {
    const value = event.target.value;

    setTokenId(value);
    resetOnChainState();

    if (value) {
      setName(`Soapy Miner #${value}`);
    }
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    setError("");
    setResult(null);
    resetOnChainState();

    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setResult(null);
    resetOnChainState();

    if (!image) {
      setError("Please select an NFT image.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter an NFT name.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("image", image);
      formData.append("tokenId", tokenId);
      formData.append("name", name.trim());
      formData.append(
        "description",
        description.trim()
      );

      const response = await fetch(
        "/api/pinata/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "NFT upload failed"
        );
      }

      setResult(data.nft);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setUploading(false);
    }
  }

  async function registerOnChain() {
    if (!result?.metadataURI) {
      setError(
        "Metadata URI is missing."
      );

      return;
    }

    const numericTokenId =
      Number(tokenId);

    if (
      !Number.isInteger(
        numericTokenId
      ) ||
      numericTokenId < 1 ||
      numericTokenId > 256
    ) {
      setError(
        "Token ID must be between 1 and 256."
      );

      return;
    }

    try {
      setRegistering(true);
      setError("");
      setTxHash("");

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

      const existing =
        await contract.getNFT(
          numericTokenId
        );

      if (existing[0]) {
        throw new Error(
          `Token #${numericTokenId} is already registered.`
        );
      }

      const metadataUsed =
        await contract.isMetadataUsed(
          result.metadataURI
        );

      if (metadataUsed) {
        throw new Error(
          "This metadata URI has already been registered."
        );
      }

      const transaction =
        numericTokenId >= 236
          ? await contract.registerReservedNFT(
              numericTokenId,
              result.metadataURI
            )
          : await contract.registerNFT(
              numericTokenId,
              result.metadataURI
            );

      setTxHash(
        transaction.hash
      );

      await transaction.wait();

      setRegistered(true);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setRegistering(false);
    }
  }

  async function releaseNFT() {
    const numericTokenId =
      Number(tokenId);

    try {
      setError("");

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

      const nft =
        await contract.getNFT(
          numericTokenId
        );

      if (!nft[0]) {
        throw new Error(
          "NFT is not registered."
        );
      }

      if (nft[2]) {
        throw new Error(
          "NFT is already minted."
        );
      }

      const transaction =
        await contract.setNFTAvailability(
          numericTokenId,
          true
        );

      await transaction.wait();

      alert(
        `Soapy Miner #${numericTokenId} is now available for public mint.`
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Release failed."
      );
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">
          Upload NFT
        </h2>

        <p className="mt-2 text-[#9f9b83]">
          Upload and register a single Soapy Miner. For 1–50 NFT drops, use{" "}
          <Link
            href="/admin/batch-upload"
            className="text-[#e4c657] underline"
          >
            Batch Upload
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Token ID
            </label>

            <input
              type="number"
              min="1"
              max="256"
              value={tokenId}
              onChange={handleTokenIdChange}
              placeholder="1"
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3 outline-none focus:border-[#e4c657]"
            />

            <p className="mt-2 text-xs text-[#777462]">
              Valid range: #1 – #256
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              NFT Artwork
            </label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImage}
              className="block w-full rounded-lg border border-[#3a392f] bg-[#11110f] p-3"
            />

            <p className="mt-2 text-xs text-[#777462]">
              PNG is recommended for the Soapy Miners pixel artwork.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              NFT Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Soapy Miner #1"
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3 outline-none focus:border-[#e4c657]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3 outline-none focus:border-[#e4c657]"
            />
          </div>

          <div className="rounded-lg border border-[#3a392f] bg-[#151510] p-4">
            <p className="text-sm text-[#b7b199]">
              NFT attributes are optional. Game Level, XP and Mining Power will be handled later by the Soapy Miners game registry.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-[#e4c657] px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading to IPFS..."
              : "Upload & Create NFT"}
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-5">
            <p className="mb-4 text-sm text-[#9f9b83]">
              NFT Preview
            </p>

            {preview ? (
              <img
                src={preview}
                alt="Soapy NFT preview"
                className="aspect-square w-full rounded-lg border border-[#3a392f] object-cover [image-rendering:pixelated]"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#3a392f] bg-[#11110f] text-sm text-[#777462]">
                Upload artwork to preview
              </div>
            )}

            <div className="mt-4">
              <p className="font-semibold">
                {name || "Unnamed Soapy Miner"}
              </p>

              <p className="mt-1 line-clamp-3 text-sm text-[#9f9b83]">
                {description}
              </p>
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-[#5c5430] bg-[#242115] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">
                  IPFS Created
                </h3>

                <span className="rounded-full bg-[#e4c657] px-3 py-1 text-xs font-semibold text-black">
                  READY
                </span>
              </div>

              <div className="space-y-4 text-sm">
                <ResultField
                  label="Image CID"
                  value={result.imageCID}
                />

                <ResultField
                  label="Image URI"
                  value={result.image}
                />

                <ResultField
                  label="Metadata CID"
                  value={result.metadataCID}
                />

                <ResultField
                  label="Metadata URI"
                  value={result.metadataURI}
                />
              </div>

              <button
                type="button"
                onClick={registerOnChain}
                disabled={
                  registering ||
                  registered
                }
                className="mt-5 w-full rounded-lg bg-[#e4c657] px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {registered
                  ? "Registered On-Chain ✓"
                  : registering
                    ? "Waiting for Transaction..."
                    : "Register NFT On-Chain"}
              </button>

              {txHash && (
                <div className="mt-4">
                  <p className="text-xs text-[#9f9b83]">
                    Registration Transaction
                  </p>

                  <p className="mt-1 break-all font-mono text-xs">
                    {txHash}
                  </p>
                </div>
              )}

              {registered && (
                <button
                  type="button"
                  onClick={releaseNFT}
                  className="mt-3 w-full rounded-lg border border-[#e4c657] px-5 py-3 font-semibold"
                >
                  Release to Public Mint
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#9f9b83]">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-xs">
        {value}
      </p>
    </div>
  );
}
