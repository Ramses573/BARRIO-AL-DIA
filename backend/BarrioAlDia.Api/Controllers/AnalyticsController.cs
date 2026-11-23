using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;

namespace BarrioAlDia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly BarrioDbContext _context;

    public AnalyticsController(BarrioDbContext context)
    {
        _context = context;
    }

    // GET: api/analytics/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var incidents = await _context.Incidents.AsNoTracking().ToListAsync();

        var total = incidents.Count;
        var pending = incidents.Count(i => i.Status == "Pendiente");
        var inProgress = incidents.Count(i => i.Status == "En atención" || i.Status == "En proceso");
        var resolved = incidents.Count(i => i.Status == "Resuelto");
        var resolutionRate = total > 0 ? (int)Math.Round((double)resolved / total * 100) : 0;

        // Distribución Cantonal
        var cartagoCount = incidents.Count(i =>
        {
            var l = i.Location.ToLower();
            return l.Contains("cartago") || l.Contains("san blas") || l.Contains("carmen");
        });

        var turrialbaCount = incidents.Count(i => i.Location.ToLower().Contains("turrialba"));

        var tarrazuCount = incidents.Count(i =>
        {
            var l = i.Location.ToLower();
            return l.Contains("tarrazú") || l.Contains("tarrazu") || l.Contains("marcos");
        });

        // Desglose por categoría
        var categories = new[]
        {
            new { name = "Inundación", color = "#3182ce", count = incidents.Count(i => i.Category == "Inundación") },
            new { name = "Accidente", color = "#e53e3e", count = incidents.Count(i => i.Category == "Accidente") },
            new { name = "Poste sin luz", color = "#805ad5", count = incidents.Count(i => i.Category == "Poste sin luz") },
            new { name = "Incendio", color = "#dd6b20", count = incidents.Count(i => i.Category == "Incendio") },
            new { name = "Calles dañadas", color = "#d97706", count = incidents.Count(i => i.Category == "Calles dañadas") },
            new { name = "Inseguridad", color = "#4f46e5", count = incidents.Count(i => i.Category == "Inseguridad") }
        };

        return Ok(new
        {
            total,
            pending,
            inProgress,
            resolved,
            resolutionRate,
            cantons = new
            {
                cartago = new { count = cartagoCount, percentage = total > 0 ? (int)Math.Round((double)cartagoCount / total * 100) : 0 },
                turrialba = new { count = turrialbaCount, percentage = total > 0 ? (int)Math.Round((double)turrialbaCount / total * 100) : 0 },
                tarrazu = new { count = tarrazuCount, percentage = total > 0 ? (int)Math.Round((double)tarrazuCount / total * 100) : 0 }
            },
            categories
        });
    }
}
