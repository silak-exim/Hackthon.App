namespace FoundryDataUploader.Models;

// Request models
public class AskRequest
{
    public string Question { get; set; } = string.Empty;
    public string? Context { get; set; }
}

public class SummarizeRequest
{
    public string SummaryType { get; set; } = "general"; // general, executive, financial, legal, trade
}

public class AnalyzeRequest
{
    public string Content { get; set; } = string.Empty;
}

// Response models
public class AskResponse
{
    public string Answer { get; set; } = string.Empty;
    public bool Success { get; set; }
}

public class UploadResponse
{
    public bool Success { get; set; }
    public List<DocumentInfo> Documents { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class DocumentInfo
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public string? ContentType { get; set; }
    public long Size { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? TextContent { get; set; }
}

public class SummarizeResponse
{
    public bool Success { get; set; }
    public string DocumentId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string SummaryType { get; set; } = string.Empty;
}

public class AnalyzeResponse
{
    public bool Success { get; set; }
    public string Analysis { get; set; } = string.Empty;
}

public class SearchResponse
{
    public bool Success { get; set; }
    public List<SearchResult> Results { get; set; } = new();
    public string? Error { get; set; }
}

public class SearchResult
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public double Score { get; set; }
}
