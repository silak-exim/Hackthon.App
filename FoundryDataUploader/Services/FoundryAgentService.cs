using Azure.AI.Projects;
using Azure.AI.Projects.OpenAI;
using Azure.Identity;
using OpenAI;
using OpenAI.Responses;

namespace FoundryDataUploader.Services;

#pragma warning disable OPENAI001

public interface IFoundryAgentService
{
    Task<string> AskAsync(string question);
}

public class FoundryAgentService : IFoundryAgentService
{
    private readonly AIProjectClient _projectClient;
    private readonly string _agentName;
    private readonly string _agentVersion;
    private readonly ILogger<FoundryAgentService> _logger;

    public FoundryAgentService(IConfiguration configuration, ILogger<FoundryAgentService> logger)
    {
        _logger = logger;

        var projectEndpoint = configuration["AzureFoundry:Endpoint"] 
            ?? throw new ArgumentNullException("AzureFoundry:Endpoint is required");
        _agentName = configuration["AzureFoundry:AgentName"] ?? "sila-wf";
        _agentVersion = configuration["AzureFoundry:AgentVersion"] ?? "2";

        _logger.LogInformation("Initializing FoundryAgentService with endpoint: {Endpoint}", projectEndpoint);
        _logger.LogInformation("Agent: {AgentName} v{AgentVersion}", _agentName, _agentVersion);

        // Use DefaultAzureCredential with fallback options
        var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            ExcludeEnvironmentCredential = false,
            ExcludeWorkloadIdentityCredential = true,
            ExcludeManagedIdentityCredential = true,
            ExcludeSharedTokenCacheCredential = false,
            ExcludeVisualStudioCredential = false,
            ExcludeVisualStudioCodeCredential = false,
            ExcludeAzureCliCredential = false,
            ExcludeAzurePowerShellCredential = false,
            ExcludeInteractiveBrowserCredential = false  // Allow browser login
        });

        // Connect to your project using the endpoint from your project page
        _projectClient = new AIProjectClient(
            endpoint: new Uri(projectEndpoint),
            tokenProvider: credential
        );
    }

    public async Task<string> AskAsync(string question)
    {
        try
        {
            _logger.LogInformation("Creating conversation for question: {Question}", question);

            // Create a project conversation
            ProjectConversation conversation = _projectClient.OpenAI.Conversations.CreateProjectConversation();
            
            // Create agent reference
            AgentReference agentReference = new AgentReference(name: _agentName, version: _agentVersion);
            
            // Get responses client for agent
            ProjectResponsesClient responseClient = _projectClient.OpenAI.GetProjectResponsesClientForAgent(
                agentReference, 
                conversation.Id
            );

            _logger.LogInformation("Sending message to agent...");
            
            // Create response
            OpenAIResponse response = responseClient.CreateResponse(question);
            
            var outputText = response.GetOutputText();
            _logger.LogInformation("Received response: {Response}", outputText?.Substring(0, Math.Min(outputText?.Length ?? 0, 100)));
            
            return outputText ?? "ไม่ได้รับคำตอบจาก AI";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Azure AI Foundry agent: {Message}", ex.Message);
            return $"ขออภัย ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้: {ex.Message}";
        }
    }
}
