import { Component, OnInit } from '@angular/core'; // Importiamo le interfacce base di Angular
import { ActivatedRoute, Router } from '@angular/router'; // Importiamo gli strumenti di routing
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importiamo gli strumenti per i Form Reattivi
import { BankAccount } from '../model/bank-account'; // Importiamo il modello dati
import { ContiService } from '../service/conti-service'; // Importiamo il servizio dati

/**
 * =========================================================================================
 * COMPONENT: FORM CONTO BANCARIO
 * =========================================================================================
 * Questo componente gestisce sia la Creazione (Create) che la Modifica (Update) di un conto.
 * Usa lo stesso form HTML per entrambe le operazioni.
 */
@Component({
  selector: 'app-form-conto-bancario',
  templateUrl: './form-conto-bancario.component.html',
  styleUrls: ['./form-conto-bancario.component.css']
})
export class FormContoBancarioComponent implements OnInit {
[x: string]: any;
  
  /**
   * form: Variabile che conterrà il nostro "FormGroup".
   * Il '!' serve a dire a TypeScript che la inizializzeremo sicuramente (in ngOnInit),
   * quindi non deve preoccuparsi che possa essere null.
   */
  form!: FormGroup;
  
  /**
   * isEdit: Flag booleano per sapere se siamo in modalità modifica (true) o creazione (false).
   * Utile per cambiare titolo alla pagina o logica di salvataggio.
   */
  isEdit = false;
  
  /**
   * currentId: Memorizza l'ID del conto che stiamo modificando (opzionale).
   */
  currentId?: number;

  /**
   * COSTRUTTORE
   * @param fb - FormBuilder: servizio per creare FormGroup in modo veloce.
   * @param route - ActivatedRoute: servizio per leggere i parametri dell'URL (es. l'ID).
   * @param router - Router: servizio per navigare (cambiare pagina) via codice.
   * @param contiService - ContiService: servizio per leggere/scrivere i dati dei conti.
   */
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contiService: ContiService
  ) {}

  /**
   * ngOnInit
   * Viene eseguito appena il componente viene inizializzato.
   * Qui costruiamo il form e carichiamo i dati se necessario.
   */
  ngOnInit(): void {
    // 1. Definiamo la struttura del Form (nomi dei campi e validatori).
    this.form = this.fb.group({
      // Campo 'name': valore iniziale vuoto, obbligatorio, max 80 caratteri.
      name: ['', [Validators.required, Validators.maxLength(80)]],
      // Campo 'iban': valore iniziale vuoto, obbligatorio, max 34 caratteri.
      iban: ['', [Validators.required, Validators.maxLength(34)]],
      // Campo 'currency': valore iniziale 'EUR', obbligatorio.
      currency: ['EUR', [Validators.required]]
    });

    // 2. Controlliamo se nell'URL c'è un parametro 'id'.
    // route.snapshot.paramMap.get('id') ci dà il valore corrente del parametro.
    const idParam = this.route.snapshot.paramMap.get('id');
    
    // Se c'è un ID, vuol dire che siamo in MODIFICA.
    if (idParam) {
      this.isEdit = true; // Impostiamo la modalità modifica
      this.currentId = +idParam; // Convertiamo la stringa in numero con '+'
      
      // Chiamiamo il servizio per ottenere i dati del conto dal server.
      this.contiService.getContoById(this.currentId).subscribe({
        // Successo: abbiamo ricevuto i dati (conto)
        next: (conto) => {
          // Riempiamo il form con i dati ricevuti.
          // patchValue mappa automaticamente le proprietà dell'oggetto sui campi del form con lo stesso nome.
          this.form.patchValue(conto);
        },
        // Errore: l'ID non esiste o il server è giù
        error: () => {
          // Torniamo alla lista per sicurezza.
          this.router.navigate(['/lista-conti-bancari']);
        }
      });
    }
  }

  /**
   * salva
   * Metodo chiamato quando l'utente preme il pulsante di salvataggio.
   */
  salva(): void {
    // Se il form non è valido (es. campi obbligatori vuoti), ci fermiamo subito.
    if (this.form.invalid) return;

    // Creiamo l'oggetto da inviare al server.
    // Usiamo lo spread operator (...) per copiare tutti i valori del form (name, iban, currency).
    const payload: BankAccount = {
      id: this.currentId ?? 0, // Se c'è currentId lo usiamo, altrimenti 0 (nuovo conto).
      ...this.form.value
    };

    // Chiamiamo il metodo upsertConto del servizio (gestisce sia Create che Update).
    // È IMPORTANTE fare .subscribe(), altrimenti la chiamata non parte.
    this.contiService.upsertConto(payload).subscribe({
      next: () => {
        // Quando il salvataggio è finito con successo, torniamo alla lista.
        this.router.navigate(['/lista-conti-bancari']);
      },
      error: (err) => console.error('Errore salvataggio:', err)
    });
  }
}
