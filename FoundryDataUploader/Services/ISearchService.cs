using FoundryDataUploader.Models;

namespace FoundryDataUploader.Services;

public interface ISearchService
{
    Task IndexDocumentAsync(KnowledgeDoc document);
    Task<List<SearchResult>> SearchAsync(string query);
    Task<List<DocumentInfo>> GetAllDocumentsAsync();
    Task DeleteDocumentAsync(string id);
}
