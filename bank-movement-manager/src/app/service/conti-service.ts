import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';

/**
 * Service responsabile della gestione dei Conti Bancari.
 * 
 * Pattern utilizzati:
 * - **Singleton**: Grazie a `providedIn: 'root'`, esiste una sola istanza di questo service in tutta l'app.
 * - **State Management (RxJS)**: Utilizza `BehaviorSubject` per mantenere lo stato corrente dei conti e 
 *   permettere ai componenti di "reagire" ai cambiamenti (Reactive Programming).
 */
@Injectable({
  providedIn: 'root'
})
export class ContiService {
  
  /**
   * `_conti$` è il "Single Source of Truth" (unica fonte di verità) per lo stato dei conti.
   * È privato perché non vogliamo che i componenti possano emettere nuovi valori direttamente.
   * 
   * BehaviorSubject è un tipo speciale di Observable che:
   * 1. Ha sempre un valore corrente (valore iniziale richiesto).
   * 2. Emette l'ultimo valore a chiunque si iscriva (subscribe).
   */
  private readonly _conti$ = new BehaviorSubject<BankAccount[]>([
    { id: 1, name: 'Conto Principale', iban: 'IT60X0542811101000000123456', currency: 'EUR' },
    { id: 2, name: 'Conto Risparmi', iban: 'IT75X0100501010000000012345', currency: 'EUR' },
    { id: 3, name: 'USD Account', iban: 'GB29XBAR60161331926819', currency: 'USD' },
  ]);

  /**
   * Espone lo stream dei conti come `Observable` (sola lettura).
   * I componenti useranno questo metodo per visualizzare i dati (spesso con la pipe `| async`).
   * 
   * @returns Un Observable che emette l'array di conti ogni volta che cambia.
   */
  getConti$(): Observable<BankAccount[]> {
    return this._conti$.asObservable();
  }

  /**
   * Recupera un singolo conto dato il suo ID.
   * Nota: Questo metodo è sincrono e restituisce un valore snapshot (istantaneo).
   * 
   * @param id L'identificativo del conto da cercare.
   * @returns L'oggetto BankAccount se trovato, altrimenti undefined.
   */
  getContoById(id: number): BankAccount | undefined {
    return this._conti$.value.find(c => c.id === id);
  }

  /**
   * Elimina un conto dalla lista.
   * 
   * L'approccio è immutabile: invece di modificare l'array esistente,
   * ne creiamo uno nuovo filtrando via l'elemento da rimuovere.
   * Questo aiuta Angular a rilevare i cambiamenti in modo efficiente.
   * 
   * @param id L'identificativo del conto da eliminare.
   */
  deleteConto(id: number): void {
    const currentList = this._conti$.value;
    const newList = currentList.filter(c => c.id !== id);
    this._conti$.next(newList); // Emettiamo il nuovo stato
  }

  /**
   * Gestisce sia l'inserimento (Insert) che l'aggiornamento (Update) di un conto.
   * 
   * Se il conto ha un ID esistente nella lista -> Aggiorna.
   * Se il conto non ha ID o l'ID non esiste -> Crea nuovo.
   * 
   * @param conto L'oggetto BankAccount da salvare.
   */
  upsertConto(conto: BankAccount): void {
    const arr = [...this._conti$.value]; // Creiamo una copia superficiale (shallow copy) dell'array
    
    // Cerchiamo se esiste già
    if (conto.id) {
      const idx = arr.findIndex(c => c.id === conto.id);
      if (idx >= 0) {
        // UPDATE: Sostituiamo l'oggetto esistente con una copia del nuovo
        arr[idx] = { ...conto }; 
        this._conti$.next(arr);
        return;
      }
    }
    
    // INSERT: Calcoliamo il nuovo ID (massimo attuale + 1)
    const maxId = arr.length ? Math.max(...arr.map(c => c.id)) : 0;
    arr.push({ ...conto, id: maxId + 1 });
    
    this._conti$.next(arr); // Emettiamo la nuova lista aggiornata
  }
}
