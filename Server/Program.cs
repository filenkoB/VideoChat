using Server;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR(opt => {
    opt.MaximumReceiveMessageSize = null;
    opt.EnableDetailedErrors = true;
});

var app = builder.Build();
app.UseWebSockets();
app.UseCors(builder => {
    builder.AllowAnyHeader()
        .AllowAnyMethod()
        .WithOrigins("http://localhost:4200")
        .AllowCredentials();
});
app.MapHub<ConferenceHub>("/conference");
app.Run();