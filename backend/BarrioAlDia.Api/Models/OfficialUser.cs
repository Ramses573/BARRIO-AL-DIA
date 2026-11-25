using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.Models;

public class OfficialUser
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Role { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Entity { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string BadgeNumber { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? AvatarUrl { get; set; }

    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(60)]
    public string Canton { get; set; } = string.Empty;

    [MaxLength(80)]
    public string District { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Neighborhood { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Bio { get; set; } = string.Empty;

    [MaxLength(100)]
    public string WorkSchedule { get; set; } = string.Empty;

    [MaxLength(120)]
    public string EmergencyContact { get; set; } = string.Empty;

    [MaxLength(30)]
    public string UserType { get; set; } = "Official";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
