using MediatR;
using Microsoft.AspNetCore.Mvc;
using FoundryDataUploader.Application.Chat.Commands;
using FoundryDataUploader.Application.Chat.Queries;

namespace FoundryDataUploader.Controllers;

/// <summary>
/// Chat API Controller - Thin controller following Clean Architecture
/// All business logic is in Application layer handlers
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IMediator mediator, ILogger<ChatController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Ask AI a question
    /// </summary>
    [HttpPost("ask")]
    [ProducesResponseType(typeof(AskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Ask([FromBody] AskRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new ErrorResponse("Question is required", "VALIDATION_ERROR"));
        }

        var command = new AskQuestionCommand(request.Question, request.Context);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.Success)
        {
            return StatusCode(500, new ErrorResponse(result.Error!, result.ErrorCode));
        }

        return Ok(new AskResponse(
            Success: true,
            Answer: result.Data!.FormattedAnswer,
            Summary: result.Data.Summary,
            Timestamp: result.Data.Timestamp
        ));
    }

    /// <summary>
    /// Health check endpoint
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetHealthQuery(), cancellationToken);
        
        return Ok(new HealthResponse(
            Status: result.Data!.Status,
            Timestamp: result.Data.Timestamp,
            Version: result.Data.Version
        ));
    }
}

// Request/Response DTOs for API
public record AskRequest(string Question, string? Context = null);
public record AskResponse(bool Success, string Answer, string? Summary, DateTime Timestamp);
public record HealthResponse(string Status, DateTime Timestamp, string Version);
public record ErrorResponse(string Error, string? ErrorCode = null);
