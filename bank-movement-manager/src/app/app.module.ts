import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ListaContiBancariComponent } from './lista-conti-bancari/lista-conti-bancari.component';
import { ListaMovimentiComponent } from './lista-movimenti/lista-movimenti.component';
import { FormContoBancarioComponent } from './form-conto-bancario/form-conto-bancario.component';
import { FormMovimentoComponent } from './form-movimento/form-movimento.component';
import { ContiContabiliComponent } from './conti-contabili/conti-contabili.component';
import { TabellaContiComponent } from './conti-contabili/tabella-conti/tabella-conti.component';
import { LoginComponent } from './login/login.component';
import { AuthInterceptor } from './auth/auth.interceptor';

/**
 * =========================================================================================
 * MODULE: APP MODULE (RADICE)
 * =========================================================================================
 * È il punto di ingresso dell'app Angular:
 * - Dichiara i componenti usati nell'app.
 * - Importa i moduli necessari (browser, routing, HTTP, forms).
 * - Indica il componente di bootstrap (AppComponent).
 */
@NgModule({
  declarations: [
    // Componenti UI dichiarati nel modulo
    AppComponent,
    HomeComponent,
    ListaContiBancariComponent,
    ListaMovimentiComponent,
    FormContoBancarioComponent,
    FormMovimentoComponent,
    ContiContabiliComponent,
    TabellaContiComponent,
    LoginComponent
  ],
  imports: [
    // Modulo base per eseguire l'app nel browser
    BrowserModule,
    // Abilita le chiamate HTTP verso API esterne
    HttpClientModule,
    // Abilita i Reactive Forms (FormGroup, FormControl)
    ReactiveFormsModule,
    // Modulo di routing con le rotte dell'app
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  // Componente radice che Angular carica per primo
  bootstrap: [AppComponent]
})
export class AppModule { }
