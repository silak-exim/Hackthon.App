using System.Text.RegularExpressions;

namespace FoundryDataUploader.Application.Common;

/// <summary>
/// Service for formatting AI responses for better readability
/// </summary>
public static class ResponseFormatter
{
    /// <summary>
    /// Format AI response for better readability
    /// Converts markdown-style formatting to clean, readable text
    /// </summary>
    public static string FormatForDisplay(string rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse))
            return rawResponse;

        var formatted = rawResponse;

        // Clean up excessive newlines (more than 2 consecutive)
        formatted = Regex.Replace(formatted, @"\n{3,}", "\n\n");

        // Ensure proper spacing after headers
        formatted = Regex.Replace(formatted, @"(#{1,6}\s+.+)\n(?!\n)", "$1\n\n");

        // Clean up bullet points for consistency
        formatted = Regex.Replace(formatted, @"^\s*[-*]\s+", "• ", RegexOptions.Multiline);

        // Clean up numbered lists
        formatted = Regex.Replace(formatted, @"^\s*(\d+)\.\s+", "$1. ", RegexOptions.Multiline);

        // Trim whitespace
        formatted = formatted.Trim();

        return formatted;
    }

    /// <summary>
    /// Convert response to HTML for rich display
    /// </summary>
    public static string FormatAsHtml(string rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse))
            return rawResponse;

        var html = System.Net.WebUtility.HtmlEncode(rawResponse);

        // Convert headers
        html = Regex.Replace(html, @"^### (.+)$", "<h4>$1</h4>", RegexOptions.Multiline);
        html = Regex.Replace(html, @"^## (.+)$", "<h3>$1</h3>", RegexOptions.Multiline);
        html = Regex.Replace(html, @"^# (.+)$", "<h2>$1</h2>", RegexOptions.Multiline);

        // Convert bold
        html = Regex.Replace(html, @"\*\*(.+?)\*\*", "<strong>$1</strong>");

        // Convert italic
        html = Regex.Replace(html, @"\*(.+?)\*", "<em>$1</em>");

        // Convert line breaks
        html = html.Replace("\n\n", "</p><p>");
        html = html.Replace("\n", "<br/>");

        // Wrap in paragraph
        html = $"<p>{html}</p>";

        return html;
    }

    /// <summary>
    /// Extract summary from a longer response (first paragraph or N characters)
    /// </summary>
    public static string ExtractSummary(string response, int maxLength = 200)
    {
        if (string.IsNullOrWhiteSpace(response))
            return response;

        // Get first paragraph
        var firstParagraph = response.Split(new[] { "\n\n" }, StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault() ?? response;

        if (firstParagraph.Length <= maxLength)
            return firstParagraph;

        // Truncate at word boundary
        var truncated = firstParagraph.Substring(0, maxLength);
        var lastSpace = truncated.LastIndexOf(' ');
        
        if (lastSpace > 0)
            truncated = truncated.Substring(0, lastSpace);

        return truncated + "...";
    }
}
