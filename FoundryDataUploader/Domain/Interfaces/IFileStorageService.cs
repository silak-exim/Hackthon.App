namespace FoundryDataUploader.Domain.Interfaces;

/// <summary>
/// Interface for file storage operations (Single Responsibility)
/// </summary>
public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string filePath, CancellationToken cancellationToken = default);
    Task<string> ReadTextContentAsync(string filePath, CancellationToken cancellationToken = default);
    bool FileExists(string filePath);
}
