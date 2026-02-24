import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, AuthUser } from './auth/auth.service';

/**
 * =========================================================================================
 * COMPONENT: APP ROOT
 * =========================================================================================
 * È il componente radice dell'albero di Angular.
 * Viene caricato per primo (bootstrap) e contiene il layout principale della pagina
 * (es. Navbar, Footer e il tag <router-outlet> dove vengono caricate le pagine).
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Titolo dell'app, usato in componenti o test
  title = 'bank-movement-manager';
  // Stream dell'utente loggato per mostrare Login/Logout nella navbar
  user$: Observable<AuthUser | null>;

  constructor(private auth: AuthService) {
    // Ci sottoscriviamo allo stream per aggiornare la UI in tempo reale
    this.user$ = this.auth.user$();
  }

  // Invoca il logout e pulisce la sessione client
  // Ritorno: void (l'Observable è gestito internamente con subscribe)
  logout(): void {
    this.auth.logout().subscribe();
  }
}
