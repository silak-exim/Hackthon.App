using MediatR;
using FoundryDataUploader.Application.Common.Interfaces;

namespace FoundryDataUploader.Application.Chat.Queries;

public class GetHealthQueryHandler : IRequestHandler<GetHealthQuery, Result<HealthResponse>>
{
    public Task<Result<HealthResponse>> Handle(GetHealthQuery request, CancellationToken cancellationToken)
    {
        var response = new HealthResponse(
            Status: "healthy",
            Timestamp: DateTime.UtcNow,
            Version: "2.0.0"
        );

        return Task.FromResult(Result<HealthResponse>.Ok(response));
    }
}
