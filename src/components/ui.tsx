"use client";

import type { ReactNode } from "react";

export function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-2 p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed border-sand-2 bg-sand/50 opacity-50"
          : selected
          ? "border-brand bg-brand/10 shadow-sm"
          : "border-sand-2 bg-white hover:border-brand/50"
      }`}
    >
      <div className={`font-semibold ${disabled ? "text-ink/40" : "text-ink"}`}>
        {title}
      </div>
      {subtitle && (
        <div className={`mt-1 text-sm ${disabled ? "text-ink/30" : "text-ink/60"}`}>
          {subtitle}
        </div>
      )}
    </button>
  );
}

export function Chip({
  selected,
  onClick,
  label,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
        selected
          ? "border-court bg-court text-white"
          : disabled
          ? "cursor-not-allowed border-sand-2 bg-white text-ink/30"
          : "border-sand-2 bg-white text-ink hover:border-court/50"
      }`}
    >
      {label}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <div className="font-semibold text-ink">{label}</div>
      {hint && <div className="mt-0.5 text-sm text-ink/50">{hint}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = Number(e.target.value);
        if (!Number.isFinite(raw)) {
          onChange(min ?? 0);
          return;
        }
        let next = raw;
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        onChange(next);
      }}
      className="w-32 rounded-lg border-2 border-sand-2 bg-white px-3 py-2 text-ink outline-none focus:border-brand"
    />
  );
}
