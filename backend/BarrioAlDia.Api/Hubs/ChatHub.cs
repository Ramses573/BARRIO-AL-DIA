using Microsoft.AspNetCore.SignalR;
using BarrioAlDia.Api.DTOs;

namespace BarrioAlDia.Api.Hubs;

public class ChatHub : Hub
{
    // Unirse al canal de un ticket específico
    public async Task JoinTicketChat(string ticketCode)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ticketCode);
    }

    // Salir del canal del ticket
    public async Task LeaveTicketChat(string ticketCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketCode);
    }

    // Enviar mensaje o audio en tiempo real al grupo del ticket
    public async Task SendMessage(ChatMessageDto message)
    {
        await Clients.Group(message.TicketCode).SendAsync("ReceiveMessage", message);
    }
}
