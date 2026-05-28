import type { AlgorithmRunStats, ScanResult } from "../shared/contracts";
import {
  STORAGE_SCAN_RESULT_KEY,
  STORAGE_BLUR_KEY,
  RESCAN_REQUEST_MESSAGE
} from "../shared/messages";

// Mapping warna visual untuk progress bar
const ALGO_COLORS: Record<string, string> = {
  "kmp": "#4dabf7",                    
  "boyer-moore": "#51cf66",            
  "regex": "#ff6b6b",                  
  "weighted-levenshtein": "#cc5de8",   
};

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing popup element #${id}`);
  }
  return element;
}

function formatMs(value: number): string {
  return `${value.toFixed(2)} ms`;
}

function createMetricRow(
  name: string,
  value: string,
  ratio: number,
  barColor?: string
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "metric";

  const row = document.createElement("div");
  row.className = "metric__row";

  const label = document.createElement("span");
  label.className = "metric__name";
  label.textContent = name;

  const metricValue = document.createElement("span");
  metricValue.className = "metric__value";
  metricValue.textContent = value;

  const bar = document.createElement("div");
  bar.className = "bar";

  const fill = document.createElement("div");
  fill.className = "bar__fill";
  fill.style.setProperty("--bar-width", `${Math.round(ratio * 100)}%`);

  if (barColor) {
    fill.style.backgroundColor = barColor;
  }

  row.append(label, metricValue);
  bar.append(fill);
  wrapper.append(row, bar);

  return wrapper;
}

function renderEmpty(container: HTMLElement, message: string): void {
  container.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty";
  empty.textContent = message;
  container.append(empty);
}

function renderAlgorithmStats(
  container: HTMLElement,
  stats: readonly AlgorithmRunStats[]
): void {
  container.replaceChildren();
  if (stats.length === 0) {
    renderEmpty(container, "No algorithm runs recorded.");
    return;
  }

  const maxMatches = Math.max(1, ...stats.map((s) => s.matchCount));
  for (const item of stats) {
    const color = ALGO_COLORS[item.algorithm] ?? "#f1b84b";
    container.append(
      createMetricRow(
        item.algorithm,
        `${item.matchCount} matches / ${formatMs(item.durationMs)}`,
        item.matchCount / maxMatches,
        color
      )
    );
  }
}

function renderKeywordCounts(
  container: HTMLElement,
  keywordCounts: Record<string, number>
): void {
  container.replaceChildren();
  const entries = Object.entries(keywordCounts);
  if (entries.length === 0) {
    renderEmpty(container, "No keyword matches yet.");
    return;
  }

  entries.sort((a, b) => b[1] - a[1]);

  const maxCount = Math.max(1, ...entries.map(([, count]) => count));
  for (const [keyword, count] of entries) {
    container.append(createMetricRow(keyword, `${count}`, count / maxCount));
  }
}

function renderResult(result: ScanResult | null): void {
  const totalFindings = requireElement("total-findings");
  const scanTime = requireElement("scan-time");
  const scanStatus = requireElement("scan-status");
  const algorithmStats = requireElement("algorithm-stats");
  const keywordCounts = requireElement("keyword-counts");

  if (result === null) {
    totalFindings.textContent = "0";
    scanTime.textContent = "No scan yet";
    scanStatus.textContent = "Idle";
    renderEmpty(algorithmStats, "Open a webpage to start scanning.");
    renderEmpty(keywordCounts, "No keyword matches yet.");
    return;
  }

  totalFindings.textContent = `${result.totalKeywordsFound}`;
  scanTime.textContent = `Last scan: ${new Date(result.scannedAt).toLocaleTimeString()}`;
  scanStatus.textContent = "Ready";
  renderAlgorithmStats(algorithmStats, result.algorithmStats);
  renderKeywordCounts(keywordCounts, result.keywordCounts);
}

async function readStoredResult(): Promise<ScanResult | null> {
  if (typeof chrome === "undefined" || chrome.storage?.local === undefined) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_SCAN_RESULT_KEY], (items) => {
      resolve((items[STORAGE_SCAN_RESULT_KEY] as ScanResult | undefined) ?? null);
    });
  });
}

// Inisialisasi awal UI popup
document.addEventListener("DOMContentLoaded", () => {
  void readStoredResult().then(renderResult);

  // Sync data secara realtime
  if (typeof chrome !== "undefined" && chrome.storage?.onChanged !== undefined) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;

      const updated = changes[STORAGE_SCAN_RESULT_KEY]?.newValue as
        | ScanResult
        | undefined;
      if (updated) {
        renderResult(updated);
      }
    });
  }

  // Event listener fitur blur
  const blurToggle = document.getElementById("blur-toggle") as HTMLInputElement | null;

  if (blurToggle && typeof chrome !== "undefined" && chrome.storage?.local) {
    chrome.storage.local.get([STORAGE_BLUR_KEY], (items) => {
      blurToggle.checked = items[STORAGE_BLUR_KEY] === true;
    });

    blurToggle.addEventListener("change", () => {
      chrome.storage.local.set({ [STORAGE_BLUR_KEY]: blurToggle.checked });
    });
  }

  // Trigger rescanning halaman aktif
  const rescanBtn = document.getElementById("rescan-btn");

  if (rescanBtn) {
    rescanBtn.addEventListener("click", () => {
      if (typeof chrome === "undefined" || !chrome.tabs) return;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, { type: RESCAN_REQUEST_MESSAGE });
        }
      });
    });
  }
});
