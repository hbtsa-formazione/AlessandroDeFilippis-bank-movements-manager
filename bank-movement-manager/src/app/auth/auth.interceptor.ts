import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * =========================================================================================
 * INTERCEPTOR: AUTH INTERCEPTOR
 * =========================================================================================
 * Aggiunge il Bearer Token alle richieste HTTP e tenta il refresh automatico su 401.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Flag per evitare refresh concorrenti
  private isRefreshing = false;
  // Stream per far attendere le richieste mentre il refresh è in corso
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  // Intercetta tutte le richieste HTTP
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
