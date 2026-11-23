using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BarrioAlDia.Api.Models;

public class IncidentComment
{
    [Key]
    public int Id { get; set; }

    public int IncidentId { get; set; }

    [JsonIgnore]
    public Incident? Incident { get; set; }

    [MaxLength(100)]
    public string Author { get; set; } = "Vecino anónimo";

    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = string.Empty;

    public string? Photo { get; set; }

    [MaxLength(30)]
    public string Date { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
