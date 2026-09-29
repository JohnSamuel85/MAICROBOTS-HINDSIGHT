export interface MemoryItem {
  id: string;
  category: string;
  issue: string;
  rootCause: string;
  resolution: string;
  summary: string;
  outcome: string;
  timestamp: string;
  relevanceScore?: number;
}

export interface AnalysisResult {
  recommendedAction: string;
  memoriesUsed: MemoryItem[];
  savedMemory?: MemoryItem;
}

export interface ProcessStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  detail?: string;
}
