/**
 * =========================================================================================
 * GUARD: AUTH GUARD
 * =========================================================================================
 * Impedisce l'accesso alle rotte protette se l'utente non è autenticato.
 * In caso negativo, reindirizza alla pagina di Login con returnUrl per tornare
 * alla pagina richiesta dopo un login valido.
 */
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  // Controlla l'accesso alla rotta richiesta
  // Parametri:
  // - route: snapshot della rotta (non usato in questa logica)
  // - state: include l'URL completo richiesto dall'utente
  // Ritorno:
  // - true se autenticato
  // - UrlTree di redirect a /login se non autenticato
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl(`/login?returnUrl=${encodeURIComponent(state.url)}`);
  }
}
