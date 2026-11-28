using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BarrioAlDia.Api.Data;
using BarrioAlDia.Api.DTOs;

namespace BarrioAlDia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private static readonly PasswordHasher<Models.OfficialUser> _passwordHasher = new();
    private readonly BarrioDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(BarrioDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Usuario y contraseña requeridos." });
        }

        var username = dto.Username.Trim().ToLower();

        var official = await _context.OfficialUsers
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username || u.Email.ToLower() == username);

        if (official == null || !VerifyPassword(official, dto.Password, out var needsRehash))
        {
            return Unauthorized(new { message = "Credenciales institucionales incorrectas." });
        }

        if (needsRehash)
        {
            official.PasswordHash = _passwordHasher.HashPassword(official, dto.Password);
            await _context.SaveChangesAsync();
        }

        // Generar Token JWT
        var token = GenerateJwtToken(official);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Official = MapToDto(official)
        });
    }

    // PUT: api/auth/profile
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var username = dto.Username?.Trim().ToLower();
        var user = await _context.OfficialUsers.FirstOrDefaultAsync(u =>
            (dto.Id.HasValue && u.Id == dto.Id.Value) ||
            (!string.IsNullOrEmpty(username) && u.Username.ToLower() == username));

        if (user == null)
        {
            if (string.IsNullOrEmpty(username))
            {
                return NotFound(new { message = "Usuario no encontrado en la base de datos." });
            }

            // Crear perfil comunitario o de funcionario si aún no existe en SQL Server
            user = new Models.OfficialUser
            {
                Username = username,
                FullName = string.IsNullOrWhiteSpace(dto.FullName) ? username : dto.FullName.Trim(),
                Role = string.IsNullOrWhiteSpace(dto.Role) ? "Vecino Comunitario" : dto.Role.Trim(),
                Entity = string.IsNullOrWhiteSpace(dto.Entity) ? "Comunidad Barrio al Día" : dto.Entity.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? $"{username}@comunidad.cr" : dto.Email.Trim(),
                BadgeNumber = string.IsNullOrWhiteSpace(dto.BadgeNumber) ? $"VEC-{DateTime.UtcNow.Ticks % 10000}" : dto.BadgeNumber.Trim(),
                PasswordHash = string.Empty,
                UserType = string.IsNullOrWhiteSpace(dto.UserType) ? "Citizen" : dto.UserType.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                string.IsNullOrWhiteSpace(dto.Password) ? Guid.NewGuid().ToString("N") : dto.Password
            );
            _context.OfficialUsers.Add(user);
        }

        if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Role)) user.Role = dto.Role.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Entity)) user.Entity = dto.Entity.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BadgeNumber)) user.BadgeNumber = dto.BadgeNumber.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Password)) user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl.Trim();
        if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber.Trim();
        if (dto.Canton != null) user.Canton = dto.Canton.Trim();
        if (dto.District != null) user.District = dto.District.Trim();
        if (dto.Neighborhood != null) user.Neighborhood = dto.Neighborhood.Trim();
        if (dto.Bio != null) user.Bio = dto.Bio.Trim();
        if (dto.WorkSchedule != null) user.WorkSchedule = dto.WorkSchedule.Trim();
        if (dto.EmergencyContact != null) user.EmergencyContact = dto.EmergencyContact.Trim();
        if (!string.IsNullOrWhiteSpace(dto.UserType)) user.UserType = dto.UserType.Trim();

        await _context.SaveChangesAsync();

        return Ok(MapToDto(user));
    }

    // POST: api/auth/upload-avatar
    [HttpPost("upload-avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Imagen no provista o vacía." });
        }

        var avatarsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars");
        if (!Directory.Exists(avatarsDir))
        {
            Directory.CreateDirectory(avatarsDir);
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";
        var fileName = $"avatar_{DateTime.UtcNow.Ticks}_{Guid.NewGuid().ToString()[..6]}{ext}";
        var filePath = Path.Combine(avatarsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new
        {
            avatarUrl = $"/avatars/{fileName}",
            fileName
        });
    }

    // GET: api/auth/officials
    [HttpGet("officials")]
    public async Task<IActionResult> GetOfficials()
    {
        var list = await _context.OfficialUsers
            .Where(o => o.IsActive)
            .ToListAsync();

        return Ok(list.Select(MapToDto).ToList());
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterOfficialDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Nombre de usuario y contraseña requeridos." });
        }

        var username = dto.Username.Trim().ToLower();

        if (await _context.OfficialUsers.AnyAsync(u => u.Username.ToLower() == username))
        {
            return Conflict(new { message = $"El usuario '{username}' ya se encuentra registrado." });
        }

        var official = new Models.OfficialUser
        {
            Username = username,
            FullName = string.IsNullOrWhiteSpace(dto.FullName) ? username : dto.FullName.Trim(),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Administrador Municipal" : dto.Role.Trim(),
            Entity = string.IsNullOrWhiteSpace(dto.Entity) ? "Municipalidad de Cartago" : dto.Entity.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? $"{username}@muni.go.cr" : dto.Email.Trim(),
            BadgeNumber = string.IsNullOrWhiteSpace(dto.BadgeNumber) ? $"ADM-{DateTime.UtcNow.Ticks % 10000}" : dto.BadgeNumber.Trim(),
            AvatarUrl = dto.AvatarUrl?.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            Canton = dto.Canton?.Trim() ?? string.Empty,
            District = dto.District?.Trim() ?? string.Empty,
            Neighborhood = dto.Neighborhood?.Trim() ?? string.Empty,
            Bio = dto.Bio?.Trim() ?? string.Empty,
            WorkSchedule = dto.WorkSchedule?.Trim() ?? string.Empty,
            EmergencyContact = dto.EmergencyContact?.Trim() ?? string.Empty,
            UserType = string.IsNullOrWhiteSpace(dto.UserType) ? "Official" : dto.UserType.Trim(),
            PasswordHash = string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        official.PasswordHash = _passwordHasher.HashPassword(official, dto.Password);

        _context.OfficialUsers.Add(official);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(official);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Official = MapToDto(official)
        });
    }

    private static OfficialDto MapToDto(Models.OfficialUser u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        FullName = u.FullName,
        Role = u.Role,
        Entity = u.Entity,
        Email = u.Email,
        BadgeNumber = u.BadgeNumber,
        AvatarUrl = u.AvatarUrl,
        PhoneNumber = u.PhoneNumber,
        Canton = u.Canton,
        District = u.District,
        Neighborhood = u.Neighborhood,
        Bio = u.Bio,
        WorkSchedule = u.WorkSchedule,
        EmergencyContact = u.EmergencyContact,
        UserType = u.UserType
    };

    private static bool VerifyPassword(Models.OfficialUser official, string password, out bool needsRehash)
    {
        needsRehash = false;
        if (string.IsNullOrEmpty(official.PasswordHash)) return false;

        if (official.PasswordHash.StartsWith("AQAAAA", StringComparison.Ordinal))
        {
            var result = _passwordHasher.VerifyHashedPassword(official, official.PasswordHash, password);
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                needsRehash = true;
                return true;
            }
            return result == PasswordVerificationResult.Success;
        }

        if (official.PasswordHash == password)
        {
            needsRehash = true;
            return true;
        }
        return false;
    }

    private string GenerateJwtToken(Models.OfficialUser official)
    {
        var key = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key no configurado.");
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, official.Username),
            new Claim(JwtRegisteredClaimNames.Email, official.Email),
            new Claim("role", official.Role),
            new Claim("entity", official.Entity),
            new Claim("fullName", official.FullName),
            new Claim("badge", official.BadgeNumber)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "BarrioAlDiaApi",
            audience: _config["Jwt:Audience"] ?? "BarrioAlDiaClients",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
