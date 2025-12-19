import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';

/**
 * Service responsabile della gestione dei Movimenti Bancari.
 * 
 * Segue lo stesso pattern architetturale del ContiService per coerenza:
 * - Reactive State Management con BehaviorSubject
 * - Operazioni CRUD immutabili
 * - Logica di business centralizzata
 */
@Injectable({ providedIn: 'root' })
export class MovimentiService {
  
  // Inizializzazione con dati mock (finti) per simulare un database
  private readonly _movimenti$ = new BehaviorSubject<BankMovement[]>([
    {
      id: 1,
      accountId: 1,
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
      accountId: 1,
      date: '2025-12-16',
      description: 'Pagamento bolletta luce',
      currency: 'EUR',
      amount: -120.50,
      direction: 'debit',
      category: 'Bolletta',
      balanceAfter: 7379.50,
      createdAt: '2025-12-16T10:30:00Z'
    }
  ]);

  /**
   * Restituisce tutti i movimenti come Observable.
   */
  getMovimenti$(): Observable<BankMovement[]> {
    return this._movimenti$.asObservable();
  }

  /**
   * Restituisce i movimenti filtrati per uno specifico conto.
   * Utilizza l'operatore RxJS `map` per trasformare lo stream dei dati.
   * 
   * @param accountId L'ID del conto di cui si vogliono i movimenti.
   */
  getMovimentiByAccount(accountId: number): Observable<BankMovement[]> {
    return this._movimenti$.pipe(
      // Filtra l'array ogni volta che ne viene emesso uno nuovo
      map(movimenti => movimenti.filter(m => m.accountId === accountId))
    );
  }

  /**
   * Cerca un movimento per ID (sincrono).
   */
  getById(id: number): BankMovement | undefined {
    return this._movimenti$.value.find(m => m.id === id);
  }

  /**
   * Elimina un movimento per ID.
   * Emette un nuovo array privo dell'elemento cancellato.
   */
  delete(id: number): void {
    const current = this._movimenti$.value;
    const updated = current.filter(m => m.id !== id);
    this._movimenti$.next(updated);
  }

  /**
   * Inserisce o Aggiorna un movimento.
   * Gestisce automaticamente l'assegnazione dell'ID per i nuovi inserimenti.
   */
  upsert(mov: BankMovement): void {
    const arr = [...this._movimenti$.value];
    const idx = arr.findIndex(m => m.id === mov.id);
    
    if (idx >= 0) {
      // UPDATE
      arr[idx] = { ...mov }; // Spread operator per sicurezza (copia)
    } else {
      // INSERT
      const nextId = arr.length ? Math.max(...arr.map(m => m.id)) + 1 : 1;
      // Impostiamo la data di creazione se non c'è
      const newMov = { 
        ...mov, 
        id: nextId,
        createdAt: mov.createdAt || new Date().toISOString()
      };
      arr.push(newMov);
    }
    
    this._movimenti$.next(arr);
  }
}
