using System.ComponentModel.DataAnnotations;

namespace BarrioAlDia.Api.DTOs;

public class LoginDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public OfficialDto Official { get; set; } = new();
}

public class OfficialDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string BadgeNumber { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Canton { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string WorkSchedule { get; set; } = string.Empty;
    public string EmergencyContact { get; set; } = string.Empty;
    public string UserType { get; set; } = "Official";
}

public class RegisterOfficialDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string BadgeNumber { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Canton { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string WorkSchedule { get; set; } = string.Empty;
    public string EmergencyContact { get; set; } = string.Empty;
    public string UserType { get; set; } = "Official";
}

public class UpdateProfileDto
{
    public int? Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public string? Entity { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? BadgeNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Canton { get; set; }
    public string? District { get; set; }
    public string? Neighborhood { get; set; }
    public string? Bio { get; set; }
    public string? WorkSchedule { get; set; }
    public string? EmergencyContact { get; set; }
    public string? UserType { get; set; }
}
