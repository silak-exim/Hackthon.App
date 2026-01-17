namespace FoundryDataUploader.Domain.Interfaces;

/// <summary>
/// Interface for text extraction from various file formats (Single Responsibility)
/// </summary>
public interface ITextExtractorService
{
    Task<string> ExtractTextAsync(string filePath, string contentType, CancellationToken cancellationToken = default);
    bool CanExtract(string contentType, string fileName);
}
