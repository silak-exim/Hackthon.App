using MediatR;
using Microsoft.Extensions.Logging;
using FoundryDataUploader.Application.Common;
using FoundryDataUploader.Application.Common.Interfaces;
using FoundryDataUploader.Domain.Interfaces;

namespace FoundryDataUploader.Application.Documents.Commands;

public class SummarizeDocumentCommandHandler : IRequestHandler<SummarizeDocumentCommand, Result<SummarizeDocumentResponse>>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IAIAgentService _aiAgentService;
    private readonly ILogger<SummarizeDocumentCommandHandler> _logger;

    public SummarizeDocumentCommandHandler(
        IDocumentRepository documentRepository,
        IAIAgentService aiAgentService,
        ILogger<SummarizeDocumentCommandHandler> logger)
    {
        _documentRepository = documentRepository;
        _aiAgentService = aiAgentService;
        _logger = logger;
    }

    public async Task<Result<SummarizeDocumentResponse>> Handle(SummarizeDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Summarizing document: {DocumentId}", request.DocumentId);

            // Get document from repository
            var document = await _documentRepository.GetByIdAsync(request.DocumentId, cancellationToken);
            if (document == null)
            {
                return Result<SummarizeDocumentResponse>.Fail("ไม่พบเอกสาร", "DOCUMENT_NOT_FOUND");
            }

            if (string.IsNullOrWhiteSpace(document.TextContent))
            {
                return Result<SummarizeDocumentResponse>.Fail("ไม่สามารถอ่านเนื้อหาเอกสารได้", "NO_CONTENT");
            }

            // Build summarization prompt
            var prompt = BuildSummarizationPrompt(document.TextContent, document.FileName, request.SummaryType);

            // Call AI service
            var rawSummary = await _aiAgentService.AskAsync(prompt, cancellationToken);
            var formattedSummary = ResponseFormatter.FormatForDisplay(rawSummary);

            _logger.LogInformation("Document summarized successfully: {DocumentId}", request.DocumentId);

            return Result<SummarizeDocumentResponse>.Ok(new SummarizeDocumentResponse(
                DocumentId: document.Id,
                FileName: document.FileName,
                Summary: rawSummary,
                FormattedSummary: formattedSummary,
                SummaryType: request.SummaryType
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to summarize document: {DocumentId}", request.DocumentId);
            return Result<SummarizeDocumentResponse>.Fail($"สรุปเอกสารไม่สำเร็จ: {ex.Message}", "SUMMARIZE_ERROR");
        }
    }

    private static string BuildSummarizationPrompt(string content, string fileName, string summaryType)
    {
        var basePrompt = $@"คุณได้รับเอกสารชื่อ ""{fileName}"" กรุณาวิเคราะห์และสรุปเนื้อหาต่อไปนี้:

--- เนื้อหาเอกสาร ---
{content}
--- จบเนื้อหา ---

";

        return summaryType.ToLower() switch
        {
            "executive" => basePrompt + @"กรุณาสรุปแบบ Executive Summary:
1. สรุปภาพรวม (1-2 ประโยค)
2. ประเด็นสำคัญ 3-5 ข้อ
3. ข้อเสนอแนะหรือ Action Items
4. สิ่งที่ต้องระวัง/ความเสี่ยง (ถ้ามี)",

            "financial" => basePrompt + @"กรุณาวิเคราะห์ด้านการเงิน:
1. สรุปตัวเลขทางการเงินที่สำคัญ
2. แนวโน้มและการเปลี่ยนแปลง
3. ความเสี่ยงทางการเงิน
4. ข้อเสนอแนะ",

            "legal" => basePrompt + @"กรุณาวิเคราะห์ด้านกฎหมาย:
1. สรุปข้อกำหนดสำคัญ
2. ภาระผูกพันของแต่ละฝ่าย
3. ข้อควรระวังทางกฎหมาย
4. วันที่และเงื่อนไขสำคัญ",

            "trade" => basePrompt + @"กรุณาวิเคราะห์เอกสาร Trade Finance:
1. ประเภทธุรกรรม (L/C, T/R, Invoice, etc.)
2. คู่สัญญาและบทบาท
3. มูลค่าและเงื่อนไขการชำระเงิน
4. เอกสารที่เกี่ยวข้อง
5. ความเสี่ยงและข้อควรระวัง",

            _ => basePrompt + @"กรุณาสรุป:
1. ภาพรวมของเอกสาร
2. ประเด็นสำคัญ
3. รายละเอียดที่ควรทราบ
4. ข้อสรุปและข้อเสนอแนะ"
        };
    }
}
