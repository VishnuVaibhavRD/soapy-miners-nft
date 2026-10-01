"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { quais } from "quais";

import {
  getAdminContract,
  getReadContract,
} from "@/lib/quai";

import {
  ipfsToGateway,
} from "@/lib/ipfs";

export default function BatchUploadPage() {
  const [files, setFiles] =
    useState([]);

  const [startTokenId, setStartTokenId] =
    useState("1");

  const [description, setDescription] =
    useState(
      "Soapy Miners NFT Collection on Quai Network."
    );

  const [uploading, setUploading] =
    useState(false);

  const [registering, setRegistering] =
    useState(false);

  const [uploadedNFTs, setUploadedNFTs] =
    useState([]);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [releasePrice, setReleasePrice] =
    useState("");

  const [loadingPrice, setLoadingPrice] =
    useState(true);

  const PUBLIC_TOKEN_END = 235;

  const tokenIds = useMemo(() => {
    const start =
      Number(startTokenId);

    if (
      !Number.isInteger(start)
    ) {
      return [];
    }

    return files.map(
      (_, index) =>
        start + index
    );
  }, [
    files,
    startTokenId,
  ]);

  useEffect(() => {
    async function loadMintPrice() {
      try {
        setLoadingPrice(true);

        const contract =
          getReadContract();

        const rawPrice =
          await contract.mintPrice();

        const formatted =
          quais.formatQuai(
            rawPrice
          );

        setReleasePrice(
          formatted
        );
      } catch {
        setReleasePrice("50");
      } finally {
        setLoadingPrice(false);
      }
    }

    loadMintPrice();
  }, []);

  function handleFiles(event) {
    const selected =
      Array.from(
        event.target.files || []
      );

    setError("");
    setMessage("");
    setUploadedNFTs([]);

    if (
      selected.length > 50
    ) {
      setError(
        "Maximum batch size is 50 NFTs."
      );

      return;
    }

    setFiles(selected);
  }

  async function uploadBatch() {
    try {
      setError("");
      setMessage("");
      setUploadedNFTs([]);

      if (
        files.length === 0
      ) {
        throw new Error(
          "Select at least one NFT image."
        );
      }

      if (
        tokenIds.some(
          (id) =>
            id < 1 ||
            id > PUBLIC_TOKEN_END
        )
      ) {
        throw new Error(
          `Public batch token IDs must stay between 1 and ${PUBLIC_TOKEN_END}.`
        );
      }

      setUploading(true);

      const formData =
        new FormData();

      for (const file of files) {
        formData.append(
          "images",
          file
        );
      }

      formData.append(
        "tokenIds",
        JSON.stringify(
          tokenIds
        )
      );

      formData.append(
        "description",
        description
      );

      const response =
        await fetch(
          "/api/pinata/batch-upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Batch upload failed."
        );
      }

      setUploadedNFTs(
        data.nfts
      );

      setMessage(
        `${data.count} NFTs uploaded to IPFS successfully. Review them before registering on-chain.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function registerAndRelease() {
    try {
      setError("");
      setMessage("");

      if (
        uploadedNFTs.length === 0
      ) {
        throw new Error(
          "Upload NFTs to IPFS first."
        );
      }

      setRegistering(true);

      const priceValue =
        Number(releasePrice);

      if (
        !Number.isFinite(
          priceValue
        ) ||
        priceValue <= 0
      ) {
        throw new Error(
          "Release price must be greater than zero."
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

      const ids =
        uploadedNFTs.map(
          (nft) =>
            nft.tokenId
        );

      const metadataURIs =
        uploadedNFTs.map(
          (nft) =>
            nft.metadataURI
        );

      for (
        let i = 0;
        i < ids.length;
        i++
      ) {
        const nft =
          await contract.getNFT(
            ids[i]
          );

        if (nft[0]) {
          throw new Error(
            `Token #${ids[i]} is already registered.`
          );
        }

        const used =
          await contract.isMetadataUsed(
            metadataURIs[i]
          );

        if (used) {
          throw new Error(
            `Metadata for token #${ids[i]} is already registered.`
          );
        }
      }

      const parsedPrice =
        quais.parseQuai(
          releasePrice
        );

      const transaction =
        await contract.registerAndReleaseBatch(
          ids,
          metadataURIs,
          parsedPrice
        );

      setMessage(
        "Transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setMessage(
        `${ids.length} Soapy Miners registered and released successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Batch registration failed."
      );
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">
          Batch Upload
        </h2>

        <p className="mt-2 text-[#9f9b83]">
          Upload and release 1–50 Soapy Miners in one batch.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6 rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
          <div>
            <label className="mb-2 block text-sm">
              Starting Token ID
            </label>

            <input
              type="number"
              min="1"
              max="235"
              value={
                startTokenId
              }
              onChange={(
                event
              ) =>
                setStartTokenId(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3"
            />

            <p className="mt-2 text-xs text-[#777462]">
              Files are assigned sequential IDs from this number in selection order.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Select NFT Images
            </label>

            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleFiles
              }
              className="w-full rounded-lg border border-[#3a392f] p-3"
            />

            <p className="mt-2 text-xs text-[#777462]">
              Maximum 50 images. For production batches, name files
              {" "}
              <span className="font-mono">26.png</span>
              ,
              {" "}
              <span className="font-mono">27.png</span>
              , etc. to match token IDs.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Release Price (QUAI)
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={releasePrice}
              onChange={(event) =>
                setReleasePrice(
                  event.target.value
                )
              }
              disabled={loadingPrice}
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3"
            />

            <p className="mt-2 text-xs text-[#777462]">
              Defaults to the current contract mint price. Zero is not allowed.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Description
            </label>

            <textarea
              rows={4}
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3"
            />
          </div>

          {files.length > 0 && (
            <div className="rounded-lg border border-[#3a392f] bg-[#11110f] p-4">
              <p className="text-sm">
                {files.length} NFT
                {files.length !==
                1
                  ? "s"
                  : ""}{" "}
                selected
              </p>

              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-[#9f9b83]">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[#e4c657]">☑</span>
                    <span>
                      {file.name}
                      {" → "}
                      <span className="font-semibold text-[#f5f0d7]">
                        #{tokenIds[index]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={
              uploadBatch
            }
            disabled={
              uploading ||
              files.length === 0
            }
            className="w-full rounded-lg bg-[#e4c657] px-5 py-3 font-semibold text-black disabled:opacity-50"
          >
            {uploading
              ? "Uploading to IPFS..."
              : `Upload ${files.length || ""} NFTs to Pinata`}
          </button>
        </div>

        <div>
          {error && (
            <div className="mb-5 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-lg border border-green-900 bg-green-950/30 p-4 text-green-300">
              {message}
            </div>
          )}

          {uploadedNFTs.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[#3a392f] p-12 text-center text-[#9f9b83]">
              Uploaded NFTs will appear here for review.
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Review Batch
                  </h3>

                  <p className="mt-1 text-sm text-[#9f9b83]">
                    {uploadedNFTs.length} metadata URIs ready.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    registerAndRelease
                  }
                  disabled={
                    registering
                  }
                  className="shrink-0 rounded-lg bg-[#e4c657] px-5 py-3 font-semibold text-black disabled:opacity-50"
                >
                  {registering
                    ? "Waiting for Wallet..."
                    : `Register + Release ${uploadedNFTs.length}`}
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {uploadedNFTs.map(
                  (nft) => (
                    <BatchNFTCard
                      key={
                        nft.tokenId
                      }
                      nft={nft}
                    />
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchNFTCard({
  nft,
}) {
  const imageURL =
    ipfsToGateway(
      nft.imageURI
    );

  return (
    <div className="overflow-hidden rounded-xl border border-[#3a392f] bg-[#1d1d18]">
      <div className="aspect-square bg-[#11110f]">
        {imageURL ? (
          <img
            src={imageURL}
            alt={nft.name}
            className="h-full w-full object-cover [image-rendering:pixelated]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#777462]">
            Image unavailable
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs text-[#777462]">
          TOKEN #{nft.tokenId}
        </p>

        <p className="mt-1 font-semibold">
          {nft.name}
        </p>

        <p className="mt-3 break-all font-mono text-xs text-[#9f9b83]">
          {nft.metadataURI}
        </p>
      </div>
    </div>
  );
}
