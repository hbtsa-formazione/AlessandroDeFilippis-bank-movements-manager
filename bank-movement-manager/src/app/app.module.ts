import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ListaContiBancariComponent } from './lista-conti-bancari/lista-conti-bancari.component';
import { ListaMovimentiComponent } from './lista-movimenti/lista-movimenti.component';
import { FormContoBancarioComponent } from './form-conto-bancario/form-conto-bancario.component';
import { FormMovimentoComponent } from './form-movimento/form-movimento.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ListaContiBancariComponent,
    ListaMovimentiComponent,
    FormContoBancarioComponent,
    FormMovimentoComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }