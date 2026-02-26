using Microsoft.EntityFrameworkCore;

namespace BankApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<BankMovement> BankMovements => Set<BankMovement>();
    public DbSet<ContoContabile> ContiContabili => Set<ContoContabile>();
    public DbSet<AuthUser> Users => Set<AuthUser>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AccessTokenBlacklist> AccessTokenBlacklists => Set<AccessTokenBlacklist>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<OperationLog> OperationLogs => Set<OperationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BankAccount>(entity =>
        {
            entity.ToTable("BankAccounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Iban).HasMaxLength(34).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.HasIndex(e => e.Iban).IsUnique();
        });

        modelBuilder.Entity<BankMovement>(entity =>
        {
            entity.ToTable("BankMovements");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Date).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Direction).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(60);
            entity.Property(e => e.BalanceAfter).HasPrecision(18, 2);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => new { e.AccountId, e.Date });
            entity.HasOne(e => e.Account)
                .WithMany(a => a.Movements)
                .HasForeignKey(e => e.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasCheckConstraint("CK_BankMovements_Direction", "[Direction] IN ('credit','debit')");
        });

        modelBuilder.Entity<ContoContabile>(entity =>
        {
            entity.ToTable("ContiContabili");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nome).HasMaxLength(80).IsRequired();
            entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<AuthUser>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.Username).IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("Permissions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("RolePermissions");
            entity.HasKey(e => new { e.RoleId, e.PermissionId });
            entity.HasOne(e => e.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(e => e.RoleId);
            entity.HasOne(e => e.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(e => e.PermissionId);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TokenHash).HasMaxLength(256).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.IsRevoked).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.ReplacedByToken)
                .WithMany()
                .HasForeignKey(e => e.ReplacedByTokenId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AccessTokenBlacklist>(entity =>
        {
            entity.ToTable("AccessTokenBlacklist");
            entity.HasKey(e => e.Jti);
            entity.Property(e => e.Jti).HasMaxLength(64).IsRequired();
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.RevokedAt).IsRequired();
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId);
        });

        modelBuilder.Entity<AppSetting>(entity =>
        {
            entity.ToTable("AppSettings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Value).HasMaxLength(2000);
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();
        });

        modelBuilder.Entity<OperationLog>(entity =>
        {
            entity.ToTable("OperationLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntityName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Details).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
