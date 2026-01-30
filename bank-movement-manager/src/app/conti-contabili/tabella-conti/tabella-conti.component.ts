import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContiContabili } from 'src/app/model/conti-contabili';

/**
 * =========================================================================================
 * COMPONENT: TABELLA CONTI CONTABILI
 * =========================================================================================
 * Questo componente è "presentazionale":
 * - Riceve la lista dei dati via @Input()
 * - Emana eventi di modifica/eliminazione via @Output()
 *
 * Non contiene logica di business: quella resta nel componente padre.
 */
@Component({
  selector: 'app-tabella-conti',
  templateUrl: './tabella-conti.component.html',
  styleUrls: ['./tabella-conti.component.css']
})
export class TabellaContiComponent {
  /**
   * Lista di conti contabili da visualizzare nella tabella.
   */
  @Input() contiContabili: ContiContabili[] = [];

  /**
   * Evento "edit": notificato quando l'utente clicca l'icona di modifica.
   * Il payload è l'oggetto ContoContabile selezionato.
   */
  @Output() edit = new EventEmitter<ContiContabili>();

  /**
   * Evento "remove": notificato quando l'utente clicca l'icona di eliminazione.
   * Il payload è l'oggetto ContoContabile selezionato.
   */
  @Output() remove = new EventEmitter<ContiContabili>();
}
