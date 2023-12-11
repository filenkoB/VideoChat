FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ./Server.csproj .
RUN dotnet restore ./Server.csproj
COPY . .
RUN dotnet build Server.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS publish
WORKDIR /app
COPY --from=build /app .

EXPOSE 5555
EXPOSE 80

ENV ASPNETCORE_URLS=http://+:5555

ENTRYPOINT [ "dotnet", "Server.dll" ]