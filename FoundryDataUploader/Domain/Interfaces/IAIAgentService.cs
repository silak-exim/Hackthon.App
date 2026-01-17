namespace FoundryDataUploader.Domain.Interfaces;

/// <summary>
/// Interface for AI Agent communication (Dependency Inversion Principle)
/// </summary>
public interface IAIAgentService
{
    /// <summary>
    /// Send a question to the AI agent and get a response
    /// </summary>
    Task<string> AskAsync(string question, CancellationToken cancellationToken = default);
}
