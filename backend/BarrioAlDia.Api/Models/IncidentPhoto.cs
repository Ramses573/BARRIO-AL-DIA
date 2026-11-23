using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BarrioAlDia.Api.Models;

public class IncidentPhoto
{
    [Key]
    public int Id { get; set; }

    public int IncidentId { get; set; }

    [JsonIgnore]
    public Incident? Incident { get; set; }

    [Required]
    [MaxLength(200)]
    public string PhotoName { get; set; } = string.Empty;

    public string PhotoUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
