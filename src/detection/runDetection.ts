import type { MatcherInput, ScanResult } from "../shared/contracts";
import { runBoyerMoore } from "../algorithms/boyerMoore";
import { runKmp } from "../algorithms/kmp";
import { runRegexMatcher } from "../algorithms/regexMatcher";
import { runRabinKarp } from "../algorithms/rabinKarp";
import { runAhoCorasick } from "../algorithms/ahoCorasick";
import {
  DEFAULT_FUZZY_THRESHOLD,
  runWeightedLevenshtein
} from "../algorithms/weightedLevenshtein";
import { buildScanResult } from "../shared/stats";

export function runDetection(input: MatcherInput): ScanResult {
  const kmpResult = runKmp(input);
  const boyerMooreResult = runBoyerMoore(input);
  const rabinKarpResult = runRabinKarp(input);
  const ahoCorasickResult = runAhoCorasick(input);
  const regexResult = runRegexMatcher(input);

  const exactMatchedKeywords = new Set<string>();
  for (const result of [kmpResult, boyerMooreResult, rabinKarpResult, ahoCorasickResult]) {
    for (const match of result.matches) {
      exactMatchedKeywords.add(match.keyword);
    }
  }

  const unmatchedKeywords = input.keywords.filter(
    (keyword) => !exactMatchedKeywords.has(keyword)
  );

  const fuzzyResult = runWeightedLevenshtein({
    ...input,
    unmatchedKeywords,
    threshold: DEFAULT_FUZZY_THRESHOLD
  });

  return buildScanResult([
    kmpResult,
    boyerMooreResult,
    rabinKarpResult,
    ahoCorasickResult,
    regexResult,
    fuzzyResult
  ]);
}
