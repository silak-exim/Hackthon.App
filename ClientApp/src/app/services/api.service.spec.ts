import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, AskResponse, UploadResponse, SummarizeResponse, SearchResponse } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:5000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('healthCheck', () => {
    it('should call GET /api/chat/health', () => {
      const mockResponse = { status: 'Healthy', timestamp: new Date().toISOString() };

      service.healthCheck().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/chat/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('ask', () => {
    it('should call POST /api/chat/ask with question', () => {
      const mockResponse: AskResponse = {
        success: true,
        answer: 'This is the answer'
      };

      service.ask('What is EXIM Bank?').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
        expect(response.answer).toBe('This is the answer');
      });

      const req = httpMock.expectOne(`${baseUrl}/chat/ask`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ question: 'What is EXIM Bank?', context: undefined });
      req.flush(mockResponse);
    });

    it('should call POST /api/chat/ask with question and context', () => {
      const mockResponse: AskResponse = {
        success: true,
        answer: 'Contextual answer'
      };

      service.ask('Question?', 'Some context').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/chat/ask`);
      expect(req.request.body).toEqual({ question: 'Question?', context: 'Some context' });
      req.flush(mockResponse);
    });

    it('should handle error response', () => {
      const errorResponse: AskResponse = {
        success: false,
        answer: 'Error occurred'
      };

      service.ask('Bad question').subscribe(response => {
        expect(response.success).toBeFalse();
      });

      const req = httpMock.expectOne(`${baseUrl}/chat/ask`);
      req.flush(errorResponse);
    });
  });

  describe('uploadDocuments', () => {
    it('should call POST /api/upload with FormData', () => {
      const mockResponse: UploadResponse = {
        success: true,
        documents: [
          { id: '1', title: 'test', fileName: 'test.pdf' }
        ]
      };

      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocuments([mockFile]).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBeTrue();
        expect(response.documents.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush(mockResponse);
    });

    it('should append multiple files to FormData', () => {
      const mockResponse: UploadResponse = {
        success: true,
        documents: [
          { id: '1', title: 'file1', fileName: 'file1.pdf' },
          { id: '2', title: 'file2', fileName: 'file2.pdf' }
        ]
      };

      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });

      service.uploadDocuments([file1, file2]).subscribe(response => {
        expect(response.documents.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/upload`);
      req.flush(mockResponse);
    });

    it('should handle upload errors', () => {
      const mockResponse: UploadResponse = {
        success: false,
        documents: [],
        errors: ['File too large']
      };

      const mockFile = new File(['content'], 'large.pdf');

      service.uploadDocuments([mockFile]).subscribe(response => {
        expect(response.success).toBeFalse();
        expect(response.errors?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/upload`);
      req.flush(mockResponse);
    });
  });

  describe('summarizeDocument', () => {
    it('should call POST /api/upload/summarize/{id} with default summaryType', () => {
      const mockResponse: SummarizeResponse = {
        success: true,
        documentId: 'doc-123',
        fileName: 'test.pdf',
        summary: 'Document summary...',
        summaryType: 'general'
      };

      service.summarizeDocument('doc-123').subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.summaryType).toBe('general');
      });

      const req = httpMock.expectOne(`${baseUrl}/upload/summarize/doc-123`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ summaryType: 'general' });
      req.flush(mockResponse);
    });

    it('should call POST with custom summaryType', () => {
      const mockResponse: SummarizeResponse = {
        success: true,
        documentId: 'doc-123',
        fileName: 'test.pdf',
        summary: 'Executive summary...',
        summaryType: 'executive'
      };

      service.summarizeDocument('doc-123', 'executive').subscribe(response => {
        expect(response.summaryType).toBe('executive');
      });

      const req = httpMock.expectOne(`${baseUrl}/upload/summarize/doc-123`);
      expect(req.request.body).toEqual({ summaryType: 'executive' });
      req.flush(mockResponse);
    });
  });
});
