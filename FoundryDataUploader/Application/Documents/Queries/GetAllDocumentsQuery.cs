using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Documents.Queries;

/// <summary>
/// Query to get all documents (CQRS Query)
/// </summary>
public record GetAllDocumentsQuery : IRequest<Result<GetAllDocumentsResponse>>;

public record GetAllDocumentsResponse(IEnumerable<DocumentDto> Documents);

public record DocumentDto(
    string Id,
    string Title,
    string FileName,
    long Size,
    DateTime UploadedAt
);
