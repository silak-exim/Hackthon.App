# FoundryDataUploader - Docker Deployment Guide

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- Azure credentials and API keys

## Configuration

### 1. Environment Variables Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` file and provide your Azure credentials:
- `AZURE_SEARCH_API_KEY`: Your Azure Search API Key
- `AZURE_AI_FOUNDRY_ENDPOINT`: Your Azure AI Foundry Endpoint
- `AZURE_AI_FOUNDRY_API_KEY`: Your Azure AI Foundry API Key

### 2. Security Note

⚠️ **Important**: Never commit the `.env` file to version control. It contains sensitive credentials.

## Building and Running

### Using Docker Compose (Recommended)

1. Build and start the container:
```bash
docker-compose up -d --build
```

2. Check logs:
```bash
docker-compose logs -f
```

3. Stop the container:
```bash
docker-compose down
```

### Using Docker CLI

1. Build the image:
```bash
docker build -t foundry-data-uploader:latest .
```

2. Run the container:
```bash
docker run -d \
  -p 5000:8080 \
  -v uploads-data:/app/Uploads \
  --name foundry-data-uploader \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e AzureSearch__ApiKey=your_api_key_here \
  foundry-data-uploader:latest
```

3. Stop the container:
```bash
docker stop foundry-data-uploader
docker rm foundry-data-uploader
```

## Accessing the Application

- **API**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger
- **Health Check**: http://localhost:5000/health (if implemented)

## Configuration Options

### Port Mapping

Default ports:
- External: 5000 (HTTP)
- Internal: 8080

To change the external port, modify `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:8080"
```

### Volume Persistence

Uploaded files are stored in a Docker volume `uploads-data`. To use a local directory instead:

```yaml
volumes:
  - ./Uploads:/app/Uploads
```

## Production Deployment

### Azure Container Instances (ACI)

1. Login to Azure:
```bash
az login
```

2. Create a resource group:
```bash
az group create --name foundry-rg --location eastus
```

3. Create a container registry:
```bash
az acr create --resource-group foundry-rg --name foundryacr --sku Basic
```

4. Build and push image:
```bash
az acr build --registry foundryacr --image foundry-data-uploader:v1 .
```

5. Deploy to ACI:
```bash
az container create \
  --resource-group foundry-rg \
  --name foundry-data-uploader \
  --image foundryacr.azurecr.io/foundry-data-uploader:v1 \
  --dns-name-label foundry-uploader \
  --ports 8080 \
  --environment-variables \
    ASPNETCORE_ENVIRONMENT=Production \
    AzureSearch__ApiKey=YOUR_KEY
```

### Azure App Service (Container)

1. Create App Service plan:
```bash
az appservice plan create \
  --name foundry-plan \
  --resource-group foundry-rg \
  --is-linux \
  --sku B1
```

2. Create web app:
```bash
az webapp create \
  --resource-group foundry-rg \
  --plan foundry-plan \
  --name foundry-data-uploader \
  --deployment-container-image-name foundryacr.azurecr.io/foundry-data-uploader:v1
```

3. Configure app settings:
```bash
az webapp config appsettings set \
  --resource-group foundry-rg \
  --name foundry-data-uploader \
  --settings \
    AzureSearch__ApiKey=YOUR_KEY \
    AzureSearch__Endpoint=YOUR_ENDPOINT
```

## Troubleshooting

### Check container logs
```bash
docker logs foundry-data-uploader
```

### Access container shell
```bash
docker exec -it foundry-data-uploader /bin/bash
```

### Rebuild without cache
```bash
docker-compose build --no-cache
```

### Check container status
```bash
docker ps -a
```

## Health Monitoring

Monitor your container:
```bash
docker stats foundry-data-uploader
```

## Security Best Practices

1. Use Azure Key Vault for secrets in production
2. Enable HTTPS/TLS
3. Use managed identities when deploying to Azure
4. Regularly update base images
5. Scan images for vulnerabilities:
```bash
docker scan foundry-data-uploader:latest
```

## Updating the Application

1. Pull latest code
2. Rebuild and restart:
```bash
docker-compose up -d --build
```

## Backup and Restore

### Backup uploaded files
```bash
docker run --rm --volumes-from foundry-data-uploader \
  -v $(pwd):/backup \
  alpine tar cvf /backup/uploads-backup.tar /app/Uploads
```

### Restore uploaded files
```bash
docker run --rm --volumes-from foundry-data-uploader \
  -v $(pwd):/backup \
  alpine tar xvf /backup/uploads-backup.tar
```
