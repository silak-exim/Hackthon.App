# PowerShell script to generate self-signed SSL certificate for development

$CertDir = ".\certs"
$CertName = "aspnetapp"
$CertPassword = "DevPassword123!"

# Create certs directory if not exists
if (!(Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir -Force
}

# Generate self-signed certificate using dotnet dev-certs
Write-Host "Generating self-signed certificate..." -ForegroundColor Green

# Method 1: Using dotnet dev-certs (recommended for .NET)
dotnet dev-certs https -ep "$CertDir\$CertName.pfx" -p $CertPassword --trust

# Method 2: Using PowerShell (alternative)
# $cert = New-SelfSignedCertificate `
#     -DnsName "localhost" `
#     -CertStoreLocation "Cert:\CurrentUser\My" `
#     -NotAfter (Get-Date).AddYears(1) `
#     -FriendlyName "EXIM Bank Dev Cert" `
#     -KeyUsage DigitalSignature, KeyEncipherment `
#     -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# $securePassword = ConvertTo-SecureString -String $CertPassword -Force -AsPlainText
# Export-PfxCertificate -Cert $cert -FilePath "$CertDir\$CertName.pfx" -Password $securePassword

Write-Host "Certificate generated in $CertDir\" -ForegroundColor Green
Write-Host "PFX Password: $CertPassword" -ForegroundColor Yellow
