"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LAST_ISSUED_SERIES, PLATE_LENGTH, PLATE_PATTERN, PRICE_EUR, PROVINCES } from "@/lib/plate/config";
import { randomPlate, toSlots, validatePlate, type RuleStatus } from "@/lib/plate/validate";
import { downloadPlatePng, downloadPlateSvg } from "@/lib/exportPlate";
import { CharacterPad } from "./CharacterPad";
import { PlateSvg } from "./PlateSvg";
import { SlotEditor } from "./SlotEditor";

const EMPTY = Array.from({ length: PLATE_LENGTH }, () => "");

const STATUS_STYLE: Record<RuleStatus, { icon: string; className: string }> = {
  pass: { icon: "✓", className: "bg-emerald-100 text-emerald-700" },
  fail: { icon: "✕", className: "bg-red-100 text-red-700" },
  warn: { icon: "!", className: "bg-amber-100 text-amber-700" },
  pending: { icon: "", className: "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200" },
};

export function PlateBuilder() {
  const [chars, setChars] = useState<string[]>(EMPTY);
  const [active, setActive] = useState<number | null>(0);
  const [province, setProvince] = useState("");
  const [showYear, setShowYear] = useState(false);
  const [year, setYear] = useState(() => String(new Date().getFullYear()).slice(-2));
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const result = useMemo(() => validatePlate(chars), [chars]);
  const errorPositions = useMemo(
    () => [...new Set(result.issues.filter((i) => i.severity === "error").flatMap((i) => i.positions))],
    [result],
  );

  // Condivisione via URL: ?targa=MR123KP
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("targa");
    if (param) setChars(toSlots(param));
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const compact = chars.join("");
    if (compact) url.searchParams.set("targa", compact);
    else url.searchParams.delete("targa");
    window.history.replaceState(null, "", url);
  }, [chars]);

  const write = (index: number, incoming: string[]): number => {
    const next = [...chars];
    let i = index;
    for (const c of incoming) {
      if (i >= PLATE_LENGTH) break;
      next[i++] = c;
    }
    setChars(next);
    const nextIndex = Math.min(i, PLATE_LENGTH - 1);
    setActive(nextIndex);
    return nextIndex;
  };

  const clearAt = (index: number) => {
    setChars((prev) => prev.map((c, i) => (i === index ? "" : c)));
    setActive(index);
  };

  const padIndex = active ?? Math.max(0, chars.findIndex((c) => !c));

  const copyPlate = async () => {
    await navigator.clipboard.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filename = `targa-${result.compact || "bozza"}`;
  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-8">
      {/* Anteprima */}
      <section className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 px-4 py-10 shadow-xl sm:px-10">
        <PlateSvg
          ref={svgRef}
          slots={chars}
          errorPositions={errorPositions}
          activeIndex={active}
          province={province || undefined}
          year={showYear ? year : undefined}
          className="mx-auto w-full max-w-2xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
        />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <StatusBadge complete={result.complete} hasErrors={errors.length > 0} hasWarnings={warnings.length > 0} />
          <span className="plate-font text-xl tracking-wider text-slate-300">{result.formatted}</span>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        {/* Editor */}
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Componi la combinazione</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setChars(randomPlate());
                  setActive(null);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                🎲 Casuale
              </button>
              <button
                type="button"
                onClick={() => {
                  setChars(EMPTY);
                  setActive(0);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Svuota
              </button>
            </div>
          </header>

          <SlotEditor
            slots={result.slots}
            activeIndex={active}
            onActiveChange={setActive}
            onWrite={write}
            onClear={clearAt}
            highlight={errorPositions}
          />

          <div className="border-t border-slate-100 pt-5">
            <CharacterPad
              kind={PLATE_PATTERN[padIndex]}
              position={padIndex}
              onPick={(c) => write(padIndex, [c])}
              onBackspace={() => {
                if (chars[padIndex]) clearAt(padIndex);
                else if (padIndex > 0) clearAt(padIndex - 1);
              }}
            />
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Sigla provincia (banda destra)</span>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">Nessuna (facoltativa)</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm">
              <label className="mb-1 flex items-center gap-2 font-medium text-slate-700">
                <input type="checkbox" checked={showYear} onChange={(e) => setShowYear(e.target.checked)} />
                Anno di immatricolazione
              </label>
              <input
                value={year}
                disabled={!showYear}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                inputMode="numeric"
                maxLength={2}
                placeholder="26"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>
        </section>

        {/* Verifica e riepilogo */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Verifica delle regole</h2>
            <ul className="space-y-3">
              {result.rules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-3 text-sm">
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${STATUS_STYLE[rule.status].className}`}
                    aria-label={rule.status}
                  >
                    {STATUS_STYLE[rule.status].icon}
                  </span>
                  <span className={rule.status === "pending" ? "text-slate-400" : "text-slate-700"}>{rule.label}</span>
                </li>
              ))}
            </ul>

            {errors.length + warnings.length > 0 ? (
              <ul className="mt-5 space-y-2" aria-live="polite">
                {errors.map((issue, k) => (
                  <li key={`e${k}`} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {issue.message}
                  </li>
                ))}
                {warnings.map((issue, k) => (
                  <li key={`w${k}`} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Riepilogo</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Combinazione" value={<span className="plate-font text-lg">{result.formatted}</span>} />
              <Row label="Costo stimato (auto)" value={`${PRICE_EUR.auto} €`} />
              <Row label="Costo stimato (moto)" value={`${PRICE_EUR.moto} €`} />
              <Row label="Disponibilità" value="Da verificare in Motorizzazione" />
            </dl>
            <p className="mt-3 text-xs text-slate-400">
              Importi dallo schema di decreto, non definitivi. Serie ordinarie considerate già emesse fino a{" "}
              {LAST_ISSUED_SERIES}.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!result.valid}
                onClick={() => svgRef.current && downloadPlatePng(svgRef.current, `${filename}.png`)}
                className="rounded-lg bg-[#003399] px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#002a80] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Scarica PNG
              </button>
              <button
                type="button"
                disabled={!result.valid}
                onClick={() => svgRef.current && downloadPlateSvg(svgRef.current, `${filename}.svg`)}
                className="rounded-lg border border-[#003399] px-3 py-2.5 text-sm font-semibold text-[#003399] hover:bg-[#003399]/5 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
              >
                Scarica SVG
              </button>
              <button
                type="button"
                disabled={!result.complete}
                onClick={copyPlate}
                className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                {copied ? "Copiata ✓" : "Copia combinazione"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function StatusBadge({ complete, hasErrors, hasWarnings }: { complete: boolean; hasErrors: boolean; hasWarnings: boolean }) {
  if (hasErrors) return <span className="rounded-full bg-red-500/90 px-3 py-1 font-medium text-white">Non ammessa</span>;
  if (!complete) {
    return <span className="rounded-full bg-slate-700 px-3 py-1 font-medium text-slate-200">In composizione…</span>;
  }
  if (hasWarnings)
    return <span className="rounded-full bg-amber-400 px-3 py-1 font-medium text-amber-950">Ammessa con riserva</span>;
  return <span className="rounded-full bg-emerald-500 px-3 py-1 font-medium text-white">Combinazione valida</span>;
}
