using Azure.AI.Projects;
using Azure.AI.Projects.OpenAI;
using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI.Responses;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Infrastructure.Services;

#pragma warning disable OPENAI001

/// <summary>
/// Azure AI Foundry Agent Service implementation
/// Implements IAIAgentService interface (Dependency Inversion)
/// </summary>
public class AzureFoundryAgentService : IAIAgentService
{
    private readonly AIProjectClient _projectClient;
    private readonly string _agentName;
    private readonly string _agentVersion;
    private readonly ILogger<AzureFoundryAgentService> _logger;

    public AzureFoundryAgentService(IConfiguration configuration, ILogger<AzureFoundryAgentService> logger)
    {
        _logger = logger;

        var projectEndpoint = configuration["AzureFoundry:Endpoint"] 
            ?? throw new ArgumentNullException("AzureFoundry:Endpoint is required");
        _agentName = configuration["AzureFoundry:AgentName"] ?? "sila-wf";
        _agentVersion = configuration["AzureFoundry:AgentVersion"] ?? "2";

        _logger.LogInformation("Initializing AzureFoundryAgentService with endpoint: {Endpoint}", projectEndpoint);
        _logger.LogInformation("Agent: {AgentName} v{AgentVersion}", _agentName, _agentVersion);

        var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            ExcludeEnvironmentCredential = false,
            ExcludeWorkloadIdentityCredential = true,
            ExcludeManagedIdentityCredential = true,
            ExcludeVisualStudioCredential = false,
            ExcludeVisualStudioCodeCredential = false,
            ExcludeAzureCliCredential = false,
            ExcludeAzurePowerShellCredential = false,
            ExcludeInteractiveBrowserCredential = false
        });

        _projectClient = new AIProjectClient(
            endpoint: new Uri(projectEndpoint),
            tokenProvider: credential
        );
    }

    public async Task<string> AskAsync(string question, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating conversation for question: {Question}", 
                question.Length > 100 ? question.Substring(0, 100) + "..." : question);

            ProjectConversation conversation = _projectClient.OpenAI.Conversations.CreateProjectConversation();
            var agentReference = new AgentReference(name: _agentName, version: _agentVersion);
            var responseClient = _projectClient.OpenAI.GetProjectResponsesClientForAgent(agentReference, conversation.Id);

            _logger.LogInformation("Sending message to agent...");
            
            OpenAIResponse response = responseClient.CreateResponse(question);
            var outputText = response.GetOutputText();
            
            _logger.LogInformation("Received response: {Response}", 
                outputText?.Length > 100 ? outputText.Substring(0, 100) + "..." : outputText);
            
            return outputText ?? "ไม่ได้รับคำตอบจาก AI";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Azure AI Foundry agent: {Message}", ex.Message);
            throw; // Let the application layer handle this
        }
    }
}
