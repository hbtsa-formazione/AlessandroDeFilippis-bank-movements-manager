# BankApi — Guida Passo Passo

## Panoramica
Backend minimale in .NET (Minimal API) che espone gli endpoint per i conti bancari.
Usa un database in memoria (lista) che si resetta a ogni riavvio.

## Avvio
- Requisiti: .NET 8 SDK
- Comando: esegui `dotnet run` nella cartella `BankApi`
- CORS: abilitato per `http://localhost:4200`

## Dati Iniziali
La lista `conti` contiene 2 conti di esempio:
- Id, Name, Iban, Currency
Definiti in `Program.cs` nella sezione “DATABASE (IN MEMORIA)”.

## Endpoints
- `GET /api/conti`: restituisce l’elenco dei conti
- `GET /api/conti/{id}`: restituisce un conto per ID
- `POST /api/conti`: crea un conto (assegna ID incrementale)
- `PUT /api/conti/{id}`: aggiorna un conto esistente
- `DELETE /api/conti/{id}`: elimina un conto

## Modello Dati
Classe `ContoBancario`:
- `Id` (int)
- `Name` (string)
- `Iban` (string)
- `Currency` (string)

## Collegamento al Frontend
Nel frontend Angular (`ContiService`) l’URL base è `http://localhost:5051/api/conti`.
Il servizio legge/scrive i conti tramite gli endpoint sopra e aggiorna la lista locale.

## Note
- Il backend non gestisce movimenti o conti contabili: queste entità sono gestite lato frontend in memoria.
