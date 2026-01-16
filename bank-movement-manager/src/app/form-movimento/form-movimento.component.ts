import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BankMovement } from '../model/bank-movement';
import { BankAccount } from '../model/bank-account';
import { MovimentiService } from '../service/movimenti-service';
import { ContiService } from '../service/conti-service';

/**
 * =========================================================================================
 * COMPONENT: FORM MOVIMENTO
 * =========================================================================================
 * Gestisce l'inserimento e la modifica dei movimenti.
 * Include un esempio di popolamento di una <select> dinamica tramite Observable.
 */
@Component({
  selector: 'app-form-movimento',
  templateUrl: './form-movimento.component.html',
  styleUrls: ['./form-movimento.component.css']
})
export class FormMovimentoComponent implements OnInit {
  
  form: FormGroup;
  isEditMode = false;
  
  /**
   * Observable per popolare la Select Box dei conti nel template.
   * Non sottoscriviamo qui nel TS (`.subscribe()`), ma passiamo l'observable
   * direttamente al template HTML che userà la pipe `| async`.
   * Questo è un pattern best-practice in Angular.
   */
  accounts$: Observable<BankAccount[]>;
  
  /** Array statico per le opzioni della valuta */
  currencies = ['EUR', 'USD', 'GBP'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movimentiService: MovimentiService,
    private contiService: ContiService
  ) {
    // Inizializzazione del form
    this.form = this.fb.group({
      accountId: ['', Validators.required], // Campo obbligatorio
      // Impostiamo la data di oggi come default (formato YYYY-MM-DD per input type="date")
      date: [new Date().toISOString().substring(0, 10), Validators.required], 
      description: ['', Validators.required],
      currency: ['EUR', Validators.required],
      amount: ['', [Validators.required]] 
    });

    // Colleghiamo l'observable dei conti dal service
    this.accounts$ = this.contiService.getConti$();
  }

  ngOnInit(): void {
    // Verifica se siamo in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      
      // Recupero sincrono del movimento (poiché il service mantiene lo stato in memoria)
      const movement = this.movimentiService.getById(+id);
      
      if (movement) {
        // Popolamento form
        this.form.patchValue({
          accountId: movement.accountId,
          date: movement.date,
          description: movement.description,
          currency: movement.currency,
          amount: movement.amount
        });
      } else {
        // ID non trovato -> redirect
        this.router.navigate(['/lista-movimenti']);
      }
    }
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Costruzione dell'oggetto Model dai dati del Form
      const movement: BankMovement = {
        // ID: se edit prendiamo da URL, se nuovo mettiamo 0
        id: this.isEditMode ? +this.route.snapshot.paramMap.get('id')! : 0,
        
        // Conversione tipi: i valori dei form HTML sono sempre stringhe,
        // dobbiamo convertirli in numeri con il prefisso '+' (unary plus)
        accountId: +formValue.accountId,
        amount: +formValue.amount,
        
        // Stringhe semplici
        date: formValue.date,
        description: formValue.description,
        currency: formValue.currency,
      };

      // Chiamata al service
      this.movimentiService.upsert(movement);
      
      // Navigazione
      this.router.navigate(['/lista-movimenti']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/lista-movimenti']);
  }
}
