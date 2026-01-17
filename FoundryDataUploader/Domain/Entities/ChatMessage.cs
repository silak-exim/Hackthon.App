namespace FoundryDataUploader.Domain.Entities;

/// <summary>
/// Represents a chat message exchange
/// </summary>
public class ChatMessage
{
    public string Id { get; private set; } = string.Empty;
    public string Question { get; private set; } = string.Empty;
    public string Answer { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public bool IsSuccessful { get; private set; }

    private ChatMessage() { }

    public static ChatMessage Create(string question, string answer, bool isSuccessful = true)
    {
        return new ChatMessage
        {
            Id = Guid.NewGuid().ToString(),
            Question = question,
            Answer = answer,
            CreatedAt = DateTime.UtcNow,
            IsSuccessful = isSuccessful
        };
    }
}
