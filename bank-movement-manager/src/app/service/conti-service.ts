import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';

@Injectable({
  providedIn: 'root'
})
export class ContiService {
  private readonly _conti$ = new BehaviorSubject<BankAccount[]>([
    { id: 1, name: 'Conto Principale', iban: 'IT60X0542811101000000123456', currency: 'EUR' },
    { id: 2, name: 'Conto Risparmi', iban: 'IT75X0100501010000000012345', currency: 'EUR' },
    { id: 3, name: 'USD Account', iban: 'GB29XBAR60161331926819', currency: 'USD' },
  ]);

  getConti$(): Observable<BankAccount[]> {
    return this._conti$.asObservable();
  }

  getContoById(id: number): BankAccount | undefined {
    return this._conti$.value.find(c => c.id === id);
  }

  deleteConto(id: number): void {
    this._conti$.next(this._conti$.value.filter(c => c.id !== id));
  }

  upsertConto(conto: BankAccount): void {
    const arr = [...this._conti$.value]; // spread invece di slice
    
    if (conto.id) {
      const idx = arr.findIndex(c => c.id === conto.id);
      if (idx >= 0) {
        arr[idx] = { ...conto }; // clone per sicurezza
        this._conti$.next(arr);
        return;
      }
    }
    
    // Creazione nuovo
    const maxId = arr.length ? Math.max(...arr.map(c => c.id)) : 0;
    arr.push({ ...conto, id: maxId + 1 });
    this._conti$.next(arr);
  }
}