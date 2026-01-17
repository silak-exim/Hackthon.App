import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DocumentService, NotificationService } from '../../core/services';
import { Document, SummarizeResponse, SummaryType, SUMMARY_TYPES } from '../../core/models';
import { FileSizePipe } from '../../shared/pipes';

/**
 * Upload Component
 * Handles document upload and AI summarization
 */
@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, FileSizePipe],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnInit, OnDestroy {
  // State
  selectedFiles: File[] = [];
  uploadedDocs: Document[] = [];
  isUploading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // AI Summary feature
  readonly summaryTypes = SUMMARY_TYPES;
  selectedSummaryType: SummaryType = 'general';
  isSummarizing: Record<string, boolean> = {};
  summaryResults: Record<string, SummarizeResponse> = {};

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load existing documents
   */
  loadDocuments(): void {
    this.documentService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.uploadedDocs = response.documents;
          }
        },
        error: (err) => console.error('Error loading documents:', err)
      });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  /**
   * Handle drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
    }
  }

  /**
   * Upload selected files
   */
  upload(): void {
    if (this.selectedFiles.length === 0) {
      this.showMessage('กรุณาเลือกไฟล์ก่อน', 'error');
      return;
    }

    this.isUploading = true;
    this.message = '';

    this.documentService.upload(this.selectedFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUploading = false;
          if (response.success) {
            this.uploadedDocs = [...this.uploadedDocs, ...response.documents];
            this.showMessage(`อัพโหลดสำเร็จ ${response.documents.length} ไฟล์`, 'success');
            this.notificationService.success(`อัพโหลดสำเร็จ ${response.documents.length} ไฟล์`);
            this.selectedFiles = [];
          }
          if (response.errors?.length) {
            this.showMessage(`บางไฟล์อัพโหลดไม่สำเร็จ: ${response.errors.join(', ')}`, 'error');
          }
        },
        error: (err) => {
          this.isUploading = false;
          this.showMessage('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
      });
  }

  /**
   * Summarize document using AI
   */
  summarizeDocument(doc: Document): void {
    this.isSummarizing[doc.id] = true;
    
    this.documentService.summarize(doc.id, this.selectedSummaryType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSummarizing[doc.id] = false;
          if (response.success) {
            this.summaryResults[doc.id] = response;
            this.showMessage('สรุปเอกสารสำเร็จ!', 'success');
            this.notificationService.success('สรุปเอกสารสำเร็จ!');
          }
        },
        error: (err) => {
          this.isSummarizing[doc.id] = false;
          this.showMessage('เกิดข้อผิดพลาดในการสรุป: ' + err.message, 'error');
        }
      });
  }

  /**
   * Delete a document
   */
  deleteDocument(doc: Document): void {
    if (!confirm(`คุณต้องการลบเอกสาร "${doc.fileName}" หรือไม่?`)) {
      return;
    }

    this.documentService.delete(doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.uploadedDocs = this.uploadedDocs.filter(d => d.id !== doc.id);
            delete this.summaryResults[doc.id];
            this.showMessage('ลบเอกสารสำเร็จ', 'success');
            this.notificationService.success('ลบเอกสารสำเร็จ');
          }
        },
        error: (err) => {
          this.showMessage('เกิดข้อผิดพลาดในการลบ: ' + err.message, 'error');
        }
      });
  }

  /**
   * Clear summary result
   */
  clearSummary(docId: string): void {
    delete this.summaryResults[docId];
  }

  /**
   * Get summary type label
   */
  getSummaryTypeLabel(type: string): string {
    const found = this.summaryTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  /**
   * Remove file from selection
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Track documents by id
   */
  trackByDocId(index: number, doc: Document): string {
    return doc.id;
  }

  /**
   * Show message
   */
  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }
}
