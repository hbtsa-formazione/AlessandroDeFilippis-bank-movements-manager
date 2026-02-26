using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BankApi.Data;
using Microsoft.IdentityModel.Tokens;

// ==============================================================================================
// SERVICE: JWT TOKEN SERVICE
// ==============================================================================================
// Responsabilità:
// - Generare Access Token con i claim richiesti (ID, ruolo, timestamp, JTI)
// - Generare Refresh Token sicuri
// - Leggere un token JWT per estrarne metadati (es. JTI, scadenza)
public sealed class JwtTokenService
{
    // Configurazione JWT (issuer, audience, segreto e scadenze)
    private readonly JwtOptions _options;
    // Handler nativo per creare e leggere token JWT
    private readonly JwtSecurityTokenHandler _handler = new();
    // Chiave simmetrica (byte[]) derivata dal segreto
    private readonly byte[] _key;

    // Costruttore: inizializza opzioni e chiave di firma
    public JwtTokenService(JwtOptions options)
    {
        _options = options;
        _key = Encoding.UTF8.GetBytes(options.Secret);
    }

    public TokenResult CreateTokens(AuthUser user, IReadOnlyCollection<string> roles)
    {
        var now = DateTimeOffset.UtcNow;
        var jti = Guid.NewGuid().ToString("N");
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(JwtRegisteredClaimNames.Jti, jti)
        };
        foreach (var role in roles)
        {
            if (!string.IsNullOrWhiteSpace(role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var expiresAt = now.Add(_options.AccessTokenLifetime);
        var token = new JwtSecurityToken(
            _options.Issuer,
            _options.Audience,
            claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(_key), SecurityAlgorithms.HmacSha256)
        );

        var accessToken = _handler.WriteToken(token);
        var refreshToken = CreateRefreshToken();
        var refreshExpiresAt = now.Add(_options.RefreshTokenLifetime);
        return new TokenResult(accessToken, expiresAt, refreshToken, refreshExpiresAt, jti);
    }

    // Genera un refresh token casuale e non prevedibile
    // Ritorno:
    // - stringa Base64 di 64 byte casuali
    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    // Legge e decodifica un JWT (senza validazione)
    // Parametri:
    // - token: stringa JWT
    // Ritorno:
    // - JwtSecurityToken con header, payload e claims
    public JwtSecurityToken ReadToken(string token)
    {
        return _handler.ReadJwtToken(token);
    }
}

// ==============================================================================================
// CONFIG: JWT OPTIONS
// ==============================================================================================
// Parametri centralizzati per la generazione e validazione dei token
public record JwtOptions(
    // Emittente del token
    string Issuer,
    // Destinatario previsto
    string Audience,
    // Segreto di firma
    string Secret,
    // Durata access token
    TimeSpan AccessTokenLifetime,
    // Durata refresh token
    TimeSpan RefreshTokenLifetime
);

// ==============================================================================================
// DTO: RISULTATO GENERAZIONE TOKEN
// ==============================================================================================
public record TokenResult(
    // JWT firmato per l'accesso
    string AccessToken,
    // Scadenza access token (UTC)
    DateTimeOffset AccessTokenExpiresAt,
    // Token lungo per refresh
    string RefreshToken,
    // Scadenza refresh token (UTC)
    DateTimeOffset RefreshTokenExpiresAt,
    // JTI del token per revoca/blacklist
    string Jti
);
