import type { ScanResult } from "../shared/contracts";
import type { DomTextScanTarget } from "./domTargets";

export interface DetectionHighlighter {
  clear(): void;
  apply(targets: readonly DomTextScanTarget[], result: ScanResult): void;
}

export function createDetectionHighlighter(): DetectionHighlighter {
  return {
    clear() {
      // TODO: Remove old highlight spans and tooltip nodes before rescanning
    },
    apply(targets: readonly DomTextScanTarget[], result: ScanResult) {
      // TODO: Highlight exact text ranges and attach custom DOM tooltips
      void targets;
      void result;
    }
  };
}
