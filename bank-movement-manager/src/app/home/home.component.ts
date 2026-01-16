import { Component, OnInit } from '@angular/core';

/**
 * =========================================================================================
 * COMPONENT: HOME (DASHBOARD)
 * =========================================================================================
 * Pagina di atterraggio dell'applicazione.
 * 
 * Non contiene logica complessa, funge solo da menu di navigazione grafico.
 * I link reali sono gestiti nel template HTML tramite la direttiva `routerLink`.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Qui si potrebbero caricare statistiche globali o messaggi di benvenuto
  }

}
