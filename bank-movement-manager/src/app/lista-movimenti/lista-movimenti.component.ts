import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';
import { BankAccount } from '../model/bank-account';
import { MovimentiService } from '../service/movimenti-service';
import { ContiService } from '../service/conti-service';

/**
 * Interfaccia estesa per la visualizzazione:
 * Aggiunge i dettagli del conto (nome, iban) al movimento base.
 */
interface MovementWithAccount extends BankMovement {
  accountName: string;
  accountIban: string;
}

/**
 * Componente che visualizza l'elenco dei movimenti bancari e alcune statistiche aggregate.
 * Utilizza `combineLatest` per unire i dati dei movimenti con i dati dei conti.
 */
@Component({
  selector: 'app-lista-movimenti',
  templateUrl: './lista-movimenti.component.html',
  styleUrls: ['./lista-movimenti.component.css']
})
export class ListaMovimentiComponent implements OnInit {
  
  /**
   * Stream principale dei dati da visualizzare in tabella.
   */
  movementsWithAccounts$: Observable<MovementWithAccount[]> = new Observable();
  
  /**
   * Dizionario per i totali aggregati per valuta.
   * Es: { 'EUR': 1000, 'USD': 50 }
   */
  totalsByCurrency: { [currency: string]: number } = {};
  
  /**
   * Dizionario per i totali aggregati per conto.
   */
  totalsByAccount: { [accountId: number]: { name: string; total: number } } = {};

  constructor(
    private movimentiService: MovimentiService,
    private contiService: ContiService,
    private router: Router
  ) {}

  /**
   * Inizializzazione: combina gli stream dei movimenti e dei conti.
   * Quando cambia uno dei due, ricalcola la lista arricchita e i totali.
   */
  ngOnInit(): void {
    this.movementsWithAccounts$ = combineLatest([
      this.movimentiService.getMovimenti$(),
      this.contiService.getConti$()
    ]).pipe(
      map(([movements, accounts]) => {
        // Creiamo una mappa per accesso rapido ai conti tramite ID
        const accountMap = new Map<number, BankAccount>();
        accounts.forEach(acc => accountMap.set(acc.id, acc));

        // Arricchiamo ogni movimento con i dati del conto
        const movementsWithAcc: MovementWithAccount[] = movements.map(mov => {
          const acc = accountMap.get(mov.accountId);
          return {
            ...mov,
            accountName: acc ? acc.name : 'Conto non trovato',
            accountIban: acc ? acc.iban : 'N/D'
          };
        });

        // Calcolo totali per valuta
        this.totalsByCurrency = movements.reduce((acc, mov) => {
          acc[mov.currency] = (acc[mov.currency] || 0) + mov.amount;
          return acc;
        }, {} as { [currency: string]: number });

        // Calcolo totali per conto
        this.totalsByAccount = movements.reduce((acc, mov) => {
          if (!acc[mov.accountId]) {
            const accData = accountMap.get(mov.accountId);
            acc[mov.accountId] = { name: accData ? accData.name : 'Sconosciuto', total: 0 };
          }
          acc[mov.accountId].total += mov.amount;
          return acc;
        }, {} as { [accountId: number]: { name: string; total: number } });

        return movementsWithAcc;
      })
    );
  }

  /**
   * Naviga alla pagina di creazione.
   */
  onCreateNew(): void {
    this.router.navigate(['/form-movimento']);
  }

  /**
   * Naviga alla pagina di modifica.
   */
  onEdit(movement: BankMovement): void {
    this.router.navigate(['/form-movimento', movement.id]);
  }

  /**
   * Elimina un movimento.
   */
  onDelete(movement: BankMovement): void {
    if (confirm('Sei sicuro di voler eliminare questo movimento?')) {
      this.movimentiService.delete(movement.id);
    }
  }

  /**
   * Torna alla dashboard.
   */
  onBackToHome(): void {
    this.router.navigate(['/home']);
  }
}
