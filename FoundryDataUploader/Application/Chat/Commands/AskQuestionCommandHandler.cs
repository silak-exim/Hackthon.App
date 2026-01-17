using MediatR;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Application.Common;
using FoundryDataUploader.Application.Common.Interfaces;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Application.Chat.Commands;

/// <summary>
/// Handler for AskQuestionCommand (Single Responsibility)
/// </summary>
public class AskQuestionCommandHandler : IRequestHandler<AskQuestionCommand, Result<AskQuestionResponse>>
{
    private readonly IAIAgentService _aiAgentService;
    private readonly ILogger<AskQuestionCommandHandler> _logger;

    public AskQuestionCommandHandler(
        IAIAgentService aiAgentService,
        ILogger<AskQuestionCommandHandler> logger)
    {
        _aiAgentService = aiAgentService;
        _logger = logger;
    }

    public async Task<Result<AskQuestionResponse>> Handle(AskQuestionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing question: {Question}", request.Question);

            // Build the full question with context if provided
            var fullQuestion = string.IsNullOrWhiteSpace(request.Context)
                ? request.Question
                : $"{request.Context}\n\nคำถาม: {request.Question}";

            // Call AI service
            var rawAnswer = await _aiAgentService.AskAsync(fullQuestion, cancellationToken);

            // Format the response for better readability
            var formattedAnswer = ResponseFormatter.FormatForDisplay(rawAnswer);
            var summary = ResponseFormatter.ExtractSummary(formattedAnswer);

            var response = new AskQuestionResponse(
                Answer: rawAnswer,
                FormattedAnswer: formattedAnswer,
                Summary: summary,
                Timestamp: DateTime.UtcNow
            );

            _logger.LogInformation("Question answered successfully");
            return Result<AskQuestionResponse>.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process question");
            return Result<AskQuestionResponse>.Fail($"ไม่สามารถประมวลผลคำถามได้: {ex.Message}", "AI_ERROR");
        }
    }
}
