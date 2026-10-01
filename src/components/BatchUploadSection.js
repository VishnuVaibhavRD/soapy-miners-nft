"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminContract,
  getReadContract,
} from "@/lib/quai";

import { quais } from "quais";

import {
  ipfsToGateway,
} from "@/lib/ipfs";

const MAX_BATCH_SIZE = 50;

export default function BatchUploadSection() {
  const [files, setFiles] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [description, setDescription] =
    useState(
      "Soapy Miners NFT Collection on Quai Network."
    );

  const [uploading, setUploading] =
    useState(false);

  const [registering, setRegistering] =
    useState(false);

  const [uploaded, setUploaded] =
    useState([]);

  const [registered, setRegistered] =
    useState(false);

  const [txHash, setTxHash] =
    useState("");

  const [error, setError] =
    useState("");

  const [releasePrice, setReleasePrice] =
    useState("");

  const [loadingPrice, setLoadingPrice] =
    useState(true);

  useEffect(() => {
    async function loadMintPrice() {
      try {
        setLoadingPrice(true);

        const contract =
          getReadContract();

        const rawPrice =
          await contract.mintPrice();

        setReleasePrice(
          quais.formatQuai(rawPrice)
        );
      } catch {
        setReleasePrice("50");
      } finally {
        setLoadingPrice(false);
      }
    }

    loadMintPrice();
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(
          preview.url
        );
      });
    };
  }, [previews]);

  function parseTokenId(filename) {
    const base = filename.replace(
      /\.[^.]+$/,
      ""
    );

    const exactMatch =
      base.match(/^#?(\d+)$/);

    if (exactMatch) {
      return Number(
        exactMatch[1]
      );
    }

    const trailingMatch =
      base.match(
        /(?:^|[-_#])(\d{1,3})$/
      );

    if (trailingMatch) {
      return Number(
        trailingMatch[1]
      );
    }

    return null;
  }

  function handleFiles(event) {
    const selected = Array.from(
      event.target.files || []
    );

    setError("");
    setUploaded([]);
    setRegistered(false);
    setTxHash("");

    previews.forEach((preview) => {
      URL.revokeObjectURL(
        preview.url
      );
    });

    const nextPreviews =
      selected.map((file) => ({
        file,
        tokenId:
          parseTokenId(
            file.name
          ),
        url: URL.createObjectURL(
          file
        ),
      }));

    nextPreviews.sort(
      (a, b) => {
        if (
          a.tokenId === null
        ) {
          return 1;
        }

        if (
          b.tokenId === null
        ) {
          return -1;
        }

        return (
          a.tokenId - b.tokenId
        );
      }
    );

    setFiles(selected);
    setPreviews(nextPreviews);
  }

  const invalidFiles =
    useMemo(
      () =>
        previews.filter(
          (preview) =>
            !preview.tokenId ||
            preview.tokenId < 1 ||
            preview.tokenId > 256
        ),
      [previews]
    );

  async function uploadBatch() {
    if (files.length === 0) {
      setError(
        "Select one or more image files."
      );
      return;
    }

    if (
      invalidFiles.length > 0
    ) {
      setError(
        "Every filename must include a valid token ID between 1 and 256, such as 1.png or #25.png."
      );
      return;
    }

    if (
      files.length > MAX_BATCH_SIZE
    ) {
      setError(
        `Batch limit is ${MAX_BATCH_SIZE} NFTs.`
      );
      return;
    }

    try {
      setUploading(true);
      setError("");
      setUploaded([]);
      setRegistered(false);
      setTxHash("");

      const formData =
        new FormData();

      files.forEach((file) => {
        formData.append(
          "images",
          file
        );
      });

      formData.append(
        "description",
        description.trim()
      );

      const response =
        await fetch(
          "/api/pinata/batch",
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
            "Batch upload failed"
        );
      }

      setUploaded(data.nfts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Batch upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function registerAndReleaseBatch() {
    if (uploaded.length === 0) {
      setError(
        "Upload the batch to Pinata first."
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

      const nftIds =
        uploaded.map(
          (nft) => nft.tokenId
        );

      const metadataURIs =
        uploaded.map(
          (nft) =>
            nft.metadataURI
        );

      const priceValue =
        Number(releasePrice);

      if (
        !Number.isFinite(priceValue) ||
        priceValue <= 0
      ) {
        throw new Error(
          "Release price must be greater than zero."
        );
      }

      const parsedPrice =
        quais.parseQuai(releasePrice);

      const transaction =
        await contract.registerAndReleaseBatch(
          nftIds,
          metadataURIs,
          parsedPrice
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
          : "Batch registration failed."
      );
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#3a392f] bg-[#1d1d18] p-6">
        <h3 className="text-lg font-semibold">
          Batch Upload
        </h3>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Choose Multiple Images
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFiles}
            className="block w-full rounded-lg border border-[#3a392f] bg-[#11110f] p-3"
          />

          <p className="mt-2 text-xs text-[#777462]">
            Supports 1–50 NFTs per batch. Name files like
            {" "}
            <span className="font-mono">1.png</span>
            ,
            {" "}
            <span className="font-mono">#2.png</span>
            , or
            {" "}
            <span className="font-mono">soapy-25.png</span>
            .
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Shared Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            rows={3}
            className="w-full rounded-lg border border-[#3a392f] bg-[#11110f] px-4 py-3 outline-none focus:border-[#e4c657]"
          />
        </div>

        {previews.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-[#f5f0d7]">
              {previews.length}
              {" "}
              {previews.length === 1
                ? "File Selected"
                : "Files Selected"}
            </p>

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-[#3a392f] bg-[#11110f] p-3">
              {previews.map(
                (preview) => (
                  <label
                    key={
                      preview.file.name
                    }
                    className="flex items-center gap-3 rounded-lg bg-[#151510] px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={
                        Boolean(
                          preview.tokenId
                        )
                      }
                      readOnly
                      className="h-4 w-4 accent-[#e4c657]"
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {preview.tokenId
                        ? `Soapy #${preview.tokenId}`
                        : preview.file.name}
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                        preview.tokenId
                          ? "bg-green-950 text-green-300"
                          : "bg-red-950 text-red-300"
                      }`}
                    >
                      {preview.tokenId
                        ? "Ready"
                        : "Invalid ID"}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={uploadBatch}
          disabled={
            uploading ||
            files.length === 0
          }
          className="mt-6 rounded-lg bg-[#e4c657] px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading to Pinata..."
            : "Upload All to Pinata"}
        </button>
      </div>

      {uploaded.length > 0 && (
        <div className="rounded-xl border border-[#5c5430] bg-[#242115] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              Pinata Batch Ready
            </h3>

            <span className="rounded-full bg-[#e4c657] px-3 py-1 text-xs font-semibold text-black">
              {uploaded.length}
              {" "}
              URIs READY
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uploaded.map((nft) => (
              <article
                key={nft.tokenId}
                className="overflow-hidden rounded-lg border border-[#3a392f] bg-[#1d1d18]"
              >
                <div className="aspect-square bg-[#0b0b09]">
                  <img
                    src={ipfsToGateway(
                      nft.image
                    )}
                    alt={nft.name}
                    className="h-full w-full object-cover [image-rendering:pixelated]"
                  />
                </div>

                <div className="p-3">
                  <p className="font-semibold">
                    {nft.name}
                  </p>

                  <p className="mt-1 truncate font-mono text-xs text-[#777462]">
                    {
                      nft.metadataURI
                    }
                  </p>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={
              registerAndReleaseBatch
            }
            disabled={
              registering ||
              registered
            }
            className="mt-6 w-full rounded-lg bg-[#e4c657] px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registered
              ? `Registered + Released ${uploaded.length} NFT${uploaded.length === 1 ? "" : "s"} ✓`
              : registering
                ? "Waiting for Transaction..."
                : `Register + Release ${uploaded.length} NFT${uploaded.length === 1 ? "" : "s"}`}
          </button>

          {txHash && (
            <div className="mt-4">
              <p className="text-xs text-[#9f9b83]">
                Batch Transaction
              </p>

              <p className="mt-1 break-all font-mono text-xs">
                {txHash}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
