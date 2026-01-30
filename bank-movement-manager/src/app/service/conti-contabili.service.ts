import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContiContabili } from '../model/conti-contabili';

/**
 * =========================================================================================
 * SERVICE: CONTI CONTABILI
 * =========================================================================================
 * Questo servizio gestisce i "conti contabili" (piano dei conti).
 * È costruito in modo molto simile al servizio dei conti bancari, ma lavora in memoria.
 *
 * Concetti chiave:
 * - BehaviorSubject: tiene lo stato corrente e notifica automaticamente i componenti
 *   quando cambia (pattern reattivo).
 * - CRUD basico: create, update, delete su un array locale.
 * - Observable read-only: esponiamo lo stream con .asObservable() per evitare
 *   modifiche esterne non controllate.
 */
@Injectable({
  providedIn: 'root'
})
export class ContiContabiliService {
  /**
   * Stato reattivo dei conti contabili.
   * In un'app reale, questi dati verrebbero dal server (HTTP).
   * Qui li inizializziamo con 3 elementi di esempio.
   */
  private readonly _contiContabili$ = new BehaviorSubject<ContiContabili[]>([
    {
      id: 1,
      nome: 'Conto Corrente',
      code: 'CC001',
      description: 'Conto corrente principale',
      type: 'CORRENTI'
    },
    {
      id: 2,
      nome: 'Conto Deposito',
      code: 'DP001',
      description: 'Conto deposito mensile',
      type: 'DEPOSITI'
    },
    {
      id: 3,
      nome: 'Conto Prestito',
      code: 'PR001',
      description: 'Conto prestito mensile',
      type: 'PRESTITI'
    }
  ]);

  /**
   * Costruttore del servizio.
   * Non serve fare nulla alla nascita: i dati iniziali sono già nel BehaviorSubject.
   */
  constructor() { }

  /**
   * Restituisce lo stream dei conti contabili.
   * I componenti si sottoscrivono per ricevere aggiornamenti automatici.
   */
  getContiContabili$(): Observable<ContiContabili[]> {
    return this._contiContabili$.asObservable();
  }

  /**
   * CREATE
   * Aggiunge un nuovo conto contabile.
   * - Calcola un ID incrementale (max + 1).
   * - Aggiorna l'array in modo immutabile (spread operator).
   */
  createConto(conto: Omit<ContiContabili, 'id'>): void {
    const current = this._contiContabili$.value;
    const newId = current.length > 0 ? Math.max(...current.map(c => c.id)) + 1 : 1;
    const updated = [...current, { ...conto, id: newId }];
    this._contiContabili$.next(updated);
  }

  /**
   * UPDATE
   * Modifica un conto esistente cercandolo per ID e sostituendolo con
   * una nuova copia aggiornata (immutabilità).
   */
  updateConto(conto: ContiContabili): void {
    const updated = this._contiContabili$.value.map(c => c.id === conto.id ? { ...conto } : c);
    this._contiContabili$.next(updated);
  }

  /**
   * DELETE
   * Rimuove un conto filtrando l'array per tutti gli elementi con ID diverso.
   */
  deleteConto(id: number): void {
    const updated = this._contiContabili$.value.filter(c => c.id !== id);
    this._contiContabili$.next(updated);
  }
}
 
