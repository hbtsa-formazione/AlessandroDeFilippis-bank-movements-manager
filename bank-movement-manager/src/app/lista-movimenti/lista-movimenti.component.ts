import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BankMovement } from '../model/bank-movement';
import { BankAccount } from '../model/bank-account';
import { MovimentiService } from '../service/movimenti-service';
import { ContiService } from '../service/conti-service';

interface MovementWithAccount extends BankMovement {
  accountName: string;
  accountIban: string;
}

@Component({
  selector: 'app-lista-movimenti',
  templateUrl: './lista-movimenti.component.html',
  styleUrls: ['./lista-movimenti.component.css']
})
export class ListaMovimentiComponent implements OnInit {
  movementsWithAccounts$: Observable<MovementWithAccount[]> = new Observable();
  totalsByCurrency: { [currency: string]: number } = {};
  totalsByAccount: { [accountId: number]: { name: string; total: number } } = {};

  constructor(
    private movimentiService: MovimentiService,
    private contiService: ContiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.movementsWithAccounts$ = combineLatest([
      this.movimentiService.getMovimenti$(),
      this.contiService.getConti$()
    ]).pipe(
      map(([movements, accounts]) => {
        const accountMap = new Map<number, BankAccount>();
        accounts.forEach(acc => accountMap.set(acc.id, acc));

        const movementsWithAcc: MovementWithAccount[] = movements.map(mov => {
          const acc = accountMap.get(mov.accountId);
          return {
            ...mov,
            accountName: acc ? acc.name : 'Unknown',
            accountIban: acc ? acc.iban : 'Unknown'
          };
        });

        // Calcola totali per valuta
        this.totalsByCurrency = movements.reduce((acc, mov) => {
          acc[mov.currency] = (acc[mov.currency] || 0) + mov.amount;
          return acc;
        }, {} as { [currency: string]: number });

        // Calcola totali per conto
        this.totalsByAccount = movements.reduce((acc, mov) => {
          if (!acc[mov.accountId]) {
            const accData = accountMap.get(mov.accountId);
            acc[mov.accountId] = { name: accData ? accData.name : 'Unknown', total: 0 };
          }
          acc[mov.accountId].total += mov.amount;
          return acc;
        }, {} as { [accountId: number]: { name: string; total: number } });

        return movementsWithAcc;
      })
    );
  }

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