// ==============================================================================================
// FILE: Program.cs
// ==============================================================================================
// Questo è il punto di ingresso (Entry Point) della nostra applicazione C#.
// In .NET 6/7/8, si usano le "Minimal API", che permettono di scrivere tutto in un solo file.
// ==============================================================================================

// Importiamo il "Builder" che serve a costruire l'applicazione web.
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

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

// ==============================================================================================
// 1.b CONFIGURAZIONE JWT (AUTENTICAZIONE E AUTORIZZAZIONE)
// ==============================================================================================
// Leggiamo le impostazioni JWT (Issuer, Audience, scadenze) dal file di configurazione.
// La chiave di firma (Secret) deve essere fornita via variabile d'ambiente in produzione.
// In sviluppo, se manca, ne generiamo una temporanea per poter avviare il progetto.
var jwtSection = builder.Configuration.GetSection("Jwt");
var issuer = jwtSection["Issuer"] ?? "BankApi";
var audience = jwtSection["Audience"] ?? "BankApiClient";
var accessTokenMinutes = int.TryParse(jwtSection["AccessTokenMinutes"], out var atm) ? atm : 15;
var refreshTokenDays = int.TryParse(jwtSection["RefreshTokenDays"], out var rtd) ? rtd : 7;
var secret = builder.Configuration["Jwt:Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(secret))
{
    if (builder.Environment.IsDevelopment())
    {
        secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
    else
    {
        throw new InvalidOperationException("JWT secret is required.");
    }
}

var jwtOptions = new JwtOptions(issuer, audience, secret, TimeSpan.FromMinutes(accessTokenMinutes), TimeSpan.FromDays(refreshTokenDays));
builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton<JwtTokenService>();

// Database in memoria per token revocati e refresh token attivi
var revokedTokens = new ConcurrentDictionary<string, DateTimeOffset>();
var refreshTokens = new ConcurrentDictionary<string, RefreshTokenEntry>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            // Verifica della blacklist: se il JTI è revocato, il token è rifiutato
            OnTokenValidated = context =>
            {
                var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (!string.IsNullOrWhiteSpace(jti) && revokedTokens.TryGetValue(jti, out var expiresAt))
                {
                    if (expiresAt > DateTimeOffset.UtcNow)
                    {
                        context.Fail("revoked");
                    }
                    else
                    {
                        revokedTokens.TryRemove(jti, out _);
                    }
                }
                return Task.CompletedTask;
            },
            // Gestione errori generici di autenticazione
            OnAuthenticationFailed = context =>
            {
                return Task.CompletedTask;
            },
            // Risposte coerenti per token mancante, scaduto o non valido
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var hasAuth = context.Request.Headers.ContainsKey("Authorization");
                var isExpired = context.AuthenticateFailure is SecurityTokenExpiredException;
                var message = !hasAuth ? "Token mancante" : isExpired ? "Token scaduto" : "Token non valido";
                return context.Response.WriteAsJsonAsync(new { message });
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
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
// Middleware di autenticazione e autorizzazione
app.UseAuthentication();
app.UseAuthorization();

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

// Utenti demo con password hashate (PBKDF2)
var users = new List<AuthUser>
{
    new() { Id = 1, Username = "admin", PasswordHash = PasswordHasher.Hash("Admin123!"), Role = "Admin" },
    new() { Id = 2, Username = "user", PasswordHash = PasswordHasher.Hash("User123!"), Role = "User" }
};

// AUTH: Login con rilascio di Access e Refresh Token
app.MapPost("/api/auth/login", (LoginRequest req, JwtTokenService tokenService) =>
{
    var user = users.FirstOrDefault(u => u.Username == req.Username);
    if (user is null)
    {
        return Results.Unauthorized();
    }
    if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    var tokens = tokenService.CreateTokens(user);
    var entry = new RefreshTokenEntry
    {
        UserId = user.Id,
        Token = tokens.RefreshToken,
        ExpiresAt = tokens.RefreshTokenExpiresAt,
        IsRevoked = false
    };
    refreshTokens[tokens.RefreshToken] = entry;
    return Results.Ok(new
    {
        accessToken = tokens.AccessToken,
        accessTokenExpiresAt = tokens.AccessTokenExpiresAt,
        refreshToken = tokens.RefreshToken,
        refreshTokenExpiresAt = tokens.RefreshTokenExpiresAt,
        user = new { id = user.Id, username = user.Username, role = user.Role }
    });
});

// AUTH: Refresh (token rotation single-use)
app.MapPost("/api/auth/refresh", (RefreshRequest req, JwtTokenService tokenService) =>
{
    if (!refreshTokens.TryGetValue(req.RefreshToken, out var entry) || entry.IsRevoked || entry.ExpiresAt <= DateTimeOffset.UtcNow)
    {
        return Results.Unauthorized();
    }

    var user = users.FirstOrDefault(u => u.Id == entry.UserId);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var tokens = tokenService.CreateTokens(user);
    refreshTokens[tokens.RefreshToken] = new RefreshTokenEntry
    {
        UserId = user.Id,
        Token = tokens.RefreshToken,
        ExpiresAt = tokens.RefreshTokenExpiresAt,
        IsRevoked = false
    };

    entry.IsRevoked = true;
    refreshTokens[req.RefreshToken] = entry;

    return Results.Ok(new
    {
        accessToken = tokens.AccessToken,
        accessTokenExpiresAt = tokens.AccessTokenExpiresAt,
        refreshToken = tokens.RefreshToken,
        refreshTokenExpiresAt = tokens.RefreshTokenExpiresAt
    });
});

// AUTH: Logout con revoca access token e invalidazione refresh token
app.MapPost("/api/auth/logout", (HttpContext context, LogoutRequest req, JwtTokenService tokenService) =>
{
    var authHeader = context.Request.Headers.Authorization.ToString();
    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        var token = authHeader["Bearer ".Length..].Trim();
        if (!string.IsNullOrWhiteSpace(token))
        {
            var jwt = tokenService.ReadToken(token);
            var expiresAt = jwt.ValidTo == default
                ? DateTimeOffset.UtcNow.AddMinutes(accessTokenMinutes)
                : new DateTimeOffset(DateTime.SpecifyKind(jwt.ValidTo, DateTimeKind.Utc));
            if (!string.IsNullOrWhiteSpace(jwt.Id))
            {
                revokedTokens[jwt.Id] = expiresAt;
            }
        }
    }
    if (!string.IsNullOrWhiteSpace(req.RefreshToken))
    {
        if (refreshTokens.TryGetValue(req.RefreshToken, out var entry))
        {
            entry.IsRevoked = true;
            refreshTokens[req.RefreshToken] = entry;
        }
    }
    return Results.Ok();
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/conti
// Restituisce la lista di tutti i conti.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti", () => 
{
    // Restituisce direttamente la lista. .NET la converte automaticamente in JSON.
    return Results.Ok(conti);
}).RequireAuthorization();

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
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// POST: /api/conti
// Crea un nuovo conto.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/conti", (ContoBancario nuovoConto) =>
{
    // Calcoliamo il nuovo ID: prendiamo il massimo ID attuale e aggiungiamo 1.
    // Se la lista è vuota, partiamo da 1.
    int newId = conti.Count > 0 ? conti.Max(c => c.Id) + 1 : 1;
    nuovoConto.Id = newId;

    // Aggiungiamo il nuovo conto alla lista.
    conti.Add(nuovoConto);

    // Restituiamo 200 OK con il conto appena creato (che ora ha l'ID).
    return Results.Ok(nuovoConto);
}).RequireAuthorization("AdminOnly");

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
}).RequireAuthorization("AdminOnly");

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
}).RequireAuthorization("AdminOnly");

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

// ==============================================================================================
// MODELLI AUTENTICAZIONE
// ==============================================================================================
public class AuthUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class LogoutRequest
{
    public string? RefreshToken { get; set; }
}

public class RefreshTokenEntry
{
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}

// ==============================================================================================
// UTILITÀ: HASH DELLA PASSWORD
// ==============================================================================================
public static class PasswordHasher
{
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string stored)
    {
        var parts = stored.Split('.');
        if (parts.Length != 2)
        {
            return false;
        }
        var salt = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
        var actual = pbkdf2.GetBytes(32);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
