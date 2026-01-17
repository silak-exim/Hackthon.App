using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Domain.Entities;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Infrastructure.Repositories;

/// <summary>
/// In-memory document repository implementation
/// For production, replace with database repository
/// </summary>
public class InMemoryDocumentRepository : IDocumentRepository
{
    private readonly ConcurrentDictionary<string, Document> _documents = new();
    private readonly ILogger<InMemoryDocumentRepository> _logger;

    public InMemoryDocumentRepository(ILogger<InMemoryDocumentRepository> logger)
    {
        _logger = logger;
    }

    public Task<Document?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        _documents.TryGetValue(id, out var document);
        return Task.FromResult(document);
    }

    public Task<IEnumerable<Document>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IEnumerable<Document>>(_documents.Values.ToList());
    }

    public Task<Document> AddAsync(Document document, CancellationToken cancellationToken = default)
    {
        _documents.TryAdd(document.Id, document);
        _logger.LogInformation("Document added to repository: {Id}", document.Id);
        return Task.FromResult(document);
    }

    public Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = _documents.TryRemove(id, out _);
        if (result)
            _logger.LogInformation("Document removed from repository: {Id}", id);
        return Task.FromResult(result);
    }

    public Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_documents.ContainsKey(id));
    }
}
