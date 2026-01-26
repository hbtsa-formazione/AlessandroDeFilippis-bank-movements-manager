import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ContiContabili } from '../model/conti-contabili';
import { type } from 'os';

 
@Injectable({
  providedIn: 'root'
})
export class ContiContabiliService {
 
  contiContabili : ContiContabili[] = [
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
  ];
 
  constructor() {
   }
 
   getconxticontabili() : Observable<ContiContabili[]> {
    return of(this.contiContabili);
   }
}
 