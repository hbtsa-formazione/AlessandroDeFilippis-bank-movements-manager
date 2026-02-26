namespace BankApi.Data;

public class BankAccount
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public string Currency { get; set; } = "EUR";
    public ICollection<BankMovement> Movements { get; set; } = new List<BankMovement>();
}

public class BankMovement
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public BankAccount? Account { get; set; }
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Currency { get; set; } = "EUR";
    public decimal Amount { get; set; }
    public string Direction { get; set; } = "debit";
    public string? Category { get; set; }
    public decimal? BalanceAfter { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ContoContabile
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class AuthUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class UserRole
{
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public int RoleId { get; set; }
    public Role? Role { get; set; }
}

public class RolePermission
{
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    public int PermissionId { get; set; }
    public Permission? Permission { get; set; }
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public int? ReplacedByTokenId { get; set; }
    public RefreshToken? ReplacedByToken { get; set; }
}

public class AccessTokenBlacklist
{
    public string Jti { get; set; } = string.Empty;
    public int UserId { get; set; }
    public AuthUser? User { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset RevokedAt { get; set; }
}

public class AppSetting
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class OperationLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
