using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Models;
using FoundryDataUploader.Models;

namespace FoundryDataUploader.Services;

public class SearchService : ISearchService
{
    private readonly SearchClient _searchClient;
    private readonly SearchIndexClient _indexClient;
    private readonly string _indexName;
    private readonly ILogger<SearchService> _logger;

    public SearchService(IConfiguration configuration, ILogger<SearchService> logger)
    {
        _logger = logger;

        var endpoint = configuration["AzureSearch:Endpoint"]
            ?? Environment.GetEnvironmentVariable("AZURE_SEARCH_ENDPOINT")
            ?? throw new InvalidOperationException("Azure Search endpoint not configured");

        var apiKey = configuration["AzureSearch:ApiKey"]
            ?? Environment.GetEnvironmentVariable("AZURE_SEARCH_API_KEY")
            ?? throw new InvalidOperationException("Azure Search API key not configured");

        _indexName = configuration["AzureSearch:IndexName"]
            ?? Environment.GetEnvironmentVariable("AZURE_SEARCH_INDEX_NAME")
            ?? "knowledgedocs";

        var credential = new AzureKeyCredential(apiKey);
        _indexClient = new SearchIndexClient(new Uri(endpoint), credential);
        _searchClient = _indexClient.GetSearchClient(_indexName);

        EnsureIndexExistsAsync().GetAwaiter().GetResult();
    }

    private async Task EnsureIndexExistsAsync()
    {
        try
        {
            var fieldBuilder = new FieldBuilder();
            var searchFields = fieldBuilder.Build(typeof(KnowledgeDoc));
            var definition = new SearchIndex(_indexName, searchFields);

            await _indexClient.CreateOrUpdateIndexAsync(definition);
            _logger.LogInformation("Search index '{IndexName}' created or updated", _indexName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating search index");
            throw;
        }
    }

    public async Task IndexDocumentAsync(KnowledgeDoc document)
    {
        var batch = IndexDocumentsBatch.Upload(new[] { document });
        await _searchClient.IndexDocumentsAsync(batch);
        _logger.LogInformation("Document '{Title}' indexed successfully", document.Title);
    }

    public async Task<List<SearchResult>> SearchAsync(string query)
    {
        var options = new SearchOptions
        {
            Size = 10,
            IncludeTotalCount = true,
            Select = { "Id", "Title", "Content", "FileName" }
        };

        var response = await _searchClient.SearchAsync<KnowledgeDoc>(query, options);
        var results = new List<SearchResult>();

        await foreach (var result in response.Value.GetResultsAsync())
        {
            var snippet = result.Document.Content.Length > 200
                ? result.Document.Content.Substring(0, 200) + "..."
                : result.Document.Content;

            results.Add(new SearchResult
            {
                Id = result.Document.Id,
                Title = result.Document.Title,
                Snippet = snippet,
                Score = result.Score ?? 0
            });
        }

        return results;
    }

    public async Task<List<DocumentInfo>> GetAllDocumentsAsync()
    {
        var options = new SearchOptions
        {
            Size = 100,
            Select = { "Id", "Title", "FileName" }
        };

        var response = await _searchClient.SearchAsync<KnowledgeDoc>("*", options);
        var documents = new List<DocumentInfo>();

        await foreach (var result in response.Value.GetResultsAsync())
        {
            documents.Add(new DocumentInfo
            {
                Id = result.Document.Id,
                Title = result.Document.Title,
                FileName = result.Document.FileName
            });
        }

        return documents;
    }

    public async Task DeleteDocumentAsync(string id)
    {
        var batch = IndexDocumentsBatch.Delete("Id", new[] { id });
        await _searchClient.IndexDocumentsAsync(batch);
        _logger.LogInformation("Document '{Id}' deleted successfully", id);
    }
}
