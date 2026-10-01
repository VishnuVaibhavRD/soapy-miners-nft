"use client";

export default function PixelButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        pixel-button
        ${className}
      `}
    >
      {children}
    </button>
  );
}
