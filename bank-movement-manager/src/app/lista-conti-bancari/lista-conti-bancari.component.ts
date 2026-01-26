import { Component } from '@angular/core'; // Importiamo il decoratore Component
import { Router } from '@angular/router'; // Importiamo il Router per la navigazione
import { Observable } from 'rxjs'; // Importiamo Observable per gestire i flussi di dati asincroni
import { BankAccount } from '../model/bank-account'; // Importiamo l'interfaccia del modello dati
import { ContiService } from '../service/conti-service'; // Importiamo il servizio che gestisce i dati

/**
 * =========================================================================================
 * COMPONENT: LISTA CONTI BANCARI
 * =========================================================================================
 * Questo componente visualizza la tabella con tutti i conti bancari.
 * 
 * @Component definisce i metadati di Angular:
 * - selector: il tag HTML da usare (es. <app-lista-conti-bancari>)
 * - templateUrl: il percorso del file HTML
 * - styleUrls: il percorso del file CSS
 */
@Component({
  selector: 'app-lista-conti-bancari',
  templateUrl: './lista-conti-bancari.component.html',
  styleUrls: ['./lista-conti-bancari.component.css']
})
export class ListaContiBancariComponent {
tornaHome() {
throw new Error('Method not implemented.');
}
  
  /**
   * conti$: È un Observable che contiene l'array di conti bancari.
   * Il suffisso '$' è una convenzione per indicare che è un Observable.
   * 
   * Invece di sottoscriverci manualmente (.subscribe) e copiare i dati in un array locale,
   * lasciamo che sia Angular a gestire tutto nel template HTML usando la pipe "| async".
   * Questo gestisce automaticamente l'apertura e la chiusura della sottoscrizione.
   */
  conti$: Observable<BankAccount[]> = this.contiService.getConti$();

  /**
   * COSTRUTTORE
   * @param contiService - Iniettiamo il servizio per accedere ai dati.
   * @param router - Iniettiamo il router per poter navigare ad altre pagine via codice.
   */
  constructor(
    private contiService: ContiService,
    private router: Router
  ) {}

  /**
   * trackById
   * Funzione di ottimizzazione per *ngFor.
   * Dice ad Angular di tracciare gli elementi in base al loro ID univoco.
   * Se la lista cambia, Angular ridisegna solo le righe con ID modificati/nuovi,
   * invece di distruggere e ricreare tutta la tabella.
   */
  trackById(_index: number, c: BankAccount): number {
    return c.id;
  }

  /**
   * Naviga alla pagina di creazione di un nuovo conto.
   */
  nuovoConto(): void {
    // Naviga all'URL /form-conto-bancario
    this.router.navigate(['/form-conto-bancario']);
  }

  /**
   * Naviga alla pagina di modifica di un conto esistente.
   * @param c - Il conto da modificare.
   */
  modificaConto(c: BankAccount): void {
    // Naviga all'URL /form-conto-bancario/{id}
    this.router.navigate(['/form-conto-bancario', c.id]);
  }

  /**
   * Gestisce l'eliminazione di un conto.
   * @param c - Il conto da eliminare.
   */
  eliminaConto(c: BankAccount): void {
    // Controllo di sicurezza: se non c'è l'ID, non posso eliminare.
    if (!c.id) {
      console.warn('Impossibile eliminare: ID mancante');
      return;
    }

    // Chiedo conferma all'utente con un popup nativo del browser.
    const ok = confirm(`Confermi l'eliminazione del conto "${c.name}"?`);
    
    // Se l'utente clicca "OK":
    if (ok) {
      // Chiamo il metodo deleteConto del servizio.
      // IMPORTANTE: deleteConto ritorna un Observable.
      // Se non faccio .subscribe(), la chiamata HTTP NON parte!
      this.contiService.deleteConto(c.id).subscribe({
        // Callback di successo (next)
        next: () => console.log('Conto eliminato con successo'),
        // Callback di errore (error)
        error: (err) => console.error('Errore durante eliminazione:', err)
      });
    }
  }
}
