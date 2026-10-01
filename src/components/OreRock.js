"use client";

import Link from "next/link";

import {
  useState,
} from "react";

const ORE_IMAGES = {
  idle: "/images/mint/ore-idle.png",
  hover: "/images/mint/ore-hover.png",
  cracked: "/images/mint/ore-cracked.png",
  open: "/images/mint/ore-open.png",
};

const TOTAL_PUBLIC_SUPPLY = 235;

function OreParticles() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <span className="ore-particle particle-1" />
      <span className="ore-particle particle-2" />
      <span className="ore-particle particle-3" />
      <span className="ore-particle particle-4" />
      <span className="ore-particle particle-5" />
      <span className="ore-particle particle-6" />
    </div>
  );
}

export default function OreRock({
  mineState,
  disabled,
  mintEnabled,
  releaseRemaining,
  mintPrice,
  onHit,
}) {
  const [hovered, setHovered] =
    useState(false);

  const isHitting =
    mineState === "hitting";

  const isMining =
    mineState === "hitting" ||
    mineState === "waiting";

  const oreSrc =
    mineState === "breaking"
      ? ORE_IMAGES.open
      : isHitting ||
          mineState === "waiting"
        ? ORE_IMAGES.cracked
        : hovered && !disabled
          ? ORE_IMAGES.hover
          : ORE_IMAGES.idle;

  const mintDisabled =
    disabled ||
    mineState !== "idle";

  const buttonLabel =
    isMining
      ? "Digging..."
      : !mintEnabled
        ? "Mine Closed"
        : releaseRemaining === 0
          ? "Sold Out"
          : "Hit to Mine";

  return (
    <div className="mine-action-layout">
      <div className="ore-mint-area">
        <button
          type="button"
          onClick={onHit}
          disabled={mintDisabled}
          onMouseEnter={() =>
            setHovered(true)
          }
          onMouseLeave={() =>
            setHovered(false)
          }
          className="ore-click-target clickable"
          aria-label="Hit ore rock to mine"
        >
          {isHitting && (
            <span
              className="impact-flash"
              aria-hidden="true"
            >
              💥
            </span>
          )}

          <img
            src={oreSrc}
            alt="Ore rock"
            className={`pixel-art ore-main-image ${
              isHitting
                ? "ore-hit"
                : ""
            }`}
          />

          {isHitting && (
            <OreParticles />
          )}
        </button>

        <button
          type="button"
          onClick={onHit}
          disabled={mintDisabled}
          className="wooden-mine-button clickable"
        >
          {buttonLabel}
        </button>

        <div className="mint-price-under-button">
          {mintPrice}
          {" "}
          QUAI
        </div>

        <p className="mint-tagline">
          One hit. One transaction.
          <br />
          One Soapy uncovered.
        </p>
      </div>
    </div>
  );
}

export function MiningProgressSection({
  publicMinted,
}) {
  const mintProgress =
    Math.min(
      Math.max(
        (publicMinted /
          TOTAL_PUBLIC_SUPPLY) *
          100,
        0
      ),
      100
    );

  const cartProgress =
    3 + mintProgress * 0.94;

  return (
    <section className="mining-progress-section">
      <div className="mine-track-wrapper">
        <div
          className="mine-cart"
          style={{
            left: `${cartProgress}%`,
          }}
        >
          <div className="cart-body">
            <div className="cart-ore" />
          </div>

          <div className="cart-wheels">
            <span />
            <span />
          </div>
        </div>

        <div className="mine-track">
          <div className="rail rail-top" />

          <div className="rail rail-bottom" />

          <div className="track-sleepers">
            {Array.from({
              length: 20,
            }).map((_, index) => (
              <span
                key={index}
                className="track-sleeper"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mine-progress-info">
        <strong>
          {publicMinted}
          {" / "}
          {TOTAL_PUBLIC_SUPPLY}
          {" "}
          discovered
        </strong>
      </div>
    </section>
  );
}

export function DiggingOverlay() {
  return (
    <div className="digging-overlay pixel-panel mx-auto max-w-lg p-8 text-center">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d6ae51]">
        Digging Deeper...
      </p>

      <div className="mt-6 text-3xl">
        ⛏
      </div>

      <div className="digging-bar mx-auto mt-4">
        <span className="digging-bar-fill" />
      </div>

      <p className="mt-5 text-sm text-[#b7a98d]">
        Searching the mine...
      </p>

      <p className="mt-3 text-xs leading-6 text-[#84765f]">
        Keep this tunnel open while
        the transaction confirms.
      </p>
    </div>
  );
}

export function MineClosedPanel() {
  return (
    <div className="mine-status-panel">
      <p className="text-4xl">
        🔒
      </p>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.35em] text-[#b99756]">
        The Mine Is Closed
      </p>

      <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#b7a98d]">
        The tunnels are sealed.
        Check back when the next
        group of miners is discovered.
      </p>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#84765f]">
        Next Expedition Soon
      </p>
    </div>
  );
}

export function ShaftEmptyPanel() {
  return (
    <div className="shaft-empty-panel">
      <div className="shaft-empty-scene">
        <div
          className="shaft-lantern-glow"
          aria-hidden="true"
        />

        <img
          src="/images/placeholder-miner.png"
          alt="Empty shaft"
          className="pixel-art shaft-empty-miner"
        />

        <img
          src="/images/mint/ore-open.png"
          alt=""
          aria-hidden="true"
          className="pixel-art shaft-empty-ore"
        />

        <div
          className="shaft-empty-dust"
          aria-hidden="true"
        >
          <span className="dust-1" />
          <span className="dust-2" />
          <span className="dust-3" />
          <span className="dust-4" />
          <span className="dust-5" />
        </div>
      </div>

      <p className="shaft-empty-message">
        Every miner from this tunnel
        has been discovered.
      </p>

      <div
        className="shaft-empty-track"
        aria-hidden="true"
      >
        <div className="shaft-empty-cart">
          <div className="cart-body shaft-empty-cart-body" />

          <div className="cart-wheels">
            <span />
            <span />
          </div>
        </div>

        <div className="mine-track shaft-track-mini">
          <div className="rail rail-top" />
          <div className="rail rail-bottom" />

          <div className="track-sleepers">
            {Array.from({
              length: 14,
            }).map((_, index) => (
              <span
                key={index}
                className="track-sleeper"
              />
            ))}
          </div>
        </div>
      </div>

      <p className="shaft-empty-soon">
        Next Mine Coming Soon
      </p>

      <Link
        href="/collection"
        className="shaft-empty-camp-link"
      >
        Visit My Miner Camp
      </Link>
    </div>
  );
}

export function RockBreakFlash() {
  return (
    <div className="rock-break-flash pixel-panel mx-auto max-w-md p-10 text-center">
      <p className="text-4xl">
        💥
      </p>

      <p className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-[#e3b84d]">
        The Rock Breaks Open
      </p>
    </div>
  );
}
