using MediatR;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Application.Common.Interfaces;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Result>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<DeleteDocumentCommandHandler> _logger;

    public DeleteDocumentCommandHandler(
        IDocumentRepository documentRepository,
        IFileStorageService fileStorageService,
        ILogger<DeleteDocumentCommandHandler> logger)
    {
        _documentRepository = documentRepository;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<Result> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Deleting document: {DocumentId}", request.DocumentId);

            var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
            if (document == null)
            {
                return Result.Fail("ไม่พบเอกสาร", "DOCUMENT_NOT_FOUND");
            }

            // Delete file from storage
            await _fileStorageService.DeleteFileAsync(document.FilePath, cancellationToken);

            // Delete from repository
            await _documentRepository.DeleteAsync(request.DocumentId, cancellationToken);

            _logger.LogInformation("Document deleted successfully: {DocumentId}", request.DocumentId);
            return Result.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete document: {DocumentId}", request.DocumentId);
            return Result.Fail($"ลบเอกสารไม่สำเร็จ: {ex.Message}", "DELETE_ERROR");
        }
    }
}
