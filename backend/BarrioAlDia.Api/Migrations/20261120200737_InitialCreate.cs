using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BarrioAlDia.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Lat = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    Lng = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: false),
                    Date = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsAnonymous = table.Column<bool>(type: "bit", nullable: false),
                    GpsAccuracy = table.Column<int>(type: "int", nullable: true),
                    InstitutionalNote = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Photo = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Votes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Date = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Time = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RiskLevel = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Recommendation = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OfficialUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Entity = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BadgeNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfficialUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IncidentComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncidentId = table.Column<int>(type: "int", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Photo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Date = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentComments_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IncidentPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IncidentId = table.Column<int>(type: "int", nullable: false),
                    PhotoName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PhotoUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentPhotos_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Incidents",
                columns: new[] { "Id", "Category", "CreatedAt", "Date", "Description", "GpsAccuracy", "InstitutionalNote", "IsAnonymous", "Lat", "Lng", "Location", "Photo", "Priority", "Status", "Title", "Votes" },
                values: new object[,]
                {
                    { 1, "Poste sin luz", new DateTime(2026, 11, 10, 18, 0, 0, 0, DateTimeKind.Utc), "2026-11-10", "Luminaria apagada hace más de 3 noches consecutivas en zona concurrida.", null, null, false, 9.8644m, -83.9194m, "Avenida Central, Cartago Centro", null, "Media", "Pendiente", "Poste sin luz en Av. Central", 5 },
                    { 2, "Inundación", new DateTime(2026, 11, 12, 16, 30, 0, 0, DateTimeKind.Utc), "2026-11-12", "Acumulación de agua en calle principal por fuertes lluvias.", null, "Cuadrilla 2 de Servicios Públicos asignada para limpieza de alcantarillado.", false, 9.8580m, -83.9235m, "Barrio El Carmen, Cartago", null, "Alta", "En atención", "Inundación por colapso de alcantarillado", 12 },
                    { 3, "Accidente", new DateTime(2026, 11, 15, 8, 15, 0, 0, DateTimeKind.Utc), "2026-11-15", "Colisión vehicular genera congestionamiento hacia la ruta principal.", null, "Tránsito despejado y vehículos orillados tras inspección policial.", true, 9.8785m, -83.9248m, "Intersección San Blas, Cartago", null, "Media", "Resuelto", "Accidente de tránsito con bloqueo", 8 },
                    { 4, "Incendio", new DateTime(2026, 11, 18, 14, 0, 0, 0, DateTimeKind.Utc), "2026-11-18", "Humo denso afectando a los vecinos y visibilidad en la carretera.", null, "Unidad M-41 del Cuerpo de Bomberos en labores de control.", false, 9.9047m, -83.6835m, "Sector El Mora, Turrialba", null, "Alta", "En atención", "Quema de pastizal cerca de viviendas", 15 },
                    { 5, "Calles dañadas", new DateTime(2026, 11, 19, 10, 0, 0, 0, DateTimeKind.Utc), "2026-11-19", "Deterioro grave de asfalto afectando el paso de vehículos y autobuses.", null, null, false, 9.6611m, -84.0206m, "San Marcos de Tarrazú, Calle Central", null, "Media", "Pendiente", "Huecos profundos en vía cantonal", 9 }
                });

            migrationBuilder.InsertData(
                table: "Notifications",
                columns: new[] { "Id", "Category", "CreatedAt", "Date", "Description", "Location", "Recommendation", "RiskLevel", "Status", "Time", "Title" },
                values: new object[,]
                {
                    { 1, "Inundación", new DateTime(2026, 11, 20, 16, 35, 0, 0, DateTimeKind.Utc), "2026-11-20", "Se reporta acumulación de agua. Evite la zona y utilice una ruta alterna.", "Calle principal, Barrio El Carmen", "Transitar con precaución, evitar la zona afectada y seguir las indicaciones de las autoridades.", "RIESGO MEDIO", "Reporte reciente", "4:35 p. m.", "Inundación reportada" },
                    { 2, "Poste sin luz", new DateTime(2026, 11, 20, 18, 10, 0, 0, DateTimeKind.Utc), "2026-11-20", "Tres postes con luminarias sin funcionar.", "Avenida Central, sector comercial", "Caminar por aceras iluminadas y reportar actividad sospechosa.", "RIESGO BAJO", "En atención", "6:10 p. m.", "Falla de alumbrado público" },
                    { 3, "Accidente", new DateTime(2026, 11, 19, 7, 40, 0, 0, DateTimeKind.Utc), "2026-11-19", "Colisión de dos vehículos bloqueando el paso hacia el centro.", "Intersección San Marcos", "Tomar desvío por ruta alterna y permitir paso a ambulancias.", "RIESGO ALTO", "Resuelto", "7:40 a. m.", "Accidente de tránsito con bloqueo" }
                });

            migrationBuilder.InsertData(
                table: "OfficialUsers",
                columns: new[] { "Id", "BadgeNumber", "CreatedAt", "Email", "Entity", "FullName", "IsActive", "PasswordHash", "Role", "Username" },
                values: new object[,]
                {
                    { 1, "MC-4921", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "carlos.mendez@muni-cartago.go.cr", "Municipalidad de Cartago", "Ing. Carlos Méndez Solís", true, "MuniCartago#2026!", "Director de Obras y Servicios Públicos", "carlos.mendez" },
                    { 2, "MT-1840", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "elena.rojas@muni-turrialba.go.cr", "Municipalidad de Turrialba", "Licda. Elena Rojas Umaña", true, "MuniTurrialba$2026!", "Coordinadora de Obras Comunales", "elena.rojas" },
                    { 3, "MZ-0372", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "marco.solano@munitarrazu.go.cr", "Municipalidad de Tarrazú", "Téc. Marco Solano Vargas", true, "MuniTarrazu%2026!", "Inspector de Infraestructura Vial", "marco.solano" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_IncidentId",
                table: "IncidentComments",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentPhotos_IncidentId",
                table: "IncidentPhotos",
                column: "IncidentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IncidentComments");

            migrationBuilder.DropTable(
                name: "IncidentPhotos");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "OfficialUsers");

            migrationBuilder.DropTable(
                name: "Incidents");
        }
    }
}
