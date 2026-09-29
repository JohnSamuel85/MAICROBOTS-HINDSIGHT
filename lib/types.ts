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

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
}

export type AnalysisStepId =
  | 'understanding'
  | 'searching_memory'
  | 'memory_found'
  | 'sending_to_gemini'
  | 'reasoning'
  | 'recommendation_generated'
  | 'saving_memory';

export interface AnalysisStepUpdate {
  step: AnalysisStepId;
  label: string;
  detail?: string;
  timestamp?: number;
}

export interface AnalysisResult {
  recommendedAction: string;
  memoriesUsed: MemoryItem[];
  savedMemory: MemoryItem;
}
