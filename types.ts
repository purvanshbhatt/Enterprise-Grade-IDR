export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum ThreatLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  MALICIOUS = 'MALICIOUS',
  UNKNOWN = 'UNKNOWN'
}

export interface ScanResult {
  fileName: string;
  threatLevel: ThreatLevel;
  summary: string;
  vulnerabilities: string[];
  cveMatches?: string[]; // From Search Grounding
  confidenceScore: number; // 0-100
  technicalDetails: string;
}

export interface FileQueueItem {
  id: string;
  file: File;
  status: ScanStatus;
  result?: ScanResult;
  progress: number; // 0-100
  eta?: number; // Estimated time remaining in seconds
}

export interface ScanOptions {
  scanDepth: 'quick' | 'balanced' | 'deep';
  enableHeuristics: boolean;
  enableSignatures: boolean;
  sensitivityThreshold: number; // 0-100
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}