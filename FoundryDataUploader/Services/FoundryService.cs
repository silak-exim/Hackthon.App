using System.ClientModel;
using Azure;
using Azure.AI.Inference;
using Azure.Identity;

namespace FoundryDataUploader.Services;

public class FoundryService : IFoundryService
{
    private readonly ChatCompletionsClient _client;
    private readonly string _modelName;
    private readonly ILogger<FoundryService> _logger;

    public FoundryService(IConfiguration configuration, ILogger<FoundryService> logger)
    {
        _logger = logger;

        var endpoint = configuration["AzureAIFoundry:Endpoint"]
            ?? Environment.GetEnvironmentVariable("FOUNDRY_ENDPOINT")
            ?? throw new InvalidOperationException("Azure AI Foundry endpoint not configured");

        var apiKey = configuration["AzureAIFoundry:ApiKey"]
            ?? Environment.GetEnvironmentVariable("FOUNDRY_API_KEY");

        _modelName = configuration["AzureAIFoundry:ModelName"]
            ?? Environment.GetEnvironmentVariable("FOUNDRY_MODEL_NAME")
            ?? "gpt-4o";

        // Use API key if provided, otherwise use DefaultAzureCredential (Managed Identity)
        if (!string.IsNullOrEmpty(apiKey))
        {
            _client = new ChatCompletionsClient(
                new Uri(endpoint),
                new AzureKeyCredential(apiKey));
            _logger.LogInformation("Using API Key authentication for Azure AI Foundry");
        }
        else
        {
            _client = new ChatCompletionsClient(
                new Uri(endpoint),
                new DefaultAzureCredential());
            _logger.LogInformation("Using DefaultAzureCredential (Managed Identity) for Azure AI Foundry");
        }
    }

    public async Task<string> AskAsync(string question, string? context = null)
    {
        var messages = new List<ChatRequestMessage>
        {
            new ChatRequestSystemMessage("You are a helpful AI assistant. Answer questions based on the provided context when available. Be concise and accurate.")
        };

        if (!string.IsNullOrEmpty(context))
        {
            messages.Add(new ChatRequestUserMessage($"Context:\n{context}\n\nQuestion: {question}"));
        }
        else
        {
            messages.Add(new ChatRequestUserMessage(question));
        }

        var options = new ChatCompletionsOptions(messages)
        {
            Model = _modelName,
            MaxTokens = 2048,
            Temperature = 0.7f
        };

        try
        {
            _logger.LogInformation("Calling Azure AI Foundry with model: {Model}", _modelName);
            var response = await _client.CompleteAsync(options);
            _logger.LogInformation("Got response from Azure AI Foundry");
            return response.Value.Content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Azure AI Foundry model: {Message}", ex.Message);
            return $"ขออภัย ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้: {ex.Message}";
        }
    }
}
