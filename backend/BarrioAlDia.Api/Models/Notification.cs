using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.Models;

public class Notification
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
    [MaxLength(250)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Date { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Time { get; set; } = string.Empty;

    [MaxLength(30)]
    public string RiskLevel { get; set; } = "RIESGO MEDIO"; // RIESGO BAJO, RIESGO MEDIO, RIESGO ALTO

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Recommendation { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "Reporte reciente";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
