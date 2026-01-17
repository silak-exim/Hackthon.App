import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ConfigService } from './config.service';
import { SearchResponse } from '../models';

/**
 * Service for searching documents.
 * Handles all search-related API interactions.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: ConfigService
  ) {}

  /**
   * Search documents by query
   * @param query Search query string
   * @returns Observable of search results
   */
  search(query: string): Observable<SearchResponse> {
    const params = new HttpParams().set('query', query);
    return this.http.get<SearchResponse>(
      `${this.config.apiUrl}/search`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Search error:', error);
        return of({
          success: false,
          results: [],
          error: error.message || 'เกิดข้อผิดพลาดในการค้นหา'
        });
      })
    );
  }
}
