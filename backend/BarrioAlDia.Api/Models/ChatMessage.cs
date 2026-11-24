using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarrioAlDia.Api.Models;

[Table("ChatMessages")]
public class ChatMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(80)]
    public string TicketCode { get; set; } = "GENERAL"; // Código del ticket asociado (ej. TKT-CART-5821) o canal

    [Required]
    [MaxLength(120)]
    public string SenderName { get; set; } = "Vecino Comunitario";

    [Required]
    [MaxLength(60)]
    public string SenderRole { get; set; } = "Ciudadano"; // "Ciudadano", "Cuadrilla Municipal", "Coordinador Cantonal"

    [Required]
    [MaxLength(30)]
    public string MessageType { get; set; } = "Text"; // "Text", "Audio", "Photo"

    [Required]
    public string Content { get; set; } = string.Empty; // Texto del mensaje o URL/base64 de la nota de audio

    public int? AudioDurationSeconds { get; set; } // Duración en segundos de la nota de voz

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;
}
