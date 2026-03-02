// ==============================================================================================
// FILE: Program.cs
// ==============================================================================================
// Questo è il punto di ingresso (Entry Point) della nostra applicazione C#.
// In .NET 6/7/8, si usano le "Minimal API", che permettono di scrivere tutto in un solo file.
// ==============================================================================================

// Importiamo il "Builder" che serve a costruire l'applicazione web.
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Globalization;
using BankApi.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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
// Obiettivo: centralizzare la policy di autenticazione e definire in modo esplicito
// i parametri che governano sicurezza, compatibilità e ciclo di vita del token.
// Parametri attesi nel file di config (appsettings.json):
// - Jwt:Issuer: identificatore dell'emittente del token
// - Jwt:Audience: identificatore del destinatario previsto
// - Jwt:AccessTokenMinutes: durata access token in minuti
// - Jwt:RefreshTokenDays: durata refresh token in giorni
var jwtSection = builder.Configuration.GetSection("Jwt");
// Issuer: stringa che identifica chi ha emesso il token
var issuer = jwtSection["Issuer"] ?? "BankApi";
// Audience: stringa che identifica per chi è valido il token
var audience = jwtSection["Audience"] ?? "BankApiClient";
// Durata access token (fallback a 15 minuti se non configurato o non valido)
var accessTokenMinutes = int.TryParse(jwtSection["AccessTokenMinutes"], out var atm) ? atm : 15;
// Durata refresh token (fallback a 7 giorni se non configurato o non valido)
var refreshTokenDays = int.TryParse(jwtSection["RefreshTokenDays"], out var rtd) ? rtd : 7;
// Segreto di firma: da config o da variabile d'ambiente JWT_SECRET
var secret = builder.Configuration["Jwt:Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(secret))
{
    if (builder.Environment.IsDevelopment())
    {
        // In sviluppo: segreto generato per semplificare l'avvio locale
        secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
    else
    {
        // In produzione: senza segreto si blocca l'avvio per motivi di sicurezza
        throw new InvalidOperationException("JWT secret is required.");
    }
}

// Oggetto di configurazione JWT usato sia per generazione che per validazione
var jwtOptions = new JwtOptions(issuer, audience, secret, TimeSpan.FromMinutes(accessTokenMinutes), TimeSpan.FromDays(refreshTokenDays));
// Registriamo le opzioni come singleton per usarle ovunque
builder.Services.AddSingleton(jwtOptions);
// Registriamo il servizio che genera e legge i token
builder.Services.AddSingleton<JwtTokenService>();

// Configurazione EF Core: colleghiamo il DbContext al database SQL Server DB_Esempio
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DbEsempio")));

// Configurazione middleware JWT Bearer per validare i token nelle richieste HTTP
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Parametri di validazione del token: issuer, audience, firma e scadenza
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

        // Eventi del middleware per personalizzare il comportamento di autenticazione
        options.Events = new JwtBearerEvents
        {
            // Verifica della blacklist: se il JTI è revocato, il token è rifiutato
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (!string.IsNullOrWhiteSpace(jti))
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var entry = await db.AccessTokenBlacklists.AsNoTracking()
                        .FirstOrDefaultAsync(x => x.Jti == jti);
                    if (entry != null && entry.ExpiresAt > DateTimeOffset.UtcNow)
                    {
                        context.Fail("revoked");
                    }
                }
            },
            // Gestione errori generici di autenticazione
            OnAuthenticationFailed = context =>
            {
                return Task.CompletedTask;
            },
            // Risposte coerenti per token mancante, scaduto o non valido
            OnChallenge = context =>
            {
                // Sostituiamo la risposta default con un messaggio JSON più leggibile
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

// Policy di autorizzazione: consente accesso solo agli utenti con Role=Admin
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
// - UseAuthentication: legge il token e costruisce l'identità utente
// - UseAuthorization: applica le policy ai singoli endpoint
app.UseAuthentication();
app.UseAuthorization();

// ==============================================================================================
// 4. DEFINIZIONE DEGLI ENDPOINT (API)
// ==============================================================================================
// Qui mappiamo gli URL (es. /api/conti) alle funzioni che devono rispondere.

// Inizializzazione database: creiamo lo schema e inseriamo dati base se mancanti
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    SeedData(db);
}

// AUTH: Login con rilascio di Access e Refresh Token
// Parametri:
// - req.Username: username inserito dall'utente
// - req.Password: password in chiaro (solo per il transito verso il backend)
// Ritorno:
// - 200 OK con token e dati utente se le credenziali sono valide
// - 401 Unauthorized se username o password non corrispondono
app.MapPost("/api/auth/login", async (LoginRequest req, JwtTokenService tokenService, AppDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username && u.IsActive);
    if (user is null)
    {
        return Results.Unauthorized();
    }
    if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    // Recuperiamo i ruoli assegnati all'utente per inserirli nei claim del JWT
    var roles = await db.UserRoles
        .Include(ur => ur.Role)
        .Where(ur => ur.UserId == user.Id)
        .Select(ur => ur.Role!.Name)
        .ToListAsync();
    if (roles.Count == 0)
    {
        roles.Add("User");
    }

    // Generiamo access token e refresh token
    var tokens = tokenService.CreateTokens(user, roles);
    var entry = new RefreshToken
    {
        UserId = user.Id,
        // Memorizziamo solo l'hash del refresh token per maggiore sicurezza
        TokenHash = HashToken(tokens.RefreshToken),
        ExpiresAt = tokens.RefreshTokenExpiresAt,
        IsRevoked = false,
        CreatedAt = DateTimeOffset.UtcNow
    };
    db.RefreshTokens.Add(entry);
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        accessToken = tokens.AccessToken,
        accessTokenExpiresAt = tokens.AccessTokenExpiresAt,
        refreshToken = tokens.RefreshToken,
        refreshTokenExpiresAt = tokens.RefreshTokenExpiresAt,
        user = new { id = user.Id, username = user.Username, role = roles[0] }
    });
});

