import type {
  AlgorithmId,
  AlgorithmResult,
  AlgorithmRunStats,
  ScanResult,
  TextMatch
} from "./contracts";

export function emptyAlgorithmResult(algorithm: AlgorithmId): AlgorithmResult {
  return {
    algorithm,
    durationMs: 0,
    comparisons: 0,
    matches: []
  };
}

export function buildScanResult(
  algorithmResults: readonly AlgorithmResult[],
  scannedAt = new Date().toISOString()
): ScanResult {
  const detections: TextMatch[] = [];
  const keywordCounts: Record<string, number> = {};
  const algorithmStats: AlgorithmRunStats[] = [];

  for (const result of algorithmResults) {
    for (const match of result.matches) {
      detections.push(match);
      keywordCounts[match.keyword] = (keywordCounts[match.keyword] ?? 0) + 1;
    }

    algorithmStats.push({
      algorithm: result.algorithm,
      durationMs: result.durationMs,
      comparisons: result.comparisons,
      matchCount: result.matches.length
    });
  }

  return {
    scannedAt,
    totalKeywordsFound: detections.length,
    detections,
    keywordCounts,
    algorithmStats
  };
}
