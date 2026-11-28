using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;
using BarrioAlDia.Api.Models;
using BarrioAlDia.Api.DTOs;

namespace BarrioAlDia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly BarrioDbContext _context;

    public IncidentsController(BarrioDbContext context)
    {
        _context = context;
    }

    // GET: api/incidents
    [HttpGet]
    public async Task<IActionResult> GetIncidents(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] string? canton,
        [FromQuery] string? sortBy = "recientes")
    {
        var query = _context.Incidents
            .Include(i => i.Photos)
            .Include(i => i.Comments)
            .AsNoTracking()
            .AsQueryable();

        // Filtro por búsqueda
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(i =>
                i.Title.ToLower().Contains(s) ||
                i.Location.ToLower().Contains(s) ||
                i.Description.ToLower().Contains(s) ||
                i.Id.ToString() == s);
        }

        // Filtro por categoría
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("Todas", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(i => i.Category.ToLower() == category.ToLower());
        }

        // Filtro por estado
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("Todos", StringComparison.OrdinalIgnoreCase))
        {
            if (status.Contains("atención", StringComparison.OrdinalIgnoreCase) || status.Contains("proceso", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(i => i.Status == "En atención" || i.Status == "En proceso");
            }
            else
            {
                query = query.Where(i => i.Status.ToLower() == status.ToLower());
            }
        }

        // Filtro por cantón
        if (!string.IsNullOrWhiteSpace(canton) && !canton.Equals("Todos", StringComparison.OrdinalIgnoreCase))
        {
            var c = canton.ToLower();
            if (c.Contains("cartago") || c.Contains("san blas"))
            {
                query = query.Where(i => i.Location.ToLower().Contains("cartago") || i.Location.ToLower().Contains("san blas") || i.Location.ToLower().Contains("carmen"));
            }
            else if (c.Contains("turrialba"))
            {
                query = query.Where(i => i.Location.ToLower().Contains("turrialba"));
            }
            else if (c.Contains("tarrazú") || c.Contains("tarrazu"))
            {
                query = query.Where(i => i.Location.ToLower().Contains("tarrazú") || i.Location.ToLower().Contains("tarrazu") || i.Location.ToLower().Contains("marcos"));
            }
            else
            {
                query = query.Where(i => i.Location.ToLower().Contains(c));
            }
        }

        // Ordenamiento dinámico
        query = sortBy?.ToLower() switch
        {
            "antiguos" => query.OrderBy(i => i.Id),
            "votos" => query.OrderByDescending(i => i.Votes).ThenByDescending(i => i.Id),
            "prioridad" => query.OrderByDescending(i => i.Priority == "Alta" ? 3 : i.Priority == "Media" ? 2 : 1).ThenByDescending(i => i.Id),
            _ => query.OrderByDescending(i => i.Id) // "recientes" por defecto
        };

        var list = await query.ToListAsync();

        var result = list.Select(i => new
        {
            i.Id,
            i.Title,
            i.Category,
            i.Location,
            i.Lat,
            i.Lng,
            i.Date,
            i.Description,
            i.Priority,
            i.Status,
            i.IsAnonymous,
            i.ReporterName,
            i.TicketCode,
            i.Video,
            i.GpsAccuracy,
            i.InstitutionalNote,
            i.Photo,
            i.Votes,
            i.CreatedAt,
            Image = i.Photos.FirstOrDefault()?.PhotoUrl ?? (i.Photo != null ? $"/uploads/{i.Photo}" : null),
            Photos = i.Photos.Select(p => new { name = p.PhotoName, preview = p.PhotoUrl }),
            CommentsCount = i.Comments.Count
        });

        return Ok(result);
    }

    // GET: api/incidents/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetIncidentById(int id)
    {
        var incident = await _context.Incidents
            .Include(i => i.Photos)
            .Include(i => i.Comments.OrderBy(c => c.CreatedAt))
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incident == null)
        {
            return NotFound(new { message = $"El incidente #{id} no existe en la base de datos municipal." });
        }

        var result = new
        {
            incident.Id,
            incident.Title,
            incident.Category,
            incident.Location,
            incident.Lat,
            incident.Lng,
            incident.Date,
            incident.Description,
            incident.Priority,
            incident.Status,
            incident.IsAnonymous,
            incident.ReporterName,
            incident.TicketCode,
            incident.Video,
            incident.GpsAccuracy,
            incident.InstitutionalNote,
            incident.Photo,
            incident.Votes,
            incident.CreatedAt,
            Image = incident.Photos.FirstOrDefault()?.PhotoUrl ?? (incident.Photo != null ? $"/uploads/{incident.Photo}" : null),
            Photos = incident.Photos.Select(p => new { name = p.PhotoName, preview = p.PhotoUrl }),
            Comments = incident.Comments.Select(c => new
            {
                c.Id,
                c.Author,
                c.Text,
                c.Photo,
                c.Date,
                c.CreatedAt
            })
        };

        return Ok(result);
    }

    // GET: api/incidents/ticket/{ticketCode}
    [HttpGet("ticket/{ticketCode}")]
    public async Task<IActionResult> GetIncidentByTicket(string ticketCode)
    {
        var cleaned = ticketCode.Trim().ToUpper();
        var incident = await _context.Incidents
            .Include(i => i.Photos)
            .Include(i => i.Comments.OrderBy(c => c.CreatedAt))
            .AsNoTracking()
            .FirstOrDefaultAsync(i => (i.TicketCode != null && i.TicketCode.ToUpper() == cleaned) || i.Id.ToString() == cleaned);

        if (incident == null)
        {
            return NotFound(new { message = $"Ticket {ticketCode} no localizado en la base de datos municipal." });
        }

        var result = new
        {
            incident.Id,
            incident.Title,
            incident.Category,
            incident.Location,
            incident.Lat,
            incident.Lng,
            incident.Date,
            incident.Description,
            incident.Priority,
            incident.Status,
            incident.IsAnonymous,
            incident.ReporterName,
            incident.TicketCode,
            incident.Video,
            incident.GpsAccuracy,
            incident.InstitutionalNote,
            incident.Photo,
            incident.Votes,
            incident.CreatedAt,
            Image = incident.Photos.FirstOrDefault()?.PhotoUrl ?? (incident.Photo != null ? $"/uploads/{incident.Photo}" : null),
            Photos = incident.Photos.Select(p => new { name = p.PhotoName, preview = p.PhotoUrl })
        };

        return Ok(result);
    }

    // POST: api/incidents
    [HttpPost]
    public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Asignación de coordenadas por defecto en Cartago si no vinieron fijadas
        decimal lat = dto.Lat != 0 ? dto.Lat : 9.8644m + (decimal)((Random.Shared.NextDouble() - 0.5) * 0.02);
        decimal lng = dto.Lng != 0 ? dto.Lng : -83.9194m + (decimal)((Random.Shared.NextDouble() - 0.5) * 0.02);

        var incident = new Incident
        {
            Title = dto.Title,
            Category = dto.Category,
            Location = dto.Location,
            Lat = lat,
            Lng = lng,
            Date = DateTime.Now.ToString("yyyy-MM-dd"),
            Description = dto.Description,
            Priority = dto.Priority,
            Status = "Pendiente",
            IsAnonymous = dto.IsAnonymous,
            GpsAccuracy = dto.GpsAccuracy,
            Photo = dto.Photo,
            TicketCode = dto.TicketCode ?? $"TKT-CART-{Random.Shared.Next(1000, 9999)}",
            ReporterName = dto.IsAnonymous ? null : (dto.ReporterName ?? "Ramsés Solano Calvo"),
            Video = dto.Video,
            Votes = 1,
            CreatedAt = DateTime.UtcNow
        };

        // Adjuntar galería de fotos si se enviaron
        if (dto.Photos != null && dto.Photos.Any())
        {
            foreach (var p in dto.Photos)
            {
                incident.Photos.Add(new IncidentPhoto
                {
                    PhotoName = p.Name,
                    PhotoUrl = p.Preview,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetIncidentById), new { id = incident.Id }, new
        {
            incident.Id,
            incident.Title,
            incident.Category,
            incident.Location,
            incident.Lat,
            incident.Lng,
            incident.Date,
            incident.Status,
            incident.Priority,
            incident.TicketCode,
            incident.ReporterName,
            incident.Video,
            message = "Incidente registrado exitosamente en el servidor municipal."
        });
    }

    // PATCH: api/incidents/5/status
    [Authorize]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateIncidentStatus(int id, [FromBody] UpdateIncidentStatusDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
        {
            return NotFound(new { message = $"Incidente #{id} no encontrado." });
        }

        incident.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.InstitutionalNote))
        {
            incident.InstitutionalNote = dto.InstitutionalNote;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            incident.Id,
            incident.Status,
            incident.InstitutionalNote,
            message = $"Estado de incidente #{id} actualizado a '{dto.Status}'."
        });
    }

    // POST: api/incidents/5/vote
    [HttpPost("{id:int}/vote")]
    public async Task<IActionResult> VoteIncident(int id, [FromBody] VoteIncidentDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
        {
            return NotFound(new { message = $"Incidente #{id} no encontrado." });
        }

        if (dto.Increment)
        {
            incident.Votes++;
        }
        else
        {
            incident.Votes = Math.Max(0, incident.Votes - 1);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            incident.Id,
            incident.Votes,
            message = dto.Increment ? "Respaldo comunitario registrado." : "Respaldo retirado."
        });
    }

    // POST: api/incidents/5/comments
    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null)
        {
            return NotFound(new { message = $"Incidente #{id} no encontrado." });
        }

        var comment = new IncidentComment
        {
            IncidentId = id,
            Author = string.IsNullOrWhiteSpace(dto.Author) ? "Vecino anónimo" : dto.Author.Trim(),
            Text = dto.Text.Trim(),
            Photo = dto.Photo,
            Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm"),
            CreatedAt = DateTime.UtcNow
        };

        _context.IncidentComments.Add(comment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            comment.Id,
            comment.Author,
            comment.Text,
            comment.Photo,
            comment.Date,
            message = "Observación vecinal agregada exitosamente."
        });
    }

    // POST: api/incidents/wipe
    // Permite realizar un barrido completo de datos para pruebas limpias de flujo
    [Authorize]
    [HttpPost("wipe")]
    public async Task<IActionResult> WipeIncidents()
    {
        _context.IncidentPhotos.RemoveRange(_context.IncidentPhotos);
        _context.IncidentComments.RemoveRange(_context.IncidentComments);
        _context.Incidents.RemoveRange(_context.Incidents);
        await _context.SaveChangesAsync();

        try
        {
            await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Incidents', RESEED, 0);");
        }
        catch { }

        return Ok(new
        {
            success = true,
            totalRemaining = 0,
            message = "Barrido de datos ejecutado exitosamente. La base de datos está en cero para pruebas completas."
        });
    }
}
