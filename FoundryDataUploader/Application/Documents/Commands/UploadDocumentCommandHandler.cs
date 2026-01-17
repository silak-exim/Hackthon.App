using MediatR;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Application.Common.Interfaces;
using FoundryDataUploader.Domain.Entities;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, Result<UploadDocumentResponse>>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly ITextExtractorService _textExtractorService;
    private readonly ILogger<UploadDocumentCommandHandler> _logger;

    public UploadDocumentCommandHandler(
        IDocumentRepository documentRepository,
        IFileStorageService fileStorageService,
        ITextExtractorService textExtractorService,
        ILogger<UploadDocumentCommandHandler> logger)
    {
        _documentRepository = documentRepository;
        _fileStorageService = fileStorageService;
        _textExtractorService = textExtractorService;
        _logger = logger;
    }

    public async Task<Result<UploadDocumentResponse>> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Uploading document: {FileName}", request.FileName);

            // Save file to storage
            var filePath = await _fileStorageService.SaveFileAsync(
                request.FileStream, 
                request.FileName, 
                cancellationToken);

            // Extract text content
            var textContent = await _textExtractorService.ExtractTextAsync(
                filePath, 
                request.ContentType, 
                cancellationToken);

            // Create domain entity
            var document = Document.Create(
                title: Path.GetFileNameWithoutExtension(request.FileName),
                fileName: request.FileName,
                filePath: filePath,
                contentType: request.ContentType,
                size: request.Size,
                textContent: textContent
            );

            // Persist to repository
            await _documentRepository.AddAsync(document, cancellationToken);

            _logger.LogInformation("Document uploaded successfully: {Id}", document.Id);

            return Result<UploadDocumentResponse>.Ok(new UploadDocumentResponse(
                Id: document.Id,
                Title: document.Title,
                FileName: document.FileName,
                Size: document.Size,
                UploadedAt: document.UploadedAt
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload document: {FileName}", request.FileName);
            return Result<UploadDocumentResponse>.Fail($"อัพโหลดไฟล์ไม่สำเร็จ: {ex.Message}", "UPLOAD_ERROR");
        }
    }
}
