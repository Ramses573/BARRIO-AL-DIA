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

        // Seed Data: Incidentes Oficiales de Costa Rica
        modelBuilder.Entity<Incident>().HasData(
            new Incident
            {
                Id = 1,
                Title = "Poste sin luz en Av. Central",
                Location = "Avenida Central, Cartago Centro",
                Category = "Poste sin luz",
                Lat = 9.8644m,
                Lng = -83.9194m,
                Date = "2026-11-10",
                Description = "Luminaria apagada hace más de 3 noches consecutivas en zona concurrida.",
                Status = "Pendiente",
                Priority = "Media",
                IsAnonymous = false,
                Votes = 5,
                CreatedAt = new DateTime(2026, 11, 10, 18, 0, 0, DateTimeKind.Utc)
            },
            new Incident
            {
                Id = 2,
                Title = "Inundación por colapso de alcantarillado",
                Location = "Barrio El Carmen, Cartago",
                Category = "Inundación",
                Lat = 9.8580m,
                Lng = -83.9235m,
                Date = "2026-11-12",
                Description = "Acumulación de agua en calle principal por fuertes lluvias.",
                Status = "En atención",
                Priority = "Alta",
                InstitutionalNote = "Cuadrilla 2 de Servicios Públicos asignada para limpieza de alcantarillado.",
                IsAnonymous = false,
                Votes = 12,
                CreatedAt = new DateTime(2026, 11, 12, 16, 30, 0, DateTimeKind.Utc)
            },
            new Incident
            {
                Id = 3,
                Title = "Accidente de tránsito con bloqueo",
                Location = "Intersección San Blas, Cartago",
                Category = "Accidente",
                Lat = 9.8785m,
                Lng = -83.9248m,
                Date = "2026-11-15",
                Description = "Colisión vehicular genera congestionamiento hacia la ruta principal.",
                Status = "Resuelto",
                Priority = "Media",
                InstitutionalNote = "Tránsito despejado y vehículos orillados tras inspección policial.",
                IsAnonymous = true,
                Votes = 8,
                CreatedAt = new DateTime(2026, 11, 15, 8, 15, 0, DateTimeKind.Utc)
            },
            new Incident
            {
                Id = 4,
                Title = "Quema de pastizal cerca de viviendas",
                Location = "Sector El Mora, Turrialba",
                Category = "Incendio",
                Lat = 9.9047m,
                Lng = -83.6835m,
                Date = "2026-11-18",
                Description = "Humo denso afectando a los vecinos y visibilidad en la carretera.",
                Status = "En atención",
                Priority = "Alta",
                InstitutionalNote = "Unidad M-41 del Cuerpo de Bomberos en labores de control.",
                IsAnonymous = false,
                Votes = 15,
                CreatedAt = new DateTime(2026, 11, 18, 14, 0, 0, DateTimeKind.Utc)
            },
            new Incident
            {
                Id = 5,
                Title = "Huecos profundos en vía cantonal",
                Location = "San Marcos de Tarrazú, Calle Central",
                Category = "Calles dañadas",
                Lat = 9.6611m,
                Lng = -84.0206m,
                Date = "2026-11-19",
                Description = "Deterioro grave de asfalto afectando el paso de vehículos y autobuses.",
                Status = "Pendiente",
                Priority = "Media",
                IsAnonymous = false,
                Votes = 9,
                CreatedAt = new DateTime(2026, 11, 19, 10, 0, 0, DateTimeKind.Utc)
            }
        );

        // Seed Data: Notificaciones Comunitarias del Anexo 4
        modelBuilder.Entity<Notification>().HasData(
            new Notification
            {
                Id = 1,
                Title = "Inundación reportada",
                Category = "Inundación",
                Location = "Calle principal, Barrio El Carmen",
                Date = "2026-11-20",
                Time = "4:35 p. m.",
                RiskLevel = "RIESGO MEDIO",
                Description = "Se reporta acumulación de agua. Evite la zona y utilice una ruta alterna.",
                Recommendation = "Transitar con precaución, evitar la zona afectada y seguir las indicaciones de las autoridades.",
                Status = "Reporte reciente",
                CreatedAt = new DateTime(2026, 11, 20, 16, 35, 0, DateTimeKind.Utc)
            },
            new Notification
            {
                Id = 2,
                Title = "Falla de alumbrado público",
                Category = "Poste sin luz",
                Location = "Avenida Central, sector comercial",
                Date = "2026-11-20",
                Time = "6:10 p. m.",
                RiskLevel = "RIESGO BAJO",
                Description = "Tres postes con luminarias sin funcionar.",
                Recommendation = "Caminar por aceras iluminadas y reportar actividad sospechosa.",
                Status = "En atención",
                CreatedAt = new DateTime(2026, 11, 20, 18, 10, 0, DateTimeKind.Utc)
            },
            new Notification
            {
                Id = 3,
                Title = "Accidente de tránsito con bloqueo",
                Category = "Accidente",
                Location = "Intersección San Marcos",
                Date = "2026-11-19",
                Time = "7:40 a. m.",
                RiskLevel = "RIESGO ALTO",
                Description = "Colisión de dos vehículos bloqueando el paso hacia el centro.",
                Recommendation = "Tomar desvío por ruta alterna y permitir paso a ambulancias.",
                Status = "Resuelto",
                CreatedAt = new DateTime(2026, 11, 19, 7, 40, 0, DateTimeKind.Utc)
            }
        );

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

        // Seed Data: Noticias y Boletines Cantonales Oficiales
        modelBuilder.Entity<NewsArticle>().HasData(
            new NewsArticle
            {
                Id = 1,
                Title = "Plan de Recarpeteo y Bacheo Intensivo en Cartago Centro",
                Summary = "Cuadrillas municipales inician intervención en Avenida Central y Calle 4 durante toda la semana.",
                Content = "La Dirección de Obras de la Municipalidad de Cartago informa a la ciudadanía el inicio de labores de recarpeteo asfáltico en los sectores comprendidos entre el Mercado Municipal y la Basílica de los Ángeles. Se recomienda a los conductores utilizar vías alternas hacia El Tejar y Taras.",
                Category = "Vial",
                Canton = "Cartago",
                District = "Oriental",
                AuthorEntity = "Municipalidad de Cartago - Obras Públicas",
                PublishedAt = new DateTime(2026, 11, 20, 8, 0, 0, DateTimeKind.Utc),
                IsUrgent = true,
                OfficialLink = "https://muni-cartago.go.cr/comunicados/recarpeteo-nov-2026"
            },
            new NewsArticle
            {
                Id = 2,
                Title = "Mantenimiento del Sistema de Acueducto en Turrialba (Sector El Mora)",
                Summary = "Suspensión temporal del servicio de agua potable este miércoles por reparación de tubería madre.",
                Content = "El Acueducto Municipal de Turrialba informa que debido a trabajos de interconexión y sustitución de tubería de alta presión en el sector de El Mora y San Rafael, habrá interrupción del suministro entre las 9:00 a.m. y las 3:00 p.m. Se solicita a los vecinos recolectar agua preventiva.",
                Category = "Agua y Alcantarillado",
                Canton = "Turrialba",
                District = "Turrialba Centro",
                AuthorEntity = "Municipalidad de Turrialba - Acueductos",
                PublishedAt = new DateTime(2026, 11, 21, 10, 30, 0, DateTimeKind.Utc),
                IsUrgent = false,
                OfficialLink = "https://muni-turrialba.go.cr/avisos/acueducto-el-mora"
            },
            new NewsArticle
            {
                Id = 3,
                Title = "Habilitación de Paso en Ruta Cafetalera San Marcos - Santa María de Dota",
                Summary = "Inspección técnica concluye remoción de escombros tras lluvias de la semana en Tarrazú.",
                Content = "La Unidad de Gestión Vial de la Municipalidad de Tarrazú confirma la apertura normal del tránsito en la ruta que conecta San Marcos con los distritos productores de café. Cuadrillas permanecen atentas a cualquier alerta preventiva por lluvias.",
                Category = "Vial",
                Canton = "Tarrazú",
                District = "San Marcos",
                AuthorEntity = "Municipalidad de Tarrazú - Gestión Vial",
                PublishedAt = new DateTime(2026, 11, 22, 14, 0, 0, DateTimeKind.Utc),
                IsUrgent = false,
                OfficialLink = "https://munitarrazu.go.cr/obras/ruta-cafetalera"
            }
        );

        // Seed Data: Mensajes y Audios de Chat Iniciales
        modelBuilder.Entity<ChatMessage>().HasData(
            new ChatMessage
            {
                Id = 1,
                TicketCode = "TKT-CART-5821",
                SenderName = "María Luisa Monge",
                SenderRole = "Ciudadano",
                MessageType = "Text",
                Content = "Buenas tardes, ¿saben si la cuadrilla vendrá hoy a revisar el poste sin luz?",
                SentAt = new DateTime(2026, 11, 22, 15, 30, 0, DateTimeKind.Utc),
                IsRead = true
            },
            new ChatMessage
            {
                Id = 2,
                TicketCode = "TKT-CART-5821",
                SenderName = "Ing. Carlos Méndez",
                SenderRole = "Cuadrilla Municipal",
                MessageType = "Text",
                Content = "Hola doña María Luisa. La cuadrilla de electrificación municipal está programada para las 4:30 PM en su sector.",
                SentAt = new DateTime(2026, 11, 22, 15, 35, 0, DateTimeKind.Utc),
                IsRead = true
            },
            new ChatMessage
            {
                Id = 3,
                TicketCode = "TKT-CART-5821",
                SenderName = "Cuadrilla #2 Cartago",
                SenderRole = "Cuadrilla Municipal",
                MessageType = "Audio",
                Content = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcAA...",
                AudioDurationSeconds = 8,
                SentAt = new DateTime(2026, 11, 22, 16, 25, 0, DateTimeKind.Utc),
                IsRead = true
            }
        );
    }
}
