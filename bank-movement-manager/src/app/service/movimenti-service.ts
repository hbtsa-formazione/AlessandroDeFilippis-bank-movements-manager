import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';

/**
 * =========================================================================================
 * SERVICE: MOVIMENTI SERVICE
 * =========================================================================================
 * Gestisce la logica CRUD (Create, Read, Update, Delete) per i movimenti bancari.
 * Segue gli stessi pattern del `ContiService` per coerenza architetturale.
 */
@Injectable({ providedIn: 'root' })
export class MovimentiService {
  
  /**
   * Database simulato in memoria (In-Memory Store).
   * Contiene la lista di tutti i movimenti di tutti i conti.
   */
  private readonly _movimenti$ = new BehaviorSubject<BankMovement[]>([
    {
      id: 1,
      accountId: 1, // Collegato al Conto ID 1
      date: '2025-12-15',
      description: 'Stipendio Dicembre',
      currency: 'EUR',
      amount: 2500.00,
      direction: 'credit',
      category: 'Stipendio',
      balanceAfter: 7500.00,
      createdAt: '2025-12-15T09:00:00Z'
    },
    {
      id: 2,
      accountId: 1, // Collegato al Conto ID 1
      date: '2025-12-16',
      description: 'Pagamento bolletta luce',
      currency: 'EUR',
      amount: -120.50, // Importo negativo = Uscita
      direction: 'debit',
      category: 'Bolletta',
      balanceAfter: 7379.50,
      createdAt: '2025-12-16T10:30:00Z'
    }
  ]);

  /**
   * Restituisce il flusso completo di tutti i movimenti.
   */
  getMovimenti$(): Observable<BankMovement[]> {
    return this._movimenti$.asObservable();
  }

  /**
   * OPERATORE PIPE E MAP
   * ---------------------------------------------------------------------------------------
   * Questo metodo restituisce un Observable che emette SOLO i movimenti di un certo conto.
   * 
   * `.pipe()`: È un metodo degli Observable che permette di concatenare operazioni di trasformazione.
   * `map(...)`: È un operatore RxJS che prende i dati emessi (l'array completo) e li trasforma.
   * 
   * In questo caso: Array Completo -> Filtro per accountId -> Array Filtrato.
   * Il componente che si iscrive a questo metodo riceverà aggiornamenti solo quando
   * la lista filtrata cambia.
   */
  getMovimentiByAccount(accountId: number): Observable<BankMovement[]> {
    return this._movimenti$.pipe(
      map(movimenti => movimenti.filter(m => m.accountId === accountId))
    );
  }

  /**
   * Recupera un singolo movimento per ID (utile per l'edit form).
   */
  getById(id: number): BankMovement | undefined {
    return this._movimenti$.value.find(m => m.id === id);
  }

  /**
   * Elimina un movimento dalla lista globale.
   */
  delete(id: number): void {
    const current = this._movimenti$.value;
    const updated = current.filter(m => m.id !== id);
    this._movimenti$.next(updated);
  }

  /**
   * Inserisce o Aggiorna un movimento.
   * Gestisce anche l'assegnazione automatica della data di creazione (`createdAt`).
   */
  upsert(mov: BankMovement): void {
    const arr = [...this._movimenti$.value];
    const idx = arr.findIndex(m => m.id === mov.id);
    
    if (idx >= 0) {
      // UPDATE: Se trovato, sostituisci
      arr[idx] = { ...mov };
    } else {
      // INSERT: Se nuovo, calcola ID e aggiungi
      const nextId = arr.length ? Math.max(...arr.map(m => m.id)) + 1 : 1;
      
      const newMov = { 
        ...mov, 
        id: nextId,
        // Se non è fornita una data creazione, usa quella attuale
        createdAt: mov.createdAt || new Date().toISOString()
      };
      
      arr.push(newMov);
    }
    
    // Emette il nuovo stato dell'array
    this._movimenti$.next(arr);
  }
}
