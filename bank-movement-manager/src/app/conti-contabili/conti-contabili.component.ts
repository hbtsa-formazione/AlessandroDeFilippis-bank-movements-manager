import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContiContabiliService } from '../service/conti-contabili.service';
import { ContiContabili } from '../model/conti-contabili';

/**
 * =========================================================================================
 * COMPONENT: CONTI CONTABILI
 * =========================================================================================
 * Questo componente coordina tre aspetti principali:
 * 1) Lettura dei conti contabili dal service (stream reattivo).
 * 2) Filtro per testo e per tipo.
 * 3) CRUD tramite un form reattivo (crea/modifica/elimina).
 *
 * È il "contenitore" che passa i dati alla tabella e gestisce il form.
 */
@Component({
  selector: 'app-conti-contabili',
  templateUrl: './conti-contabili.component.html',
  styleUrls: ['./conti-contabili.component.css']
})
export class ContiContabiliComponent implements OnInit {

  /**
   * Lista completa ricevuta dal service.
   * Questo array rappresenta la sorgente dati "vera".
   */
  contiContabili: ContiContabili[] = [];

  /**
   * Lista filtrata che viene effettivamente mostrata nella tabella.
   * È calcolata applicando i filtri su contiContabili.
   */
  contiFiltrati: ContiContabili[] = [];

  /**
   * Elenco dei tipi disponibili, usato per il filtro a tendina.
   * È calcolato dinamicamente dai dati disponibili.
   */
  availableTypes: string[] = [];

  /**
   * Testo digitato dall'utente nel filtro.
   * Viene applicato su nome, codice e descrizione.
   */
  filterText = '';

  /**
   * Tipo selezionato dall'utente nel filtro.
   * Se vuoto, non filtra per tipo.
   */
  filterType = '';

  /**
   * Form reattivo per creare o modificare un conto contabile.
   * La proprietà viene inizializzata in ngOnInit.
   */
  form!: FormGroup;

  /**
   * True quando l'utente sta modificando un elemento esistente.
   * False quando sta creando un nuovo elemento.
   */
  isEdit = false;

  /**
   * ID dell'elemento in modifica.
   * È undefined in modalità creazione.
   */
  currentId?: number;
  
  /**
   * Iniezione delle dipendenze:
   * - ContiContabiliService per CRUD e stream dati
   * - FormBuilder per creare il form in modo compatto
   */
  constructor(
    private contiContabiliService: ContiContabiliService,
    private fb: FormBuilder
  ) { }

  /**
   * ngOnInit:
   * - Costruisce il form con validazioni base
   * - Si sottoscrive allo stream dei conti
   * - Calcola i tipi disponibili e applica il filtro iniziale
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(80)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: ['', [Validators.maxLength(200)]],
      type: ['', [Validators.required, Validators.maxLength(30)]]
    });

    this.contiContabiliService.getContiContabili$().subscribe((conti) => {
      this.contiContabili = conti;
      this.availableTypes = Array.from(new Set(conti.map(c => c.type))).sort();
      this.applyFilter();
    });
  }

  /**
   * Gestisce l'input di testo del filtro.
   * Aggiorna lo stato e ricalcola la lista filtrata.
   */
  onFilterText(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterText = value;
    this.applyFilter();
  }

  /**
   * Gestisce il cambio del filtro per tipo.
   * Aggiorna lo stato e ricalcola la lista filtrata.
   */
  onFilterType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterType = value;
    this.applyFilter();
  }

  /**
   * Applica i filtri:
   * - Testo: match su nome, codice o descrizione (case-insensitive)
   * - Tipo: match esatto sul campo type
   */
  applyFilter(): void {
    const text = this.filterText.trim().toLowerCase();
    const type = this.filterType;

    this.contiFiltrati = this.contiContabili.filter(c => {
      const matchesText =
        text.length === 0 ||
        c.nome.toLowerCase().includes(text) ||
        c.code.toLowerCase().includes(text) ||
        c.description.toLowerCase().includes(text);

      const matchesType = type.length === 0 || c.type === type;

      return matchesText && matchesType;
    });
  }

  /**
   * Avvia la modifica di un elemento:
   * - Abilita modalità edit
   * - Salva l'ID corrente
   * - Riempie il form con i dati selezionati
   */
  startEdit(conto: ContiContabili): void {
    this.isEdit = true;
    this.currentId = conto.id;
    this.form.patchValue({
      nome: conto.nome,
      code: conto.code,
      description: conto.description,
      type: conto.type
    });
  }

  /**
   * Annulla la modifica:
   * - Reset dei flag
   * - Pulizia del form
   */
  cancelEdit(): void {
    this.isEdit = false;
    this.currentId = undefined;
    this.form.reset({ nome: '', code: '', description: '', type: '' });
  }

  /**
   * Salva il form:
   * - Se in edit, aggiorna l'elemento esistente
   * - Se in create, crea un nuovo elemento
   * - Alla fine resetta il form
   */
  save(): void {
    if (this.form.invalid) return;

    const payload = {
      nome: this.form.value.nome,
      code: this.form.value.code,
      description: this.form.value.description,
      type: this.form.value.type
    };

    if (this.isEdit && this.currentId) {
      this.contiContabiliService.updateConto({ id: this.currentId, ...payload });
    } else {
      this.contiContabiliService.createConto(payload);
    }

    this.cancelEdit();
  }

  /**
   * Elimina un elemento con ID specifico.
   */
  deleteConto(conto: ContiContabili): void {
    this.contiContabiliService.deleteConto(conto.id);
  }
}
