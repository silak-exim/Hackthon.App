using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;

namespace FoundryDataUploader.Models;

public class KnowledgeDoc
{
    [SimpleField(IsKey = true)]
    public string Id { get; set; } = string.Empty;

    [SearchableField(AnalyzerName = LexicalAnalyzerName.Values.EnLucene)]
    public string Title { get; set; } = string.Empty;

    [SearchableField(AnalyzerName = LexicalAnalyzerName.Values.EnLucene)]
    public string Content { get; set; } = string.Empty;

    [SimpleField(IsFilterable = true)]
    public string FileName { get; set; } = string.Empty;

    [SimpleField(IsFilterable = true, IsSortable = true)]
    public DateTime UploadedAt { get; set; }
}
