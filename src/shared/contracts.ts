export const ALGORITHM_IDS = [
  "kmp",
  "boyer-moore",
  "regex",
  "weighted-levenshtein"
] as const;

export type AlgorithmId = (typeof ALGORITHM_IDS)[number];
export type MatchKind = "exact" | "regex" | "fuzzy";

export interface TextMatch {
  algorithm: AlgorithmId;
  kind: MatchKind;
  keyword: string;
  matchedText: string;
  start: number;
  end: number;
  comparisons: number;
  score?: number;
}

export interface AlgorithmResult {
  algorithm: AlgorithmId;
  durationMs: number;
  comparisons: number;
  matches: TextMatch[];
}

export interface AlgorithmRunStats {
  algorithm: AlgorithmId;
  durationMs: number;
  comparisons: number;
  matchCount: number;
}

export interface ScanResult {
  scannedAt: string;
  totalKeywordsFound: number;
  detections: TextMatch[];
  keywordCounts: Record<string, number>;
  algorithmStats: AlgorithmRunStats[];
}

export interface MatcherInput {
  text: string;
  keywords: readonly string[];
}

export interface FuzzyMatcherInput extends MatcherInput {
  unmatchedKeywords: readonly string[];
  threshold: number;
}

export interface KeywordMatcher<Input extends MatcherInput = MatcherInput> {
  id: AlgorithmId;
  run(input: Input): AlgorithmResult;
}

export interface TextScanTarget {
  id: string;
  text: string;
  documentStart: number;
  documentEnd: number;
}
