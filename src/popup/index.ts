import type { AlgorithmRunStats, ScanResult } from "../shared/contracts";
import { STORAGE_SCAN_RESULT_KEY } from "../shared/messages";

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

function createMetricRow(name: string, value: string, ratio: number): HTMLElement {
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

  const maxMatches = Math.max(1, ...stats.map((item) => item.matchCount));
  for (const item of stats) {
    container.append(
      createMetricRow(
        item.algorithm,
        `${item.matchCount} matches / ${formatMs(item.durationMs)}`,
        item.matchCount / maxMatches
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

document.addEventListener("DOMContentLoaded", () => {
  void readStoredResult().then(renderResult);

  if (typeof chrome !== "undefined" && chrome.storage?.onChanged !== undefined) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const updated = changes[STORAGE_SCAN_RESULT_KEY]?.newValue as
        | ScanResult
        | undefined;
      renderResult(updated ?? null);
    });
  }
});
