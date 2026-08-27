"use client";

import { EQUIPMENT_LABELS } from "@/lib/labels";
import type { Equipment } from "@/lib/types";

export function EquipmentPicker({
  options,
  selected,
  onToggle,
  assumedAvailable = [],
}: {
  options: Equipment[];
  selected: Equipment[];
  onToggle: (item: Equipment) => void;
  /** Shown selected and disabled — e.g. balls & net for coaches. */
  assumedAvailable?: Equipment[];
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {assumedAvailable.map((item) => (
        <EquipmentBox
          key={item}
          label={EQUIPMENT_LABELS[item]}
          selected
          disabled
          hint="Always available"
          onToggle={() => {}}
        />
      ))}
      {options.map((item) => (
        <EquipmentBox
          key={item}
          label={EQUIPMENT_LABELS[item]}
          selected={selected.includes(item)}
          onToggle={() => onToggle(item)}
        />
      ))}
    </div>
  );
}

function EquipmentBox({
  label,
  selected,
  disabled = false,
  hint,
  onToggle,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  hint?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-xl border-2 p-3 text-left transition ${
        disabled
          ? "cursor-default border-sand-2 bg-sand/40"
          : selected
            ? "border-brand bg-brand/10 shadow-sm"
            : "border-sand-2 bg-white hover:border-brand/50"
      }`}
    >
      <span
        className={`block text-sm font-semibold ${
          disabled ? "text-ink/50" : "text-ink"
        }`}
      >
        {label}
      </span>
      {hint && (
        <span className="mt-0.5 block text-xs text-ink/40">{hint}</span>
      )}
    </button>
  );
}
