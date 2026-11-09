import {
  ALLOWED_LETTERS,
  BLOCKED_PAIRS,
  BLOCKED_WORDS,
  DIGITS,
  EXCLUDED_LETTERS,
  LAST_ISSUED_SERIES,
  LOOKALIKE_DIGITS,
  PLATE_GROUPS,
  PLATE_LENGTH,
  PLATE_PATTERN,
  RESERVED_FIRST_LETTER,
  RESERVED_PREFIXES,
  STATE_ACRONYMS,
  type SlotKind,
} from "./config";

export type Severity = "error" | "warning";

export type RuleId =
  | "complete"
  | "charset"
  | "reserved"
  | "series"
  | "offensive"
  | "acronym";

export type RuleStatus = "pass" | "fail" | "warn" | "pending";

export interface Issue {
  rule: RuleId;
  severity: Severity;
  message: string;
  /** Posizioni (0-6) coinvolte, per evidenziarle nell'editor. */
  positions: number[];
}

export interface SlotState {
  char: string;
  kind: SlotKind;
  error: string | null;
}

export interface RuleCheck {
  id: RuleId;
  label: string;
  status: RuleStatus;
}

export interface ValidationResult {
  /** Targa compatta, es. "AB123CD" (solo se completa). */
  compact: string;
  /** Targa formattata con spazi, es. "AB 123 CD" (slot vuoti = "_"). */
  formatted: string;
  complete: boolean;
  valid: boolean;
  slots: SlotState[];
  issues: Issue[];
  rules: RuleCheck[];
}

const RULE_LABELS: Record<RuleId, string> = {
  complete: "Formato AA 000 AA (2 lettere, 3 cifre, 2 lettere)",
  charset: "Solo le 22 lettere ammesse (no I, O, Q, U), cifre 0-9, niente accenti o simboli",
  reserved: "Nessuna serie riservata (X rimorchi, Y Polizia Locale, Z quadrotte, CC, CD, EE)",
  series: "Nessuna sovrapposizione con serie ordinarie già emesse",
  offensive: "Nessuna combinazione offensiva o inopportuna",
  acronym: "Nessuna sigla di corpi dello Stato (potenzialmente ingannevole)",
};

/** Pulisce l'input libero: maiuscolo, senza spazi/trattini/punti. Non rimuove accenti (vanno segnalati). */
export function sanitizeInput(raw: string): string {
  return raw.toLocaleUpperCase("it-IT").replace(/[\s\-._]/g, "");
}

/** Normalizza un array di slot alla lunghezza della targa, un carattere per slot. */
export function toSlots(input: string | readonly string[]): string[] {
  const chars = typeof input === "string" ? Array.from(sanitizeInput(input)) : [...input];
  return Array.from({ length: PLATE_LENGTH }, (_, i) => (chars[i] ?? "").slice(0, 1).toLocaleUpperCase("it-IT"));
}

/** Motivo per cui un carattere non è ammesso in uno slot, o null se va bene. */
export function checkChar(char: string, kind: SlotKind): string | null {
  if (!char) return null;
  if (kind === "letter") {
    if (ALLOWED_LETTERS.includes(char)) return null;
    if (DIGITS.includes(char)) return "Qui va una lettera";
    if (EXCLUDED_LETTERS[char]) return `La lettera ${char} non è ammessa (${EXCLUDED_LETTERS[char]})`;
    if (/\p{L}/u.test(char)) return `"${char}": lettere accentate o di alfabeti stranieri non ammesse`;
    return `"${char}": simboli non ammessi`;
  }
  if (DIGITS.includes(char)) return null;
  if (/\p{L}/u.test(char)) return "Qui va una cifra (0-9)";
  return `"${char}": simboli non ammessi`;
}

/** Indice progressivo di una serie (coppia di lettere iniziali) nell'ordine di emissione. */
export function seriesIndex(pair: string): number {
  const a = ALLOWED_LETTERS.indexOf(pair[0] as (typeof ALLOWED_LETTERS)[number]);
  const b = ALLOWED_LETTERS.indexOf(pair[1] as (typeof ALLOWED_LETTERS)[number]);
  if (a < 0 || b < 0) return -1;
  return a * ALLOWED_LETTERS.length + b;
}

export function isIssuedSeries(pair: string, lastIssued: string = LAST_ISSUED_SERIES): boolean {
  if (RESERVED_FIRST_LETTER[pair[0]]) return false; // serie speciali, gestite a parte
  const idx = seriesIndex(pair);
  return idx >= 0 && idx <= seriesIndex(lastIssued);
}

/** Traduce le cifre nelle lettere che imitano (N4Z1 → NAZI). */
export function deLeet(compact: string): string {
  return Array.from(compact, (c) => LOOKALIKE_DIGITS[c] ?? c).join("");
}

export function findBlockedWords(compact: string): string[] {
  const readable = deLeet(compact);
  const found = new Set<string>();
  for (const word of BLOCKED_WORDS) if (readable.includes(word)) found.add(word);
  for (const pair of [compact.slice(0, 2), compact.slice(5, 7)]) {
    if (BLOCKED_PAIRS.includes(pair)) found.add(pair);
  }
  return [...found];
}

export function formatPlate(slots: readonly string[]): string {
  return PLATE_GROUPS.map(([s, e]) =>
    slots
      .slice(s, e)
      .map((c) => c || "_")
      .join(""),
  ).join(" ");
}

export interface ValidateOptions {
  lastIssuedSeries?: string;
}

