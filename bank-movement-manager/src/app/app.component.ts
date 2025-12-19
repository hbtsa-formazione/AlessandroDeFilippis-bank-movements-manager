import { Component } from '@angular/core';

/**
 * Componente Root dell'applicazione.
 * Funge da contenitore principale (shell) per l'intera interfaccia utente.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  /**
   * Titolo dell'applicazione, utilizzato per il tag <title> o nell'header.
   */
  title = 'bank-movement-manager';
}