// AUTH: Refresh (token rotation single-use)
// Parametri:
// - req.RefreshToken: token lungo e persistente ottenuto al login
// Ritorno:
// - 200 OK con nuova coppia di token se valido e non revocato
// - 401 Unauthorized se mancante, revocato o scaduto
app.MapPost("/api/auth/refresh", async (RefreshRequest req, JwtTokenService tokenService, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.RefreshToken))
    {
        return Results.Unauthorized();
    }

    // Cerchiamo il refresh token in DB tramite hash, evitando di salvare il token in chiaro
    var tokenHash = HashToken(req.RefreshToken);
    var entry = await db.RefreshTokens
        .Include(r => r.User)
        .FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
    if (entry is null || entry.IsRevoked || entry.ExpiresAt <= DateTimeOffset.UtcNow)
    {
        return Results.Unauthorized();
    }

    var user = entry.User;
    if (user is null || !user.IsActive)
    {
        return Results.Unauthorized();
    }

    // Carichiamo i ruoli dell'utente per costruire i claim
    var roles = await db.UserRoles
        .Include(ur => ur.Role)
        .Where(ur => ur.UserId == user.Id)
        .Select(ur => ur.Role!.Name)
        .ToListAsync();
    if (roles.Count == 0)
    {
        roles.Add("User");
    }

    // Generiamo una nuova coppia di token e invalidiamo il refresh token precedente
    var tokens = tokenService.CreateTokens(user, roles);
    var newRefresh = new RefreshToken
    {
        UserId = user.Id,
        TokenHash = HashToken(tokens.RefreshToken),
        ExpiresAt = tokens.RefreshTokenExpiresAt,
        IsRevoked = false,
        CreatedAt = DateTimeOffset.UtcNow
    };
    db.RefreshTokens.Add(newRefresh);
    entry.IsRevoked = true;
    entry.RevokedAt = DateTimeOffset.UtcNow;
    entry.ReplacedByToken = newRefresh;
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        accessToken = tokens.AccessToken,
        accessTokenExpiresAt = tokens.AccessTokenExpiresAt,
        refreshToken = tokens.RefreshToken,
        refreshTokenExpiresAt = tokens.RefreshTokenExpiresAt
    });
});

