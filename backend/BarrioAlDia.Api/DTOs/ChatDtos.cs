using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.DTOs;

public class ChatMessageDto
{
    public int Id { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string MessageType { get; set; } = "Text"; // "Text", "Audio", "Photo"
    public string Content { get; set; } = string.Empty;
    public int? AudioDurationSeconds { get; set; }
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}

public class SendChatMessageDto
{
    [Required]
    [MaxLength(80)]
    public string TicketCode { get; set; } = "GENERAL";

    [Required]
    [MaxLength(120)]
    public string SenderName { get; set; } = "Vecino Comunitario";

    [Required]
    [MaxLength(60)]
    public string SenderRole { get; set; } = "Ciudadano";

    [Required]
    [MaxLength(30)]
    public string MessageType { get; set; } = "Text"; // "Text" o "Audio"

    [Required]
    public string Content { get; set; } = string.Empty;

    public int? AudioDurationSeconds { get; set; }
}
