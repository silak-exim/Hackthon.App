import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { SearchService, DocumentService, NotificationService } from '../../core/services';
import { SearchResult, Document } from '../../core/models';

type TabType = 'search' | 'documents';

/**
 * Search component for searching and managing documents.
 * Uses signals for reactive state management with autocomplete support.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, OnDestroy {
  // Signals for reactive state
  readonly searchQuery = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  readonly allDocuments = signal<Document[]>([]);
  readonly isSearching = signal(false);
  readonly isLoadingDocs = signal(false);
  readonly errorMessage = signal('');
  readonly activeTab = signal<TabType>('search');
  
  // Autocomplete signals
  readonly showSuggestions = signal(false);
  readonly filteredSuggestions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query || query.length < 1) return [];
    
    return this.allDocuments()
      .filter(doc => 
        doc.title.toLowerCase().includes(query) || 
        doc.fileName.toLowerCase().includes(query)
      )
      .slice(0, 5); // Limit to 5 suggestions
  });

  // Computed values
  readonly hasSearchResults = computed(() => this.searchResults().length > 0);
  readonly hasDocuments = computed(() => this.allDocuments().length > 0);
  readonly canSearch = computed(() => this.searchQuery().trim().length > 0 && !this.isSearching());
  readonly searchResultsCount = computed(() => this.searchResults().length);
  readonly documentsCount = computed(() => this.allDocuments().length);

  // Cleanup subject
  private readonly destroy$ = new Subject<void>();
  private suggestionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly searchService: SearchService,
    private readonly documentService: DocumentService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Switch between search and documents tabs
   */
  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
    if (tab === 'documents') {
      this.loadDocuments();
    }
  }

  /**
   * Execute search query
   */
  search(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isSearching.set(true);
    this.errorMessage.set('');
    this.searchResults.set([]);

    this.searchService.search(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSearching.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.searchResults.set(response.results);
            if (response.results.length === 0) {
              this.notificationService.showInfo('ไม่พบผลลัพธ์', `ไม่พบเอกสารที่ตรงกับ "${query}"`);
            }
          } else {
            this.errorMessage.set(response.error || 'เกิดข้อผิดพลาดในการค้นหา');
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.error || err.message || 'เกิดข้อผิดพลาดในการค้นหา');
          this.notificationService.showError('ค้นหาล้มเหลว', this.errorMessage());
        }
      });
  }

  /**
   * Load all documents
   */
  loadDocuments(): void {
    this.isLoadingDocs.set(true);
    
    this.documentService.getAllDocuments()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDocs.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allDocuments.set(response.documents);
          }
        },
        error: (err) => {
          console.error('Error loading documents:', err);
          this.notificationService.showError('โหลดเอกสารล้มเหลว');
        }
      });
  }

  /**
   * Delete a document
   */
  deleteDocument(id: string): void {
    if (!confirm('คุณต้องการลบเอกสารนี้หรือไม่?')) return;

    this.documentService.deleteDocument(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allDocuments.update(docs => docs.filter(d => d.id !== id));
            this.notificationService.showSuccess('ลบเอกสารสำเร็จ');
          }
        },
        error: (err) => {
          console.error('Error deleting document:', err);
          this.notificationService.showError('ลบเอกสารล้มเหลว');
        }
      });
  }

  /**
   * Handle keyboard events in search input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.showSuggestions.set(false);
      this.search();
    }
  }

  /**
   * Handle search input with autocomplete
   */
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value.trim().length > 0) {
      this.showSuggestions.set(true);
    } else {
      this.showSuggestions.set(false);
    }
  }

  /**
   * Select a suggestion from dropdown
   */
  selectSuggestion(doc: Document): void {
    this.searchQuery.set(doc.title);
    this.showSuggestions.set(false);
    this.search();
  }

  /**
   * Hide suggestions with delay (for click handling)
   */
  hideSuggestionsDelayed(): void {
    this.suggestionTimeout = setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  /**
   * Update search query value
   */
  updateSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  /**
   * Track search results by id
   */
  trackByResultId(_index: number, result: SearchResult): string {
    return result.id;
  }

  /**
   * Track documents by id
   */
  trackByDocId(_index: number, doc: Document): string {
    return doc.id;
  }
}
