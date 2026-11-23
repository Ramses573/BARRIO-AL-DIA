using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Configuración de Base de Datos SQL Server con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=BarrioAlDiaDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<BarrioDbContext>(options =>
    options.UseSqlServer(connectionString));

// Configuración de Controladores
builder.Services.AddControllers();

// Configuración de CORS para permitir frontend React Vite (localhost:3000 y red local)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Barrio al Día - API Oficial",
        Version = "v1",
        Description = "API REST en .NET 9 para la gestión de incidencias vecinales y despacho municipal de Costa Rica (CUC Emprendedores TI-155)"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT. Ejemplo: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Pipeline de Middleware
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Barrio al Día API v1");
        c.RoutePrefix = "swagger";
    });
}

// Endpoint de verificación de salud
app.MapGet("/", () => Results.Ok(new
{
    service = "Barrio al Día .NET 9 Web API",
    status = "Online",
    timestamp = DateTime.UtcNow,
    documentation = "/swagger",
    database = "SQL Server (MSSQLLocalDB)",
    academic = "Colegio Universitario de Cartago - TI-155"
}));

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    serverTime = DateTime.UtcNow
}));

// Aplicar creación y seed data de base de datos SQL Server
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BarrioDbContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error al inicializar la base de datos SQL Server");
    }
}

app.MapControllers();

app.Run();
