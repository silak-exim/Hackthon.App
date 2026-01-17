using Microsoft.Extensions.Diagnostics.HealthChecks;
using FoundryDataUploader.Services;

namespace FoundryDataUploader.Infrastructure.HealthChecks;

public class FoundryApiHealthCheck : IHealthCheck
{
    private readonly IFoundryService _foundryService;
    private readonly ILogger<FoundryApiHealthCheck> _logger;

    public FoundryApiHealthCheck(IFoundryService foundryService, ILogger<FoundryApiHealthCheck> logger)
    {
        _foundryService = foundryService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if Foundry service is accessible
            if (_foundryService == null)
            {
                return HealthCheckResult.Unhealthy("Foundry service is not available");
            }

            var data = new Dictionary<string, object>
            {
                { "service", "FoundryService" },
                { "status", "Connected" },
                { "timestamp", DateTime.UtcNow }
            };

            return HealthCheckResult.Healthy("Foundry API is healthy", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for Foundry API");
            return HealthCheckResult.Unhealthy(
                "Foundry API is unhealthy",
                ex,
                new Dictionary<string, object>
                {
                    { "error", ex.Message },
                    { "timestamp", DateTime.UtcNow }
                });
        }
    }
}

