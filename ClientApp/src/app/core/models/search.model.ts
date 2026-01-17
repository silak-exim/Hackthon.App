/**
 * Search result from the API
 */
export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

/**
 * Search response from the API
 */
export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}
