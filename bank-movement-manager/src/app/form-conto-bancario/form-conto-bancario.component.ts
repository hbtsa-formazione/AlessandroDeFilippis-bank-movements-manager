import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

/**
 * =========================================================================================
 * COMPONENT: FORM CONTO BANCARIO
 * =========================================================================================
 * Gestisce sia la creazione (CREATE) che la modifica (UPDATE) di un conto bancario.
 * Utilizza i "Reactive Forms" di Angular, che offrono un controllo potente sulla validazione.
 */
@Component({
  selector: 'app-form-conto-bancario',
  templateUrl: './form-conto-bancario.component.html',
  styleUrls: ['./form-conto-bancario.component.css']
})
export class FormContoBancarioComponent implements OnInit {
  
  /**
   * Il Reactive Form Group.
   * Rappresenta l'intero modulo e contiene i controlli (input) al suo interno.
   * Usiamo il modificatore `!` (Definite Assignment Assertion) per dire a TypeScript:
   * "Fidati, inizializzerò questa variabile nel metodo ngOnInit, non sarà null".
   */
  form!: FormGroup;
  
  /** Stato del componente: true se stiamo modificando, false se stiamo creando */
  isEdit = false;
  
  /** Memorizza l'ID del conto che stiamo modificando (se presente) */
  currentId?: number;

  constructor(
    private fb: FormBuilder,       // Helper per costruire form complessi in modo sintetico
    private route: ActivatedRoute, // Accesso ai parametri dell'URL corrente (es. l'ID)
    private router: Router,        // Per navigare via codice dopo il salvataggio
    private contiService: ContiService // Accesso ai dati
  ) {}

  /**
   * LIFECYCLE HOOK: ngOnInit
   * Viene eseguito una sola volta appena il componente è stato inizializzato.
   * È il posto giusto per configurare il form e caricare i dati.
   */
  ngOnInit(): void {
    // 1. Costruzione del Form Model
    this.form = this.fb.group({
      // Sintassi: ['ValoreIniziale', [ValidatoriSincroni]]
      name: ['', [Validators.required, Validators.maxLength(80)]],
      iban: ['', [Validators.required, Validators.maxLength(34)]],
      currency: ['EUR', [Validators.required]]
    });

    // 2. Controllo se siamo in modalità Modifica
    // route.snapshot.paramMap.get('id') recupera il parametro 'id' dall'URL
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      this.isEdit = true;
      this.currentId = +idParam; // Il '+' converte la stringa in numero
      
      // Recupero i dati attuali del conto dal service
      const conto = this.contiService.getContoById(this.currentId);
      
      if (conto) {
        // patchValue riempie il form con i dati dell'oggetto.
        // I nomi delle proprietà dell'oggetto devono combaciare con i nomi dei controlli del form.
        this.form.patchValue(conto);
      } else {
        // Edge case: L'utente ha messo un ID inesistente nell'URL
        this.router.navigate(['/lista-conti-bancari']);
      }
    }
  }

  /**
   * Gestione del salvataggio (Submit)
   */
  salva(): void {
    // Se il form non è valido (es. campi obbligatori vuoti), blocchiamo tutto.
    // (Anche il pulsante di submit dovrebbe essere disabilitato nella vista)
    if (this.form.invalid) return;

    // Preparazione del payload (oggetto da inviare)
    // Combiniamo l'ID (se c'è) con i valori del form
    const payload: BankAccount = {
      id: this.currentId ?? 0, // 0 segnala al service che è un nuovo record
      ...this.form.value       // Spread operator: copia tutte le proprietà del form (name, iban, currency)
    };

    // Deleghiamo al service la logica di salvataggio
    this.contiService.upsertConto(payload);
    
    // Torniamo alla lista
    this.router.navigate(['/lista-conti-bancari']);
  }

  /**
   * Tasto Annulla
   */
  annulla(): void {
    this.router.navigate(['/lista-conti-bancari']);
  }
}
