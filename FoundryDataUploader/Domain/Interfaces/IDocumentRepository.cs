using FoundryDataUploader.Domain.Entities;

namespace FoundryDataUploader.Domain.Interfaces;

/// <summary>
/// Repository interface for document operations (Repository Pattern)
/// </summary>
public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Document>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Document> AddAsync(Document document, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string id, CancellationToken cancellationToken = default);
}
