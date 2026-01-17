using MediatR;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Application.Common.Interfaces;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Application.Documents.Queries;

public class GetAllDocumentsQueryHandler : IRequestHandler<GetAllDocumentsQuery, Result<GetAllDocumentsResponse>>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly ILogger<GetAllDocumentsQueryHandler> _logger;

    public GetAllDocumentsQueryHandler(
        IDocumentRepository documentRepository,
        ILogger<GetAllDocumentsQueryHandler> logger)
    {
        _documentRepository = documentRepository;
        _logger = logger;
    }

    public async Task<Result<GetAllDocumentsResponse>> Handle(GetAllDocumentsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var documents = await _documentRepository.GetAllAsync(cancellationToken);

            var documentDtos = documents.Select(d => new DocumentDto(
                Id: d.Id,
                Title: d.Title,
                FileName: d.FileName,
                Size: d.Size,
                UploadedAt: d.UploadedAt
            ));

            return Result<GetAllDocumentsResponse>.Ok(new GetAllDocumentsResponse(documentDtos));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get documents");
            return Result<GetAllDocumentsResponse>.Fail($"ไม่สามารถดึงรายการเอกสารได้: {ex.Message}", "QUERY_ERROR");
        }
    }
}
