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
public class ChatController : ControllerBase
{
    private readonly BarrioDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatController(BarrioDbContext context, IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // GET: api/chat/ticket/{ticketCode}
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet("ticket/{ticketCode}")]
    public async Task<IActionResult> GetMessagesByTicket(string ticketCode)
    {
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";

        var code = ticketCode.Trim().ToUpper();

        var messages = await _context.ChatMessages
            .Where(m => m.TicketCode.ToUpper() == code)
            .OrderBy(m => m.SentAt)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                TicketCode = m.TicketCode,
                SenderName = m.SenderName,
                SenderRole = m.SenderRole,
                MessageType = m.MessageType,
                Content = m.Content,
                AudioDurationSeconds = m.AudioDurationSeconds,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            })
            .ToListAsync();

        return Ok(messages);
    }

    // POST: api/chat/send
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendChatMessageDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var message = new ChatMessage
        {
            TicketCode = dto.TicketCode.Trim().ToUpper(),
            SenderName = dto.SenderName.Trim(),
            SenderRole = dto.SenderRole.Trim(),
            MessageType = dto.MessageType.Trim(), // "Text" o "Audio"
            Content = dto.Content,
            AudioDurationSeconds = dto.AudioDurationSeconds,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var resultDto = new ChatMessageDto
        {
            Id = message.Id,
            TicketCode = message.TicketCode,
            SenderName = message.SenderName,
            SenderRole = message.SenderRole,
            MessageType = message.MessageType,
            Content = message.Content,
            AudioDurationSeconds = message.AudioDurationSeconds,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };

        // Broadcast en tiempo real vía SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveMessage", resultDto);

        return Ok(resultDto);
    }

    // POST: api/chat/upload-audio
    [HttpPost("upload-audio")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAudioFile([FromForm] IFormFile? file, [FromForm] string ticketCode, [FromForm] int? durationSeconds)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Archivo de audio no provisto o vacío." });
        }

        // Crear directorio de audios si no existe
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "audios");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".webm";
        var fileName = $"audio_{DateTime.UtcNow.Ticks}_{Guid.NewGuid().ToString()[..6]}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var audioUrl = $"/audios/{fileName}";

        return Ok(new
        {
            audioUrl,
            fileName,
            durationSeconds = durationSeconds ?? 5
        });
    }
}
