/**
 * =========================================================================================
 * INTERFACCIA BANK MOVEMENT
 * =========================================================================================
 * Rappresenta una singola transazione bancaria (un movimento di denaro).
 * Questa struttura dati è fondamentale per tenere traccia dello storico delle operazioni.
 */
export interface BankMovement {
  /**
   * Identificativo univoco del movimento.
   * Necessario per operazioni di modifica o cancellazione specifiche di una riga.
   */
  id: number;

  /**
   * Foreign Key (Chiave Esterna) verso il Conto Bancario.
   * - Relazione: Collega questo movimento a uno specifico `BankAccount`.
   * - Significato: "Questo movimento appartiene al conto con ID X".
   * - Database: Corrisponde alla colonna `account_id` in una tabella SQL relazionale.
   */
  accountId: number;

  /**
   * Data dell'operazione.
   * - Formato consigliato: Stringa ISO 8601 (es. "2023-12-25") per massima compatibilità.
   * - Perché stringa? Spesso i JSON restituiti dalle API usano stringhe per le date.
   *   Angular offre la `DatePipe` per formattarle facilmente nel template HTML.
   */
  date: string;

  /**
   * Descrizione o Causale del movimento.
   * - Esempio: "Bonifico stipendio", "Pagamento Amazon", "Prelievo Bancomat".
   */
  description: string;

  /**
   * Valuta della transazione.
   * - Best Practice: Dovrebbe corrispondere alla valuta del conto (`accountId`),
   *   oppure il sistema dovrebbe gestire la conversione di valuta.
   */
  currency: string;

  /**
   * Importo della transazione.
   * - Valore positivo (+): Entrata / Accredito (es. Stipendio).
   * - Valore negativo (-): Uscita / Addebito (es. Spesa).
   * - Tipo: number (attenzione ai calcoli in virgola mobile in JS, per app bancarie reali
   *   si usano spesso interi rappresentanti i centesimi o librerie come Decimal.js).
   */
  amount: number;

  /**
   * (Opzionale) Direzione del movimento.
   * - 'credit': Entrata.
   * - 'debit': Uscita.
   * - Nota: Questo campo è ridondante se usiamo il segno +/- di `amount`, ma può essere
   *   utile per facilitare la logica di visualizzazione (es. icone freccia su/giù).
   *   Il punto interrogativo `?` indica che la proprietà non è obbligatoria.
   */
  direction?: 'credit' | 'debit';

  /**
   * (Opzionale) Categoria di spesa.
   * - Utile per generare grafici e statistiche (es. "Quanto ho speso in Cibo?").
   */
  category?: string;

  /**
   * (Opzionale) Saldo dopo l'operazione.
   * - Snapshot del saldo del conto subito dopo questo movimento.
   * - Utile per ricostruire l'andamento del saldo nel tempo senza ricalcolarlo da zero.
   */
  balanceAfter?: number;

  /**
   * (Opzionale) Data e ora di creazione del record nel sistema.
   * - Diverso da `date` (data valuta): questa è la data tecnica di inserimento.
   */
  createdAt?: string;
}
