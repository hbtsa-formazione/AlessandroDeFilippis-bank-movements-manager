import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankAccount } from '../model/bank-account';
import { ContiService } from '../service/conti-service';

/**
 * Componente Form per la creazione o modifica di un Conto Bancario.
 * Gestisce la logica di validazione e il salvataggio dei dati.
 */
@Component({
  selector: 'app-form-conto-bancario',
  templateUrl: './form-conto-bancario.component.html',
  styleUrls: ['./form-conto-bancario.component.css']
})
export class FormContoBancarioComponent implements OnInit {
  /**
   * Il Reactive Form Group che gestisce i controlli del form.
   */
  form!: FormGroup;
  
  /**
   * Flag per indicare se siamo in modalità modifica (true) o creazione (false).
   */
  isEdit = false;
  
  /**
   * ID del conto corrente (se in modifica).
   */
  currentId?: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contiService: ContiService
  ) {}

  /**
   * Inizializzazione del componente.
   * 1. Crea il form con i validatori.
   * 2. Controlla se c'è un ID nella rotta (edit mode).
   * 3. Se c'è l'ID, carica i dati dal service.
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      iban: ['', [Validators.required, Validators.maxLength(34)]],
      currency: ['EUR', [Validators.required]]
    });

    // Controllo parametri rotta
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.currentId = +idParam;
      
      const conto = this.contiService.getContoById(this.currentId);
      if (conto) {
        // Popola il form con i dati esistenti
        this.form.patchValue(conto);
      } else {
        // Se l'ID non esiste, reindirizza alla lista (sicurezza)
        this.router.navigate(['/lista-conti-bancari']);
      }
    }
  }

  /**
   * Metodo chiamato al submit del form.
   */
  salva(): void {
    if (this.form.invalid) return;

    // Costruiamo l'oggetto da salvare unendo l'ID (se esiste) ai valori del form
    const payload: BankAccount = {
      id: this.currentId ?? 0, // Se è 0, il service capirà che è una nuova creazione
      ...this.form.value
    };

    this.contiService.upsertConto(payload);
    this.router.navigate(['/lista-conti-bancari']);
  }

  /**
   * Annulla l'operazione e torna alla lista.
   */
  annulla(): void {
    this.router.navigate(['/lista-conti-bancari']);
  }
}
