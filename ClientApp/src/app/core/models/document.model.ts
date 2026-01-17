/**
 * Document model
 */
export interface Document {
  id: string;
  title: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
  filePath?: string;
  contentType?: string;
  textContent?: string;
}

/**
 * Upload response
 */
export interface UploadResponse {
  success: boolean;
  documents: Document[];
  errors?: string[];
}

/**
 * Summarize request
 */
export interface SummarizeRequest {
  summaryType: SummaryType;
}

/**
 * Summary type options
 */
export type SummaryType = 'general' | 'executive' | 'financial' | 'legal' | 'trade';

/**
 * Summarize response
 */
export interface SummarizeResponse {
  success: boolean;
  documentId: string;
  fileName: string;
  summary: string;
  summaryType: string;
}

/**
 * Summary type option for UI
 */
export interface SummaryTypeOption {
  value: SummaryType;
  label: string;
  icon: string;
  description?: string;
}

/**
 * Available summary types
 */
export const SUMMARY_TYPES: SummaryTypeOption[] = [
  { value: 'general', label: 'สรุปทั่วไป', icon: '📋', description: 'สรุปภาพรวมทั่วไป' },
  { value: 'executive', label: 'สรุปสำหรับผู้บริหาร', icon: '👔', description: 'สรุปสั้นกระชับ เน้น Action Items' },
  { value: 'financial', label: 'สรุปด้านการเงิน', icon: '💰', description: 'วิเคราะห์ตัวเลขและแนวโน้มทางการเงิน' },
  { value: 'legal', label: 'สรุปด้านกฎหมาย', icon: '⚖️', description: 'วิเคราะห์ข้อกำหนดและความเสี่ยงทางกฎหมาย' },
  { value: 'trade', label: 'สรุปด้าน Trade Finance', icon: '🚢', description: 'วิเคราะห์ธุรกรรมนำเข้า-ส่งออก' }
];
