// ==============================================================================================
// FILE: Program.cs
// ==============================================================================================
// Questo è il punto di ingresso (Entry Point) della nostra applicazione C#.
// In .NET 6/7/8, si usano le "Minimal API", che permettono di scrivere tutto in un solo file.
// ==============================================================================================

// Importiamo il "Builder" che serve a costruire l'applicazione web.
using System.Security.Authentication;

var builder = WebApplication.CreateBuilder(args);

// ==============================================================================================
// 1. CONFIGURAZIONE DEI SERVIZI (DEPENDENCY INJECTION)
// ==============================================================================================
// Qui aggiungiamo funzionalità al server prima che venga avviato.

// Aggiungiamo il servizio CORS (Cross-Origin Resource Sharing).
// Serve perché il nostro Frontend (Angular) gira su una porta (4200) e il Backend su un'altra.
// Senza CORS, il browser bloccherebbe le chiamate per sicurezza.
builder.Services.AddCors(options =>
{
    // Definiamo una politica chiamata "AllowAngular"
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200") // Permettiamo chiamate SOLO da Angular
                  .AllowAnyHeader()                     // Permettiamo qualsiasi intestazione HTTP
                  .AllowAnyMethod();                    // Permettiamo GET, POST, PUT, DELETE
        });
});

// Costruiamo l'applicazione vera e propria.
var app = builder.Build();

// ==============================================================================================
// 2. CONFIGURAZIONE DELLA PIPELINE HTTP
// ==============================================================================================
// Qui decidiamo come l'applicazione deve rispondere alle richieste che arrivano.

// Attiviamo la politica CORS che abbiamo definito sopra.
// Deve essere messo PRIMA di definire gli endpoint.
app.UseCors("AllowAngular");

// ==============================================================================================
// 3. DATABASE (IN MEMORIA)
// ==============================================================================================
// Non usiamo ancora un database vero (SQL). Usiamo una semplice lista in memoria.
// ATTENZIONE: Se riavvii il server, i dati si resettano!

// Creiamo una lista statica di Conti Bancari per avere dei dati di prova.
var conti = new List<ContoBancario>
{
    new ContoBancario 
    { 
        Id = 1, 
        Name = "Conto Principale", 
        Iban = "IT60X0542811101000000123456", 
        Currency = "EUR" 
    },
    new ContoBancario 
    { 
        Id = 2, 
        Name = "Conto Risparmio", 
        Iban = "IT12A0123456789012345678901", 
        Currency = "USD" 
    }
};

// ==============================================================================================
// 4. DEFINIZIONE DEGLI ENDPOINT (API)
// ==============================================================================================
// Qui mappiamo gli URL (es. /api/conti) alle funzioni che devono rispondere.

// ----------------------------------------------------------------------------------------------
// GET: /api/conti
// Restituisce la lista di tutti i conti.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti", () => 
{
    // Restituisce direttamente la lista. .NET la converte automaticamente in JSON.
    return Results.Ok(conti);
});

// ----------------------------------------------------------------------------------------------
// GET: /api/conti/{id}
// Restituisce un singolo conto cercando per ID.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti/{id}", (int id) =>
{
    // Cerchiamo nella lista il primo conto che ha l'Id uguale a quello richiesto.
    var conto = conti.FirstOrDefault(c => c.Id == id);

    // Se non lo troviamo (è null), restituiamo 404 NotFound.
    if (conto is null)
    {
        return Results.NotFound(new { Message = "Conto non trovato" });
    }

    // Se lo troviamo, restituiamo 200 OK con l'oggetto.
    return Results.Ok(conto);
});

// ----------------------------------------------------------------------------------------------
// POST: /api/conti
// Crea un nuovo conto.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/conti", (ContoBancario nuovoConto) =>
{
    // Calcoliamo il nuovo ID: prendiamo il massimo ID attuale e aggiungiamo 1.
    // Se la lista è vuota, partiamo da 1.
    int newId = conti.Any() ? conti.Max(c => c.Id) + 1 : 1;
    nuovoConto.Id = newId;

    // Aggiungiamo il nuovo conto alla lista.
    conti.Add(nuovoConto);

    // Restituiamo 200 OK con il conto appena creato (che ora ha l'ID).
    return Results.Ok(nuovoConto);
});

// ----------------------------------------------------------------------------------------------
// PUT: /api/conti/{id}
// Aggiorna un conto esistente.
// ----------------------------------------------------------------------------------------------
app.MapPut("/api/conti/{id}", (int id, ContoBancario contoAggiornato) =>
{
    // Cerchiamo il conto da modificare.
    var contoEsistente = conti.FirstOrDefault(c => c.Id == id);

    // Se non esiste, errore 404.
    if (contoEsistente is null)
    {
        return Results.NotFound();
    }

    // Aggiorniamo i campi.
    contoEsistente.Name = contoAggiornato.Name;
    contoEsistente.Iban = contoAggiornato.Iban;
    contoEsistente.Currency = contoAggiornato.Currency;

    // Restituiamo il conto aggiornato.
    return Results.Ok(contoEsistente);
});

// ----------------------------------------------------------------------------------------------
// DELETE: /api/conti/{id}
// Elimina un conto.
// ----------------------------------------------------------------------------------------------
app.MapDelete("/api/conti/{id}", (int id) =>
{
    // Cerchiamo il conto da eliminare.
    var contoDaEliminare = conti.FirstOrDefault(c => c.Id == id);

    // Se esiste, lo rimuoviamo dalla lista.
    if (contoDaEliminare is not null)
    {
        conti.Remove(contoDaEliminare);
    }

    // Restituiamo 200 OK (anche se non c'era, per idempotenza spesso si fa così, oppure 204 No Content).
    return Results.Ok();
});

// ==============================================================================================
// 5. AVVIO DELL'APPLICAZIONE
// ==============================================================================================
// Questo comando fa partire il server in ascolto sulle porte configurate.
app.Run();

// ==============================================================================================
// CLASSI MODELLO (DATA MODELS)
// ==============================================================================================
// Definiamo la struttura dei dati. In un progetto grande starebbero in file separati.

public class ContoBancario
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Inizializziamo a stringa vuota per evitare null
    public string Iban { get; set; } = string.Empty;
    public string Currency { get; set; } = "EUR";
}
