using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.DTOs;

public class NewsDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Canton { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string AuthorEntity { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public bool IsUrgent { get; set; }
    public string? ImageUrl { get; set; }
    public string? OfficialLink { get; set; }
}

public class CreateNewsDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Summary { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = "Comunitario";

    [Required]
    [MaxLength(100)]
    public string Canton { get; set; } = "Cartago";

    [MaxLength(100)]
    public string District { get; set; } = "Centro";

    [Required]
    [MaxLength(150)]
    public string AuthorEntity { get; set; } = "Municipalidad de Cartago";

    public bool IsUrgent { get; set; } = false;

    public string? ImageUrl { get; set; }
    public string? OfficialLink { get; set; }
}
