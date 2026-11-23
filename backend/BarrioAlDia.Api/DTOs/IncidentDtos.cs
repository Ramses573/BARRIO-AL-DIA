using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.DTOs;

public class CreateIncidentDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(60)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Location { get; set; } = string.Empty;

    public decimal Lat { get; set; }
    public decimal Lng { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Priority { get; set; } = "Media";

    public bool IsAnonymous { get; set; } = false;

    public int? GpsAccuracy { get; set; }

    public string? Photo { get; set; }

    public List<PhotoItemDto>? Photos { get; set; }
}

public class PhotoItemDto
{
    public string Name { get; set; } = string.Empty;
    public string Preview { get; set; } = string.Empty;
}

public class UpdateIncidentStatusDto
{
    [Required]
    public string Status { get; set; } = "Pendiente"; // Pendiente, En atención, Resuelto
    public string? InstitutionalNote { get; set; }
}

public class CreateCommentDto
{
    public string Author { get; set; } = "Vecino anónimo";

    [Required]
    public string Text { get; set; } = string.Empty;

    public string? Photo { get; set; }
}

public class VoteIncidentDto
{
    public bool Increment { get; set; } = true;
}
