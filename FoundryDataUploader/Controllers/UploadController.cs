using MediatR;
using Microsoft.AspNetCore.Mvc;
using FoundryDataUploader.Application.Documents.Commands;
using FoundryDataUploader.Application.Documents.Queries;

namespace FoundryDataUploader.Controllers;

/// <summary>
/// Document Upload API Controller - Thin controller following Clean Architecture
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IMediator mediator, ILogger<UploadController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Upload one or more documents
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50MB limit
    [ProducesResponseType(typeof(UploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload([FromForm] List<IFormFile> files, CancellationToken cancellationToken)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new ErrorResponse("No files uploaded", "VALIDATION_ERROR"));
        }

        var documents = new List<DocumentDto>();
        var errors = new List<string>();

        foreach (var file in files)
        {
            using var stream = file.OpenReadStream();
            var command = new UploadDocumentCommand(
                FileStream: stream,
                FileName: file.FileName,
                ContentType: file.ContentType,
                Size: file.Length
            );

            var result = await _mediator.Send(command, cancellationToken);

            if (result.Success)
            {
                documents.Add(new DocumentDto(
                    Id: result.Data!.Id,
                    Title: result.Data.Title,
                    FileName: result.Data.FileName,
                    Size: result.Data.Size,
                    UploadedAt: result.Data.UploadedAt
                ));
            }
            else
            {
                errors.Add($"{file.FileName}: {result.Error}");
            }
        }

        return Ok(new UploadResponse(
            Success: documents.Count > 0,
            Documents: documents,
            Errors: errors.Count > 0 ? errors : null
        ));
    }

    /// <summary>
    /// Summarize a document using AI
    /// </summary>
    [HttpPost("summarize/{documentId}")]
    [ProducesResponseType(typeof(SummarizeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Summarize(string documentId, [FromBody] SummarizeRequest? request, CancellationToken cancellationToken)
    {
        var command = new SummarizeDocumentCommand(documentId, request?.SummaryType ?? "general");
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.Success)
        {
            var statusCode = result.ErrorCode == "DOCUMENT_NOT_FOUND" ? 404 : 500;
            return StatusCode(statusCode, new ErrorResponse(result.Error!, result.ErrorCode));
        }

        return Ok(new SummarizeResponse(
            Success: true,
            DocumentId: result.Data!.DocumentId,
            FileName: result.Data.FileName,
            Summary: result.Data.FormattedSummary,
            SummaryType: result.Data.SummaryType
        ));
    }

    /// <summary>
    /// Get all uploaded documents
    /// </summary>
    [HttpGet("documents")]
    [ProducesResponseType(typeof(GetDocumentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAllDocumentsQuery(), cancellationToken);

        if (!result.Success)
        {
            return StatusCode(500, new ErrorResponse(result.Error!, result.ErrorCode));
        }

        return Ok(new GetDocumentsResponse(
            Success: true,
            Documents: result.Data!.Documents.Select(d => new DocumentDto(
                d.Id, d.Title, d.FileName, d.Size, d.UploadedAt
            ))
        ));
    }

    /// <summary>
    /// Delete a document
    /// </summary>
    [HttpDelete("documents/{id}")]
    [ProducesResponseType(typeof(DeleteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteDocumentCommand(id), cancellationToken);

        if (!result.Success)
        {
            var statusCode = result.ErrorCode == "DOCUMENT_NOT_FOUND" ? 404 : 500;
            return StatusCode(statusCode, new ErrorResponse(result.Error!, result.ErrorCode));
        }

        return Ok(new DeleteResponse(Success: true));
    }
}

// Request/Response DTOs
public record SummarizeRequest(string SummaryType = "general");
public record SummarizeResponse(bool Success, string DocumentId, string FileName, string Summary, string SummaryType);
public record UploadResponse(bool Success, IEnumerable<DocumentDto> Documents, IEnumerable<string>? Errors = null);
public record GetDocumentsResponse(bool Success, IEnumerable<DocumentDto> Documents);
public record DeleteResponse(bool Success);
public record DocumentDto(string Id, string Title, string FileName, long Size, DateTime UploadedAt);
