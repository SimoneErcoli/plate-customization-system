import { PlateBuilder } from "@/components/PlateBuilder";

const RULES = [
  ["Formato invariato", "7 caratteri: 2 lettere, 3 cifre, 2 lettere (AA 000 AA). Font, colori e bande blu restano quelli ufficiali."],
  ["22 lettere", "Escluse I, O, Q e U per non confonderle con 1, 0 e V. Niente accenti, alfabeti stranieri o simboli."],
  ["Serie riservate", "Non si possono usare le serie X (rimorchi), Y (Polizia Locale), Z (quadrotte), né CC, CD ed EE."],
  ["Niente doppioni", "La combinazione non può sovrapporsi a serie ordinarie già emesse o a targhe già assegnate."],
  ["Niente abusi", "Vietate combinazioni offensive, ingannevoli o che richiamano corpi dello Stato."],
  ["Legata al veicolo", "La targa resta associata al veicolo, non al proprietario."],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#003399]">Nuovo Codice della Strada</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Crea la tua targa personalizzata</h1>
        <p className="mt-3 text-slate-600">
          Componi la combinazione nel formato italiano <span className="plate-font text-lg">AA 000 AA</span>: ogni
          carattere viene controllato in tempo reale rispetto alle regole previste per le targhe personalizzate.
        </p>
      </header>

      <PlateBuilder />

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-semibold text-slate-900">Le regole in breve</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map(([title, text]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Strumento indicativo, non collegato alla Motorizzazione Civile. Le regole seguono quanto riportato finora sulla
          riforma del Codice della Strada; i regolamenti attuativi, i costi definitivi e la data di avvio delle richieste
          (indicata per il 1° gennaio 2028) potrebbero cambiare. Il carattere usato è un&apos;approssimazione di quello
          ufficiale.
        </p>
      </section>
    </main>
  );
}
