namespace FoundryDataUploader.Models;

public class ChatRequest
{
    public string Question { get; set; } = string.Empty;
}

public class ChatResponse
{
    public bool Success { get; set; } = true;
    public string Answer { get; set; } = string.Empty;
}
