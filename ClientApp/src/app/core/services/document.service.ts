import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { Document, UploadResponse, SummarizeResponse, SummaryType } from '../models';

/**
 * Document API Service
 * Handles all document-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  /**
   * Upload files
   */
  upload(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return this.http.post<UploadResponse>(this.config.uploadApiUrl, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Alias for upload
   */
  uploadDocuments(files: File[]): Observable<UploadResponse> {
    return this.upload(files);
  }

  /**
   * Get all documents
   */
  getAll(): Observable<{ success: boolean; documents: Document[] }> {
    return this.http.get<{ success: boolean; documents: Document[] }>(
      `${this.config.uploadApiUrl}/documents`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias for getAll
   */
  getAllDocuments(): Observable<{ success: boolean; documents: Document[] }> {
    return this.getAll();
  }

  /**
   * Summarize a document using AI
   */
  summarize(documentId: string, summaryType: SummaryType = 'general'): Observable<SummarizeResponse> {
    return this.http.post<SummarizeResponse>(
      `${this.config.uploadApiUrl}/summarize/${documentId}`,
      { summaryType }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias for summarize
   */
  summarizeDocument(documentId: string, summaryType: SummaryType = 'general'): Observable<SummarizeResponse> {
    return this.summarize(documentId, summaryType);
  }

  /**
   * Delete a document
   */
  delete(documentId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.config.uploadApiUrl}/documents/${documentId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Alias for delete
   */
  deleteDocument(documentId: string): Observable<{ success: boolean }> {
    return this.delete(documentId);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || error.message || errorMessage;
    }

    console.error('DocumentService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
