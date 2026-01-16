import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';

/**
 * =========================================================================================
 * SERVICE: CONTI SERVICE
 * =========================================================================================
 * In Angular, i Service sono classi Singleton (ne esiste una sola istanza per applicazione)
 * che contengono la logica di business e la gestione dei dati.
 *
 * @Injectable({ providedIn: 'root' })
 * Questo decoratore dice ad Angular: "Questa classe è un servizio che può essere iniettato
 * in altri componenti. Creane una sola istanza globale disponibile ovunque (root)".
 */
@Injectable({
  providedIn: 'root'
})
export class ContiService {
  
  /**
   * STATE MANAGEMENT CON RXJS
   * ---------------------------------------------------------------------------------------
   * Utilizziamo un approccio reattivo per gestire lo stato dei conti.
   *
   * 1. `_conti$`: È un `BehaviorSubject`.
   *    - Subject: È sia un Observable (puoi ascoltarlo) che un Observer (puoi emettere valori).
   *    - Behavior: Mantiene in memoria l'ultimo valore emesso. Appena un componente si iscrive,
   *      riceve subito l'ultimo valore disponibile (utile per caricare subito la UI).
   *    - Private: È privato per impedire ai componenti di manipolare direttamente i dati.
   *      Solo questo Service deve avere la responsabilità di modificare lo stato.
   */
  private readonly _conti$ = new BehaviorSubject<BankAccount[]>([
    // Dati iniziali (Mock) per simulare un database
    { id: 1, name: 'Conto Principale', iban: 'IT60X0542811101000000123456', currency: 'EUR' },
    { id: 2, name: 'Conto Risparmi', iban: 'IT75X0100501010000000012345', currency: 'EUR' },
    { id: 3, name: 'USD Account', iban: 'GB29XBAR60161331926819', currency: 'USD' },
  ]);

  /**
   * GETTER OSSERVABILE (READ-ONLY)
   * ---------------------------------------------------------------------------------------
   * Espone lo stato come `Observable`.
   * I componenti useranno questo metodo per "abbonarsi" ai cambiamenti della lista conti.
   * Ogni volta che la lista cambia (aggiunta/rimozione), tutti gli abbonati riceveranno
   * automaticamente il nuovo array aggiornato.
   * 
   * @returns Un Observable che emette array di BankAccount.
   */
  getConti$(): Observable<BankAccount[]> {
    return this._conti$.asObservable();
  }

  /**
   * METODO SINCRONO (SNAPSHOT)
   * ---------------------------------------------------------------------------------------
   * A volte serve ottenere il valore *attuale* senza sottoscriversi a flussi futuri.
   * `this._conti$.value` ci restituisce il valore corrente contenuto nel BehaviorSubject.
   *
   * @param id L'ID del conto da cercare.
   * @returns L'oggetto BankAccount se trovato, altrimenti undefined.
   */
  getContoById(id: number): BankAccount | undefined {
    return this._conti$.value.find(c => c.id === id);
  }

  /**
   * ELIMINAZIONE (IMMUTABILITÀ)
   * ---------------------------------------------------------------------------------------
   * Per eliminare un elemento in un contesto reattivo, non modifichiamo l'array esistente (mutation).
   * Invece, creiamo un NUOVO array che contiene tutti gli elementi tranne quello da eliminare.
   * 
   * Perché immutabile?
   * Angular (e il change detection) rileva i cambiamenti molto più velocemente se l'oggetto/array
   * cambia riferimento in memoria, invece di cambiare solo il suo contenuto interno.
   */
  deleteConto(id: number): void {
    const currentList = this._conti$.value; // Prendo la lista attuale
    const newList = currentList.filter(c => c.id !== id); // Creo nuova lista filtrata
    this._conti$.next(newList); // Emetto la nuova lista a tutti gli iscritti
  }

  /**
   * UPSERT (UPDATE + INSERT)
   * ---------------------------------------------------------------------------------------
   * Un unico metodo per gestire sia la creazione che la modifica.
   * Logica:
   * 1. Copia l'array attuale (Spread Operator `[...]`) per non mutare l'originale.
   * 2. Cerca se l'elemento esiste già (tramite ID).
   * 3. Se esiste -> Sovrascrivi (Update).
   * 4. Se non esiste -> Aggiungi con nuovo ID (Insert).
   */
  upsertConto(conto: BankAccount): void {
    const arr = [...this._conti$.value]; // Copia difensiva (Shallow Copy)
    
    // Controllo se è un aggiornamento (l'oggetto ha un ID valido?)
    if (conto.id) {
      const idx = arr.findIndex(c => c.id === conto.id);
      if (idx >= 0) {
        // UPDATE: Sostituisco l'oggetto all'indice trovato
        // Uso {...conto} per rompere il riferimento all'oggetto originale del form
        arr[idx] = { ...conto }; 
        this._conti$.next(arr); // Notifico il cambiamento
        return;
      }
    }
    
    // INSERT: Se arrivo qui, è un nuovo conto.
    // Calcolo un nuovo ID simulando un database autoincrementale
    // (Prendo l'ID massimo attuale e aggiungo 1)
    const maxId = arr.length ? Math.max(...arr.map(c => c.id)) : 0;
    
    // Aggiungo il nuovo oggetto all'array copiato
    arr.push({ ...conto, id: maxId + 1 });
    
    // Notifico il cambiamento a tutti gli observer
    this._conti$.next(arr); 
  }
}
