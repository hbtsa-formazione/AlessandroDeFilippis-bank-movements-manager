
export interface BankMovement {
  /** Identificativo univoco numerico (generato automaticamente, non visibile all'utente) */
  id: number;

  /** Chiave esterna verso il conto bancario principale del movimento */
  accountId: number;

  /** Data del movimento (ISO 8601 consigliato) */
  date: string; // es. '2025-12-17' o '2025-12-17T14:03:00Z'
  // In alternativa: date: Date;

  /** Descrizione testuale del movimento */
  description: string;

  /** Valuta del movimento (es. 'EUR', 'USD', 'GBP') */
  currency: string;

  /**
   * Importo del movimento.
   * Convenzione: positivo = accredito (entrata), negativo = addebito (uscita).
   */
  amount: number;

  /**
   * Direzione (facoltativa) utile per UI/filtri.
   * Se preferisci, puoi derivarla da amount (>0 = 'credit', <0 = 'debit').
   */
  direction?: 'credit' | 'debit';

  /**
   * Categoria (facoltativa): es. 'Bonifico', 'Stipendio', 'Bolletta', 'POS', 'F24', ecc.
   */
  category?: string;

  /**
   * Saldo del conto subito dopo l'applicazione del movimento (snapshot opzionale).
   * Utile per audit o ricostruzione storica senza ricalcoli.
   */
  balanceAfter?: number;

  /**
   * Dati controparte (facoltativi):
   * - Se la controparte è un conto interno: usa counterpartyAccountId
   * - Se è esterna (non censita): usa counterpartyIban
   * Puoi usare solo uno dei due, o nessuno.
   */
  counterpartyAccountId?: number;
  counterpartyIban?: string;

  /**
   * Metadati opzionali (audit / tracciamento)
   */
  createdAt?: string; // ISO datetime
  updatedAt?: string; // ISO datetime
}
