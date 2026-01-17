using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Chat.Queries;

/// <summary>
/// Query to check health status (CQRS Query - no side effects)
/// </summary>
public record GetHealthQuery : IRequest<Result<HealthResponse>>;

public record HealthResponse(
    string Status,
    DateTime Timestamp,
    string Version
);
