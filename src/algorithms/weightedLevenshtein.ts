import type { AlgorithmResult, FuzzyMatcherInput } from "../shared/contracts";
import { emptyAlgorithmResult } from "../shared/stats";

export const DEFAULT_FUZZY_THRESHOLD = 0.82;

/**
 * TODO: Implement weighted Levenshtein matching
 * Required: lower substitution cost for visually similar character
 */
export function runWeightedLevenshtein(input: FuzzyMatcherInput): AlgorithmResult {
  void input;
  return emptyAlgorithmResult("weighted-levenshtein");
}
