using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using BankApi.Data;
using Xunit;

public class JwtTokenServiceTests
{
    [Fact]
    public void CreateTokens_ReturnsValidJwtWithClaims()
    {
        var options = new JwtOptions(
            Issuer: "TestIssuer",
            Audience: "TestAudience",
            Secret: "SuperSecretKeyForJwtTests_SuperSecretKeyForJwtTests_123",
            AccessTokenLifetime: TimeSpan.FromMinutes(5),
            RefreshTokenLifetime: TimeSpan.FromDays(1)
        );
        var service = new JwtTokenService(options);
        var user = new AuthUser { Id = 42, Username = "alice", PasswordHash = "x" };

        var result = service.CreateTokens(user, new[] { "Admin" });

        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.AccessToken);

        Assert.Equal(options.Issuer, jwt.Issuer);
        Assert.Contains(options.Audience, jwt.Audiences);
        Assert.Contains(jwt.Claims, c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "42");
        Assert.Contains(jwt.Claims, c => c.Type == JwtRegisteredClaimNames.Iat);
        Assert.Contains(jwt.Claims, c => c.Type == JwtRegisteredClaimNames.Jti);
        Assert.Contains(jwt.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Admin");

        Assert.True(result.AccessTokenExpiresAt > DateTimeOffset.UtcNow);
        Assert.False(string.IsNullOrWhiteSpace(result.RefreshToken));
    }
}
