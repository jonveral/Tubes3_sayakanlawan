import type { AlgorithmResult, MatcherInput, TextMatch } from "../shared/contracts";
import { emptyAlgorithmResult } from "../shared/stats";

// Membangun Last Occurrence Table
function buildLastOccurrenceTable(pattern: string): Map<string, number> {
  const last = new Map<string, number>();
  for (let i = 0; i < pattern.length; i++) {
    last.set(pattern[i], i);
  }
  return last;
}

// Implementasi algoritma Boyer-Moore
export function runBoyerMoore(input: MatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComparisons = 0;

  // Ubah teks ke uppercase agar case-insensitive
  const text = input.text.toUpperCase();
  const n = text.length;

  for (const keyword of input.keywords) {
    if (keyword.length === 0) continue;

    const pattern = keyword.toUpperCase();
    const m = pattern.length;

    const last = buildLastOccurrenceTable(pattern);
    let keywordComparisons = 0;

    let i = m - 1;
    let j = m - 1;

    while (i < n) {
      keywordComparisons++;
      if (pattern[j] === text[i]) {
        if (j === 0) { // Menemukan kecocokan pattern yang komplit
          matches.push({
            algorithm: "boyer-moore",
            kind: "exact",
            keyword: keyword,
            matchedText: input.text.substring(i, i + m), // Menangkap casing aslinya
            start: i,
            end: i + m,
            comparisons: keywordComparisons
          });
          
          // Shifting process sesudah sukses match.
          // Saat ini i sedang berada pada awal kata yang termatch, sehingga
          // kita melompat ke (i + m) untuk mengecek windows pattern yang selanjutnya.
          i = i + m; 
          j = m - 1;
        } else {
          // Telusuri secara mundur karena masih cocok (Right-to-Left)
          i--;
          j--;
        }
      } else {
        // Bad character heuristic shifting process
        const lo = last.get(text[i]) ?? -1;
        i = i + m - Math.min(j, 1 + lo);
        j = m - 1;
      }
    }
    totalComparisons += keywordComparisons;
  }

  const endMs = performance.now();

  return {
    algorithm: "boyer-moore",
    durationMs: endMs - startMs,
    comparisons: totalComparisons,
    matches
  };
}