export function validatePlate(
  input: string | readonly string[],
  options: ValidateOptions = {},
): ValidationResult {
  const lastIssued = options.lastIssuedSeries ?? LAST_ISSUED_SERIES;
  const chars = toSlots(input);
  const issues: Issue[] = [];

  const slots: SlotState[] = chars.map((char, i) => ({
    char,
    kind: PLATE_PATTERN[i],
    error: checkChar(char, PLATE_PATTERN[i]),
  }));

  // 1. Caratteri ammessi
  for (const [i, slot] of slots.entries()) {
    if (slot.error) {
      issues.push({ rule: "charset", severity: "error", message: `Posizione ${i + 1}: ${slot.error}`, positions: [i] });
    }
  }

  const complete = chars.every(Boolean);
  const charsetOk = slots.every((s) => !s.error);
  const compact = chars.join("");
  const prefix = compact.slice(0, 2);
  const suffix = compact.slice(5, 7);
  const prefixReady = Boolean(chars[0] && chars[1]) && !slots[0].error && !slots[1].error;
  const suffixReady = Boolean(chars[5] && chars[6]) && !slots[5].error && !slots[6].error;

  // 2. Serie riservate
  if (chars[0] && !slots[0].error && RESERVED_FIRST_LETTER[chars[0]]) {
    issues.push({
      rule: "reserved",
      severity: "error",
      message: `Le targhe che iniziano per ${chars[0]} sono ${RESERVED_FIRST_LETTER[chars[0]]}`,
      positions: [0],
    });
  } else if (prefixReady && RESERVED_PREFIXES[prefix]) {
    issues.push({
      rule: "reserved",
      severity: "error",
      message: `La serie ${prefix} è esclusa: ${RESERVED_PREFIXES[prefix]}`,
      positions: [0, 1],
    });
  }

  // 3. Serie già emesse
  if (prefixReady && !RESERVED_PREFIXES[prefix] && isIssuedSeries(prefix, lastIssued)) {
    issues.push({
      rule: "series",
      severity: "error",
      message: `La serie ${prefix} è già stata emessa (serie ordinarie fino a ${lastIssued}): scegli due lettere iniziali successive`,
      positions: [0, 1],
    });
  }

  // 4. Combinazioni offensive (controllo anche su targa parziale, sui caratteri già inseriti)
  const typed = chars.map((c) => c || " ").join("");
  const blocked = typed
    .split(" ")
    .filter((chunk) => chunk.length >= 2)
    .flatMap((chunk) => findBlockedWords(chunk));
  if (complete) blocked.push(...findBlockedWords(compact));
  const uniqueBlocked = [...new Set(blocked)];
  if (uniqueBlocked.length > 0) {
    issues.push({
      rule: "offensive",
      severity: "error",
      message: `Combinazione non consentita: richiama "${uniqueBlocked[0]}"`,
      positions: chars.map((_, i) => i).filter((i) => chars[i]),
    });
  }

  // 5. Sigle di corpi dello Stato (avviso)
  for (const [pair, positions, ready] of [
    [prefix, [0, 1], prefixReady],
    [suffix, [5, 6], suffixReady],
  ] as const) {
    if (!ready || !STATE_ACRONYMS[pair]) continue;
    if (positions[0] === 0 && RESERVED_PREFIXES[pair]) continue; // già segnalato come errore
    issues.push({
      rule: "acronym",
      severity: "warning",
      message: `"${pair}" richiama la sigla ${STATE_ACRONYMS[pair]}: la richiesta potrebbe essere respinta come ingannevole`,
      positions: [...positions],
    });
  }

  const hasIssue = (rule: RuleId, severity: Severity = "error") =>
    issues.some((i) => i.rule === rule && i.severity === severity);

  const statusFor = (rule: RuleId, ready: boolean): RuleStatus => {
    if (hasIssue(rule, "error")) return "fail";
    if (hasIssue(rule, "warning")) return "warn";
    return ready ? "pass" : "pending";
  };

  const rules: RuleCheck[] = [
    { id: "complete", label: RULE_LABELS.complete, status: complete ? "pass" : "pending" },
    { id: "charset", label: RULE_LABELS.charset, status: charsetOk ? (complete ? "pass" : "pending") : "fail" },
    { id: "reserved", label: RULE_LABELS.reserved, status: statusFor("reserved", prefixReady) },
    { id: "series", label: RULE_LABELS.series, status: statusFor("series", prefixReady) },
    { id: "offensive", label: RULE_LABELS.offensive, status: statusFor("offensive", complete && charsetOk) },
    { id: "acronym", label: RULE_LABELS.acronym, status: statusFor("acronym", prefixReady && suffixReady) },
  ];

  const valid = complete && !issues.some((i) => i.severity === "error");

  return {
    compact: complete ? compact : "",
    formatted: formatPlate(chars),
    complete,
    valid,
    slots,
    issues,
    rules,
  };
}

/** Genera una combinazione casuale valida (utile come spunto). */
export function randomPlate(
  random: () => number = Math.random,
  options: ValidateOptions = {},
): string[] {
  const pick = (pool: string) => pool[Math.floor(random() * pool.length)];
  for (let attempt = 0; attempt < 500; attempt++) {
    const slots = PLATE_PATTERN.map((kind) => pick(kind === "letter" ? ALLOWED_LETTERS : DIGITS));
    const result = validatePlate(slots, options);
    if (result.valid && !result.issues.length) return slots;
  }
  throw new Error("Impossibile generare una targa valida con la configurazione attuale");
}
