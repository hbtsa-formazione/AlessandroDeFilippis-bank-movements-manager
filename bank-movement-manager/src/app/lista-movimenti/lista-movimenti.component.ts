import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';
import { BankAccount } from '../model/bank-account';
import { MovimentiService } from '../service/movimenti-service';
import { ContiService } from '../service/conti-service';

/**
 * Interfaccia di supporto (ViewModel) specifica per questo componente.
 * Estende il modello base `BankMovement` aggiungendo campi visuali
 * che non esistono nel database ma servono all'utente (Nome Conto, IBAN).
 */
interface MovementWithAccount extends BankMovement {
  accountName: string;
  accountIban: string;
}

/**
 * =========================================================================================
 * COMPONENT: LISTA MOVIMENTI
 * =========================================================================================
 * Dimostra un pattern avanzato di RxJS: `combineLatest`.
 * 
 * Problema: I movimenti hanno solo un `accountId` (numero), ma noi vogliamo mostrare 
 * il NOME del conto (stringa). I nomi dei conti stanno in un altro Service (`ContiService`).
 * 
 * Soluzione: Dobbiamo ascoltare contemporaneamente due flussi dati (Movimenti e Conti)
 * e combinarli insieme prima di mostrarli.
 */
@Component({
  selector: 'app-lista-movimenti',
  templateUrl: './lista-movimenti.component.html',
  styleUrls: ['./lista-movimenti.component.css']
})
export class ListaMovimentiComponent implements OnInit {
  
  /**
   * Stream combinato pronto per la visualizzazione.
   */
  movementsWithAccounts$: Observable<MovementWithAccount[]> = new Observable();
  
  // Oggetti per le statistiche (semplici dizionari chiave-valore)
  totalsByCurrency: { [currency: string]: number } = {};
  totalsByAccount: { [accountId: number]: { name: string; total: number } } = {};

  constructor(
    private movimentiService: MovimentiService,
    private contiService: ContiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    /**
     * RXJS COMBINELATEST
     * Accetta un array di Observable. Emette un nuovo valore (array di risultati)
     * ogni volta che ALMENO UNO degli Observable sorgente emette un valore.
     * 
     * [StreamMovimenti, StreamConti] => ([movimenti[], conti[]])
     */
    this.movementsWithAccounts$ = combineLatest([
      this.movimentiService.getMovimenti$(),
      this.contiService.getConti$()
    ]).pipe(
      // L'operatore MAP riceve i dati dai due flussi e li trasforma
      map(([movements, accounts]) => {
        
        // 1. Ottimizzazione: Creiamo una Map per cercare i conti per ID velocemente (O(1))
        // invece di fare .find() per ogni movimento (O(N*M))
        const accountMap = new Map<number, BankAccount>();
        accounts.forEach(acc => accountMap.set(acc.id, acc));

        // 2. Arricchimento dati (Data Enrichment)
        // Per ogni movimento, cerchiamo i dettagli del conto corrispondente
        const movementsWithAcc: MovementWithAccount[] = movements.map(mov => {
          const acc = accountMap.get(mov.accountId);
          return {
            ...mov,
            // Gestione fallback se il conto non esiste più
            accountName: acc ? acc.name : 'Conto non trovato',
            accountIban: acc ? acc.iban : 'N/D'
          };
        });

        // 3. Calcolo statistiche in tempo reale (Side effect utile nel map o tap)
        // Ricalcoliamo i totali ogni volta che i dati cambiano
        this.calculateStats(movements, accountMap);

        return movementsWithAcc;
      })
    );
  }

  /**
   * Funzione helper per calcolare i totali (spostata per pulizia del codice)
   */
  private calculateStats(movements: BankMovement[], accountMap: Map<number, BankAccount>) {
    // Totali per Valuta
    this.totalsByCurrency = movements.reduce((acc, mov) => {
      // Se la chiave non esiste, inizializza a 0, poi somma amount
      acc[mov.currency] = (acc[mov.currency] || 0) + mov.amount;
      return acc;
    }, {} as { [currency: string]: number });

    // Totali per Conto
    this.totalsByAccount = movements.reduce((acc, mov) => {
      if (!acc[mov.accountId]) {
        const accData = accountMap.get(mov.accountId);
        acc[mov.accountId] = { name: accData ? accData.name : 'Sconosciuto', total: 0 };
      }
      acc[mov.accountId].total += mov.amount;
      return acc;
    }, {} as { [accountId: number]: { name: string; total: number } });
  }

  // --- Metodi di Navigazione e Azioni ---

  onCreateNew(): void {
    this.router.navigate(['/form-movimento']);
  }

  onEdit(movement: BankMovement): void {
    this.router.navigate(['/form-movimento', movement.id]);
  }

  onDelete(movement: BankMovement): void {
    if (confirm('Sei sicuro di voler eliminare questo movimento?')) {
      this.movimentiService.delete(movement.id);
    }
  }

  onBackToHome(): void {
    this.router.navigate(['/home']);
  }
}
