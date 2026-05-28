import type { AlgorithmResult, MatcherInput, TextMatch } from "../shared/contracts";
import { emptyAlgorithmResult } from "../shared/stats";

/**
 * Membangun array LPS (Border / Failure Function)
 */
function computeBorderFunction(pattern: string, metrics: { comparisons: number }): number[] {
  const m = pattern.length;
  const lps = new Array(m).fill(0);
  let len = 0;
  let i = 1;

  while (i < m) {
    metrics.comparisons++;
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

/**
 * Implementasi algoritma Knuth-Morris-Pratt (KMP) dari awal
 */
export function runKmp(input: MatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComparisons = 0;

  // Ubah teks ke uppercase untuk memastikan case-insensitive matching
  const text = input.text.toUpperCase();
  const n = text.length;

  for (const keyword of input.keywords) {
    if (keyword.length === 0) continue;

    const pattern = keyword.toUpperCase();
    const m = pattern.length;

    const metrics = { comparisons: 0 };
    const lps = computeBorderFunction(pattern, metrics);
    let keywordComparisons = metrics.comparisons;

    let i = 0; // index untuk text
    let j = 0; // index untuk pattern

    while (i < n) {
      keywordComparisons++; // Menghitung proses komparasi text[i] dengan pattern[j]
      if (pattern[j] === text[i]) {
        i++;
        j++;
      }

      if (j === m) {
        matches.push({
          algorithm: "kmp",
          kind: "exact",
          keyword: keyword,
          matchedText: input.text.substring(i - j, i), // Mengambil text casing asli dari HTML
          start: i - j,
          end: i,
          comparisons: keywordComparisons
        });
        
        // Shifting process menggunakan lps untuk mencari overlapping matches
        j = lps[j - 1]; 
      } else if (i < n && pattern[j] !== text[i]) {
        if (j !== 0) {
          j = lps[j - 1]; // Shifting process tanpa mengulangi evaluasi text[i]
        } else {
          i++;
        }
      }
    }
    totalComparisons += keywordComparisons;
  }

  const endMs = performance.now();

  return {
    algorithm: "kmp",
    durationMs: endMs - startMs,
    comparisons: totalComparisons,
    matches
  };
}
