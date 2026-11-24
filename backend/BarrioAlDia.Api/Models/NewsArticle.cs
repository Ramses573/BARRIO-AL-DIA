using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarrioAlDia.Api.Models;

[Table("NewsArticles")]
public class NewsArticle
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Summary { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = "Comunitario"; // "Vial", "Agua y Alcantarillado", "Alerta CNE", "Electricidad", "Comunitario"

    [Required]
    [MaxLength(100)]
    public string Canton { get; set; } = "Cartago"; // "Cartago", "Turrialba", "Tarrazú", "General"

    [MaxLength(100)]
    public string District { get; set; } = "Centro";

    [Required]
    [MaxLength(150)]
    public string AuthorEntity { get; set; } = "Municipalidad de Cartago";

    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

    public bool IsUrgent { get; set; } = false;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(300)]
    public string? OfficialLink { get; set; }
}
