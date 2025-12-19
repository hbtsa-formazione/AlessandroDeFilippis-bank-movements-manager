import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BankMovement } from '../model/bank-movement';
import { BankAccount } from '../model/bank-account';
import { MovimentiService } from '../service/movimenti-service';
import { ContiService } from '../service/conti-service';

@Component({
  selector: 'app-form-movimento',
  templateUrl: './form-movimento.component.html',
  styleUrls: ['./form-movimento.component.css']
})
export class FormMovimentoComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  accounts$: Observable<BankAccount[]>;
  currencies = ['EUR', 'USD', 'GBP'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private movimentiService: MovimentiService,
    private contiService: ContiService
  ) {
    this.form = this.fb.group({
      accountId: ['', Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required],
      currency: ['', Validators.required],
      amount: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]]
    });

    this.accounts$ = this.contiService.getConti$();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      const movement = this.movimentiService.getById(+id);
      if (movement) {
        this.form.patchValue({
          accountId: movement.accountId,
          date: movement.date,
          description: movement.description,
          currency: movement.currency,
          amount: movement.amount
        });
      }
    }
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const movement: BankMovement = {
        id: this.isEditMode ? +this.route.snapshot.paramMap.get('id')! : 0,
        accountId: +formValue.accountId,
        date: formValue.date,
        description: formValue.description,
        currency: formValue.currency,
        amount: +formValue.amount
      };
      this.movimentiService.upsert(movement);
      this.router.navigate(['/lista-movimenti']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/lista-movimenti']);
  }
}