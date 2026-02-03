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
  showInsufficientFunds = false;
  requiredInstallmentTotal = 0;
  availableBalance = 0;
  
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
      amount: ['', [Validators.required]],
      isInstallment: [false],
      installments: [1]
    });

    // Colleghiamo l'observable dei conti dal service
    this.accounts$ = this.contiService.getConti$();

    // Attiva/Disattiva le validazioni delle rate in base al toggle
    this.form.get('isInstallment')?.valueChanges.subscribe((value) => {
      this.updateInstallmentValidators(!!value);
    });
    this.updateInstallmentValidators(false);
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
          amount: movement.amount,
          isInstallment: false,
          installments: 1
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
      const accountId = +formValue.accountId;
      const isInstallment = !!formValue.isInstallment;
      const installments = +formValue.installments || 1;
      const amountValue = +formValue.amount;

      if (!this.isEditMode && isInstallment) {
        const perInstallmentAmount = -Math.abs(amountValue);
        const requiredTotal = Math.abs(perInstallmentAmount) * installments;
        const balance = this.movimentiService.getBalanceForAccount(accountId);

        if (balance < requiredTotal) {
          this.showInsufficientFundsPopup(balance, requiredTotal);
          return;
        }

        this.movimentiService.createInstallmentPayments({
          accountId,
          startDate: formValue.date,
          description: formValue.description,
          currency: formValue.currency,
          amountPerInstallment: perInstallmentAmount,
          count: installments
        });

        this.router.navigate(['/lista-movimenti']);
        return;
      }
      
      // Costruzione dell'oggetto Model dai dati del Form
      const movement: BankMovement = {
        // ID: se edit prendiamo da URL, se nuovo mettiamo 0
        id: this.isEditMode ? +this.route.snapshot.paramMap.get('id')! : 0,
        
        // Conversione tipi: i valori dei form HTML sono sempre stringhe,
        // dobbiamo convertirli in numeri con il prefisso '+' (unary plus)
        accountId,
        amount: amountValue,
        
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

  closeInsufficientFundsPopup(): void {
    this.showInsufficientFunds = false;
    this.requiredInstallmentTotal = 0;
    this.availableBalance = 0;
  }

  showExamplePopup(): void {
    this.showInsufficientFundsPopup(120.00, 480.00);
  }

  getInstallmentTotal(): number {
    const amountValue = +this.form.value.amount || 0;
    const installments = +this.form.value.installments || 0;
    return Math.abs(amountValue) * installments;
  }

  private updateInstallmentValidators(isInstallment: boolean): void {
    const installmentsControl = this.form.get('installments');

    if (!installmentsControl) return;

    if (isInstallment) {
      installmentsControl.setValidators([Validators.required, Validators.min(2), Validators.max(120)]);
    } else {
      installmentsControl.setValidators([]);
      installmentsControl.setValue(1, { emitEvent: false });
    }

    installmentsControl.updateValueAndValidity({ emitEvent: false });
  }

  private showInsufficientFundsPopup(balance: number, requiredTotal: number): void {
    this.availableBalance = balance;
    this.requiredInstallmentTotal = requiredTotal;
    this.showInsufficientFunds = true;
  }
}
