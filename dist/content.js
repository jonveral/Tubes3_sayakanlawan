"use strict";
(() => {
  // src/shared/stats.ts
  function emptyAlgorithmResult(algorithm) {
    return {
      algorithm,
      durationMs: 0,
      comparisons: 0,
      matches: []
    };
  }
  function buildScanResult(algorithmResults, scannedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    const detections = [];
    const keywordCounts = {};
    const algorithmStats = [];
    for (const result of algorithmResults) {
      for (const match of result.matches) {
        detections.push(match);
        keywordCounts[match.keyword] = (keywordCounts[match.keyword] ?? 0) + 1;
      }
      algorithmStats.push({
        algorithm: result.algorithm,
        durationMs: result.durationMs,
        comparisons: result.comparisons,
        matchCount: result.matches.length
      });
    }
    return {
      scannedAt,
      totalKeywordsFound: detections.length,
      detections,
      keywordCounts,
      algorithmStats
    };
  }

  // src/algorithms/boyerMoore.ts
  function runBoyerMoore(input) {
    void input;
    return emptyAlgorithmResult("boyer-moore");
  }

  // src/algorithms/kmp.ts
  function runKmp(input) {
    void input;
    return emptyAlgorithmResult("kmp");
  }

  // src/algorithms/regexMatcher.ts
  function runRegexMatcher(input) {
    void input;
    return emptyAlgorithmResult("regex");
  }

  // src/algorithms/weightedLevenshtein.ts
  var DEFAULT_FUZZY_THRESHOLD = 0.82;
  function runWeightedLevenshtein(input) {
    void input;
    return emptyAlgorithmResult("weighted-levenshtein");
  }

  // src/detection/runDetection.ts
  function runDetection(input) {
    const kmpResult = runKmp(input);
    const boyerMooreResult = runBoyerMoore(input);
    const regexResult = runRegexMatcher(input);
    const exactMatchedKeywords = /* @__PURE__ */ new Set();
    for (const result of [kmpResult, boyerMooreResult]) {
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
      regexResult,
      fuzzyResult
    ]);
  }

  // src/keywords/loadKeywords.ts
  var DEFAULT_KEYWORD_PATH = "keywords/keywords.txt";
  function parseKeywords(source) {
    const keywords = [];
    const seen = /* @__PURE__ */ new Set();
    for (const rawLine of source.split(/\r?\n/)) {
      const keyword = rawLine.trim();
      if (keyword.length === 0) {
        continue;
      }
      const normalized = keyword.toUpperCase();
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      keywords.push(normalized);
    }
    return keywords;
  }
  async function loadKeywords(path = DEFAULT_KEYWORD_PATH) {
    const url = chrome.runtime.getURL(path);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load keywords from ${path}`);
    }
    return parseKeywords(await response.text());
  }

  // src/shared/messages.ts
  var STORAGE_SCAN_RESULT_KEY = "judolDetector:lastScanResult";
  async function saveScanResult(result) {
    if (typeof chrome === "undefined" || chrome.storage?.local === void 0) {
      return;
    }
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_SCAN_RESULT_KEY]: result }, () => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  // src/content/domTargets.ts
  var SKIPPED_TAGS = /* @__PURE__ */ new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION"
  ]);
  function acceptsTextNode(node) {
    const parent = node.parentElement;
    if (parent === null) {
      return false;
    }
    if (SKIPPED_TAGS.has(parent.tagName)) {
      return false;
    }
    const text = node.nodeValue ?? "";
    return text.trim().length > 0;
  }
  function collectTextTargets(root = document.body) {
    const targets = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return acceptsTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let current = walker.nextNode();
    let cursor = 0;
    let id = 0;
    while (current !== null) {
      const textNode = current;
      const text = textNode.nodeValue ?? "";
      const documentStart = cursor;
      const documentEnd = documentStart + text.length;
      targets.push({
        id: `text-${id}`,
        text,
        documentStart,
        documentEnd,
        node: textNode
      });
      cursor = documentEnd + 1;
      id += 1;
      current = walker.nextNode();
    }
    return targets;
  }
  function joinTargetText(targets) {
    return targets.map((target) => target.text).join("\n");
  }

  // src/content/highlighting.ts
  function createDetectionHighlighter() {
    return {
      clear() {
      },
      apply(targets, result) {
        void targets;
        void result;
      }
    };
  }

  // src/content/index.ts
  var highlighter = createDetectionHighlighter();
  var cachedKeywords = null;
  var scanTimer;
  var scanInFlight = false;
  async function getKeywords() {
    if (cachedKeywords !== null) {
      return cachedKeywords;
    }
    cachedKeywords = await loadKeywords();
    return cachedKeywords;
  }
  async function scanPage() {
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
  function scheduleScan(delayMs) {
    if (scanTimer !== void 0) {
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
  var observer = new MutationObserver(() => {
    scheduleScan(500);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
//# sourceMappingURL=content.js.map
