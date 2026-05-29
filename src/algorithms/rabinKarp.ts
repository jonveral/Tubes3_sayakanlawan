import type { AlgorithmResult, MatcherInput, TextMatch } from "../shared/contracts";

// Bonus Algoritma

export function runRabinKarp(input: MatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComparisons = 0;

  // Ubah teks ke uppercase agar case-insensitive
  const text = input.text.toUpperCase();
  const n = text.length;
  
  const d = 256; // Jumlah karakter ASCII
  const q = 101; // Bilangan prima untuk modulo

  for (const keyword of input.keywords) {
    if (keyword.length === 0) continue;

    const pattern = keyword.toUpperCase();
    const m = pattern.length;
    let keywordComparisons = 0;

    if (m > n) continue;

    let p = 0; // Nilai hash untuk pattern
    let t = 0; // Nilai hash untuk text (window saat ini)
    let h = 1;

    // Nilai h = pow(d, m-1) % q
    for (let i = 0; i < m - 1; i++) {
      h = (h * d) % q;
    }

    // Hitung hash awal untuk pattern dan window pertama text
    for (let i = 0; i < m; i++) {
      p = (d * p + pattern.charCodeAt(i)) % q;
      t = (d * t + text.charCodeAt(i)) % q;
    }

    // Geser window teks satu per satu
    for (let i = 0; i <= n - m; i++) {
      keywordComparisons++;
      
      // Jika hash cocok, lakukan verifikasi karakter per karakter
      if (p === t) {
        let match = true;
        for (let j = 0; j < m; j++) {
          keywordComparisons++;
          if (text[i + j] !== pattern[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          matches.push({
            algorithm: "rabin-karp",
            kind: "exact",
            keyword: keyword,
            matchedText: input.text.substring(i, i + m),
            start: i,
            end: i + m,
            comparisons: keywordComparisons
          });
        }
      }

      // Hitung hash untuk window selanjutnya
      if (i < n - m) {
        t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
        if (t < 0) {
          t = t + q;
        }
      }
    }
    totalComparisons += keywordComparisons;
  }

  const endMs = performance.now();

  return {
    algorithm: "rabin-karp",
    durationMs: endMs - startMs,
    comparisons: totalComparisons,
    matches
  };
}