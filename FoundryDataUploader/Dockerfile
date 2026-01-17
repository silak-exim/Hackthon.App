# Use .NET 10.0 SDK for build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Install ca-certificates package
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy and install corporate proxy CA certificate (if exists)
COPY certs/proxy-ca.crt /usr/local/share/ca-certificates/proxy-ca.crt
RUN update-ca-certificates || true

#Remark เพื่อใช้กับ Zscaler ต้องเพิ่ม Certificate ลงไปใน Container ด้วย
COPY ZscalerRootCertificate-2048-SHA256.crt /usr/local/share/ca-certificates/ZscalerRootCertificate-2048-SHA256.crt
RUN update-ca-certificates

# Configure NuGet to skip SSL verification (for corporate proxy/firewall issues)
ENV DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER=0
ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false
ENV SSL_CERT_DIR=/etc/ssl/certs

# Create NuGet config to handle SSL issues
RUN mkdir -p ~/.nuget/NuGet && \
    echo '<?xml version="1.0" encoding="utf-8"?>\n\
<configuration>\n\
  <packageSources>\n\
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />\n\
  </packageSources>\n\
  <config>\n\
    <add key="signatureValidationMode" value="accept" />\n\
  </config>\n\
</configuration>' > ~/.nuget/NuGet/NuGet.Config

# Copy csproj and restore dependencies
COPY ["FoundryDataUploader.csproj", "./"]
RUN dotnet restore "FoundryDataUploader.csproj" --disable-parallel

# Copy everything else and build
COPY . .
RUN dotnet build "FoundryDataUploader.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "FoundryDataUploader.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Generate self-signed certificate stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS cert-generator
WORKDIR /certs

# Generate self-signed certificate for HTTPS
RUN dotnet dev-certs https -ep /certs/aspnetapp.pfx -p DevPassword123! && \
    dotnet dev-certs https --trust || true

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Create directories
RUN mkdir -p /app/Uploads /app/certs

# Copy published app
COPY --from=publish /app/publish .

# Copy certificate from cert-generator stage
COPY --from=cert-generator /certs/aspnetapp.pfx /app/certs/

# Expose ports (HTTP and HTTPS)
EXPOSE 8080
EXPOSE 8081

# Set environment variables for HTTPS
ENV ASPNETCORE_URLS=https://+:8081;http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/app/certs/aspnetapp.pfx
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=DevPassword123!

ENTRYPOINT ["dotnet", "FoundryDataUploader.dll"]
