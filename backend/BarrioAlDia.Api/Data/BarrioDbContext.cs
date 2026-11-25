using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Models;

namespace BarrioAlDia.Api.Data;

public class BarrioDbContext : DbContext
{
    public BarrioDbContext(DbContextOptions<BarrioDbContext> options) : base(options)
    {
    }

    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentComment> IncidentComments => Set<IncidentComment>();
    public DbSet<IncidentPhoto> IncidentPhotos => Set<IncidentPhoto>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<OfficialUser> OfficialUsers => Set<OfficialUser>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Relaciones
        modelBuilder.Entity<Incident>()
            .HasMany(i => i.Comments)
            .WithOne(c => c.Incident)
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Incident>()
            .HasMany(i => i.Photos)
            .WithOne(p => p.Incident)
            .HasForeignKey(p => p.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Precisiones numéricas
        modelBuilder.Entity<Incident>()
            .Property(i => i.Lat)
            .HasPrecision(9, 6);

        modelBuilder.Entity<Incident>()
            .Property(i => i.Lng)
            .HasPrecision(9, 6);

        // Seed Data: Funcionarios Municipales Oficiales
        modelBuilder.Entity<OfficialUser>().HasData(
            new OfficialUser
            {
                Id = 1,
                Username = "carlos.mendez",
                FullName = "Ing. Carlos Méndez Solís",
                Role = "Director de Obras y Servicios Públicos",
                Entity = "Municipalidad de Cartago",
                Email = "carlos.mendez@muni-cartago.go.cr",
                PasswordHash = "Admin1234!", // Se valida contra hash o demo
                BadgeNumber = "MC-4921",
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new OfficialUser
            {
                Id = 2,
                Username = "elena.rojas",
                FullName = "Licda. Elena Rojas Umaña",
                Role = "Coordinadora de Obras Comunales",
                Entity = "Municipalidad de Turrialba",
                Email = "elena.rojas@muni-turrialba.go.cr",
                PasswordHash = "Admin1234!",
                BadgeNumber = "MT-1840",
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new OfficialUser
            {
                Id = 3,
                Username = "marco.solano",
                FullName = "Téc. Marco Solano Vargas",
                Role = "Inspector de Infraestructura Vial",
                Entity = "Municipalidad de Tarrazú",
                Email = "marco.solano@munitarrazu.go.cr",
                PasswordHash = "Admin1234!",
                BadgeNumber = "MZ-0372",
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

    }
}
