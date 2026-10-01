"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { quais } from "quais";

import PublicHeader from "@/components/PublicHeader";

import OreRock, {
  DiggingOverlay,
  MiningProgressSection,
  MineClosedPanel,
  RockBreakFlash,
  ShaftEmptyPanel,
} from "@/components/OreRock";

import {
  connectWallet,
  getMintContract,
} from "@/lib/publicWallet";

import {
  getPublicReadContract,
} from "@/lib/publicContract";

import {
  fetchIpfsJson,
  ipfsToGateway,
} from "@/lib/ipfs";

function delay(ms) {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms
      );
    }
  );
}

export default function HomePage() {
  const [wallet, setWallet] =
    useState("");

  const [mintPrice, setMintPrice] =
    useState("50");

  const [publicMinted, setPublicMinted] =
    useState(0);

  const [releaseRemaining, setReleaseRemaining] =
    useState(0);

  const [mintEnabled, setMintEnabled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [mineState, setMineState] =
    useState("idle");

  const [error, setError] =
    useState("");

  const [revealedNFT, setRevealedNFT] =
    useState(null);

  const [revealPhase, setRevealPhase] =
    useState(null);

  async function loadCollection() {
    try {
      setLoading(true);
      setError("");

      const contract =
        getPublicReadContract();

      const [
        rawPrice,
        minted,
        enabled,
        available,
      ] =
        await Promise.all([
          contract.mintPrice(),
          contract.publicMinted(),
          contract.publicMintEnabled(),
          contract.countAvailablePublic(),
        ]);

      setMintPrice(
        quais.formatQuai(rawPrice)
      );

      setPublicMinted(
        Number(minted)
      );

      setMintEnabled(enabled);

      setReleaseRemaining(
        Number(available)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load the mine."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollection();
  }, []);

  async function handleConnect() {
    try {
      setError("");

      const result =
        await connectWallet();

      setWallet(
        result.address
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wallet connection failed."
      );
    }
  }

  async function handleHit() {
    if (
      mineState !== "idle" ||
      !mintEnabled ||
      releaseRemaining === 0
    ) {
      return;
    }

    try {
      setError("");
      setRevealedNFT(null);
      setRevealPhase(null);
      setMineState("hitting");

      await delay(420);

      setMineState("waiting");

      const {
        contract,
        address,
      } =
        await getMintContract();

      setWallet(address);

      const enabled =
        await contract.publicMintEnabled();

      if (!enabled) {
        throw new Error(
          "The mine is currently closed."
        );
      }

      const available =
        await contract.countAvailablePublic();

      if (
        Number(available) === 0
      ) {
        throw new Error(
          "No miners are available in this release."
        );
      }

      const currentPrice =
        await contract.mintPrice();

      const transaction =
        await contract.mint({
          value: currentPrice,
        });

      const receipt =
        await transaction.wait();

      const events =
        await contract.queryFilter(
          contract.filters.PublicMinted(),
          receipt.blockNumber,
          receipt.blockNumber
        );

      const mintEvent =
        events.find(
          (event) =>
            event.transactionHash ===
              receipt.hash &&
            event.args[0].toLowerCase() ===
              address.toLowerCase()
        );

      const mintedTokenId =
        mintEvent
          ? Number(
              mintEvent.args[1]
            )
          : null;

      if (!mintedTokenId) {
        throw new Error(
          "Mint succeeded but token ID could not be determined."
        );
      }

      const nft =
        await contract.getNFT(
          mintedTokenId
        );

      let metadata = null;

      if (nft[0]) {
        try {
          metadata =
            await fetchIpfsJson(
              nft[0]
            );
        } catch {
          metadata = null;
        }
      }

      const revealData = {
        tokenId: mintedTokenId,
        metadataURI: nft[0],
        metadata,
      };

      setMineState("breaking");
      setRevealPhase("break");

      await delay(500);

      setRevealPhase("nft");
      setRevealedNFT(revealData);
      setMineState("idle");

      await loadCollection();
    } catch (err) {
      setMineState("idle");
      setRevealPhase(null);

      setError(
        err instanceof Error
          ? err.message
          : "Mining failed."
      );
    }
  }

  const remainingPublic =
    Math.max(
      235 - publicMinted,
      0
    );

  const mineOpen =
    mintEnabled &&
    releaseRemaining > 0;

  const shaftEmpty =
    mintEnabled &&
    releaseRemaining === 0 &&
    remainingPublic > 0;

  const fullySoldOut =
    remainingPublic === 0;

  return (
    <main className="mine-background relative min-h-screen">
      <div className="pixel-overlay" />

      <PublicHeader
        wallet={wallet}
        onConnect={handleConnect}
        active="mint"
      />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-90px)] max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full">
          <div className="pixel-panel p-6 md:p-10">
            <section className="mine-hero">
              <p className="mine-open-text">
                {!mintEnabled
                  ? "The mine is closed"
                  : shaftEmpty
                    ? "This shaft is empty"
                    : fullySoldOut
                      ? "The mine is exhausted"
                      : "The mine is open"}
              </p>

              {!loading &&
                mineOpen && (
                  <h2 className="miners-underground">
                    {releaseRemaining}
                    {" "}
                    miners still
                    underground
                  </h2>
                )}

              {!loading &&
                !mineOpen &&
                !shaftEmpty &&
                !fullySoldOut && (
                  <h2 className="miners-underground miners-underground-muted">
                    {remainingPublic}
                    {" "}
                    miners remain
                    in the collection
                  </h2>
                )}

              <div>
                {loading ? (
                  <p className="py-16 text-center text-sm text-[#84765f]">
                    Loading mine status...
                  </p>
                ) : mineState ===
                  "waiting" ? (
                  <DiggingOverlay />
                ) : !mintEnabled ? (
                  <MineClosedPanel />
                ) : shaftEmpty ? (
                  <ShaftEmptyPanel />
                ) : fullySoldOut ? (
                  <div className="mine-status-panel">
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-[#b99756]">
                      Collection Complete
                    </p>

                    <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#b7a98d]">
                      All 235 public miners
                      have been discovered.
                    </p>
                  </div>
                ) : revealPhase ===
                  "break" ? (
                  <RockBreakFlash />
                ) : (
                  <OreRock
                    mineState={
                      mineState
                    }
                    disabled={
                      !mineOpen ||
                      mineState !==
                        "idle"
                    }
                    mintEnabled={
                      mintEnabled
                    }
                    releaseRemaining={
                      releaseRemaining
                    }
                    mintPrice={
                      mintPrice
                    }
                    onHit={
                      handleHit
                    }
                  />
                )}
              </div>

              {!loading && (
                <MiningProgressSection
                  publicMinted={
                    publicMinted
                  }
                />
              )}
            </section>

            {error && (
              <div className="mt-6 border-2 border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="quai-footer">
              <p>
                Powered by
              </p>

              <img
                src="/images/quai-logo.svg"
                alt="Quai"
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6f6250]">
                Quai Network
              </span>
            </div>
          </div>
        </div>
      </section>

      {revealedNFT &&
        revealPhase ===
          "nft" && (
          <RevealModal
            nft={revealedNFT}
            onClose={() => {
              setRevealedNFT(
                null
              );
              setRevealPhase(
                null
              );
            }}
          />
        )}
    </main>
  );
}

function RevealModal({
  nft,
  onClose,
}) {
  const metadata = nft.metadata;

  const name =
    metadata?.name ||
    `Soapy Miner #${nft.tokenId}`;

  const image =
    ipfsToGateway(
      metadata?.image
    ) ||
    "/images/placeholder-miner.png";

  useEffect(() => {
    document.body.classList.add(
      "reveal-modal-open"
    );

    return () => {
      document.body.classList.remove(
        "reveal-modal-open"
      );
    };
  }, []);

  return (
    <div
      className="reveal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
    >
      <div className="reveal-scene">
        <p
          id="reveal-title"
          className="reveal-title"
        >
          MINER FOUND
        </p>

        <div className="reveal-stage">
          <div className="reveal-glow" />

          <img
            src="/images/mint/ore-open.png"
            alt=""
            aria-hidden="true"
            className="pixel-art reveal-ore"
          />

          <div className="revealed-soapy">
            <img
              src={image}
              alt={name}
              className="pixel-art revealed-soapy-image"
            />
          </div>

          <div
            className="reveal-particles"
            aria-hidden="true"
          >
            <span className="particle p1" />
            <span className="particle p2" />
            <span className="particle p3" />
            <span className="particle p4" />
            <span className="particle p5" />
            <span className="particle p6" />
          </div>
        </div>

        <div className="reveal-info">
          <h2>{name}</h2>
          <p>TOKEN #{nft.tokenId}</p>
        </div>

        <div className="reveal-actions">
          <Link
            href="/collection"
            className="wooden-reveal-button"
          >
            MY MINER CAMP
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="reveal-close"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
