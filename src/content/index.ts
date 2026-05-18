import { runDetection } from "../detection/runDetection";
import { loadKeywords } from "../keywords/loadKeywords";
import { saveScanResult } from "../shared/messages";
import { collectTextTargets, joinTargetText } from "./domTargets";
import { createDetectionHighlighter } from "./highlighting";

const highlighter = createDetectionHighlighter();

let cachedKeywords: string[] | null = null;
let scanTimer: number | undefined;
let scanInFlight = false;

async function getKeywords(): Promise<string[]> {
  if (cachedKeywords !== null) {
    return cachedKeywords;
  }

  cachedKeywords = await loadKeywords();
  return cachedKeywords;
}

async function scanPage(): Promise<void> {
  if (scanInFlight) {
    return;
  }

  scanInFlight = true;
  try {
    const keywords = await getKeywords();
    const targets = collectTextTargets();
    const text = joinTargetText(targets);
    const result = runDetection({ text, keywords });

    highlighter.clear();
    highlighter.apply(targets, result);
    await saveScanResult(result);
  } catch (error) {
    console.error("[Judol Detector] scan failed", error);
  } finally {
    scanInFlight = false;
  }
}

function scheduleScan(delayMs: number): void {
  if (scanTimer !== undefined) {
    window.clearTimeout(scanTimer);
  }

  scanTimer = window.setTimeout(() => {
    void scanPage();
  }, delayMs);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      scheduleScan(0);
    },
    { once: true }
  );
} else {
  scheduleScan(0);
}

const observer = new MutationObserver(() => {
  scheduleScan(500);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});
