#!/bin/bash
# Script to generate self-signed SSL certificate for development

CERT_DIR="./certs"
CERT_NAME="aspnetapp"
CERT_PASSWORD="DevPassword123!"

# Create certs directory if not exists
mkdir -p $CERT_DIR

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $CERT_DIR/$CERT_NAME.key \
  -out $CERT_DIR/$CERT_NAME.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=EXIM Bank/OU=IT/CN=localhost"

# Create PFX file for ASP.NET Core
openssl pkcs12 -export \
  -out $CERT_DIR/$CERT_NAME.pfx \
  -inkey $CERT_DIR/$CERT_NAME.key \
  -in $CERT_DIR/$CERT_NAME.crt \
  -passout pass:$CERT_PASSWORD

echo "Certificates generated in $CERT_DIR/"
echo "PFX Password: $CERT_PASSWORD"
