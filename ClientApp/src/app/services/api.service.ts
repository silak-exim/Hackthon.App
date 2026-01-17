import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AskRequest {
  question: string;
  context?: string;
}

export interface AskResponse {
  answer: string;
  success: boolean;
}

export interface DocumentInfo {
  id: string;
  title: string;
  fileName: string;
  filePath?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: Date;
  textContent?: string;
}

export interface UploadResponse {
  success: boolean;
  documents: DocumentInfo[];
  errors?: string[];
}

export interface SummarizeRequest {
  summaryType: 'general' | 'executive' | 'financial' | 'legal' | 'trade';
}

export interface SummarizeResponse {
  success: boolean;
  documentId: string;
  fileName: string;
  summary: string;
  summaryType: string;
}

export interface AnalyzeRequest {
  content: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat/health`);
  }

  // Ask the AI model
  ask(question: string, context?: string): Observable<AskResponse> {
    const request: AskRequest = { question, context };
    return this.http.post<AskResponse>(`${this.baseUrl}/chat/ask`, request);
  }

  // Upload documents
  uploadDocuments(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  // Summarize a document using AI Agent
  summarizeDocument(documentId: string, summaryType: string = 'general'): Observable<SummarizeResponse> {
    return this.http.post<SummarizeResponse>(
      `${this.baseUrl}/upload/summarize/${documentId}`,
      { summaryType }
    );
  }

  // Analyze content using AI Agent
  analyzeContent(content: string): Observable<AnalyzeResponse> {
    return this.http.post<AnalyzeResponse>(`${this.baseUrl}/upload/analyze`, { content });
  }

  // Search documents
  search(query: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.baseUrl}/search`, {
      params: { query }
    });
  }

  // Get all documents
  getDocuments(): Observable<{ success: boolean; documents: DocumentInfo[] }> {
    return this.http.get<{ success: boolean; documents: DocumentInfo[] }>(`${this.baseUrl}/upload/documents`);
  }

  // Delete document
  deleteDocument(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/upload/documents/${id}`);
  }
}
