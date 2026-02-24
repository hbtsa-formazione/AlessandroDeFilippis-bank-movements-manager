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
  title = 'bank-movement-manager';
  user$: Observable<AuthUser | null>;

  constructor(private auth: AuthService) {
    this.user$ = this.auth.user$();
  }

  // Invoca il logout e pulisce la sessione client
  logout(): void {
    this.auth.logout().subscribe();
  }
}
