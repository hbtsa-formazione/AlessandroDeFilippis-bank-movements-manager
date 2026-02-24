import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timer, switchMap, of, catchError } from 'rxjs';

/**
 * =========================================================================================
 * INTERFACCIA: AUTH USER
 * =========================================================================================
 * Rappresenta l'utente autenticato restituito dal backend.
 */
export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

/**
 * =========================================================================================
 * DTO: LOGIN RESPONSE
 * =========================================================================================
 * Struttura della risposta restituita dai nostri endpoint di autenticazione.
 */
export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}

/**
 * =========================================================================================
 * SERVICE: AUTH SERVICE
 * =========================================================================================
 * Gestisce login/logout, refresh token e persistenza lato client.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Endpoint base per autenticazione
  private readonly apiBase = 'http://localhost:5051/api/auth';
  // Stato utente in memoria (con persistenza su localStorage)
  private _user$ = new BehaviorSubject<AuthUser | null>(this.readUser());
  // Token e scadenze memorizzati localmente
  private _accessToken: string | null = this.read('accessToken');
  private _accessExp: string | null = this.read('accessTokenExpiresAt');
  private _refreshToken: string | null = this.read('refreshToken');
  private _refreshExp: string | null = this.read('refreshTokenExpiresAt');
  // Flag per evitare di avviare più timer di refresh
  private _refreshTimerStarted = false;

  constructor(private http: HttpClient) {
    // Avviamo il controllo periodico per refresh automatico
    this.startRefreshTimerIfNeeded();
  }

  // Espone lo stream dell'utente loggato
  user$(): Observable<AuthUser | null> {
    return this._user$.asObservable();
  }

  // Verifica veloce se l'utente è autenticato
  isLoggedIn(): boolean {
    return !!this._accessToken && !this.isExpired(this._accessExp);
  }

  // Access token corrente (usato dall'interceptor)
  getAccessToken(): string | null {
    return this._accessToken;
  }

  // Effettua login e salva token/utente in storage
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/login`, { username, password }).pipe(
      tap(res => {
        this.persistLogin(res);
        this._user$.next(res.user);
        this.startRefreshTimerIfNeeded(true);
      })
    );
  }

  // Effettua logout: revoca refresh token lato backend e pulisce lo stato client
  logout(): Observable<void> {
    const body = { refreshToken: this._refreshToken };
    return this.http.post<void>(`${this.apiBase}/logout`, body).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clear())
    );
  }

  // Wrapper usato dall'interceptor per rinnovare i token in caso di 401
  refreshTokens(): Observable<LoginResponse | null> {
    return this.refresh().pipe(catchError(() => of(null)));
  }

  // Chiamata interna di refresh token
  private refresh(): Observable<LoginResponse> {
    if (!this._refreshToken) {
      return of(null as any);
    }
    return this.http.post<LoginResponse>(`${this.apiBase}/refresh`, { refreshToken: this._refreshToken }).pipe(
      tap(res => {
        this.persistTokens(res);
        this.startRefreshTimerIfNeeded(true);
      })
    );
  }

  // Timer periodico: se il token sta per scadere, prova a refresharlo
  private startRefreshTimerIfNeeded(force = false): void {
    if (this._refreshTimerStarted && !force) {
      return;
    }
    this._refreshTimerStarted = true;
    timer(0, 30000)
      .pipe(
        switchMap(() => {
          if (!this._accessToken || this.isExpired(this._accessExp)) {
            return this.refresh();
          }
          const expMs = new Date(this._accessExp ?? 0).getTime();
          const now = Date.now();
          if (expMs - now < 60_000) {
            return this.refresh();
          }
          return of(null as any);
        }),
        catchError(() => of(null as any))
      )
      .subscribe();
  }

  // Verifica scadenza ISO date
  private isExpired(iso?: string | null): boolean {
    if (!iso) return true;
    return new Date(iso).getTime() <= Date.now();
  }

  // Persistenza completa (token + utente)
  private persistLogin(res: LoginResponse) {
    this.persistTokens(res);
    this.write('user', JSON.stringify(res.user));
  }

  // Persistenza token e scadenze
  private persistTokens(res: LoginResponse) {
    this._accessToken = res.accessToken;
    this._accessExp = res.accessTokenExpiresAt;
    this._refreshToken = res.refreshToken;
    this._refreshExp = res.refreshTokenExpiresAt;
    this.write('accessToken', this._accessToken);
    this.write('accessTokenExpiresAt', this._accessExp);
    this.write('refreshToken', this._refreshToken);
    this.write('refreshTokenExpiresAt', this._refreshExp);
  }

  // Reset completo dello stato di autenticazione
  private clear() {
    this._accessToken = null;
    this._accessExp = null;
    this._refreshToken = null;
    this._refreshExp = null;
    this._user$.next(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenExpiresAt');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshTokenExpiresAt');
    localStorage.removeItem('user');
  }

  // Scrive una chiave nello storage (o la rimuove se null)
  private write(k: string, v: string | null) {
    if (v == null) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, v);
    }
  }

  // Legge una chiave dallo storage
  private read(k: string): string | null {
    return localStorage.getItem(k);
  }

  // Legge l'utente salvato in storage
  private readUser(): AuthUser | null {
    const s = localStorage.getItem('user');
    if (!s) return null;
    try {
      return JSON.parse(s) as AuthUser;
    } catch {
      return null;
    }
  }
}
