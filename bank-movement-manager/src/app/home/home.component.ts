import { Component, OnInit } from '@angular/core';

/**
 * Componente Home (Dashboard).
 * Rappresenta la pagina iniziale dell'applicazione, fornendo un accesso rapido
 * alle funzionalità principali tramite delle "Card" di navigazione.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }

  /**
   * Lifecycle hook che viene chiamato dopo che Angular ha inizializzato le proprietà.
   * Qui andrebbero eventuali chiamate iniziali ai service, se necessarie.
   */
  ngOnInit(): void {
  }

}
