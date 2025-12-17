import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';

@Injectable({ providedIn: 'root' })
export class MovimentiService {
  private readonly _movimenti$ = new BehaviorSubject<BankMovement[]>([
    {
      id: 1,
      accountId: 1,
      date: '2025-12-15',
      description: 'Stipendio',
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
      balanceAfter: 7379.50, // Aggiunto per consistenza
      createdAt: '2025-12-16T10:30:00Z'
    }
  ]);

  getMovimenti$(): Observable<BankMovement[]> {
    return this._movimenti$.asObservable();
  }

  getMovimentiByAccount(accountId: number): Observable<BankMovement[]> {
    return this._movimenti$.pipe(
      map(movimenti => movimenti.filter(m => m.accountId === accountId))
    );
  }

  getById(id: number): BankMovement | undefined {
    return this._movimenti$.value.find(m => m.id === id);
  }

  delete(id: number): void {
    this._movimenti$.next(
      this._movimenti$.value.filter(m => m.id !== id)
    );
  }

  upsert(mov: BankMovement): void {
    const arr = [...this._movimenti$.value];
    const idx = arr.findIndex(m => m.id === mov.id);
    
    if (idx >= 0) {
      arr[idx] = mov; // update
    } else {
      // insert con nuovo ID
      const nextId = arr.length ? Math.max(...arr.map(m => m.id)) + 1 : 1;
      arr.push({ ...mov, id: nextId });
    }
    
    this._movimenti$.next(arr);
  }
}