# Health Check Documentation

## Overview

The FoundryDataUploader API includes comprehensive health check endpoints to monitor the application's health status, suitable for Docker containers, Kubernetes, and monitoring tools.

## Health Check Endpoints

### 1. `/health` - Detailed Health Check
**Purpose**: Provides detailed health information about all registered health checks.

**Response Format**: JSON with detailed information from HealthChecks UI Client

**Status Codes**:
- `200 OK` - Service is healthy or degraded
- `503 Service Unavailable` - Service is unhealthy

**Example Request**:
```bash
curl http://localhost:5000/health
```

**Example Response**:
```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.0123456",
  "entries": {
    "foundry_api": {
      "status": "Healthy",
      "description": "Foundry API is healthy",
      "duration": "00:00:00.0012345",
      "data": {
        "service": "FoundryService",
        "status": "Connected",
        "timestamp": "2026-01-14T10:30:00Z"
      },
      "tags": ["api", "foundry"]
    },
    "storage": {
      "status": "Healthy",
      "description": "Storage is accessible and writable",
      "duration": "00:00:00.0009876",
      "data": {
        "uploadPath": "/app/Uploads",
        "status": "Writable",
        "timestamp": "2026-01-14T10:30:00Z"
      },
      "tags": ["storage"]
    }
  }
}
```

### 2. `/health/ready` - Readiness Probe
**Purpose**: Simplified readiness check for load balancers and orchestrators.

**Response Format**: Simple JSON with basic status

**Status Codes**:
- `200 OK` - Service is ready to accept traffic
- `503 Service Unavailable` - Service is not ready

**Example Request**:
```bash
curl http://localhost:5000/health/ready
```

**Example Response**:
```json
{
  "status": "Healthy",
  "timestamp": "2026-01-14T10:30:00Z",
  "totalDuration": 12.5
}
```

### 3. `/health/live` - Liveness Probe
**Purpose**: Simple liveness check for container orchestrators (Docker, Kubernetes).

**Response Format**: Empty response with status code

**Status Codes**:
- `200 OK` - Service is alive

**Example Request**:
```bash
curl http://localhost:5000/health/live
```

**Note**: This endpoint doesn't run any health checks, it just returns 200 OK if the application is running.

## Health Check Components

### FoundryApiHealthCheck
Monitors the Foundry API service connection and availability.

**Checks**:
- Service instantiation
- Service connectivity

**Tags**: `api`, `foundry`

### StorageHealthCheck
Monitors the file storage system (Uploads directory).

**Checks**:
- Directory existence
- Write permissions
- Disk access

**Tags**: `storage`

## Docker Integration

### Docker Compose Configuration

The health check is configured in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health/live"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Parameters**:
- `interval`: Check every 30 seconds
- `timeout`: Health check must complete within 10 seconds
- `retries`: Service is marked unhealthy after 3 consecutive failures
- `start_period`: Grace period of 40 seconds for application startup

### Check Container Health

```bash
# View container health status
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' foundry-data-uploader | jq

# Manual health check
docker exec foundry-data-uploader curl -f http://localhost:8080/health/live
```

## Kubernetes Integration

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foundry-data-uploader
spec:
  template:
    spec:
      containers:
      - name: api
        image: foundrydatauploader:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 40
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
```

## Monitoring Integration

### Prometheus Integration

The health check endpoints can be monitored with Prometheus using blackbox exporter:

```yaml
- job_name: 'foundry-api-health'
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
    - targets:
      - http://foundry-data-uploader:8080/health
  relational_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: blackbox-exporter:9115
```

### Application Insights

Health check results are automatically logged to Application Insights (if configured) via the built-in logging infrastructure.

## Load Balancer Integration

### Azure Application Gateway

Configure health probes in Azure Application Gateway:

**Settings**:
- Protocol: HTTP
- Host: (leave empty to use backend pool address)
- Path: `/health/ready`
- Interval: 30 seconds
- Timeout: 30 seconds
- Unhealthy threshold: 3

### AWS Application Load Balancer

Configure target group health checks:

**Settings**:
- Protocol: HTTP
- Path: `/health/ready`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

## Troubleshooting

### Common Issues

1. **Health check always returns unhealthy**
   - Check application logs for errors
   - Verify all dependencies are available
   - Check storage permissions

2. **Storage health check fails**
   - Verify `Uploads` directory permissions
   - Check disk space availability
   - Ensure write permissions for the application user

3. **Foundry API health check fails**
   - Verify Foundry service configuration
   - Check Azure credentials and endpoints
   - Review application logs for connection errors

### Debugging

Enable detailed health check logging in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.Extensions.Diagnostics.HealthChecks": "Debug"
    }
  }
}
```

## Testing

### Manual Testing

```bash
# Test main health endpoint
curl -v http://localhost:5000/health | jq

# Test readiness
curl -v http://localhost:5000/health/ready | jq

# Test liveness
curl -v http://localhost:5000/health/live

# Test with authentication (if required)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/health | jq
```

### Automated Testing

Use these endpoints in CI/CD pipelines:

```bash
#!/bin/bash
# Wait for service to be healthy
for i in {1..30}; do
  if curl -f http://localhost:5000/health/live; then
    echo "Service is healthy"
    exit 0
  fi
  echo "Waiting for service... attempt $i"
  sleep 2
done
echo "Service failed to become healthy"
exit 1
```

## Best Practices

1. **Use appropriate endpoints**:
   - `/health/live` for liveness probes
   - `/health/ready` for readiness probes
   - `/health` for detailed monitoring

2. **Configure timeouts appropriately**:
   - Liveness: Longer intervals, more retries
   - Readiness: Shorter intervals, fewer retries

3. **Monitor health check performance**:
   - Keep checks lightweight
   - Avoid external dependencies in liveness probes

4. **Handle startup delays**:
   - Use `start_period` in Docker
   - Use `initialDelaySeconds` in Kubernetes

## Additional Resources

- [ASP.NET Core Health Checks](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks)
- [Docker Health Check](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

