# ClientApp - Docker Deployment Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for local development)
- Docker Compose installed

## Quick Start

### Build and Run with Docker Compose

1. Build and start the container:
```bash
docker-compose up -d --build
```

2. Access the application:
   - **Frontend**: http://localhost:4200
   - **Health Check**: http://localhost:4200/health

3. View logs:
```bash
docker-compose logs -f client-app
```

4. Stop the container:
```bash
docker-compose down
```

## Configuration

### Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` to configure:
- `API_URL`: Backend API endpoint (default: http://localhost:5000)

### API Endpoint Configuration

The nginx configuration includes a proxy setup for API calls. Update the API endpoint in your Angular environment files:

**src/environments/environment.prod.ts**:
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:5000/api'  // or your backend URL
};
```

## Docker Commands

### Using Docker CLI

1. Build the image:
```bash
docker build -t foundry-client-app:latest .
```

2. Run the container:
```bash
docker run -d \
  -p 4200:80 \
  --name foundry-client-app \
  -e API_URL=http://localhost:5000 \
  foundry-client-app:latest
```

3. Stop and remove:
```bash
docker stop foundry-client-app
docker rm foundry-client-app
```

## Multi-Container Setup

To run both frontend and backend together:

```bash
# From ClientApp directory
docker-compose up -d --build
```

This will start:
- Frontend on port 4200
- Backend API on port 5000

### Separate Docker Compose Files

If you prefer to run them separately:

**Frontend only**:
```bash
docker-compose -f docker-compose.client.yml up -d
```

## Production Deployment

### Azure Container Instances (ACI)

1. Login to Azure:
```bash
az login
```

2. Create container registry (if not exists):
```bash
az acr create --resource-group foundry-rg --name foundryacr --sku Basic
```

3. Build and push image:
```bash
az acr build --registry foundryacr --image foundry-client-app:v1 .
```

4. Deploy to ACI:
```bash
az container create \
  --resource-group foundry-rg \
  --name foundry-client-app \
  --image foundryacr.azurecr.io/foundry-client-app:v1 \
  --dns-name-label foundry-client \
  --ports 80 \
  --environment-variables \
    API_URL=https://your-api-url.azurecontainerapps.io
```

### Azure Static Web Apps

For better performance with Angular, consider Azure Static Web Apps:

1. Install Azure Static Web Apps CLI:
```bash
npm install -g @azure/static-web-apps-cli
```

2. Build the app:
```bash
ng build --configuration production
```

3. Deploy:
```bash
swa deploy ./dist/client-app/browser \
  --app-name foundry-client-app \
  --resource-group foundry-rg
```

### Azure App Service (Container)

1. Create App Service plan:
```bash
az appservice plan create \
  --name foundry-client-plan \
  --resource-group foundry-rg \
  --is-linux \
  --sku B1
```

2. Create web app:
```bash
az webapp create \
  --resource-group foundry-rg \
  --plan foundry-client-plan \
  --name foundry-client-app \
  --deployment-container-image-name foundryacr.azurecr.io/foundry-client-app:v1
```

3. Configure app settings:
```bash
az webapp config appsettings set \
  --resource-group foundry-rg \
  --name foundry-client-app \
  --settings API_URL=https://your-api-url.azurewebsites.net
```

## Nginx Configuration

The default nginx configuration includes:
- Gzip compression
- Security headers
- Static asset caching
- Angular routing support
- API proxy (optional)
- Health check endpoint

To customize, edit [nginx.conf](nginx.conf).

## Troubleshooting

### Check container logs
```bash
docker logs foundry-client-app
```

### Access container shell
```bash
docker exec -it foundry-client-app /bin/sh
```

### Test nginx configuration
```bash
docker exec foundry-client-app nginx -t
```

### Rebuild without cache
```bash
docker-compose build --no-cache
```

### Check container health
```bash
docker inspect --format='{{.State.Health.Status}}' foundry-client-app
```

## Performance Optimization

### Build Optimization

The Dockerfile uses:
- Multi-stage builds to reduce image size
- Node Alpine for smaller base image
- Nginx Alpine for production
- Production build with optimizations

### Nginx Optimization

- Gzip compression enabled
- Static asset caching (1 year)
- Security headers
- Health check endpoint

## CORS Configuration

If you encounter CORS issues, ensure your backend API allows requests from your frontend domain:

```csharp
// Backend Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://your-domain.com")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

## Monitoring

### Container Stats
```bash
docker stats foundry-client-app
```

### Health Check
```bash
curl http://localhost:4200/health
```

### Access Logs
```bash
docker exec foundry-client-app tail -f /var/log/nginx/access.log
```

## Security Best Practices

1. Use HTTPS in production
2. Update base images regularly
3. Scan images for vulnerabilities:
```bash
docker scan foundry-client-app:latest
```
4. Use environment variables for configuration
5. Enable security headers (already configured in nginx.conf)
6. Implement Content Security Policy (CSP)

## Updating the Application

1. Pull latest code
2. Rebuild and restart:
```bash
docker-compose up -d --build
```

## Cleanup

Remove all containers and images:
```bash
docker-compose down --rmi all --volumes
```

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
