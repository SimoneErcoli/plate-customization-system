import { describe, expect, it } from "vitest";
import { ALLOWED_LETTERS } from "./config";
import {
  checkChar,
  deLeet,
  formatPlate,
  isIssuedSeries,
  randomPlate,
  sanitizeInput,
  seriesIndex,
  toSlots,
  validatePlate,
} from "./validate";

const opts = { lastIssuedSeries: "HH" };

describe("configurazione", () => {
  it("usa 22 lettere senza I, O, Q, U", () => {
    expect(ALLOWED_LETTERS).toHaveLength(22);
    for (const l of "IOQU") expect(ALLOWED_LETTERS).not.toContain(l);
  });
});

describe("input", () => {
  it("normalizza maiuscole, spazi e trattini", () => {
    expect(sanitizeInput("lm 123-kp")).toBe("LM123KP");
    expect(toSlots("lm 123 kp")).toEqual(["L", "M", "1", "2", "3", "K", "P"]);
    expect(toSlots("LM1")).toEqual(["L", "M", "1", "", "", "", ""]);
  });

  it("formatta con i gruppi AA 000 AA", () => {
    expect(formatPlate(toSlots("LM123KP"))).toBe("LM 123 KP");
    expect(formatPlate(toSlots("LM1"))).toBe("LM 1__ __");
  });
});

describe("checkChar", () => {
  it("rifiuta lettere escluse, accenti, simboli e tipo sbagliato", () => {
    expect(checkChar("A", "letter")).toBeNull();
    expect(checkChar("I", "letter")).toMatch(/non è ammessa/);
    expect(checkChar("O", "letter")).toMatch(/non è ammessa/);
    expect(checkChar("Ü", "letter")).toMatch(/accentate/);
    expect(checkChar("Ñ", "letter")).toMatch(/accentate/);
    expect(checkChar("@", "letter")).toMatch(/simboli/);
    expect(checkChar("5", "letter")).toMatch(/lettera/);
    expect(checkChar("5", "digit")).toBeNull();
    expect(checkChar("A", "digit")).toMatch(/cifra/);
  });
});

describe("serie", () => {
  it("ordina le serie secondo l'alfabeto delle 22 lettere", () => {
    expect(seriesIndex("AA")).toBe(0);
    expect(seriesIndex("AB")).toBe(1);
    expect(seriesIndex("BA")).toBe(22);
    expect(seriesIndex("IA")).toBe(-1);
  });

  it("riconosce le serie già emesse", () => {
    expect(isIssuedSeries("AB", "HH")).toBe(true);
    expect(isIssuedSeries("HH", "HH")).toBe(true);
    expect(isIssuedSeries("HJ", "HH")).toBe(false);
    expect(isIssuedSeries("MR", "HH")).toBe(false);
  });
});

describe("validatePlate", () => {
  it("accetta una combinazione valida", () => {
    const r = validatePlate("MR 123 KP", opts);
    expect(r.valid).toBe(true);
    expect(r.compact).toBe("MR123KP");
    expect(r.issues).toEqual([]);
    expect(r.rules.every((rule) => rule.status === "pass")).toBe(true);
  });

  it("segnala formato incompleto senza errori", () => {
    const r = validatePlate("MR12", opts);
    expect(r.complete).toBe(false);
    expect(r.valid).toBe(false);
    expect(r.issues).toEqual([]);
  });

  it("rifiuta lettere escluse nella posizione giusta", () => {
    const r = validatePlate("MR 123 KO", opts);
    expect(r.valid).toBe(false);
    expect(r.slots[6].error).toMatch(/O non è ammessa/);
    expect(r.issues[0].positions).toEqual([6]);
  });

  it("rifiuta cifre al posto delle lettere e viceversa", () => {
    expect(validatePlate("M1 123 KP", opts).slots[1].error).toBeTruthy();
    expect(validatePlate("MR 1A3 KP", opts).slots[3].error).toBeTruthy();
  });

  it("rifiuta le serie riservate X, Y, Z, CC, CD, EE", () => {
    for (const p of ["XA 123 KP", "YB 123 KP", "ZA 123 KP", "CC 123 KP", "CD 123 KP", "EE 123 KP"]) {
      const r = validatePlate(p, opts);
      expect(r.valid, p).toBe(false);
      expect(r.issues.some((i) => i.rule === "reserved"), p).toBe(true);
    }
  });

  it("rifiuta le serie ordinarie già emesse", () => {
    const r = validatePlate("AB 123 KP", opts);
    expect(r.valid).toBe(false);
    expect(r.issues.map((i) => i.rule)).toContain("series");
    expect(validatePlate("AB 123 KP", { lastIssuedSeries: "AA" }).valid).toBe(true);
  });

  it("rifiuta combinazioni offensive anche camuffate con cifre", () => {
    expect(validatePlate("NA 210 PP", opts).issues.map((i) => i.rule)).toContain("offensive"); // NAZI
    expect(validatePlate("MR 123 SS", opts).issues.map((i) => i.rule)).toContain("offensive");
    expect(deLeet("N4Z1")).toBe("NAZI");
  });

  it("avvisa per le sigle di corpi dello Stato senza bloccare", () => {
    const r = validatePlate("MR 123 VF", opts);
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0].severity).toBe("warning");
    expect(r.rules.find((rule) => rule.id === "acronym")?.status).toBe("warn");
  });
});

describe("randomPlate", () => {
  it("genera sempre targhe valide", () => {
    let seed = 42;
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 200; i++) {
      expect(validatePlate(randomPlate(rng, opts), opts).valid).toBe(true);
    }
  });
});
