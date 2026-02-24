/**
 * =========================================================================================
 * COMPONENT: LOGIN
 * =========================================================================================
 * Gestisce il form di autenticazione e il redirect alla pagina richiesta.
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
  errorMessage = '';
  // Reactive Form per username e password
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
