using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Infrastructure.Services;

/// <summary>
/// Text extraction service for various file formats
/// </summary>
public class TextExtractorService : ITextExtractorService
{
    private readonly ILogger<TextExtractorService> _logger;

    private static readonly HashSet<string> SupportedTextExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm", ".log", ".yaml", ".yml"
    };

    public TextExtractorService(ILogger<TextExtractorService> logger)
    {
        _logger = logger;
    }

    public async Task<string> ExtractTextAsync(string filePath, string contentType, CancellationToken cancellationToken = default)
    {
        try
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();

            // Text-based files
            if (IsTextBasedFile(contentType, extension))
            {
                _logger.LogInformation("Extracting text from text-based file: {FilePath}", filePath);
                return await File.ReadAllTextAsync(filePath, cancellationToken);
            }

            // PDF files (basic extraction)
            if (contentType.Contains("pdf") || extension == ".pdf")
            {
                _logger.LogInformation("Extracting text from PDF: {FilePath}", filePath);
                return await ExtractFromPdfAsync(filePath, cancellationToken);
            }

            // Unsupported format
            _logger.LogWarning("Unsupported file format: {ContentType}, {Extension}", contentType, extension);
            return $"[File: {Path.GetFileName(filePath)}] - ไม่สามารถอ่านเนื้อหาได้โดยอัตโนมัติ กรุณาใช้ OCR หรือใส่ข้อมูลเอง";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting text from file: {FilePath}", filePath);
            return string.Empty;
        }
    }

    public bool CanExtract(string contentType, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return IsTextBasedFile(contentType, extension) || 
               contentType.Contains("pdf") || 
               extension == ".pdf";
    }

    private static bool IsTextBasedFile(string contentType, string extension)
    {
        return contentType.Contains("text") || 
               contentType.Contains("json") || 
               contentType.Contains("xml") ||
               SupportedTextExtensions.Contains(extension);
    }

    private async Task<string> ExtractFromPdfAsync(string filePath, CancellationToken cancellationToken)
    {
        // Basic PDF text extraction - for production use a proper library like iTextSharp or PdfPig
        try
        {
            var bytes = await File.ReadAllBytesAsync(filePath, cancellationToken);
            var text = Encoding.UTF8.GetString(bytes);
            
            var readableText = new StringBuilder();
            var inTextBlock = false;
            var lines = text.Split('\n');

            foreach (var line in lines)
            {
                if (line.Contains("BT")) inTextBlock = true;
                if (inTextBlock)
                {
                    if (line.Contains("Tj") || line.Contains("TJ"))
                    {
                        var cleanLine = Regex.Replace(line, @"[^\u0020-\u007E\u0E00-\u0E7F]", " ");
                        if (!string.IsNullOrWhiteSpace(cleanLine))
                        {
                            readableText.AppendLine(cleanLine.Trim());
                        }
                    }
                }
                if (line.Contains("ET")) inTextBlock = false;
            }

            var result = readableText.ToString();
            if (string.IsNullOrWhiteSpace(result))
            {
                return "[PDF file] - เอกสาร PDF นี้อาจเป็น scan ต้องใช้ OCR ในการอ่าน";
            }
            return result;
        }
        catch
        {
            return "[PDF file] - ไม่สามารถอ่านเนื้อหา PDF ได้";
        }
    }
}
