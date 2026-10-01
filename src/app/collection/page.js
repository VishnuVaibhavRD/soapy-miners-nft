"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { quais } from "quais";

import PixelButton from "@/components/PixelButton";
import PublicHeader from "@/components/PublicHeader";

import {
  loadOwnedMiners,
} from "@/lib/collection";

import {
  ipfsToGateway,
} from "@/lib/ipfs";

import {
  getPublicReadContract,
} from "@/lib/publicContract";

import {
  connectWallet,
} from "@/lib/publicWallet";

export default function CollectionPage() {
  const [wallet, setWallet] =
    useState("");

  const [ownedNFTs, setOwnedNFTs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadOwnedNFTs(
    userAddress
  ) {
    const contract =
      getPublicReadContract();

    await loadOwnedMiners(
      contract,
      userAddress,
      {
        onBatch: (miners) => {
          setOwnedNFTs(miners);
        },
      }
    );
  }

  async function connectAndLoad() {
    try {
      setLoading(true);
      setError("");

      const { address } =
        await connectWallet();

      setWallet(address);

      await loadOwnedNFTs(address);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load collection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function tryAutoLoad() {
      if (
        typeof window ===
          "undefined" ||
        !window.pelagus
      ) {
        return;
      }

      try {
        const provider =
          new quais.BrowserProvider(
            window.pelagus
          );

        const accounts =
          await provider.send(
            "quai_accounts",
            []
          );

        if (
          accounts?.[0]
        ) {
          setWallet(
            accounts[0]
          );

          setLoading(true);

          await loadOwnedNFTs(
            accounts[0]
          );
        }
      } catch {
        // Wallet not connected yet.
      } finally {
        setLoading(false);
      }
    }

    tryAutoLoad();
  }, []);

  const minerCount =
    ownedNFTs.length;

  return (
    <main className="mine-background relative min-h-screen">
      <div className="pixel-overlay" />

      <PublicHeader
        wallet={wallet}
        onConnect={connectAndLoad}
        active="collection"
      />

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="pixel-panel camp-panel p-5 md:p-10">
          <header className="camp-hero">
            <p className="camp-eyebrow">
              Your Miner Camp
            </p>

            {wallet &&
              !loading &&
              minerCount > 0 && (
                <h1 className="camp-headline">
                  {minerCount}
                  {" "}
                  Miner
                  {minerCount === 1
                    ? ""
                    : "s"}
                  {" "}
                  Returned
                </h1>
              )}

            {(!wallet ||
              loading ||
              minerCount === 0) && (
              <h1 className="camp-headline camp-headline-muted">
                Your Camp
              </h1>
            )}
          </header>

          {error && (
            <div className="camp-error">
              {error}
            </div>
          )}

          {!wallet ? (
            <CampConnectPanel
              onConnect={
                connectAndLoad
              }
            />
          ) : loading &&
            minerCount === 0 ? (
            <CampLoadingPanel />
          ) : minerCount === 0 ? (
            <CampEmptyPanel />
          ) : (
            <div className="camp-grid">
              {ownedNFTs.map(
                (nft) => (
                  <CampMinerCard
                    key={
                      nft.tokenId
                    }
                    nft={nft}
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function CampConnectPanel({
  onConnect,
}) {
  return (
    <div className="camp-gate-panel">
      <div
        className="camp-gate-scene"
        aria-hidden="true"
      >
        <div className="camp-gate-lantern" />
        <img
          src="/images/placeholder-miner.png"
          alt=""
          className="pixel-art camp-gate-miner"
        />
      </div>

      <p className="camp-gate-title">
        Connect Your Wallet
      </p>

      <p className="camp-gate-message">
        Link Pelagus to see which
        Soapies have returned to
        your camp.
      </p>

      <PixelButton
        onClick={onConnect}
        className="camp-gate-button"
      >
        Connect Wallet
      </PixelButton>
    </div>
  );
}

function CampLoadingPanel() {
  return (
    <div className="camp-loading-panel">
      <div
        className="camp-loading-lantern"
        aria-hidden="true"
      />

      <p className="camp-loading-title">
        Scanning The Tunnels...
      </p>

      <p className="camp-loading-message">
        Looking for your miners
        underground.
      </p>

      <div className="camp-loading-bar">
        <span className="camp-loading-bar-fill" />
      </div>
    </div>
  );
}

function CampEmptyPanel() {
  return (
    <div className="camp-empty-panel">
      <div
        className="camp-empty-scene"
        aria-hidden="true"
      >
        <div className="camp-empty-lantern" />

        <div className="camp-empty-tent">
          <span className="camp-tent-pole camp-tent-pole-left" />
          <span className="camp-tent-pole camp-tent-pole-right" />
          <span className="camp-tent-roof" />
        </div>

        <img
          src="/images/mint/ore-idle.png"
          alt=""
          className="pixel-art camp-empty-ore"
        />
      </div>

      <p className="camp-empty-title">
        Your Camp Is Empty
      </p>

      <p className="camp-empty-message">
        No Soapies have returned
        from underground yet.
      </p>

      <Link
        href="/"
        className="camp-enter-mine-button"
      >
        Enter The Mine
      </Link>
    </div>
  );
}

function CampMinerCard({
  nft,
}) {
  const name =
    nft.metadata?.name ||
    `Soapy Miner #${nft.tokenId}`;

  const imageURL =
    ipfsToGateway(
      nft.metadata?.image
    ) ||
    "/images/placeholder-miner.png";

  return (
    <article className="camp-miner-card">
      <div className="camp-miner-image-wrap">
        <div
          className="camp-miner-lantern"
          aria-hidden="true"
        />

        <img
          src={imageURL}
          alt={name}
          className="pixel-art camp-miner-image"
        />
      </div>

      <div className="camp-miner-body">
        <h3 className="camp-miner-name">
          {name}
        </h3>

        <p className="camp-miner-token">
          Token #{nft.tokenId}
        </p>

        <p className="camp-miner-adventure">
          Ready For Adventure
        </p>

        <p className="camp-miner-owned">
          <span aria-hidden="true">
            ✓
          </span>
          {" "}
          Owned
        </p>
      </div>
    </article>
  );
}
