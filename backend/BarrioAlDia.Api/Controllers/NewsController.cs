using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using BarrioAlDia.Api.Data;
using BarrioAlDia.Api.DTOs;
using BarrioAlDia.Api.Hubs;
using BarrioAlDia.Api.Models;

namespace BarrioAlDia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private readonly BarrioDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public NewsController(BarrioDbContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // GET: api/news
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet]
    public async Task<IActionResult> GetNews(
        [FromQuery] string? canton,
        [FromQuery] string? category,
        [FromQuery] bool? urgentOnly)
    {
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";
        var query = _context.NewsArticles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(canton) && canton != "todos")
        {
            var cLower = canton.Trim().ToLower();
            query = query.Where(n => n.Canton.ToLower().Contains(cLower) || n.Canton == "General");
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "todos")
        {
            query = query.Where(n => n.Category == category);
        }

        if (urgentOnly.HasValue && urgentOnly.Value)
        {
            query = query.Where(n => n.IsUrgent);
        }

        var list = await query
            .OrderByDescending(n => n.IsUrgent)
            .ThenByDescending(n => n.PublishedAt)
            .Select(n => new NewsDto
            {
                Id = n.Id,
                Title = n.Title,
                Summary = n.Summary,
                Content = n.Content,
                Category = n.Category,
                Canton = n.Canton,
                District = n.District,
                AuthorEntity = n.AuthorEntity,
                PublishedAt = n.PublishedAt,
                IsUrgent = n.IsUrgent,
                ImageUrl = n.ImageUrl,
                VideoUrl = n.VideoUrl,
                OfficialLink = n.OfficialLink,
                Lat = n.Lat,
                Lng = n.Lng
            })
            .ToListAsync();

        return Ok(list);
    }

    // GET: api/news/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetNewsById(int id)
    {
        var news = await _context.NewsArticles.FindAsync(id);
        if (news == null)
        {
            return NotFound(new { message = $"Noticia con ID {id} no encontrada." });
        }

        return Ok(new NewsDto
        {
            Id = news.Id,
            Title = news.Title,
            Summary = news.Summary,
            Content = news.Content,
            Category = news.Category,
            Canton = news.Canton,
            District = news.District,
            AuthorEntity = news.AuthorEntity,
            PublishedAt = news.PublishedAt,
            IsUrgent = news.IsUrgent,
            ImageUrl = news.ImageUrl,
            VideoUrl = news.VideoUrl,
            OfficialLink = news.OfficialLink,
            Lat = news.Lat,
            Lng = news.Lng
        });
    }

    // POST: api/news
    [HttpPost]
    public async Task<IActionResult> CreateNews([FromBody] CreateNewsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var article = new NewsArticle
        {
            Title = dto.Title.Trim(),
            Summary = string.IsNullOrWhiteSpace(dto.Summary) ? dto.Title.Trim() : dto.Summary.Trim(),
            Content = dto.Content.Trim(),
            Category = dto.Category,
            Canton = dto.Canton,
            District = dto.District,
            AuthorEntity = dto.AuthorEntity,
            PublishedAt = DateTime.UtcNow,
            IsUrgent = dto.IsUrgent,
            ImageUrl = dto.ImageUrl,
            VideoUrl = dto.VideoUrl,
            OfficialLink = dto.OfficialLink,
            Lat = dto.Lat,
            Lng = dto.Lng
        };

        _context.NewsArticles.Add(article);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("NewsUpdated");

        return CreatedAtAction(nameof(GetNewsById), new { id = article.Id }, new NewsDto
        {
            Id = article.Id,
            Title = article.Title,
            Summary = article.Summary,
            Content = article.Content,
            Category = article.Category,
            Canton = article.Canton,
            District = article.District,
            AuthorEntity = article.AuthorEntity,
            PublishedAt = article.PublishedAt,
            IsUrgent = article.IsUrgent,
            ImageUrl = article.ImageUrl,
            VideoUrl = article.VideoUrl,
            OfficialLink = article.OfficialLink,
            Lat = article.Lat,
            Lng = article.Lng
        });
    }

    // POST: api/news/wipe
    [Authorize]
    [HttpPost("wipe")]
    public async Task<IActionResult> WipeAllNews()
    {
        await _context.Database.ExecuteSqlRawAsync("DELETE FROM NewsArticles");
        await _hubContext.Clients.All.SendAsync("NewsUpdated");
        return Ok(new { message = "Barrido de datos de Boletín Cantonal ejecutado." });
    }

    // DELETE: api/news/{id}
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNews(int id)
    {
        var article = await _context.NewsArticles.FindAsync(id);
        if (article == null)
        {
            return NotFound(new { message = $"Noticia con ID {id} no encontrada." });
        }

        _context.NewsArticles.Remove(article);
        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("NewsUpdated");

        return NoContent();
    }
}
