using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

/// <summary>
/// Command to upload documents
/// </summary>
public record UploadDocumentCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    long Size
) : IRequest<Result<UploadDocumentResponse>>;

public record UploadDocumentResponse(
    string Id,
    string Title,
    string FileName,
    long Size,
    DateTime UploadedAt
);
