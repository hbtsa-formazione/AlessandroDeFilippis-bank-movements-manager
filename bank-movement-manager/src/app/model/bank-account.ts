
export interface BankAccount {
  id: number;      // generato automaticamente, non mostrato all'utente
  name: string;    // Nome del conto
  iban: string;    // Codice IBAN
  currency: string;// 'EUR', 'USD', 'GBP', ...
}
