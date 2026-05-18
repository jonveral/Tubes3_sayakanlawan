"use strict";
(() => {
  // src/shared/messages.ts
  var STORAGE_SCAN_RESULT_KEY = "judolDetector:lastScanResult";

  // src/popup/index.ts
  function requireElement(id) {
    const element = document.getElementById(id);
    if (element === null) {
      throw new Error(`Missing popup element #${id}`);
    }
    return element;
  }
  function formatMs(value) {
    return `${value.toFixed(2)} ms`;
  }
  function createMetricRow(name, value, ratio) {
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
  function renderEmpty(container, message) {
    container.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = message;
    container.append(empty);
  }
  function renderAlgorithmStats(container, stats) {
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
  function renderKeywordCounts(container, keywordCounts) {
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
  function renderResult(result) {
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
  async function readStoredResult() {
    if (typeof chrome === "undefined" || chrome.storage?.local === void 0) {
      return null;
    }
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_SCAN_RESULT_KEY], (items) => {
        resolve(items[STORAGE_SCAN_RESULT_KEY] ?? null);
      });
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    void readStoredResult().then(renderResult);
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged !== void 0) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
          return;
        }
        const updated = changes[STORAGE_SCAN_RESULT_KEY]?.newValue;
        renderResult(updated ?? null);
      });
    }
  });
})();
//# sourceMappingURL=popup.js.map
