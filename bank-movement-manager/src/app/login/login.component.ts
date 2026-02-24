/**
 * =========================================================================================
 * COMPONENT: LOGIN
 * =========================================================================================
 * Gestisce il form di autenticazione e il redirect alla pagina richiesta.
 * Flusso:
 * 1) L'utente inserisce credenziali
 * 2) Viene chiamato l'endpoint /api/auth/login
 * 3) Se OK, si naviga alla returnUrl (o /home)
 * 4) Se KO, viene mostrato un messaggio di errore
 */
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Messaggio di errore in caso di credenziali non valide
  // Valore vuoto = nessun errore visibile
  errorMessage = '';
  // Reactive Form per username e password
  // Validatori: required su entrambi i campi
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // Invia i dati al backend e gestisce la navigazione post-login
  // Effetti collaterali:
  // - aggiorna errorMessage in caso di errore
  // - naviga alla returnUrl in caso di successo
  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const { username, password } = this.form.value;
    this.auth.login(username ?? '', password ?? '').subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.errorMessage = 'Credenziali non valide';
      }
    });
  }
}
