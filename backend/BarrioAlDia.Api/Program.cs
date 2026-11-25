using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;
using BarrioAlDia.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5000");

// Configuración de Base de Datos SQL Server con Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=BarrioAlDiaDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<BarrioDbContext>(options =>
    options.UseSqlServer(connectionString));

// Configuración de Controladores y SignalR en tiempo real
builder.Services.AddControllers();
builder.Services.AddSignalR();

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

var audiosPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "audios");
if (!Directory.Exists(audiosPath))
{
    Directory.CreateDirectory(audiosPath);
}

var avatarsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
if (!Directory.Exists(avatarsPath))
{
    Directory.CreateDirectory(avatarsPath);
}

var contentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".m4a"] = "audio/mp4";
contentTypeProvider.Mappings[".mp4"] = "audio/mp4";
contentTypeProvider.Mappings[".webm"] = "audio/webm";
contentTypeProvider.Mappings[".wav"] = "audio/wav";
contentTypeProvider.Mappings[".ogg"] = "audio/ogg";
contentTypeProvider.Mappings[".mp3"] = "audio/mpeg";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider,
    ServeUnknownFileTypes = true,
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
    }
});

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

app.MapGet("/api/health", async (BarrioDbContext db) =>
{
    var count = await db.ChatMessages.CountAsync();
    return Results.Ok(new
    {
        status = "Healthy",
        serverTime = DateTime.UtcNow,
        database = "Connected",
        totalChatMessages = count
    });
});

// Aplicar creación y seed data de base de datos SQL Server
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BarrioDbContext>();
    try
    {
        db.Database.EnsureCreated();
        db.Database.ExecuteSqlRaw(@"
            IF COL_LENGTH('OfficialUsers', 'AvatarUrl') IS NULL ALTER TABLE OfficialUsers ADD AvatarUrl NVARCHAR(300) NULL;
            IF COL_LENGTH('OfficialUsers', 'PhoneNumber') IS NULL ALTER TABLE OfficialUsers ADD PhoneNumber NVARCHAR(30) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'Canton') IS NULL ALTER TABLE OfficialUsers ADD Canton NVARCHAR(60) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'District') IS NULL ALTER TABLE OfficialUsers ADD District NVARCHAR(80) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'Neighborhood') IS NULL ALTER TABLE OfficialUsers ADD Neighborhood NVARCHAR(100) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'Bio') IS NULL ALTER TABLE OfficialUsers ADD Bio NVARCHAR(300) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'WorkSchedule') IS NULL ALTER TABLE OfficialUsers ADD WorkSchedule NVARCHAR(100) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'EmergencyContact') IS NULL ALTER TABLE OfficialUsers ADD EmergencyContact NVARCHAR(120) NOT NULL DEFAULT '';
            IF COL_LENGTH('OfficialUsers', 'UserType') IS NULL ALTER TABLE OfficialUsers ADD UserType NVARCHAR(30) NOT NULL DEFAULT 'Official';
        ");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error al inicializar la base de datos SQL Server");
    }
}

app.MapHub<ChatHub>("/chatHub").RequireCors("AllowFrontend");
app.MapControllers().RequireCors("AllowFrontend");

app.Run();
