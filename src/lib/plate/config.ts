/**
 * Parametri normativi della targa personalizzata italiana.
 *
 * Alcuni valori dipendono dai regolamenti attuativi della Motorizzazione
 * (non ancora pubblicati in forma definitiva): sono isolati qui per poterli
 * aggiornare senza toccare la logica di validazione.
 */

/** 22 lettere ammesse: sono escluse I, O, Q, U (confondibili con 1 e 0). */
export const ALLOWED_LETTERS = "ABCDEFGHJKLMNPRSTVWXYZ" as const;

export const EXCLUDED_LETTERS: Record<string, string> = {
  I: "si confonde con la cifra 1",
  O: "si confonde con la cifra 0",
  Q: "si confonde con la cifra 0",
  U: "si confonde con la lettera V",
};

export const DIGITS = "0123456789" as const;

export type SlotKind = "letter" | "digit";

/** Formato AA 000 AA: 2 lettere, 3 cifre, 2 lettere. */
export const PLATE_PATTERN: readonly SlotKind[] = [
  "letter",
  "letter",
  "digit",
  "digit",
  "digit",
  "letter",
  "letter",
] as const;

export const PLATE_LENGTH = PLATE_PATTERN.length;

/** Gruppi visivi della targa (indici di inizio/fine, fine esclusa). */
export const PLATE_GROUPS: readonly [number, number][] = [
  [0, 2],
  [2, 5],
  [5, 7],
];

/**
 * Ultima serie ordinaria emessa (prime due lettere).
 * Le combinazioni che ricadono in serie già emesse non sono assegnabili.
 * HA è stata avviata a maggio 2025: aggiornare con il dato ufficiale.
 */
export const LAST_ISSUED_SERIES = process.env.NEXT_PUBLIC_LAST_ISSUED_SERIES ?? "HH";

/** Prefissi (prima lettera) riservati a categorie speciali. */
export const RESERVED_FIRST_LETTER: Record<string, string> = {
  X: "riservata ai rimorchi",
  Y: "riservata alla Polizia Locale",
  Z: "riservata alle targhe quadrate (quadrotte)",
};

/** Coppie iniziali riservate o escluse. */
export const RESERVED_PREFIXES: Record<string, string> = {
  CC: "confondibile con le targhe del Corpo Consolare",
  CD: "confondibile con le targhe del Corpo Diplomatico",
  EE: "riservata agli Escursionisti Esteri",
};

/**
 * Sigle di corpi dello Stato o enti: in qualsiasi posizione rendono la targa
 * potenzialmente ingannevole. Generano un avviso (la decisione finale spetta
 * alla Motorizzazione).
 */
export const STATE_ACRONYMS: Record<string, string> = {
  CC: "Carabinieri / Corpo Consolare",
  CD: "Corpo Diplomatico",
  EE: "Escursionisti Esteri",
  PS: "Polizia di Stato",
  PP: "Polizia Penitenziaria",
  GF: "Guardia di Finanza",
  VF: "Vigili del Fuoco",
  CP: "Capitanerie di Porto",
  AM: "Aeronautica Militare",
  MM: "Marina Militare",
  PL: "Polizia Locale",
};

/**
 * Radici offensive o inopportune. Il controllo è fatto sulla stringa compatta
 * dopo aver "tradotto" le cifre nelle lettere che imitano (0→O, 1→I, 3→E, ...),
 * così da intercettare anche i giochi tipo "N4Z1".
 */
export const BLOCKED_WORDS: readonly string[] = [
  "CAZZ",
  "CAZ",
  "MERD",
  "MRD",
  "STRONZ",
  "TROIA",
  "TROI",
  "PUTT",
  "PUTAN",
  "ZOCCOL",
  "FIGA",
  "MINCHI",
  "COGLION",
  "BASTARD",
  "VAFFA",
  "VFF",
  "FANCUL",
  "TETT",
  "CULO",
  "PENE",
  "SESSO",
  "SEX",
  "PORN",
  "FUCK",
  "FCK",
  "SHIT",
  "BITCH",
  "DICK",
  "NAZI",
  "NAZ",
  "DUCE",
  "HITLER",
  "HTLR",
  "KKK",
  "ISIS",
  "MAFIA",
  "DIO",
  "MADONN",
  "GESU",
  "PORC",
];

/** Radici troppo corte per il controllo "per sottostringa": confronto solo su coppie di lettere. */
export const BLOCKED_PAIRS: readonly string[] = ["SS", "BR", "WC"];

/** Cifre che imitano lettere (leetspeak). */
export const LOOKALIKE_DIGITS: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "3": "E",
  "4": "A",
  "5": "S",
  "6": "G",
  "7": "T",
  "8": "B",
  "9": "G",
};

/** Costo indicato nello schema di decreto (bozza, da confermare). */
export const PRICE_EUR = { auto: 600, moto: 360 } as const;

/** Sigle delle province italiane (banda destra, opzionale). */
export const PROVINCES: readonly string[] = [
  "AG", "AL", "AN", "AO", "AP", "AQ", "AR", "AT", "AV", "BA", "BG", "BI", "BL",
  "BN", "BO", "BR", "BS", "BT", "BZ", "CA", "CB", "CE", "CH", "CL", "CN", "CO",
  "CR", "CS", "CT", "CZ", "EN", "FC", "FE", "FG", "FI", "FM", "FR", "GE", "GO",
  "GR", "IM", "IS", "KR", "LC", "LE", "LI", "LO", "LT", "LU", "MB", "MC", "ME",
  "MI", "MN", "MO", "MS", "MT", "NA", "NO", "NU", "OR", "PA", "PC", "PD", "PE",
  "PG", "PI", "PN", "PO", "PR", "PT", "PU", "PV", "PZ", "RA", "RC", "RE", "RG",
  "RI", "RM", "RN", "RO", "SA", "SI", "SO", "SP", "SR", "SS", "SU", "SV", "TA",
  "TE", "TN", "TO", "TP", "TR", "TS", "TV", "UD", "VA", "VB", "VC", "VE", "VI",
  "VR", "VT", "VV",
];
