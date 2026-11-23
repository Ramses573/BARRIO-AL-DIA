using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;
using BarrioAlDia.Api.Models;

namespace BarrioAlDia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly BarrioDbContext _context;

    public NotificationsController(BarrioDbContext context)
    {
        _context = context;
    }

    // GET: api/notifications
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var list = await _context.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.Id)
            .ToListAsync();

        return Ok(list);
    }

    // DELETE: api/notifications/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DismissNotification(int id)
    {
        var item = await _context.Notifications.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { message = $"Alerta #{id} no encontrada." });
        }

        _context.Notifications.Remove(item);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Alerta comunitaria #{id} descartada del sistema." });
    }

    // POST: api/notifications/reset
    [HttpPost("reset")]
    public async Task<IActionResult> ResetNotifications()
    {
        _context.Notifications.RemoveRange(_context.Notifications);
        await _context.SaveChangesAsync();

        var initialList = new List<Notification>
        {
            new Notification
            {
                Title = "Inundación reportada",
                Category = "Inundación",
                Location = "Calle principal, Barrio El Carmen",
                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                Time = "4:35 p. m.",
                RiskLevel = "RIESGO MEDIO",
                Description = "Se reporta acumulación de agua. Evite la zona y utilice una ruta alterna.",
                Recommendation = "Transitar con precaución, evitar la zona afectada y seguir las indicaciones de las autoridades.",
                Status = "Reporte reciente",
                CreatedAt = DateTime.UtcNow
            },
            new Notification
            {
                Title = "Falla de alumbrado público",
                Category = "Poste sin luz",
                Location = "Avenida Central, sector comercial",
                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                Time = "6:10 p. m.",
                RiskLevel = "RIESGO BAJO",
                Description = "Tres postes con luminarias sin funcionar.",
                Recommendation = "Caminar por aceras iluminadas y reportar actividad sospechosa.",
                Status = "En atención",
                CreatedAt = DateTime.UtcNow
            },
            new Notification
            {
                Title = "Accidente de tránsito con bloqueo",
                Category = "Accidente",
                Location = "Intersección San Marcos",
                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                Time = "7:40 a. m.",
                RiskLevel = "RIESGO ALTO",
                Description = "Colisión de dos vehículos bloqueando el paso hacia el centro.",
                Recommendation = "Tomar desvío por ruta alterna y permitir paso a ambulancias.",
                Status = "Resuelto",
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Notifications.AddRange(initialList);
        await _context.SaveChangesAsync();

        return Ok(initialList);
    }

    // POST: api/notifications/wipe
    [HttpPost("wipe")]
    public async Task<IActionResult> WipeNotifications()
    {
        _context.Notifications.RemoveRange(_context.Notifications);
        await _context.SaveChangesAsync();

        try
        {
            await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Notifications', RESEED, 0);");
        }
        catch { }

        return Ok(new
        {
            success = true,
            totalRemaining = 0,
            message = "Alertas comunitarias limpiadas. Base de datos en 0 notificaciones para pruebas limpias."
        });
    }
}
