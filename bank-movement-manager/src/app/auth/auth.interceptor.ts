import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * =========================================================================================
 * INTERCEPTOR: AUTH INTERCEPTOR
 * =========================================================================================
 * Aggiunge il Bearer Token alle richieste HTTP e tenta il refresh automatico su 401.
 * Flusso di esecuzione:
 * 1) Intercetta la richiesta e aggiunge Authorization se presente un access token.
 * 2) Se la risposta è 401 e non è una chiamata /auth, tenta il refresh.
 * 3) Se il refresh riesce, ripete la richiesta originale con il nuovo token.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Flag per evitare refresh concorrenti
  private isRefreshing = false;
  // Stream per far attendere le richieste mentre il refresh è in corso
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  // Intercetta tutte le richieste HTTP
  // Parametri:
  // - req: richiesta originale
  // - next: handler successivo nella pipeline
  // Ritorno:
  // - Observable con l'evento HTTP (successo o errore)
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();
    const isAuthCall = req.url.includes('/api/auth/');
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    return next.handle(authReq).pipe(
      catchError(err => {
        if (err.status === 401 && !isAuthCall) {
          return this.handle401(authReq, next);
        }
        return throwError(() => err);
      })
    );
  }

  // Gestione 401: prova a refreshare il token e ripete la richiesta fallita
  // Parametri:
  // - req: richiesta originale (senza token o con token scaduto)
  // - next: handler successivo
  // Ritorno:
  // - Observable della richiesta ripetuta (o della richiesta originale se refresh fallisce)
  // Errori gestiti:
  // - se il refresh fallisce, l'errore viene propagato al chiamante
  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
      );
    }
    this.isRefreshing = true;
    this.refreshSubject.next(null);
    return this.auth.refreshTokens().pipe(
      switchMap(res => {
        this.isRefreshing = false;
        const token = res?.accessToken ?? null;
        this.refreshSubject.next(token);
        if (!token) {
          return next.handle(req);
        }
        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }),
      catchError(err => {
        this.isRefreshing = false;
        return throwError(() => err);
      })
    );
  }
}
