import { Injectable } from '@angular/core';

/**
 * Environment configuration service
 * Single source of truth for API URLs and config
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly apiBaseUrl = 'http://localhost:5000/api';

  get apiUrl(): string {
    return this.apiBaseUrl;
  }

  get chatApiUrl(): string {
    return `${this.apiBaseUrl}/chat`;
  }

  get uploadApiUrl(): string {
    return `${this.apiBaseUrl}/upload`;
  }

  get searchApiUrl(): string {
    return `${this.apiBaseUrl}/search`;
  }
}
