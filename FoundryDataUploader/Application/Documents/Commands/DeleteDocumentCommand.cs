using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

/// <summary>
/// Command to delete a document
/// </summary>
public record DeleteDocumentCommand(string DocumentId) : IRequest<Result>;
