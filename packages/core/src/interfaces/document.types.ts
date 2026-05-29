export interface DocumentExtractorConfig {
  ort: any;                     // Initialized via Dependency Injection (ort-web or ort-node)
  confidenceThreshold?: number; // Confidence threshold to filter text
}

export interface ExtractedDocumentData {
  idNumber: string;         // ID Number
  fullName: string;         // Full Name
  dateOfBirth: string;      // Date of Birth (DD/MM/YYYY)
  gender: string;           // Gender (Male/Female)
  nationality: string;      // Nationality
  hometown: string;         // Hometown / Place of birth registration
  residence: string;        // Permanent Residence
  expiryDate: string;       // Expiry Date
  documentType: 'CCCD_CHIP' | 'CCCD_CODE' | 'CMND_9_12' | 'GPLX' | 'UNKNOWN';
}

export interface ExtractedResult {
  success: boolean;
  message: string;
  confidence: number;
  data: Partial<ExtractedDocumentData>;
  rawTexts: string[];
}
