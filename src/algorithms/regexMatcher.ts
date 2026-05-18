import type { AlgorithmResult, MatcherInput } from "../shared/contracts";
import { emptyAlgorithmResult } from "../shared/stats";

/**
 * TODO: Implement regex detection for <word><2-3 digits>
 * JavaScript RegExp is allowed by the spec, but edge cases should be covered
 */
export function runRegexMatcher(input: MatcherInput): AlgorithmResult {
  void input;
  return emptyAlgorithmResult("regex");
}
