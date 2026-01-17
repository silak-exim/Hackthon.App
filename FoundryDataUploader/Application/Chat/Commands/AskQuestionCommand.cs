using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Chat.Commands;

/// <summary>
/// Command to ask AI a question (CQRS Command)
/// </summary>
public record AskQuestionCommand(string Question, string? Context = null) : IRequest<Result<AskQuestionResponse>>;

public record AskQuestionResponse(
    string Answer,
    string FormattedAnswer,
    string? Summary,
    DateTime Timestamp
);
