import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

/**
 * Componente per la visualizzazione della lista dei conti bancari.
 * Utilizza la pipe `async` nel template per gestire automaticamente la sottoscrizione
 * e la cancellazione (unsubscribe) degli Observable.
 */
@Component({
  selector: 'app-lista-conti-bancari',
  templateUrl: './lista-conti-bancari.component.html',
  styleUrls: ['./lista-conti-bancari.component.css']
})
export class ListaContiBancariComponent {
  
  /**
   * Observable che contiene la lista dei conti.
   * Viene collegato direttamente al template.
   */
  conti$: Observable<BankAccount[]> = this.contiService.getConti$();

  constructor(
    private contiService: ContiService,
    private router: Router
  ) {}

  /**
   * Funzione di ottimizzazione per il rendering delle liste in Angular (`*ngFor`).
   * Restituisce un identificativo univoco per ogni elemento.
   * Evita il re-rendering completo del DOM se cambia solo un elemento.
   */
  trackById(_index: number, c: BankAccount): number {
    return c.id;
  }

  /**
   * Naviga verso il form di creazione di un nuovo conto.
   */
  nuovoConto(): void {
    this.router.navigate(['/form-conto-bancario']);
  }

  /**
   * Naviga verso il form di modifica passando l'ID del conto.
   */
  modificaConto(c: BankAccount): void {
    this.router.navigate(['/form-conto-bancario', c.id]);
  }

  /**
   * Gestisce l'eliminazione di un conto previa conferma.
   */
  eliminaConto(c: BankAccount): void {
    if (!c.id) {
      console.warn('Impossibile eliminare: ID mancante');
      return;
    }

    // Utilizzo di confirm() nativo (in un'app reale useremmo una modale custom)
    const ok = confirm(`Confermi l'eliminazione del conto "${c.name}"?`);
    if (ok) {
      this.contiService.deleteConto(c.id);
    }
  }

  /**
   * Ritorna alla dashboard.
   */
  tornaHome(): void {
    this.router.navigate(['/home']);
  }
}