// AUTH: Logout con revoca access token e invalidazione refresh token
// Parametri:
// - Authorization: Bearer <accessToken> (header)
// - req.RefreshToken: refresh token da revocare (body)
// Ritorno:
// - 200 OK sempre (operazione idempotente)
app.MapPost("/api/auth/logout", async (HttpContext context, LogoutRequest req, JwtTokenService tokenService, AppDbContext db) =>
{
    // Revoca dell'access token tramite inserimento in blacklist con data di scadenza
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
                var userId = int.TryParse(jwt.Subject, out var uid) ? uid : (int?)null;
                if (userId.HasValue)
                {
                    db.AccessTokenBlacklists.Add(new AccessTokenBlacklist
                    {
                        Jti = jwt.Id,
                        UserId = userId.Value,
                        ExpiresAt = expiresAt,
                        RevokedAt = DateTimeOffset.UtcNow
                    });
                }
            }
        }
    }
    // Revoca del refresh token associato, se presente nel body
    if (!string.IsNullOrWhiteSpace(req.RefreshToken))
    {
        var tokenHash = HashToken(req.RefreshToken);
        var entry = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
        if (entry != null)
        {
            entry.IsRevoked = true;
            entry.RevokedAt = DateTimeOffset.UtcNow;
        }
    }
    await db.SaveChangesAsync();
    return Results.Ok();
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/conti
// Restituisce la lista di tutti i conti.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti", async (AppDbContext db) =>
{
    var conti = await db.BankAccounts.AsNoTracking().ToListAsync();
    return Results.Ok(conti);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/conti/{id}
// Restituisce un singolo conto cercando per ID.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti/{id}", async (int id, AppDbContext db) =>
{
    var conto = await db.BankAccounts.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
    if (conto is null)
    {
        return Results.NotFound(new { Message = "Conto non trovato" });
    }
    return Results.Ok(conto);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// POST: /api/conti
// Crea un nuovo conto.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/conti", async (BankAccount nuovoConto, AppDbContext db) =>
{
    var exists = await db.BankAccounts.AnyAsync(c => c.Iban == nuovoConto.Iban);
    if (exists)
    {
        return Results.Conflict(new { Message = "IBAN già presente" });
    }
    var entity = new BankAccount
    {
        Name = nuovoConto.Name,
        Iban = nuovoConto.Iban,
        Currency = nuovoConto.Currency
    };
    db.BankAccounts.Add(entity);
    await db.SaveChangesAsync();
    await LogOperation(db, null, "create", "BankAccount", entity.Id, null);
    return Results.Ok(entity);
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// PUT: /api/conti/{id}
// Aggiorna un conto esistente.
// ----------------------------------------------------------------------------------------------
app.MapPut("/api/conti/{id}", async (int id, BankAccount contoAggiornato, AppDbContext db) =>
{
    var contoEsistente = await db.BankAccounts.FirstOrDefaultAsync(c => c.Id == id);
    if (contoEsistente is null)
    {
        return Results.NotFound();
    }
    if (!string.Equals(contoEsistente.Iban, contoAggiornato.Iban, StringComparison.OrdinalIgnoreCase))
    {
        var ibanExists = await db.BankAccounts.AnyAsync(c => c.Iban == contoAggiornato.Iban && c.Id != id);
        if (ibanExists)
        {
            return Results.Conflict(new { Message = "IBAN già presente" });
        }
    }
    contoEsistente.Name = contoAggiornato.Name;
    contoEsistente.Iban = contoAggiornato.Iban;
    contoEsistente.Currency = contoAggiornato.Currency;
    await db.SaveChangesAsync();
    await LogOperation(db, null, "update", "BankAccount", contoEsistente.Id, null);
    return Results.Ok(contoEsistente);
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// DELETE: /api/conti/{id}
// Elimina un conto.
// ----------------------------------------------------------------------------------------------
app.MapDelete("/api/conti/{id}", async (int id, AppDbContext db) =>
{
    var contoDaEliminare = await db.BankAccounts.FirstOrDefaultAsync(c => c.Id == id);
    if (contoDaEliminare is not null)
    {
        db.BankAccounts.Remove(contoDaEliminare);
        await db.SaveChangesAsync();
        await LogOperation(db, null, "delete", "BankAccount", id, null);
    }
    return Results.Ok();
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// GET: /api/conti-contabili
// Restituisce l'elenco dei conti contabili ordinati per nome.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti-contabili", async (AppDbContext db) =>
{
    var conti = await db.ContiContabili.AsNoTracking().OrderBy(c => c.Nome).ToListAsync();
    return Results.Ok(conti);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/conti-contabili/{id}
// Restituisce un conto contabile per ID.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/conti-contabili/{id}", async (int id, AppDbContext db) =>
{
    var conto = await db.ContiContabili.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
    if (conto is null)
    {
        return Results.NotFound();
    }
    return Results.Ok(conto);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// POST: /api/conti-contabili
// Crea un nuovo conto contabile con codice univoco.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/conti-contabili", async (ContoContabile conto, AppDbContext db) =>
{
    var exists = await db.ContiContabili.AnyAsync(c => c.Code == conto.Code);
    if (exists)
    {
        return Results.Conflict(new { Message = "Codice già presente" });
    }
    var entity = new ContoContabile
    {
        Nome = conto.Nome,
        Code = conto.Code,
        Description = conto.Description,
        Type = conto.Type
    };
    db.ContiContabili.Add(entity);
    await db.SaveChangesAsync();
    await LogOperation(db, null, "create", "ContoContabile", entity.Id, null);
    return Results.Ok(entity);
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// PUT: /api/conti-contabili/{id}
// Aggiorna un conto contabile esistente.
// ----------------------------------------------------------------------------------------------
app.MapPut("/api/conti-contabili/{id}", async (int id, ContoContabile conto, AppDbContext db) =>
{
    var entity = await db.ContiContabili.FirstOrDefaultAsync(c => c.Id == id);
    if (entity is null)
    {
        return Results.NotFound();
    }
    if (!string.Equals(entity.Code, conto.Code, StringComparison.OrdinalIgnoreCase))
    {
        var codeExists = await db.ContiContabili.AnyAsync(c => c.Code == conto.Code && c.Id != id);
        if (codeExists)
        {
            return Results.Conflict(new { Message = "Codice già presente" });
        }
    }
    entity.Nome = conto.Nome;
    entity.Code = conto.Code;
    entity.Description = conto.Description;
    entity.Type = conto.Type;
    await db.SaveChangesAsync();
    await LogOperation(db, null, "update", "ContoContabile", entity.Id, null);
    return Results.Ok(entity);
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// DELETE: /api/conti-contabili/{id}
// Elimina un conto contabile.
// ----------------------------------------------------------------------------------------------
app.MapDelete("/api/conti-contabili/{id}", async (int id, AppDbContext db) =>
{
    var entity = await db.ContiContabili.FirstOrDefaultAsync(c => c.Id == id);
    if (entity is not null)
    {
        db.ContiContabili.Remove(entity);
        await db.SaveChangesAsync();
        await LogOperation(db, null, "delete", "ContoContabile", id, null);
    }
    return Results.Ok();
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// GET: /api/movimenti
// Restituisce i movimenti, filtrabili per accountId.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/movimenti", async (int? accountId, AppDbContext db) =>
{
    var query = db.BankMovements.AsNoTracking();
    if (accountId.HasValue)
    {
        query = query.Where(m => m.AccountId == accountId.Value);
    }
    var list = await query.OrderByDescending(m => m.Date).ThenByDescending(m => m.Id).ToListAsync();
    var dto = list.Select(ToDto).ToList();
    return Results.Ok(dto);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/movimenti/{id}
// Restituisce un singolo movimento per ID.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/movimenti/{id}", async (int id, AppDbContext db) =>
{
    var mov = await db.BankMovements.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
    if (mov is null)
    {
        return Results.NotFound();
    }
    return Results.Ok(ToDto(mov));
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// GET: /api/movimenti/balance/{accountId}
// Calcola il saldo aggregato di un conto.
// ----------------------------------------------------------------------------------------------
app.MapGet("/api/movimenti/balance/{accountId}", async (int accountId, AppDbContext db) =>
{
    var balance = await db.BankMovements
        .Where(m => m.AccountId == accountId)
        .SumAsync(m => (decimal?)m.Amount) ?? 0m;
    return Results.Ok(balance);
}).RequireAuthorization();

// ----------------------------------------------------------------------------------------------
// POST: /api/movimenti
// Inserisce un nuovo movimento e ricalcola i saldi.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/movimenti", async (MovementRequest req, AppDbContext db) =>
{
    var accountExists = await db.BankAccounts.AnyAsync(a => a.Id == req.AccountId);
    if (!accountExists)
    {
        return Results.BadRequest(new { Message = "Conto non valido" });
    }
    // Se non viene indicata la direzione, la deduciamo dal segno dell'importo
    var direction = string.IsNullOrWhiteSpace(req.Direction)
        ? (req.Amount >= 0 ? "credit" : "debit")
        : req.Direction;
    var mov = new BankMovement
    {
        AccountId = req.AccountId,
        Date = ParseDate(req.Date),
        Description = req.Description,
        Currency = req.Currency,
        Amount = req.Amount,
        Direction = direction,
        Category = req.Category,
        CreatedAt = DateTime.UtcNow
    };
    db.BankMovements.Add(mov);
    await db.SaveChangesAsync();
    // Ricalcolo del saldo progressivo dopo l'inserimento
    await RecalculateBalances(db, req.AccountId);
    await LogOperation(db, null, "create", "BankMovement", mov.Id, null);
    return Results.Ok(ToDto(mov));
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// PUT: /api/movimenti/{id}
// Aggiorna un movimento esistente.
// ----------------------------------------------------------------------------------------------
app.MapPut("/api/movimenti/{id}", async (int id, MovementRequest req, AppDbContext db) =>
{
    var mov = await db.BankMovements.FirstOrDefaultAsync(m => m.Id == id);
    if (mov is null)
    {
        return Results.NotFound();
    }
    // Se non viene indicata la direzione, la deduciamo dal segno dell'importo
    var direction = string.IsNullOrWhiteSpace(req.Direction)
        ? (req.Amount >= 0 ? "credit" : "debit")
        : req.Direction;
    mov.AccountId = req.AccountId;
    mov.Date = ParseDate(req.Date);
    mov.Description = req.Description;
    mov.Currency = req.Currency;
    mov.Amount = req.Amount;
    mov.Direction = direction;
    mov.Category = req.Category;
    await db.SaveChangesAsync();
    // Ricalcolo del saldo progressivo dopo la modifica
    await RecalculateBalances(db, mov.AccountId);
    await LogOperation(db, null, "update", "BankMovement", mov.Id, null);
    return Results.Ok(ToDto(mov));
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// DELETE: /api/movimenti/{id}
// Elimina un movimento e aggiorna il saldo.
// ----------------------------------------------------------------------------------------------
app.MapDelete("/api/movimenti/{id}", async (int id, AppDbContext db) =>
{
    var mov = await db.BankMovements.FirstOrDefaultAsync(m => m.Id == id);
    if (mov is not null)
    {
        var accountId = mov.AccountId;
        db.BankMovements.Remove(mov);
        await db.SaveChangesAsync();
        // Ricalcolo del saldo progressivo dopo la cancellazione
        await RecalculateBalances(db, accountId);
        await LogOperation(db, null, "delete", "BankMovement", id, null);
    }
    return Results.Ok();
}).RequireAuthorization("AdminOnly");

// ----------------------------------------------------------------------------------------------
// POST: /api/movimenti/installments
// Crea un gruppo di movimenti rateizzati sullo stesso conto.
// ----------------------------------------------------------------------------------------------
app.MapPost("/api/movimenti/installments", async (InstallmentRequest req, AppDbContext db) =>
{
    var accountExists = await db.BankAccounts.AnyAsync(a => a.Id == req.AccountId);
    if (!accountExists)
    {
        return Results.BadRequest(new { Message = "Conto non valido" });
    }
    if (req.Count < 1)
    {
        return Results.BadRequest(new { Message = "Numero rate non valido" });
    }
    var list = new List<BankMovement>();
    for (var i = 0; i < req.Count; i++)
    {
        // Per ogni rata spostiamo la data di un mese rispetto alla data iniziale
        var date = AddMonths(ParseDate(req.StartDate), i);
        list.Add(new BankMovement
        {
            AccountId = req.AccountId,
            Date = date,
            Description = $"{req.Description} (Rata {i + 1}/{req.Count})",
            Currency = req.Currency,
            Amount = req.AmountPerInstallment,
            Direction = req.AmountPerInstallment >= 0 ? "credit" : "debit",
            Category = "Rateizzato",
            CreatedAt = DateTime.UtcNow
        });
    }
    db.BankMovements.AddRange(list);
    await db.SaveChangesAsync();
    await RecalculateBalances(db, req.AccountId);
    await LogOperation(db, null, "create", "Installments", null, $"AccountId={req.AccountId}");
    var dto = list.Select(ToDto).ToList();
    return Results.Ok(dto);
}).RequireAuthorization("AdminOnly");

// ==============================================================================================
// 5. AVVIO DELL'APPLICAZIONE
// ==============================================================================================
// Questo comando fa partire il server in ascolto sulle porte configurate.
app.Run();

// ==============================================================================================
// 6. UTILITÀ E SUPPORTO
// ==============================================================================================
// Funzioni di supporto usate dagli endpoint per conversioni, hashing e calcoli.

// Converte l'entità BankMovement nel DTO esposto all'esterno
static BankMovementDto ToDto(BankMovement m) =>
    new(
        m.Id,
        m.AccountId,
        m.Date.ToString("yyyy-MM-dd"),
        m.Description,
        m.Currency,
        m.Amount,
        m.Direction,
        m.Category,
        m.BalanceAfter,
        m.CreatedAt.ToString("o")
    );

// Parsing della data in formato stringa (ISO) con normalizzazione a UTC
static DateTime ParseDate(string value)
{
    var parsed = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    return DateTime.SpecifyKind(parsed.Date, DateTimeKind.Utc);
}

// Helper per aggiungere mesi alla data di partenza delle rate
static DateTime AddMonths(DateTime date, int months) => date.AddMonths(months);

// Ricalcolo del saldo progressivo per un conto specifico
static async Task RecalculateBalances(AppDbContext db, int accountId)
{
    var list = await db.BankMovements
        .Where(m => m.AccountId == accountId)
        .OrderBy(m => m.Date)
        .ThenBy(m => m.CreatedAt)
        .ThenBy(m => m.Id)
        .ToListAsync();

    decimal balance = 0m;
    foreach (var m in list)
    {
        balance += m.Amount;
        m.BalanceAfter = balance;
    }

    await db.SaveChangesAsync();
}

// Hash del refresh token prima di salvarlo su DB
static string HashToken(string token)
{
    using var sha = SHA256.Create();
    var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
    return Convert.ToBase64String(bytes);
}

// Traccia le operazioni principali su DB in una tabella di log
static async Task LogOperation(AppDbContext db, int? userId, string action, string entityName, int? entityId, string? details)
{
    db.OperationLogs.Add(new OperationLog
    {
        UserId = userId,
        Action = action,
        EntityName = entityName,
        EntityId = entityId,
        Details = details,
        CreatedAt = DateTimeOffset.UtcNow
    });
    await db.SaveChangesAsync();
}

// Seed dati iniziali per ruoli, permessi, utenti, conti e impostazioni
static void SeedData(AppDbContext db)
{
    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "User" }
        );
        db.SaveChanges();
    }

    if (!db.Permissions.Any())
    {
        db.Permissions.AddRange(
            new Permission { Name = "conti.read" },
            new Permission { Name = "conti.write" },
            new Permission { Name = "movimenti.read" },
            new Permission { Name = "movimenti.write" },
            new Permission { Name = "conti-contabili.read" },
            new Permission { Name = "conti-contabili.write" },
            new Permission { Name = "auth.manage" }
        );
        db.SaveChanges();
    }

    if (!db.RolePermissions.Any())
    {
        var adminRoleId = db.Roles.Single(r => r.Name == "Admin").Id;
        var userRoleId = db.Roles.Single(r => r.Name == "User").Id;
        var perms = db.Permissions.ToList();
        db.RolePermissions.AddRange(
            perms.Select(p => new RolePermission { RoleId = adminRoleId, PermissionId = p.Id })
        );
        db.RolePermissions.AddRange(
            perms.Where(p => p.Name.EndsWith(".read", StringComparison.OrdinalIgnoreCase))
                 .Select(p => new RolePermission { RoleId = userRoleId, PermissionId = p.Id })
        );
        db.SaveChanges();
    }

    var admin = db.Users.SingleOrDefault(u => u.Username == "admin");
    if (admin is null)
    {
        admin = new AuthUser
        {
            Username = "admin",
            PasswordHash = PasswordHasher.Hash("Admin123!"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(admin);
    }
    else
    {
        admin.PasswordHash = PasswordHasher.Hash("Admin123!");
        admin.IsActive = true;
    }

    var user = db.Users.SingleOrDefault(u => u.Username == "user");
    if (user is null)
    {
        user = new AuthUser
        {
            Username = "user",
            PasswordHash = PasswordHasher.Hash("User123!"),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
    }
    else
    {
        user.PasswordHash = PasswordHasher.Hash("User123!");
        user.IsActive = true;
    }
    db.SaveChanges();

    var adminRoleIdForUsers = db.Roles.Single(r => r.Name == "Admin").Id;
    var userRoleIdForUsers = db.Roles.Single(r => r.Name == "User").Id;
    if (!db.UserRoles.Any(ur => ur.UserId == admin.Id && ur.RoleId == adminRoleIdForUsers))
    {
        db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRoleIdForUsers });
    }
    if (!db.UserRoles.Any(ur => ur.UserId == user.Id && ur.RoleId == userRoleIdForUsers))
    {
        db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = userRoleIdForUsers });
    }
    db.SaveChanges();

    if (!db.BankAccounts.Any())
    {
        db.BankAccounts.AddRange(
            new BankAccount { Name = "Conto Principale", Iban = "IT60X0542811101000000123456", Currency = "EUR" },
            new BankAccount { Name = "Conto Risparmio", Iban = "IT12A0123456789012345678901", Currency = "USD" }
        );
        db.SaveChanges();
    }

    if (!db.ContiContabili.Any())
    {
        db.ContiContabili.AddRange(
            new ContoContabile { Nome = "Conto Corrente", Code = "CC001", Description = "Conto corrente principale", Type = "CORRENTI" },
            new ContoContabile { Nome = "Conto Deposito", Code = "DP001", Description = "Conto deposito mensile", Type = "DEPOSITI" },
            new ContoContabile { Nome = "Conto Prestito", Code = "PR001", Description = "Conto prestito mensile", Type = "PRESTITI" }
        );
        db.SaveChanges();
    }

    if (!db.BankMovements.Any())
    {
        var accountId = db.BankAccounts.OrderBy(a => a.Id).Select(a => a.Id).First();
        var now = DateTime.UtcNow;
        var m1 = new BankMovement
        {
            AccountId = accountId,
            Date = DateTime.UtcNow.Date.AddDays(-2),
            Description = "Stipendio Dicembre",
            Currency = "EUR",
            Amount = 2500m,
            Direction = "credit",
            Category = "Stipendio",
            CreatedAt = now
        };
        var m2 = new BankMovement
        {
            AccountId = accountId,
            Date = DateTime.UtcNow.Date.AddDays(-1),
            Description = "Pagamento bolletta luce",
            Currency = "EUR",
            Amount = -120.50m,
            Direction = "debit",
            Category = "Bolletta",
            CreatedAt = now
        };
        db.BankMovements.AddRange(m1, m2);
        db.SaveChanges();
        var list = db.BankMovements.Where(m => m.AccountId == accountId).OrderBy(m => m.Date).ThenBy(m => m.Id).ToList();
        decimal balance = 0m;
        foreach (var m in list)
        {
            balance += m.Amount;
            m.BalanceAfter = balance;
        }
        db.SaveChanges();
    }

    if (!db.AppSettings.Any())
    {
        db.AppSettings.AddRange(
            new AppSetting { Key = "DefaultCurrency", Value = "EUR", UpdatedAt = DateTimeOffset.UtcNow },
            new AppSetting { Key = "InstallmentMax", Value = "120", UpdatedAt = DateTimeOffset.UtcNow }
        );
        db.SaveChanges();
    }
}

// ==============================================================================================
// DTO DI RICHIESTA/RESPOSTA
// ==============================================================================================
public record LoginRequest(string Username, string Password);
public record RefreshRequest(string RefreshToken);
public record LogoutRequest(string? RefreshToken);
public record MovementRequest(int AccountId, string Date, string Description, string Currency, decimal Amount, string? Direction, string? Category);
public record InstallmentRequest(int AccountId, string StartDate, string Description, string Currency, decimal AmountPerInstallment, int Count);
public record BankMovementDto(int Id, int AccountId, string Date, string Description, string Currency, decimal Amount, string? Direction, string? Category, decimal? BalanceAfter, string? CreatedAt);

public static class PasswordHasher
{
    // Hash della password con PBKDF2
    // Parametri:
    // - password: stringa in chiaro
    // Ritorno:
    // - stringa nel formato "salt.hash" (Base64) da salvare in storage
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    // Verifica della password con lo stesso algoritmo di hashing
    // Parametri:
    // - password: stringa in chiaro inserita dall'utente
    // - stored: stringa "salt.hash" salvata in memoria
    // Ritorno:
    // - true se la password è valida, false altrimenti
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
