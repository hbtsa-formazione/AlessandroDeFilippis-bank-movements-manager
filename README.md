# Bank Movements Manager - Esercizio Angular

## Guida Funzionale (passo passo)

### 1) Avvio applicazione
- Avvia il backend in memoria: esegui `dotnet run` nella cartella `BankApi`
- Avvia il frontend: esegui `npm start` nella cartella `bank-movement-manager`
- Apri `http://localhost:4200/`

### 2) Dashboard (Home)
- Usa le card per navigare a: Conti Bancari, Movimenti, Nuovo Conto, Nuovo Movimento, Conti Contabili

### 3) Conti Bancari
- **Lista Conti Bancari**: visualizza la tabella, elimina o modifica un conto
- **Form Conto Bancario**:
  1. Inserisci Nome, IBAN e Valuta
  2. Salva per creare o modificare (in base alla rotta con o senza `:id`)
  3. Torna alla lista

### 4) Movimenti
- **Lista Movimenti**:
  1. Visualizza movimenti con Nome conto e IBAN
  2. Controlla i totali per valuta e per conto
  3. Modifica o elimina singoli movimenti
- **Form Movimento**:
  1. Inserisci Conto, Data, Descrizione, Valuta, Importo
  2. Se attivi “Pagamento rateizzato”, imposta il numero rate
  3. Il sistema controlla il saldo: se insufficiente mostra un pop-up rosso
  4. Se sufficiente, crea le rate e torna alla lista

### 5) Conti Contabili
- Filtra per testo e tipo
- Crea/modifica tramite form modale
- Elimina i conti contabili dalla tabella

### 6) Dati in memoria (backend e frontend)
- Backend C#: conti bancari in memoria con API `/api/conti`
- Frontend Angular: movimenti e conti contabili gestiti in memoria

## Prerequisiti

- Aver completato il [Tour of Heroes](https://angular.io/tutorial/tour-of-heroes) di Angular
- Conoscenza base di TypeScript
- Git e GitHub configurati

---

## Obiettivo

Creare un'applicazione Angular per la gestione di conti bancari e movimenti bancari. L'applicazione permetterà di visualizzare, creare, modificare ed eliminare conti bancari e i relativi movimenti..

---

## Setup Iniziale

1. Crea un repository su GitHub nell'organizzazione [hbtsa-formazione](https://github.com/hbtsa-formazione) con il nome `NomeCognome/bank-movements-manager`
2. Crea un nuovo progetto Angular in locale
3. Collega il progetto locale al repository GitHub
4. Effettua il primo commit e push

---

## Specifiche Tecniche

### Database

Il collegamento al server deve essere **mockato** utilizzando un database in memoria, come fatto nel Tour of Heroes con `angular-in-memory-web-api`. È accettabile che i dati vengano persi al refresh della pagina.

> **Nota**: In futuro verrà implementato un vero backend.

### Stile

Libera scelta per quanto riguarda CSS e librerie UI. Puoi usare CSS puro, Bootstrap, Angular Material o qualsiasi altra soluzione tu preferisca..

---

## Struttura dell'Applicazione

L'applicazione dovrà avere **5 pagine**:

1. **Home** - Pagina principale con link di navigazione
2. **Lista Conti Bancari** - Visualizzazione e gestione dei conti
3. **Form Conto Bancario** - Creazione/modifica di un conto
4. **Lista Movimenti** - Visualizzazione e gestione dei movimenti
5. **Form Movimento** - Creazione/modifica di un movimento

---

## Step 1: Gestione Conti Bancari

### Modello BankAccount

Crea un'interfaccia `BankAccount` che rappresenti un conto bancario. L'interfaccia deve contenere almeno i seguenti campi:

- **Id**: identificativo univoco numerico (deve essere generato automaticamente, non deve visualizzato né deve inserirlo l'utente)
- **Name**: nome del conto
- **Iban**: codice IBAN del conto
- **Currency**: valuta del conto (es. 'EUR', 'USD', 'GBP')

### Pagina: Lista Conti Bancari

- Visualizzare tutti i conti bancari in una tabella (visualizzare colonne: Nome, IBAN, Valuta)
- Bottone per navigare al form di creazione nuovo conto
- Bottone per tornare alla Home
- Per ogni riga della tabella:
  - Bottone per eliminare il conto
  - Bottone per modificare il conto (naviga al form in modalità modifica)

### Pagina: Form Conto Bancario

- Form per inserire/modificare i dati del conto bancario
- Deve funzionare sia in modalità **creazione** che in modalità **modifica**
- Bottone per salvare
- Bottone per annullare e tornare alla lista

### Pagina: Home (versione Step 1)

- Link per navigare alla Lista Conti Bancari

---

## Step 2: Gestione Movimenti Bancari

### Modello BankMovement

Crea un'interfaccia `BankMovement` che rappresenti un movimento bancario. L'interfaccia deve contenere almeno i seguenti campi:

- **Id**: identificativo univoco numerico (deve essere generato automaticamente, non deve visualizzato né deve inserirlo l'utente)
- **Date**: data del movimento
- **Description**: descrizione del movimento
- **Currency**: valuta del movimento (es. 'EUR', 'USD', 'GBP')
- **Amount**: importo del movimento

Devi inoltre decidere come collegare un movimento bancario a un conto bancario. Pensa a quale sia la soluzione più appropriata e aggiungi i campi necessari all'interfaccia.

### Pagina: Lista Movimenti

- Visualizzare tutti i movimenti in una tabella (visualizzare colonne: Nome conto bancario, IBAN conto bancario, Data Movimento, Descrizione Movimento, Valuta, Importo)
- Bottone per navigare al form di creazione nuovo movimento
- Bottone per tornare alla Home
- Per ogni riga della tabella:
  - Bottone per eliminare il movimento
  - Bottone per modificare il movimento (naviga al form in modalità modifica)
- **Sezione Totali**: Visualizzare i totali dei movimenti raggruppati per:
  - Valuta (currency)
  - Conto bancario

### Pagina: Form Movimento

- Form per inserire/modificare i dati del movimento bancario
- Deve funzionare sia in modalità **creazione** che in modalità **modifica**
- Bottone per salvare
- Bottone per annullare e tornare alla lista

### Pagina: Home (versione finale)

- Link per navigare alla Lista Conti Bancari
- Link per navigare alla Lista Movimenti

---

## Criteri di Valutazione

- Corretta implementazione delle funzionalità CRUD (Create, Read, Update, Delete)
- Navigazione funzionante tra le pagine
- Corretta gestione del database in memoria
- Codice pulito e organizzato
- Corretta tipizzazione TypeScript
- Codice che compila e pushato su GitHub

---

## Consegna

1. Assicurati che tutto il codice sia committato e pushato sul repository GitHub
2. Verifica che l'applicazione funzioni correttamente con `ng serve`
3. Comunica il completamento dell'esercizio

---

## Risorse Utili

- [Angular 14 Documentation](https://v14.angular.io/docs)
- [Tour of Heroes Tutorial]([Angular - Tour of Heroes application and tutorial](https://v14.angular.io/tutorial))
- [Angular In-Memory Web API](https://github.com/angular/angular/tree/main/packages/misc/angular-in-memory-web-api)
- [Angular Routing](https://v14.angular.io/guide/router)
- [Angular Forms](https://v14.angular.io/guide/forms-overview)
