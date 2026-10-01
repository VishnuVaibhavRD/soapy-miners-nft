"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

const FOLLOWER_SRC =
  "/images/cursors/pickaxe-cursor-source.png";

const FOLLOWER_HIT_SRC =
  "/images/cursors/pickaxe-hit-cursor-source.png";

const HOTSPOT_X = 24;
const HOTSPOT_Y = 16;

export default function PickaxeCursorFollower() {
  const pathname =
    usePathname();

  const isPublicRoute =
    !pathname.startsWith(
      "/admin"
    );

  const [enabled, setEnabled] =
    useState(false);

  const [visible, setVisible] =
    useState(false);

  const [hitting, setHitting] =
    useState(false);

  const [position, setPosition] =
    useState({
      x: 0,
      y: 0,
    });

  useEffect(() => {
    if (!isPublicRoute) {
      return;
    }

    const finePointer =
      window.matchMedia(
        "(pointer: fine)"
      );

    const noHover =
      window.matchMedia(
        "(hover: hover)"
      );

    function updateEnabled() {
      setEnabled(
        finePointer.matches &&
          noHover.matches
      );
    }

    updateEnabled();

    finePointer.addEventListener(
      "change",
      updateEnabled
    );

    noHover.addEventListener(
      "change",
      updateEnabled
    );

    return () => {
      finePointer.removeEventListener(
        "change",
        updateEnabled
      );

      noHover.removeEventListener(
        "change",
        updateEnabled
      );
    };
  }, [isPublicRoute]);

  useEffect(() => {
    if (
      !isPublicRoute ||
      !enabled
    ) {
      document.body.classList.remove(
        "pickaxe-follower-active"
      );

      return;
    }

    document.body.classList.add(
      "pickaxe-follower-active"
    );

    function handleMove(
      event
    ) {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setVisible(true);
    }

    function handleLeave() {
      setVisible(false);
    }

    function handleDown() {
      setHitting(true);
    }

    function handleUp() {
      setHitting(false);
    }

    window.addEventListener(
      "mousemove",
      handleMove
    );

    window.addEventListener(
      "mouseleave",
      handleLeave
    );

    window.addEventListener(
      "mousedown",
      handleDown
    );

    window.addEventListener(
      "mouseup",
      handleUp
    );

    return () => {
      document.body.classList.remove(
        "pickaxe-follower-active"
      );

      window.removeEventListener(
        "mousemove",
        handleMove
      );

      window.removeEventListener(
        "mouseleave",
        handleLeave
      );

      window.removeEventListener(
        "mousedown",
        handleDown
      );

      window.removeEventListener(
        "mouseup",
        handleUp
      );
    };
  }, [
    isPublicRoute,
    enabled,
  ]);

  if (
    !isPublicRoute ||
    !enabled ||
    !visible
  ) {
    return null;
  }

  return (
    <div
      className={`pickaxe-cursor-follower ${
        hitting
          ? "pickaxe-cursor-follower-hit"
          : ""
      }`}
      style={{
        transform: `translate(${position.x - HOTSPOT_X}px, ${position.y - HOTSPOT_Y}px)`,
      }}
      aria-hidden="true"
    >
      <img
        src={
          hitting
            ? FOLLOWER_HIT_SRC
            : FOLLOWER_SRC
        }
        alt=""
        className="pickaxe-cursor-follower-image pixel-art"
        draggable={false}
      />
    </div>
  );
}
