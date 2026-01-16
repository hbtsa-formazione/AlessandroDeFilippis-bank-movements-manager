import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

/**
 * =========================================================================================
 * COMPONENT: LISTA CONTI BANCARI
 * =========================================================================================
 * Questo componente è responsabile della visualizzazione tabellare dei conti bancari.
 *
 * @Component: Decoratore che definisce metadati per Angular:
 * - selector: Il nome del tag HTML personalizzato (es. <app-lista-conti-bancari>).
 * - templateUrl: Il file HTML che definisce la vista.
 * - styleUrls: I file CSS per lo stile locale (incapsulato) del componente.
 */
@Component({
  selector: 'app-lista-conti-bancari',
  templateUrl: './lista-conti-bancari.component.html',
  styleUrls: ['./lista-conti-bancari.component.css']
})
export class ListaContiBancariComponent {
  
  /**
   * STREAM DEI DATI (Observable)
   * Invece di scaricare i dati in un array statico (es. `conti: BankAccount[]`),
   * manteniamo il riferimento all'Observable.
   * 
   * Vantaggio: Usando la pipe `| async` nel template HTML, Angular gestirà automaticamente:
   * 1. La sottoscrizione (subscribe) all'inizializzazione.
   * 2. L'aggiornamento della vista ogni volta che arrivano nuovi dati.
   * 3. La cancellazione (unsubscribe) quando il componente viene distrutto (evita memory leaks).
   * 
   * Convenzione: Le variabili che contengono Observable finiscono spesso con il dollaro `$`.
   */
  conti$: Observable<BankAccount[]> = this.contiService.getConti$();

  /**
   * DEPENDENCY INJECTION (Costruttore)
   * Angular "inietta" le dipendenze richieste nel costruttore.
   * 
   * @param contiService Accesso ai dati e alla logica dei conti.
   * @param router Servizio per navigare programmaticamente tra le pagine (cambio URL).
   */
  constructor(
    private contiService: ContiService,
    private router: Router
  ) {}

  /**
   * TRACK BY FUNCTION
   * Ottimizzazione per la direttiva `*ngFor` nel template.
   * 
   * Problema: Senza trackBy, se l'array cambia, Angular potrebbe distruggere e ricreare 
   * tutti gli elementi DOM della lista, il che è lento.
   * Soluzione: Con trackBy, Angular usa l'ID univoco per capire quale riga è cambiata
   * e aggiorna solo quella, mantenendo le altre intatte.
   */
  trackById(_index: number, c: BankAccount): number {
    return c.id;
  }

  /**
   * Navigazione alla pagina di creazione.
   * `router.navigate` accetta un array di segmenti URL.
   */
  nuovoConto(): void {
    this.router.navigate(['/form-conto-bancario']);
  }

  /**
   * Navigazione alla pagina di modifica.
   * Passiamo anche l'ID del conto come parametro nell'URL (es. /form-conto-bancario/5).
   */
  modificaConto(c: BankAccount): void {
    this.router.navigate(['/form-conto-bancario', c.id]);
  }

  /**
   * Gestione cancellazione.
   * 1. Verifica validità ID.
   * 2. Chiede conferma all'utente (fondamentale per azioni distruttive).
   * 3. Chiama il service per eseguire l'operazione.
   */
  eliminaConto(c: BankAccount): void {
    if (!c.id) {
      console.warn('Impossibile eliminare: ID mancante');
      return;
    }

    // window.confirm è un metodo nativo del browser che mostra un popup Sì/No
    const ok = confirm(`Confermi l'eliminazione del conto "${c.name}"?`);
    if (ok) {
      this.contiService.deleteConto(c.id);
    }
  }

  /**
   * Torna alla home page.
   */
  tornaHome(): void {
    this.router.navigate(['/home']);
  }
}
