import type { AlgorithmResult, FuzzyMatcherInput, TextMatch } from "../shared/contracts";

export const DEFAULT_FUZZY_THRESHOLD = 0.82;

// Batas selisih panjang string untuk optimasi
const MAX_LEN_DIFF = 3;

// Mapping tabel kemiripan visual karakter
const visualSimilars: Record<string, string[]> = {
  "O": ["0", "\u039F"],
  "0": ["O", "\u039F"],
  "I": ["1", "L", "\u0399"],
  "1": ["I", "L"],
  "L": ["1", "I"],
  "A": ["4", "\u0391"],
  "4": ["A"],
  "E": ["3", "\u0395"],
  "3": ["E"],
  "S": ["5"],
  "5": ["S"],
  "T": ["7"],
  "7": ["T"],
  "B": ["8"],
  "8": ["B"],
  "G": ["9", "6"],
  "9": ["G"],
  "6": ["G"],
  "Z": ["2"],
  "2": ["Z"],
  "\u0391": ["A", "4"],
  "\u0395": ["E", "3"],
  "\u0399": ["I", "1"],
  "\u039F": ["O", "0"],
};

// Hitung cost 0.2 untuk mirip visual dan 1.0 untuk beda
function getSubCost(a: string, b: string): number {
  if (a === b) return 0;

  const aUpper = a.toUpperCase();
  const bUpper = b.toUpperCase();
  if (aUpper === bUpper) return 0;

  const similarList = visualSimilars[aUpper];
  if (similarList && similarList.includes(bUpper)) return 0.2;

  return 1.0;
}

// Algoritma DP Weighted Levenshtein Distance
function calcWLD(s1: string, s2: string): { dist: number; comps: number } {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
    dp[i][0] = i; 
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j; 
  }

  let comps = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      comps++;

      const cost = getSubCost(s1[i - 1], s2[j - 1]);
      const delCost = dp[i - 1][j] + 1;
      const insCost = dp[i][j - 1] + 1;
      const subCost = dp[i - 1][j - 1] + cost;

      dp[i][j] = Math.min(delCost, insCost, subCost);
    }
  }

  return { dist: dp[m][n], comps };
}

// Buang trailing angka dari token
function stripTrailingDigits(s: string): string {
  let endIdx = s.length;
  while (endIdx > 0 && s[endIdx - 1] >= "0" && s[endIdx - 1] <= "9") {
    endIdx--;
  }
  return s.substring(0, endIdx);
}

// Tokenizer & WLD matching dengan batasan similarity
export function runWeightedLevenshtein(input: FuzzyMatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComps = 0;

  const { text, unmatchedKeywords, threshold } = input;

  if (unmatchedKeywords.length === 0) {
    return {
      algorithm: "weighted-levenshtein",
      durationMs: performance.now() - startMs,
      comparisons: 0,
      matches: [],
    };
  }

  // Ambil token kata dari input text
  const tokenRegex = /[a-zA-Z0-9\u0391-\u03C9\u0410-\u044F]+/g;

  interface TokenInfo {
    textStr: string;
    pos: number;
  }

  const tokens: TokenInfo[] = [];
  let execRes;
  while ((execRes = tokenRegex.exec(text)) !== null) {
    tokens.push({ textStr: execRes[0], pos: execRes.index });
  }

  for (const tInfo of tokens) {
    const token = tInfo.textStr;
    const tokenStart = tInfo.pos;

    const wordOnly = stripTrailingDigits(token);
    if (wordOnly.length === 0) continue; 

    const wordUpper = wordOnly.toUpperCase();

    for (const keyword of unmatchedKeywords) {
      if (Math.abs(wordUpper.length - keyword.length) > MAX_LEN_DIFF) {
        continue;
      }

      const { dist, comps } = calcWLD(wordUpper, keyword);
      totalComps += comps;

      const maxLen = Math.max(wordUpper.length, keyword.length);
      const similarity = maxLen > 0 ? 1 - dist / maxLen : 1;

      if (similarity === 1) {
        continue;
      }

      if (similarity >= threshold) {
        matches.push({
          algorithm: "weighted-levenshtein",
          kind: "fuzzy",
          keyword: keyword,
          matchedText: token,
          start: tokenStart,
          end: tokenStart + token.length,
          comparisons: comps,
          score: similarity,
        });
      }
    }
  }

  const endMs = performance.now();

  return {
    algorithm: "weighted-levenshtein",
    durationMs: endMs - startMs,
    comparisons: totalComps,
    matches,
  };
}
