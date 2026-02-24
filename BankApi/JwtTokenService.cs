using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
    private readonly JwtOptions _options;
    private readonly JwtSecurityTokenHandler _handler = new();
    private readonly byte[] _key;

    public JwtTokenService(JwtOptions options)
    {
        _options = options;
        _key = Encoding.UTF8.GetBytes(options.Secret);
    }

    // Crea una coppia di token (Access + Refresh) per un utente autenticato
    public TokenResult CreateTokens(AuthUser user)
    {
        var now = DateTimeOffset.UtcNow;
        var jti = Guid.NewGuid().ToString("N");
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Role, user.Role),
            new(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new(JwtRegisteredClaimNames.Jti, jti)
        };

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
    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    // Legge e decodifica un JWT (senza validazione)
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
    string Issuer,
    string Audience,
    string Secret,
    TimeSpan AccessTokenLifetime,
    TimeSpan RefreshTokenLifetime
);

// ==============================================================================================
// DTO: RISULTATO GENERAZIONE TOKEN
// ==============================================================================================
public record TokenResult(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    string Jti
);
