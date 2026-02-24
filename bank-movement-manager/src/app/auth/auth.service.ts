import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timer, switchMap, of, catchError } from 'rxjs';

/**
 * =========================================================================================
 * INTERFACCIA: AUTH USER
 * =========================================================================================
 * Rappresenta l'utente autenticato restituito dal backend.
 * È un sottoinsieme dei dati utente necessari alla UI (ID, username, ruolo).
 * Non include informazioni sensibili come password o token.
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
 * Contiene sia i token sia l'utente, per consentire la persistenza client-side.
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
 * Responsabilità principali:
 * - Avviare il login e salvare token e profilo utente
 * - Tentare refresh automatici prima o dopo la scadenza
 * - Esporre lo stato autenticato per la UI
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Endpoint base per autenticazione
  // Cambiare qui se la porta o il path dell'API cambia
  private readonly apiBase = 'http://localhost:5051/api/auth';
  // Stato utente in memoria (con persistenza su localStorage)
  // BehaviorSubject consente di emettere subito l'ultimo valore a nuovi subscriber
  private _user$ = new BehaviorSubject<AuthUser | null>(this.readUser());
  // Token e scadenze memorizzati localmente
  // Questi valori sono sincronizzati con il localStorage
  private _accessToken: string | null = this.read('accessToken');
  private _accessExp: string | null = this.read('accessTokenExpiresAt');
  private _refreshToken: string | null = this.read('refreshToken');
  private _refreshExp: string | null = this.read('refreshTokenExpiresAt');
  // Flag per evitare di avviare più timer di refresh contemporaneamente
  private _refreshTimerStarted = false;

  constructor(private http: HttpClient) {
    // Avviamo il controllo periodico per refresh automatico
    // Serve a mantenere una sessione valida senza che l'utente ricarichi la pagina
    this.startRefreshTimerIfNeeded();
  }

  // Espone lo stream dell'utente loggato
  // Ritorno: Observable che emette l'utente o null quando non autenticato
  user$(): Observable<AuthUser | null> {
    return this._user$.asObservable();
  }

  // Verifica veloce se l'utente è autenticato
  // Ritorno: true se esiste access token e non è scaduto
  isLoggedIn(): boolean {
    return !!this._accessToken && !this.isExpired(this._accessExp);
  }

  // Access token corrente (usato dall'interceptor)
  // Ritorno: stringa token o null se assente
  getAccessToken(): string | null {
    return this._accessToken;
  }

  // Effettua login e salva token/utente in storage
  // Parametri:
  // - username: credenziale inserita dall'utente
  // - password: credenziale inserita dall'utente
  // Ritorno:
  // - Observable<LoginResponse> che completa quando i token sono salvati
  // Errori gestiti:
  // - eventuali errori HTTP vengono propagati al chiamante
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
  // Ritorno:
  // - Observable<void> sempre completato (anche in caso di errore backend)
  // Errori gestiti:
  // - catchError evita che un errore blocchi la pulizia dello stato locale
  logout(): Observable<void> {
    const body = { refreshToken: this._refreshToken };
    return this.http.post<void>(`${this.apiBase}/logout`, body).pipe(
      catchError(() => of(void 0)),
      tap(() => this.clear())
    );
  }

  // Wrapper usato dall'interceptor per rinnovare i token in caso di 401
  // Ritorno:
  // - Observable<LoginResponse | null> (null se refresh non possibile)
  refreshTokens(): Observable<LoginResponse | null> {
    return this.refresh().pipe(catchError(() => of(null)));
  }

  // Chiamata interna di refresh token
  // Ritorno:
  // - Observable<LoginResponse> con nuovi token
  // - null se non abbiamo refresh token salvato
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
  // Logica:
  // - Se non c'è access token o è scaduto -> refresh immediato
  // - Se scade entro 60s -> refresh proattivo
  // - Altrimenti non fa nulla
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
  // Parametri:
  // - iso: stringa data in formato ISO (es. 2026-02-24T10:00:00Z)
  // Ritorno:
  // - true se la data è passata o non presente
  private isExpired(iso?: string | null): boolean {
    if (!iso) return true;
    return new Date(iso).getTime() <= Date.now();
  }

  // Persistenza completa (token + utente)
  // Salva token e utente in memoria e storage
  private persistLogin(res: LoginResponse) {
    this.persistTokens(res);
    this.write('user', JSON.stringify(res.user));
  }

  // Persistenza token e scadenze
  // Aggiorna sia lo stato in memoria sia il localStorage
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
  // Pulisce memoria e localStorage
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
  // Parametri:
  // - k: chiave storage
  // - v: valore da salvare o null per rimozione
  private write(k: string, v: string | null) {
    if (v == null) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, v);
    }
  }

  // Legge una chiave dallo storage
  // Ritorno: stringa salvata o null se assente
  private read(k: string): string | null {
    return localStorage.getItem(k);
  }

  // Legge l'utente salvato in storage
  // Ritorno: AuthUser o null se non presente o JSON non valido
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
