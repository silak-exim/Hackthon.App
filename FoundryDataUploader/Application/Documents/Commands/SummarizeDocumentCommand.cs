using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

/// <summary>
/// Command to summarize a document using AI
/// </summary>
public record SummarizeDocumentCommand(
    string DocumentId,
    string SummaryType = "general"
) : IRequest<Result<SummarizeDocumentResponse>>;

public record SummarizeDocumentResponse(
    string DocumentId,
    string FileName,
    string Summary,
    string FormattedSummary,
    string SummaryType
);
