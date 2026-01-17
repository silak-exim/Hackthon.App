namespace FoundryDataUploader.Domain.Entities;

/// <summary>
/// Represents an uploaded document entity
/// </summary>
public class Document
{
    public string Id { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string FilePath { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long Size { get; private set; }
    public DateTime UploadedAt { get; private set; }
    public string? TextContent { get; private set; }

    private Document() { } // For EF Core or serialization

    public static Document Create(
        string title,
        string fileName,
        string filePath,
        string contentType,
        long size,
        string? textContent = null)
    {
        return new Document
        {
            Id = Guid.NewGuid().ToString(),
            Title = title,
            FileName = fileName,
            FilePath = filePath,
            ContentType = contentType,
            Size = size,
            UploadedAt = DateTime.UtcNow,
            TextContent = textContent
        };
    }

    public void UpdateTextContent(string textContent)
    {
        TextContent = textContent;
    }
}
