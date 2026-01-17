using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FoundryDataUploader.Infrastructure.HealthChecks;

public class StorageHealthCheck : IHealthCheck
{
    private readonly string _uploadPath;
    private readonly ILogger<StorageHealthCheck> _logger;

    public StorageHealthCheck(string uploadPath, ILogger<StorageHealthCheck> logger)
    {
        _uploadPath = uploadPath;
        _logger = logger;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if upload directory exists and is writable
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }

            // Test write access
            var testFile = Path.Combine(_uploadPath, $"health_check_{Guid.NewGuid()}.tmp");
            File.WriteAllText(testFile, "health check test");
            File.Delete(testFile);

            var data = new Dictionary<string, object>
            {
                { "uploadPath", _uploadPath },
                { "status", "Writable" },
                { "timestamp", DateTime.UtcNow }
            };

            return Task.FromResult(HealthCheckResult.Healthy("Storage is accessible and writable", data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Storage health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "Storage is not accessible",
                ex,
                new Dictionary<string, object>
                {
                    { "uploadPath", _uploadPath },
                    { "error", ex.Message },
                    { "timestamp", DateTime.UtcNow }
                }));
        }
    }
}
