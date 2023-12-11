using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Concurrent;
using System.Text.Json.Serialization;

namespace Server
{
    [Serializable]
    public class ParticipantData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }
        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class ConferenceHub : Hub
    {
        private object _locker = new object();
        private static List<ParticipantData> _participants = new List<ParticipantData>();
        private static int _counter = 0;

        public async Task Signal(string userIdSrc, string userIdDest, string message) {
            await Clients.Client(userIdDest).SendAsync("Signal", new { userIdSrc, userIdDest, message });
        }

        public async Task Connect(ParticipantData participant) {
            participant.Id = Context.ConnectionId;
            lock (_locker) {
                _participants.Add(participant);
            }
            await Clients.Caller.SendAsync("Connected", Context.ConnectionId);
        }

        public async Task OnNewConnection(ParticipantData participant) {
            await Clients.Others.SendAsync("OnNewConnection", participant);
        }

        public async Task<IEnumerable<ParticipantData>> GetParticipants() {
            return _participants.Where(p => p.Id != Context.ConnectionId);
        }

        public async Task ToggleMicrophone(bool isActive) {
            await Clients.Others.SendAsync("OnToggleMicrophone", new { isActive, userId = Context.ConnectionId });
        }

        public async Task ToggleVideo(bool isActive) {
            await Clients.Others.SendAsync("OnToggleVideo", new { isActive, userId = Context.ConnectionId });
        }

        public async Task ToggleSharing(bool isActive) {
            await Clients.Others.SendAsync("OnToggleSharing", new { isActive, userId = Context.ConnectionId });
        }

        public async Task Leave() {
            ParticipantData participant = null;
            lock (_locker) {
                participant = _participants.First(p => p.Id == Context.ConnectionId);
                _participants.Remove(participant);
            }
            await Clients.Others.SendAsync("OnRemoveConnection", participant);
        }

        public override async Task OnDisconnectedAsync(Exception? exception) {
            ParticipantData participant = null;
            lock (_locker) {
                participant = _participants.First(p => p.Id == Context.ConnectionId);
                _participants.Remove(participant);
            }
            await Clients.Others.SendAsync("OnRemoveConnection", participant);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
