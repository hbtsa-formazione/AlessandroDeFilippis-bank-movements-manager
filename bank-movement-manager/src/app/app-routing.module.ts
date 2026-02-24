import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ListaContiBancariComponent } from './lista-conti-bancari/lista-conti-bancari.component';
import { ListaMovimentiComponent } from './lista-movimenti/lista-movimenti.component';
import { FormContoBancarioComponent } from './form-conto-bancario/form-conto-bancario.component';
import { FormMovimentoComponent } from './form-movimento/form-movimento.component';
import { ContiContabiliComponent } from './conti-contabili/conti-contabili.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth/auth.guard';

/**
 * =========================================================================================
 * ROUTING: APP ROUTING MODULE
 * =========================================================================================
 * Definisce tutte le rotte dell'applicazione.
 * Ogni rotta collega un path URL a un componente Angular.
 */
const routes: Routes = [
  // Redirect di default alla home
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // Dashboard principale
  { path: 'home', component: HomeComponent },
  // Elenco dei conti bancari
  { path: 'lista-conti-bancari', component: ListaContiBancariComponent, canActivate: [AuthGuard] },
  // Elenco e statistiche dei movimenti
  { path: 'lista-movimenti', component: ListaMovimentiComponent, canActivate: [AuthGuard] },
  
  // Form conto: creazione e modifica
  { path: 'form-conto-bancario', component: FormContoBancarioComponent, canActivate: [AuthGuard] },
  { path: 'form-conto-bancario/:id', component: FormContoBancarioComponent, canActivate: [AuthGuard] },
  
  // Form movimenti: creazione e modifica
  { path: 'form-movimento', component: FormMovimentoComponent, canActivate: [AuthGuard] },
  // Piano dei conti contabili
  { path: 'conti-contabili', component: ContiContabiliComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  // Rotta wildcard: qualsiasi URL sconosciuto torna alla home
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  // Abilita il router con le rotte sopra e ripristino scroll
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  // Esporta le direttive routerLink/routerOutlet ai componenti
  exports: [RouterModule]
})
export class AppRoutingModule { }
