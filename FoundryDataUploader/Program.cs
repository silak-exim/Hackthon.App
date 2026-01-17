using FoundryDataUploader.Application.Common.Behaviors;
using FoundryDataUploader.Infrastructure;
using FoundryDataUploader.Infrastructure.HealthChecks;
using MediatR;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "EXIM Bank AI API", 
        Version = "v2.0",
        Description = "Clean Architecture with CQRS and MediatR"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register MediatR
builder.Services.AddMediatR(cfg => 
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
});

// Register Infrastructure services (Clean Architecture)
var uploadPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
builder.Services.AddInfrastructure(uploadPath);

// Register Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<FoundryApiHealthCheck>("foundry_api", 
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "api", "foundry" })
    .AddCheck("storage", 
        () => {
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            var logger = loggerFactory.CreateLogger<StorageHealthCheck>();
            var check = new StorageHealthCheck(uploadPath, logger);
            return check.CheckHealthAsync(new HealthCheckContext()).Result;
        },
        tags: new[] { "storage" });

var app = builder.Build();

// Configure the HTTP request pipeline - Enable Swagger for all environments
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "EXIM Bank AI API v2");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAngular");

app.MapControllers();

// Health Check Endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

// Simple health check endpoint for basic monitoring
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            totalDuration = report.TotalDuration.TotalMilliseconds
        });
        await context.Response.WriteAsync(result);
    }
});

// Liveness probe - simple endpoint for container orchestrators
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false // Don't run any checks, just return 200 OK
});

// Simple health check at root
app.MapGet("/", () => Results.Ok(new { 
    status = "API is running", 
    version = "2.0.0",
    architecture = "Clean Architecture + CQRS + MediatR",
    timestamp = DateTime.UtcNow 
}));

app.Run();

//test