import { Component } from '@angular/core';

/**
 * =========================================================================================
 * COMPONENT: APP ROOT
 * =========================================================================================
 * È il componente radice dell'albero di Angular.
 * Viene caricato per primo (bootstrap) e contiene il layout principale della pagina
 * (es. Navbar, Footer e il tag <router-outlet> dove vengono caricate le pagine).
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'bank-movement-manager';
}
