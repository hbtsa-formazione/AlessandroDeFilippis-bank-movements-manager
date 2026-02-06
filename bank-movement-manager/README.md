# Bank Movement Manager — Guida Passo Passo

## Panoramica
Applicazione Angular per gestire conti bancari e movimenti. Include:
- CRUD conti bancari
- CRUD movimenti con calcolo statistiche
- Pagamenti rateizzati con controllo liquidità e pop-up di avviso
- Gestione conti contabili (piano dei conti) in memoria

## Avvio rapido
- Avvio frontend: `npm start` e apri `http://localhost:4200/`
- Build: `npm run build`
- Test: `npm test`
- Backend C#: avvio nella cartella `BankApi` con `dotnet run` (vedi README in BankApi)

## Architettura
- Modulo radice: `src/app/app.module.ts`
- Routing: `src/app/app-routing.module.ts`
  - `home`, `lista-conti-bancari`, `lista-movimenti`, `form-conto-bancario`, `form-movimento`, `conti-contabili`

## Componenti
### Home
- Scopo: dashboard con link alle sezioni principali
- File: `src/app/home/home.component.ts` / `.html` / `.css`

### Lista Conti Bancari
- Scopo: tabella dei conti, azioni crea/modifica/elimina e navigazione al form
- Dati: `ContiService.getConti$()` (Observable)
- File: `src/app/lista-conti-bancari/lista-conti-bancari.component.ts` / `.html` / `.css`

### Form Conto Bancario
- Scopo: creazione/modifica conto con Reactive Forms e validazioni
- Flusso:
  - In modalità modifica, legge `:id` dalla rotta e carica il conto via HTTP
  - Salvataggio tramite `ContiService.upsertConto`
- File: `src/app/form-conto-bancario/form-conto-bancario.component.ts` / `.html` / `.css`

### Lista Movimenti
- Scopo: tabella movimenti arricchita con dati dei conti e statistiche
- Flusso dati:
  - Combina `MovimentiService.getMovimenti$()` con `ContiService.getConti$()` tramite `combineLatest`
  - Calcola totali per valuta e per conto
- File: `src/app/lista-movimenti/lista-movimenti.component.ts` / `.html` / `.css`

### Form Movimento
- Scopo: creazione/modifica movimento; supporta pagamenti rateizzati
- Funzioni chiave:
  - Toggle "Pagamento rateizzato"
  - Validazione numero rate
  - Calcolo del totale rate
  - Controllo liquidità e apertura pop-up rosso se insufficiente
  - Creazione rate con `MovimentiService.createInstallmentPayments`
- File: `src/app/form-movimento/form-movimento.component.ts` / `.html` / `.css`

### Conti Contabili
- Scopo: gestione piano dei conti (in memoria) con filtro e form modale
- Flusso:
  - Lettura stream da `ContiContabiliService`
  - Filtro per testo e tipo
  - Form modale per create/update
- File: `src/app/conti-contabili/conti-contabili.component.ts` / `.html` / `.css`
- Tabella figlia: `src/app/conti-contabili/tabella-conti/tabella-conti.component.ts` / `.html` / `.css`

## Servizi
### ContiService
- Ruolo: CRUD conti via HTTP verso backend C#
- Metodi principali: `getConti$`, `getContoById`, `upsertConto`
- File: `src/app/service/conti-service.ts`

### MovimentiService
- Ruolo: CRUD movimenti in memoria, statistiche e rateizzazione
- Metodi principali:
  - `getMovimenti$`, `getById`, `upsert`, `delete`
  - `getBalanceForAccount(accountId)` per saldo stimato
  - `createInstallmentPayments(params)` per generare rate mensili
- File: `src/app/service/movimenti-service.ts`

### ContiContabiliService
- Ruolo: gestione conti contabili in memoria con BehaviorSubject
- Metodi: `getContiContabili$`, `createConto`, `updateConto`, `deleteConto`
- File: `src/app/service/conti-contabili.service.ts`

## Modelli
- BankAccount: `id`, `name`, `iban`, `currency`
- BankMovement: `id`, `accountId`, `date`, `description`, `currency`, `amount`, opzionali `direction`, `category`, `balanceAfter`, `createdAt`
- ContiContabili: `id`, `nome`, `code`, `description`, `type`
- File: `src/app/model/*.ts`

## Flussi principali
### Creazione conto
1. Naviga in `form-conto-bancario`
2. Compila form e salva
3. Il service effettua `POST` o `PUT` al backend e aggiorna la lista

### Creazione movimento
1. Naviga in `form-movimento`
2. Compila form
3. Se non rateizzato: `MovimentiService.upsert` inserisce il singolo movimento
4. Se rateizzato:
   - Verifica saldo con `getBalanceForAccount`
   - Se insufficiente: mostra pop-up rosso con dettagli
   - Se sufficiente: genera le rate con `createInstallmentPayments` e naviga alla lista

### Lista movimenti e statistiche
1. Combina movimenti e conti per mostrare nome e IBAN
2. Calcola totali per valuta e per conto

### Conti contabili
1. Applica filtri e mostra tabella
2. Apre form modale per create/update

## Stili
- Design system in `src/styles.css` con palette, pulsanti, card, tabelle, alerts
- Stili locali per pop-up modale del form movimento in `form-movimento.component.css`

## Backend API (C#)
- Base URL: `http://localhost:5051`
- Endpoints:
  - `GET /api/conti` elenco conti
  - `GET /api/conti/{id}` dettaglio conto
  - `POST /api/conti` crea conto
  - `PUT /api/conti/{id}` aggiorna conto
  - `DELETE /api/conti/{id}` elimina conto
- Dati iniziali in memoria in `BankApi/Program.cs`

## Note SQL Server
- Tabelle suggerite: `dbo.BankAccounts`, `dbo.BankMovements`, `dbo.ContiContabili`
- Vedi query di creazione fornite nella richiesta precedente per gli schemi consigliati
