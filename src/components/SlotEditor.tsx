"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { PLATE_GROUPS, PLATE_LENGTH } from "@/lib/plate/config";
import { sanitizeInput, type SlotState } from "@/lib/plate/validate";

interface SlotEditorProps {
  slots: readonly SlotState[];
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  /** Scrive `chars` a partire da `index`; restituisce l'indice successivo da focalizzare. */
  onWrite: (index: number, chars: string[]) => number;
  onClear: (index: number) => void;
  highlight: readonly number[];
}

export function SlotEditor({ slots, activeIndex, onActiveChange, onWrite, onClear, highlight }: SlotEditorProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => {
    const target = refs.current[Math.max(0, Math.min(PLATE_LENGTH - 1, i))];
    target?.focus();
    target?.select();
  };

  const write = (i: number, raw: string) => {
    const chars = Array.from(sanitizeInput(raw));
    if (chars.length === 0) return;
    const next = onWrite(i, chars);
    focus(next);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        if (slots[i].char) onClear(i);
        else if (i > 0) {
          onClear(i - 1);
          focus(i - 1);
        }
        break;
      case "Delete":
        e.preventDefault();
        onClear(i);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focus(i - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        focus(i + 1);
        break;
      case "Home":
        e.preventDefault();
        focus(0);
        break;
      case "End":
        e.preventDefault();
        focus(PLATE_LENGTH - 1);
        break;
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    write(i, e.clipboardData.getData("text"));
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4" role="group" aria-label="Caratteri della targa">
      {PLATE_GROUPS.map(([start, end], g) => (
        <div key={g} className="flex gap-1 sm:gap-1.5">
          {slots.slice(start, end).map((slot, k) => {
            const i = start + k;
            const isActive = activeIndex === i;
            const isFlagged = highlight.includes(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <input
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={slot.char}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return onClear(i); // cancellazione da tastiere mobili
                    const old = slot.char;
                    const added =
                      old && v.length > old.length
                        ? v.startsWith(old)
                          ? v.slice(old.length)
                          : v.slice(0, v.length - old.length)
                        : v;
                    write(i, added);
                  }}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => handlePaste(i, e)}
                  onFocus={(e) => {
                    onActiveChange(i);
                    e.target.select();
                  }}
                  inputMode={slot.kind === "digit" ? "numeric" : "text"}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label={`Posizione ${i + 1}: ${slot.kind === "letter" ? "lettera" : "cifra"}`}
                  aria-invalid={Boolean(slot.error) || isFlagged}
                  title={slot.error ?? undefined}
                  placeholder={slot.kind === "letter" ? "A" : "0"}
                  className={[
                    "plate-font h-14 w-9 rounded-lg border-2 bg-white text-center text-3xl uppercase outline-none transition sm:h-16 sm:w-12 sm:text-4xl",
                    "placeholder:text-slate-300",
                    slot.error || isFlagged
                      ? "border-red-500 bg-red-50 text-red-700"
                      : isActive
                        ? "border-[#003399] ring-4 ring-[#003399]/15"
                        : "border-slate-300 hover:border-slate-400",
                  ].join(" ")}
                />
                <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400 sm:text-[10px]">
                  {slot.kind === "letter" ? "lettera" : "cifra"}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
