import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ListaContiBancariComponent } from './lista-conti-bancari/lista-conti-bancari.component';
import { ListaMovimentiComponent } from './lista-movimenti/lista-movimenti.component';
import { FormContoBancarioComponent } from './form-conto-bancario/form-conto-bancario.component';
import { FormMovimentoComponent } from './form-movimento/form-movimento.component';
import { ContiContabiliComponent } from './conti-contabili/conti-contabili.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'lista-conti-bancari', component: ListaContiBancariComponent },
  { path: 'lista-movimenti', component: ListaMovimentiComponent },
  
  // Form conto: creazione e modifica
  { path: 'form-conto-bancario', component: FormContoBancarioComponent },
  { path: 'form-conto-bancario/:id', component: FormContoBancarioComponent },
  
  { path: 'form-movimento', component: FormMovimentoComponent },
  { path: 'conti-contabili', component: ContiContabiliComponent },
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }