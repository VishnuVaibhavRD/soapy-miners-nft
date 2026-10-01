"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import PixelButton from "@/components/PixelButton";

function shortenAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WoodenSign({
  href,
  children,
  active,
  onClick,
  className = "",
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`wooden-sign ${className} ${
        active
          ? "wooden-sign-active"
          : ""
      }`}
    >
      {children}
    </Link>
  );
}

export default function PublicHeader({
  wallet,
  onConnect,
  active = "mint",
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove(
        "mobile-menu-open"
      );

      return;
    }

    document.body.classList.add(
      "mobile-menu-open"
    );

    return () => {
      document.body.classList.remove(
        "mobile-menu-open"
      );
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleResize() {
      if (
        window.innerWidth >= 768
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  async function handleConnect() {
    closeMenu();

    await onConnect?.();
  }

  return (
    <>
      <header className="relative z-30 border-b-4 border-[#382819] bg-[#0c0906]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            onClick={closeMenu}
          >
            <img
              src="/images/placeholder-miner.png"
              alt="Soapy Miners"
              className="site-logo pixel-art"
            />

            <div className="min-w-0">
              <p className="truncate font-black tracking-[0.12em]">
                SOAPY MINERS
              </p>

              <p className="text-[10px] uppercase tracking-[0.25em] text-[#93846b]">
                Deep Underground
              </p>
            </div>
          </Link>

          <nav className="public-header-nav">
            <WoodenSign
              href="/"
              active={
                active === "mint"
              }
            >
              The Mine
            </WoodenSign>

            <WoodenSign
              href="/collection"
              active={
                active ===
                "collection"
              }
            >
              My Camp
            </WoodenSign>

            <WoodenSign
              href="/story"
              active={
                active === "story"
              }
            >
              The Story
            </WoodenSign>

            {wallet ? (
              <div className="wallet-badge font-mono text-xs">
                {shortenAddress(
                  wallet
                )}
              </div>
            ) : (
              <PixelButton
                onClick={
                  handleConnect
                }
                className="!px-4 !py-2 !text-xs"
              >
                Wallet
              </PixelButton>
            )}
          </nav>

          <button
            type="button"
            className="mobile-menu-toggle clickable"
            onClick={() =>
              setMenuOpen(
                (open) => !open
              )
            }
            aria-expanded={
              menuOpen
            }
            aria-label={
              menuOpen
                ? "Close menu"
                : "Open menu"
            }
          >
            <span
              className={
                menuOpen
                  ? "mobile-menu-bar open"
                  : "mobile-menu-bar"
              }
            />
            <span
              className={
                menuOpen
                  ? "mobile-menu-bar open"
                  : "mobile-menu-bar"
              }
            />
            <span
              className={
                menuOpen
                  ? "mobile-menu-bar open"
                  : "mobile-menu-bar"
              }
            />
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu-backdrop ${
          menuOpen
            ? "mobile-menu-backdrop-open"
            : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        className={`mobile-menu-panel ${
          menuOpen
            ? "mobile-menu-panel-open"
            : ""
        }`}
        aria-hidden={
          !menuOpen
        }
      >
        <div className="mobile-menu-panel-header">
          <p className="mobile-menu-panel-title">
            Mine Map
          </p>

          <button
            type="button"
            className="mobile-menu-close clickable"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="mobile-menu-nav">
          <WoodenSign
            href="/"
            active={
              active === "mint"
            }
            onClick={closeMenu}
            className="mobile-menu-link"
          >
            The Mine
          </WoodenSign>

          <WoodenSign
            href="/collection"
            active={
              active ===
              "collection"
            }
            onClick={closeMenu}
            className="mobile-menu-link"
          >
            My Camp
          </WoodenSign>

          <WoodenSign
            href="/story"
            active={
              active === "story"
            }
            onClick={closeMenu}
            className="mobile-menu-link"
          >
            The Story
          </WoodenSign>
        </nav>

        <div className="mobile-menu-wallet">
          {wallet ? (
            <div className="wallet-badge mobile-wallet-badge font-mono text-xs">
              {shortenAddress(
                wallet
              )}
            </div>
          ) : (
            <PixelButton
              onClick={
                handleConnect
              }
              className="mobile-menu-wallet-button"
            >
              Connect Wallet
            </PixelButton>
          )}
        </div>
      </aside>
    </>
  );
}
