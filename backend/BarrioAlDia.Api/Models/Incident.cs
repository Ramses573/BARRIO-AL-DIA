using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarrioAlDia.Api.Models;

public class Incident
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(60)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Location { get; set; } = string.Empty;

    [Column(TypeName = "decimal(9,6)")]
    public decimal Lat { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal Lng { get; set; }

    [MaxLength(20)]
    public string Date { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Priority { get; set; } = "Media"; // Baja, Media, Alta

    [MaxLength(30)]
    public string Status { get; set; } = "Pendiente"; // Pendiente, En atención, Resuelto

    public bool IsAnonymous { get; set; } = false;

    public int? GpsAccuracy { get; set; }

    [MaxLength(1000)]
    public string? InstitutionalNote { get; set; }

    [MaxLength(300)]
    public string? Photo { get; set; }

    [MaxLength(50)]
    public string? TicketCode { get; set; }

    [MaxLength(150)]
    public string? ReporterName { get; set; }

    [MaxLength(500)]
    public string? Video { get; set; }

    public int Votes { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relaciones de navegación
    public List<IncidentComment> Comments { get; set; } = new();
    public List<IncidentPhoto> Photos { get; set; } = new();
}
