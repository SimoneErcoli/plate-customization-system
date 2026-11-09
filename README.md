# Targa Personalizzata

Configuratore Next.js per comporre una **targa personalizzata italiana** nel formato ufficiale `AA 000 AA`, con anteprima realistica e verifica delle regole in tempo reale.

## Funzionalità

- Editor a 7 caselle (2 lettere · 3 cifre · 2 lettere) con navigazione da tastiera, incolla e tastiera a schermo che mostra solo i caratteri ammessi nella posizione attiva.
- Anteprima SVG della targa posteriore (520×110 mm) con banda UE, anno di immatricolazione e sigla provincia facoltativi.
- Verifica delle regole:
  - solo le 22 lettere ammesse (escluse **I, O, Q, U**), cifre 0-9, niente accenti/simboli;
  - serie riservate: **X** (rimorchi), **Y** (Polizia Locale), **Z** (quadrotte), **CC**, **CD**, **EE**;
  - nessuna sovrapposizione con serie ordinarie già emesse;
  - filtro su combinazioni offensive, anche camuffate con cifre (`N4Z1` → `NAZI`);
  - avviso per sigle di corpi dello Stato (PS, VF, GF, …).
- Export PNG/SVG con font incorporato e link condivisibile (`?targa=MR123KP`).

## Avvio

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # test della logica di validazione
```

## Configurazione

Le regole sono in [`src/lib/plate/config.ts`](src/lib/plate/config.ts). In particolare:

- `LAST_ISSUED_SERIES`: ultima serie ordinaria emessa (default `HH`, sovrascrivibile con `NEXT_PUBLIC_LAST_ISSUED_SERIES`). Va aggiornata con il dato ufficiale.
- `BLOCKED_WORDS`, `STATE_ACRONYMS`, `PRICE_EUR`: liste e costi, da allineare ai regolamenti attuativi.

## Note

Strumento indicativo, non collegato alla Motorizzazione. I regolamenti attuativi e i costi (600 € auto / 360 € moto nello schema di decreto) non sono ancora definitivi. Il font è Barlow Condensed (OFL), un'approssimazione del carattere ufficiale.
