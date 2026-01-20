import { Injectable } from '@angular/core'; // Importiamo il decoratore base per i servizi
import { HttpClient } from '@angular/common/http'; // Importiamo il client HTTP per fare chiamate API
import { BehaviorSubject, Observable, tap } from 'rxjs'; // Importiamo gli strumenti per la programmazione reattiva
import { BankAccount } from '../model/bank-account'; // Importiamo l'interfaccia del nostro modello dati

/**
 * =========================================================================================
 * SERVICE: CONTI SERVICE
 * =========================================================================================
 * Questa classe gestisce tutte le operazioni sui conti bancari.
 * Fa da "ponte" tra i componenti Angular (la vista) e il server C# (i dati).
 */
@Injectable({
  providedIn: 'root' // Rende questo servizio disponibile in tutta l'applicazione (Singleton)
})
export class ContiService {
  
  // URL base dell'API C#. Deve corrispondere a quello mostrato da "dotnet run".
  // Se il backend cambia porta, bisogna aggiornare solo questa riga.
  private readonly apiUrl = 'http://localhost:5051/api/conti';

  // BehaviorSubject è un tipo speciale di Observable che:
  // 1. Ha un valore corrente (lo stato attuale).
  // 2. Emette il valore corrente a chiunque si iscriva (subscribe).
  // Lo usiamo per tenere sincronizzati tutti i componenti che mostrano la lista dei conti.
  private _conti$ = new BehaviorSubject<BankAccount[]>([]);

  /**
   * COSTRUTTORE
   * Viene chiamato una volta sola quando l'app parte.
   * @param http - Il client HttpClient iniettato da Angular per fare richieste web.
   */
  constructor(private http: HttpClient) {
    // Appena il servizio nasce, proviamo a caricare i dati dal server.
    this.loadAll();
  }

  /**
   * Restituisce l'Observable dei conti.
   * I componenti useranno questo metodo per "ascoltare" la lista dei conti.
   * Usiamo .asObservable() per nascondere il BehaviorSubject e impedire modifiche esterne.
   */
  getConti$(): Observable<BankAccount[]> {
    return this._conti$.asObservable();
  }

  /**
   * Metodo privato per caricare tutti i dati dal server.
   * Viene chiamato internamente dopo ogni modifica (Create, Update, Delete)
   * per assicurarsi che la lista locale sia sempre aggiornata con quella del server.
   */
  private loadAll(): void {
    // Faccio una GET all'URL dell'API. Mi aspetto un array di BankAccount.
    this.http.get<BankAccount[]>(this.apiUrl)
      .subscribe({
        // Quando i dati arrivano (next):
        next: (data) => {
          // "Spariamo" i nuovi dati dentro il BehaviorSubject.
          // Tutti i componenti in ascolto si aggiorneranno automaticamente.
          this._conti$.next(data);
        },
        // Se c'è un errore:
        error: (err) => console.error('Errore caricamento conti:', err)
      });
  }

  /**
   * Ottiene un singolo conto per ID.
   * Utile per la pagina di dettaglio o di modifica.
   * @param id - L'ID del conto da cercare.
   */
  getContoById(id: number): Observable<BankAccount> {
    // Chiamata GET: http://localhost:5051/api/conti/1
    return this.http.get<BankAccount>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea o Aggiorna un conto (Upsert).
   * Se l'oggetto ha un ID > 0, facciamo UPDATE. Altrimenti CREATE.
   */
  upsertConto(conto: BankAccount): Observable<BankAccount> {
    if (conto.id && conto.id > 0) {
      // === UPDATE (PUT) ===
      // Chiamata PUT: http://localhost:5051/api/conti/1
      return this.http.put<BankAccount>(`${this.apiUrl}/${conto.id}`, conto).pipe(
        // L'operatore tap esegue un'azione "laterale" senza modificare i dati del flusso.
        // Qui lo usiamo per ricaricare la lista globale dopo il salvataggio.
        tap(() => this.loadAll())
      );
    } else {
      // === CREATE (POST) ===
      // Chiamata POST: http://localhost:5051/api/conti
      return this.http.post<BankAccount>(this.apiUrl, conto).pipe(
        tap(() => this.loadAll())
      );
    }
  }

  /**
   * Elimina un conto.
   * @param id - L'ID del conto da eliminare.
   */
  deleteConto(id: number): Observable<void> {
    // Chiamata DELETE: http://localhost:5051/api/conti/1
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      // Dopo aver eliminato, ricarichiamo la lista per far sparire l'elemento dalla UI.
      tap(() => this.loadAll())
    );
  }
}
