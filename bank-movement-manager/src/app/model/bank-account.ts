/**
 * Interfaccia che definisce la struttura dati di un Conto Bancario.
 * 
 * In TypeScript, le interfacce sono utilizzate esclusivamente durante la fase di sviluppo
 * per garantire che gli oggetti abbiano la forma corretta. Non generano codice JavaScript
 * compilato.
 * 
 * @interface BankAccount
 */
export interface BankAccount {
  /**
   * Identificativo univoco del conto.
   * Viene generato automaticamente dal backend (o simulato nel service).
   * Non dovrebbe mai essere modificato manualmente.
   */
  id: number;

  /**
   * Nome descrittivo del conto (es. "Conto Corrente Principale", "Risparmi").
   * Visibile all'utente nella dashboard.
   */
  name: string;

  /**
   * Codice IBAN (International Bank Account Number).
   * Identifica univocamente il conto a livello internazionale.
   * Formato: 2 lettere (Paese) + 2 cifre (Controllo) + Alfanumerici.
   */
  iban: string;

  /**
   * Valuta del conto (codice ISO 4217).
   * Esempi: 'EUR', 'USD', 'GBP'.
   * Determina come vengono visualizzati gli importi.
   */
  currency: string;
}
