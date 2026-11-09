"use client";

import { ALLOWED_LETTERS, DIGITS, EXCLUDED_LETTERS, type SlotKind } from "@/lib/plate/config";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface CharacterPadProps {
  kind: SlotKind;
  position: number;
  onPick: (char: string) => void;
  onBackspace: () => void;
}

/** Tastiera che mostra solo i caratteri ammessi nella posizione attiva. */
export function CharacterPad({ kind, position, onPick, onBackspace }: CharacterPadProps) {
  const keys = kind === "letter" ? Array.from(ALPHABET) : Array.from(DIGITS);
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Posizione <strong className="text-slate-800">{position + 1}</strong>:{" "}
        {kind === "letter" ? "scegli una lettera (22 ammesse)" : "scegli una cifra da 0 a 9"}
      </p>
      <div className={`grid gap-1.5 ${kind === "letter" ? "grid-cols-7 sm:grid-cols-9" : "grid-cols-5"}`}>
        {keys.map((k) => {
          const excluded = kind === "letter" && !ALLOWED_LETTERS.includes(k);
          return (
            <button
              key={k}
              type="button"
              disabled={excluded}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(k)}
              title={excluded ? `${k}: non ammessa, ${EXCLUDED_LETTERS[k]}` : `Inserisci ${k}`}
              className={[
                "plate-font h-11 rounded-md border text-2xl transition",
                excluded
                  ? "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 text-slate-300 line-through"
                  : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-[#003399] hover:bg-[#003399] hover:text-white active:scale-95",
              ].join(" ")}
            >
              {k}
            </button>
          );
        })}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onBackspace}
          className="col-span-2 h-11 rounded-md border border-slate-200 bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200"
          aria-label="Cancella"
        >
          ⌫ Cancella
        </button>
      </div>
      {kind === "letter" ? (
        <p className="mt-3 text-xs text-slate-400">
          Le lettere barrate (I, O, Q, U) non sono ammesse perché si confondono con 1, 0 e V.
        </p>
      ) : null}
    </div>
  );
}
