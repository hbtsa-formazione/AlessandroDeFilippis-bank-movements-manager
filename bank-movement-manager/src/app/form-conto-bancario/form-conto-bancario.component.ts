import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

@Component({
  selector: 'app-form-conto-bancario',
  templateUrl: './form-conto-bancario.component.html',
  styleUrls: ['./form-conto-bancario.component.css']
})
export class FormContoBancarioComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  currentId?: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contiService: ContiService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      iban: ['', [Validators.required, Validators.maxLength(34)]],
      currency: ['EUR', [Validators.required]]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.currentId = +idParam;
      const conto = this.contiService.getContoById(this.currentId);
      if (conto) {
        this.form.patchValue(conto);
      } else {
        // ID inesistente: torna alla lista
        this.router.navigate(['/lista-conti-bancari']);
      }
    }
  }

  salva(): void {
    if (this.form.invalid) return;

    const payload: BankAccount = {
      id: this.currentId ?? 0, // il service genera l'ID se è 0 (creazione)
      ...this.form.value
    };

    this.contiService.upsertConto(payload);
    this.router.navigate(['/lista-conti-bancari']);
  }

  annulla(): void {
    this.router.navigate(['/lista-conti-bancari']);
  }
}