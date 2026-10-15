import { useState } from "react";
export function CapitalInput({
  value,
  onChange,
  label = "Capital excedente",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      aria-label={label}
      type="number"
      inputMode="decimal"
      min="1"
      max="10000000000"
      step="0.01"
      value={draft ?? String(value)}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const n = Number(text);
        if (text !== "" && Number.isFinite(n) && n >= 1 && n <= 1e10)
          onChange(n);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
