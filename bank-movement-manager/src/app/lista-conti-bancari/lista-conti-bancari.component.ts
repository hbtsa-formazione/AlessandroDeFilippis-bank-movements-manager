import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

@Component({
  selector: 'app-lista-conti-bancari',
  templateUrl: './lista-conti-bancari.component.html',
  styleUrls: ['./lista-conti-bancari.component.css']
})
export class ListaContiBancariComponent {
  conti$: Observable<BankAccount[]> = this.contiService.getConti$();

  constructor(
    private contiService: ContiService,
    private router: Router
  ) {}

  trackById(_index: number, c: BankAccount): number {
    return c.id;
  }

  nuovoConto(): void {
    this.router.navigate(['/form-conto-bancario']);
  }

  modificaConto(c: BankAccount): void {
    this.router.navigate(['/form-conto-bancario', c.id]);
  }

  eliminaConto(c: BankAccount): void {
    if (!c.id) {
      console.warn('Impossibile eliminare: ID mancante');
      return;
    }

    const ok = confirm(`Confermi l'eliminazione del conto "${c.name}"?`);
    if (ok) {
      this.contiService.deleteConto(c.id);
    }
  }

  tornaHome(): void {
    this.router.navigate(['/home']);
  }
}