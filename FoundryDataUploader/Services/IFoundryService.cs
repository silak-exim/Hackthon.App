namespace FoundryDataUploader.Services;

public interface IFoundryService
{
    Task<string> AskAsync(string question, string? context = null);
}
