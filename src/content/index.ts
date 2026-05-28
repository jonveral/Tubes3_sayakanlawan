import { runDetection } from "../detection/runDetection";
import { loadKeywords } from "../keywords/loadKeywords";
import {
  saveScanResult,
  RESCAN_REQUEST_MESSAGE,
  STORAGE_BLUR_KEY
} from "../shared/messages";
import { collectTextTargets, joinTargetText } from "./domTargets";
import { createDetectionHighlighter } from "./highlighting";

const highlighter = createDetectionHighlighter();

let cachedKeywords: string[] | null = null;
let scanTimer: number | undefined;
let scanInFlight = false;

// Setup konfigurasi listener DOM
const observerConfig: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
};

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

    // Matikan deteksi saat mewarnai teks
    observer.disconnect();

    highlighter.clear();
    highlighter.apply(targets, result);

    observer.observe(document.documentElement, observerConfig);

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

const observer = new MutationObserver(() => {
  scheduleScan(500);
});

// Trigger start scanning
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

observer.observe(document.documentElement, observerConfig);

// Setup status pengaturan efek blur
if (typeof chrome !== "undefined" && chrome.storage?.local) {
  chrome.storage.local.get([STORAGE_BLUR_KEY], (items) => {
    const isBlur = items[STORAGE_BLUR_KEY] === true;
    highlighter.setBlur(isBlur);
  });
}

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    if (STORAGE_BLUR_KEY in changes) {
      const isBlur = changes[STORAGE_BLUR_KEY].newValue === true;
      highlighter.setBlur(isBlur);
    }
  });
}

// Receiver pesan klik tombol di UI
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === RESCAN_REQUEST_MESSAGE) {
      scheduleScan(0);
    }
  });
}
