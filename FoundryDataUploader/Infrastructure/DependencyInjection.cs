using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Domain.Interfaces;
using FoundryDataUploader.Infrastructure.Repositories;
using FoundryDataUploader.Infrastructure.Services;

namespace FoundryDataUploader.Infrastructure;

/// <summary>
/// Dependency Injection configuration for Infrastructure layer
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string uploadPath)
    {
        // Register AI Agent Service
        services.AddSingleton<IAIAgentService, AzureFoundryAgentService>();

        // Register File Storage Service
        services.AddSingleton<IFileStorageService>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<LocalFileStorageService>>();
            return new LocalFileStorageService(uploadPath, logger);
        });

        // Register Text Extractor Service
        services.AddSingleton<ITextExtractorService, TextExtractorService>();

        // Register Document Repository (In-Memory for now)
        services.AddSingleton<IDocumentRepository, InMemoryDocumentRepository>();

        return services;
    }
}
