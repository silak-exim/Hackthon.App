namespace FoundryDataUploader.Application.Common.Interfaces;

/// <summary>
/// Generic result wrapper for command/query responses
/// </summary>
public class Result<T>
{
    public bool Success { get; private set; }
    public T? Data { get; private set; }
    public string? Error { get; private set; }
    public string? ErrorCode { get; private set; }

    private Result() { }

    public static Result<T> Ok(T data) => new()
    {
        Success = true,
        Data = data
    };

    public static Result<T> Fail(string error, string? errorCode = null) => new()
    {
        Success = false,
        Error = error,
        ErrorCode = errorCode
    };
}

/// <summary>
/// Result without data
/// </summary>
public class Result
{
    public bool Success { get; private set; }
    public string? Error { get; private set; }
    public string? ErrorCode { get; private set; }

    private Result() { }

    public static Result Ok() => new() { Success = true };

    public static Result Fail(string error, string? errorCode = null) => new()
    {
        Success = false,
        Error = error,
        ErrorCode = errorCode
    };
}
