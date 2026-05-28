import type { AlgorithmResult, MatcherInput, TextMatch } from "../shared/contracts";

// Matcher regex untuk menangkap format <kata><angka>
export function runRegexMatcher(input: MatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComparisons = 0;

  const text = input.text;

  // Kumpulan regex dengan 2 capture group: (kata)(angka)
  const patterns: RegExp[] = [
    // Pattern 1: kata >= 3 huruf diikuti 2-4 angka
    /\b([a-zA-Z]{3,})(\d{2,4})\b/g,

    // Pattern 2: kata campur angka di dalamnya
    /\b([a-zA-Z][a-zA-Z0-9]*[a-zA-Z])(\d{2,4})\b/g,

    // Pattern 3: kata 2 huruf diikuti >= 3 angka
    /\b([a-zA-Z]{2})(\d{3,4})\b/g,
  ];

  // Menghindari duplikat match di posisi yang sama
  const seenPos = new Set<string>();

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let res = pattern.exec(text);

    while (res !== null) {
      totalComparisons++; 

      const fullMatch = res[0];
      const wordPart = res[1];
      const startIdx = res.index;
      const endIdx = startIdx + fullMatch.length;

      const posKey = `${startIdx}:${endIdx}`;

      if (!seenPos.has(posKey)) {
        seenPos.add(posKey);

        matches.push({
          algorithm: "regex",
          kind: "regex",
          keyword: wordPart.toUpperCase(),
          matchedText: fullMatch,
          start: startIdx,
          end: endIdx,
          comparisons: 1,
        });
      }

      res = pattern.exec(text);
    }
  }

  const endMs = performance.now();

  return {
    algorithm: "regex",
    durationMs: endMs - startMs,
    comparisons: totalComparisons,
    matches,
  };
}
