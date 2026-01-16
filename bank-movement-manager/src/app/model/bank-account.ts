/**
 * =========================================================================================
 * INTERFACCIA BANK ACCOUNT
 * =========================================================================================
 * In TypeScript, un'interfaccia è un "contratto" che definisce la struttura di un oggetto.
 * A differenza delle classi, le interfacce esistono solo durante lo sviluppo (compile-time)
 * e vengono rimosse completamente quando il codice viene trasformato in JavaScript.
 *
 * PERCHÉ USARLE?
 * 1. Autocompletamento: L'IDE (VS Code) può suggerirti le proprietà disponibili.
 * 2. Type Checking: Il compilatore ti avvisa se sbagli a scrivere il nome di una proprietà
 *    o se assegni un tipo di dato errato (es. una stringa al posto di un numero).
 * 3. Documentazione: Chiunque legga il codice capisce subito com'è fatto un oggetto "Conto".
 */
export interface BankAccount {
  /**
   * Identificativo univoco del conto (Primary Key).
   * - Tipo: number
   * - Ruolo: Permette di distinguere univocamente questo conto da tutti gli altri nel database.
   * - Nota: Di solito è generato automaticamente dal server/database (autoincrement o UUID).
   */
  id: number;

  /**
   * Nome descrittivo del conto scelto dall'utente.
   * - Esempio: "Conto Risparmi", "Conto Aziendale", "Fondo Vacanze".
   * - Utilità: Aiuta l'utente a riconoscere il conto nella dashboard.
   */
  name: string;

  /**
   * Codice IBAN (International Bank Account Number).
   * - Formato standard internazionale per identificare conti bancari.
   * - Nota: In un'app reale, questo campo richiederebbe una validazione specifica (Regex)
   *   per assicurarsi che il formato sia corretto (es. lunghezza, lettere iniziali, ecc.).
   */
  iban: string;

  /**
   * Valuta del conto.
   * - Formato: Codice ISO 4217 a 3 lettere (es. 'EUR', 'USD', 'GBP').
   * - Importanza: Fondamentale per calcoli finanziari corretti. Non si dovrebbero mai
   *   sommare importi di valute diverse senza una conversione (tasso di cambio).
   */
  currency: string;
}
