import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { ChatRequest, ChatResponse, HealthResponse } from '../models';

/**
 * Chat API Service
 * Handles all chat-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}

  /**
   * Send a question to AI agent (alias for askQuestion)
   */
  ask(question: string, context?: string): Observable<ChatResponse> {
    return this.askQuestion(question, context);
  }

  /**
   * Send a question to AI agent
   */
  askQuestion(question: string, context?: string): Observable<ChatResponse> {
    const request: ChatRequest = { question, context };
    return this.http.post<ChatResponse>(`${this.config.chatApiUrl}/ask`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Check API health status
   */
  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.config.chatApiUrl}/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.message || errorMessage;
    }

    console.error('ChatService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
