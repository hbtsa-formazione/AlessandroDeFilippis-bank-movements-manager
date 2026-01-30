/**
 * =========================================================================================
 * INTERFACCIA CONTI CONTABILI
 * =========================================================================================
 * Modello dati per un conto contabile (piano dei conti).
 * Serve per tipizzare il form e la tabella dei conti contabili.
 */
export interface ContiContabili {
  /**
   * Nome descrittivo del conto contabile.
   */
  nome: any;
  /**
   * Identificativo univoco del conto.
   */
  id: number;
  /**
   * Codice del conto (es. "CC001").
   */
  code: string;
  /**
   * Descrizione estesa del conto.
   */
  description: string;
  /**
   * Macro-tipologia del conto (es. CORRENTI, DEPOSITI).
   */
  type: string;
}
