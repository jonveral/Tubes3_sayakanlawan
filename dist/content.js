"use strict";
(() => {
  // src/algorithms/boyerMoore.ts
  function buildLastOccurrenceTable(pattern) {
    const last = /* @__PURE__ */ new Map();
    for (let i = 0; i < pattern.length; i++) {
      last.set(pattern[i], i);
    }
    return last;
  }
  function runBoyerMoore(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComparisons = 0;
    const text = input.text.toUpperCase();
    const n = text.length;
    for (const keyword of input.keywords) {
      if (keyword.length === 0) continue;
      const pattern = keyword.toUpperCase();
      const m = pattern.length;
      const last = buildLastOccurrenceTable(pattern);
      let keywordComparisons = 0;
      let i = m - 1;
      let j = m - 1;
      while (i < n) {
        keywordComparisons++;
        if (pattern[j] === text[i]) {
          if (j === 0) {
            matches.push({
              algorithm: "boyer-moore",
              kind: "exact",
              keyword,
              matchedText: input.text.substring(i, i + m),
              // Menangkap casing aslinya
              start: i,
              end: i + m,
              comparisons: keywordComparisons
            });
            i = i + m;
            j = m - 1;
          } else {
            i--;
            j--;
          }
        } else {
          const lo = last.get(text[i]) ?? -1;
          i = i + m - Math.min(j, 1 + lo);
          j = m - 1;
        }
      }
      totalComparisons += keywordComparisons;
    }
    const endMs = performance.now();
    return {
      algorithm: "boyer-moore",
      durationMs: endMs - startMs,
      comparisons: totalComparisons,
      matches
    };
  }

  // src/algorithms/kmp.ts
  function computeBorderFunction(pattern, metrics) {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0;
    let i = 1;
    while (i < m) {
      metrics.comparisons++;
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }
    return lps;
  }
  function runKmp(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComparisons = 0;
    const text = input.text.toUpperCase();
    const n = text.length;
    for (const keyword of input.keywords) {
      if (keyword.length === 0) continue;
      const pattern = keyword.toUpperCase();
      const m = pattern.length;
      const metrics = { comparisons: 0 };
      const lps = computeBorderFunction(pattern, metrics);
      let keywordComparisons = metrics.comparisons;
      let i = 0;
      let j = 0;
      while (i < n) {
        keywordComparisons++;
        if (pattern[j] === text[i]) {
          i++;
          j++;
        }
        if (j === m) {
          matches.push({
            algorithm: "kmp",
            kind: "exact",
            keyword,
            matchedText: input.text.substring(i - j, i),
            // Mengambil text casing asli dari HTML
            start: i - j,
            end: i,
            comparisons: keywordComparisons
          });
          j = lps[j - 1];
        } else if (i < n && pattern[j] !== text[i]) {
          if (j !== 0) {
            j = lps[j - 1];
          } else {
            i++;
          }
        }
      }
      totalComparisons += keywordComparisons;
    }
    const endMs = performance.now();
    return {
      algorithm: "kmp",
      durationMs: endMs - startMs,
      comparisons: totalComparisons,
      matches
    };
  }

  // src/algorithms/regexMatcher.ts
  function runRegexMatcher(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComparisons = 0;
    const text = input.text;
    const patterns = [
      // Pattern 1: kata >= 3 huruf diikuti 2-4 angka
      /\b([a-zA-Z]{3,})(\d{2,4})\b/g,
      // Pattern 2: kata campur angka di dalamnya
      /\b([a-zA-Z][a-zA-Z0-9]*[a-zA-Z])(\d{2,4})\b/g,
      // Pattern 3: kata 2 huruf diikuti >= 3 angka
      /\b([a-zA-Z]{2})(\d{3,4})\b/g
    ];
    const seenPos = /* @__PURE__ */ new Set();
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let res = pattern.exec(text);
      while (res !== null) {
        totalComparisons++;
        const fullMatch = res[0];
        const wordPart = res[1];
        const startIdx = res.index;
        const endIdx = startIdx + fullMatch.length;
        const posKey = `${startIdx}:${endIdx}`;
        if (!seenPos.has(posKey)) {
          seenPos.add(posKey);
          matches.push({
            algorithm: "regex",
            kind: "regex",
            keyword: wordPart.toUpperCase(),
            matchedText: fullMatch,
            start: startIdx,
            end: endIdx,
            comparisons: 1
          });
        }
        res = pattern.exec(text);
      }
    }
    const endMs = performance.now();
    return {
      algorithm: "regex",
      durationMs: endMs - startMs,
      comparisons: totalComparisons,
      matches
    };
  }

  // src/algorithms/rabinKarp.ts
  function runRabinKarp(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComparisons = 0;
    const text = input.text.toUpperCase();
    const n = text.length;
    const d = 256;
    const q = 101;
    for (const keyword of input.keywords) {
      if (keyword.length === 0) continue;
      const pattern = keyword.toUpperCase();
      const m = pattern.length;
      let keywordComparisons = 0;
      if (m > n) continue;
      let p = 0;
      let t = 0;
      let h = 1;
      for (let i = 0; i < m - 1; i++) {
        h = h * d % q;
      }
      for (let i = 0; i < m; i++) {
        p = (d * p + pattern.charCodeAt(i)) % q;
        t = (d * t + text.charCodeAt(i)) % q;
      }
      for (let i = 0; i <= n - m; i++) {
        keywordComparisons++;
        if (p === t) {
          let match = true;
          for (let j = 0; j < m; j++) {
            keywordComparisons++;
            if (text[i + j] !== pattern[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            matches.push({
              algorithm: "rabin-karp",
              kind: "exact",
              keyword,
              matchedText: input.text.substring(i, i + m),
              start: i,
              end: i + m,
              comparisons: keywordComparisons
            });
          }
        }
        if (i < n - m) {
          t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
          if (t < 0) {
            t = t + q;
          }
        }
      }
      totalComparisons += keywordComparisons;
    }
    const endMs = performance.now();
    return {
      algorithm: "rabin-karp",
      durationMs: endMs - startMs,
      comparisons: totalComparisons,
      matches
    };
  }

  // src/algorithms/ahoCorasick.ts
  var TrieNode = class {
    children = /* @__PURE__ */ new Map();
    fail = null;
    output = [];
    // Menyimpan keyword(s) yang match saat state mencapai node ini
  };
  function runAhoCorasick(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComparisons = 0;
    const text = input.text.toUpperCase();
    const root = new TrieNode();
    for (const keyword of input.keywords) {
      if (keyword.length === 0) continue;
      const pattern = keyword.toUpperCase();
      let current2 = root;
      for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        if (!current2.children.has(char)) {
          current2.children.set(char, new TrieNode());
        }
        current2 = current2.children.get(char);
      }
      current2.output.push(keyword);
    }
    const queue = [];
    for (const child of root.children.values()) {
      child.fail = root;
      queue.push(child);
    }
    while (queue.length > 0) {
      const current2 = queue.shift();
      for (const [char, child] of current2.children.entries()) {
        queue.push(child);
        let failNode = current2.fail;
        while (failNode !== null && !failNode.children.has(char)) {
          totalComparisons++;
          failNode = failNode.fail;
        }
        totalComparisons++;
        if (failNode === null) {
          child.fail = root;
        } else {
          child.fail = failNode.children.get(char);
          child.output.push(...child.fail.output);
        }
      }
    }
    let current = root;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      while (current !== root && !current.children.has(char)) {
        totalComparisons++;
        current = current.fail;
      }
      totalComparisons++;
      if (current.children.has(char)) {
        current = current.children.get(char);
      } else {
        current = root;
      }
      for (const matchedKeyword of current.output) {
        const m = matchedKeyword.length;
        const startIdx = i - m + 1;
        matches.push({
          algorithm: "aho-corasick",
          kind: "exact",
          keyword: matchedKeyword,
          matchedText: input.text.substring(startIdx, i + 1),
          // Kasus (case) asli
          start: startIdx,
          end: i + 1,
          comparisons: totalComparisons
        });
      }
    }
    const endMs = performance.now();
    return {
      algorithm: "aho-corasick",
      durationMs: endMs - startMs,
      comparisons: totalComparisons,
      matches
    };
  }

  // src/algorithms/weightedLevenshtein.ts
  var DEFAULT_FUZZY_THRESHOLD = 0.82;
  var MAX_LEN_DIFF = 3;
  var visualSimilars = {
    "O": ["0", "\u039F"],
    "0": ["O", "\u039F"],
    "I": ["1", "L", "\u0399"],
    "1": ["I", "L"],
    "L": ["1", "I"],
    "A": ["4", "\u0391"],
    "4": ["A"],
    "E": ["3", "\u0395"],
    "3": ["E"],
    "S": ["5"],
    "5": ["S"],
    "T": ["7"],
    "7": ["T"],
    "B": ["8"],
    "8": ["B"],
    "G": ["9", "6"],
    "9": ["G"],
    "6": ["G"],
    "Z": ["2"],
    "2": ["Z"],
    "\u0391": ["A", "4"],
    "\u0395": ["E", "3"],
    "\u0399": ["I", "1"],
    "\u039F": ["O", "0"]
  };
  function getSubCost(a, b) {
    if (a === b) return 0;
    const aUpper = a.toUpperCase();
    const bUpper = b.toUpperCase();
    if (aUpper === bUpper) return 0;
    const similarList = visualSimilars[aUpper];
    if (similarList && similarList.includes(bUpper)) return 0.2;
    return 1;
  }
  function calcWLD(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1);
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    let comps = 0;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        comps++;
        const cost = getSubCost(s1[i - 1], s2[j - 1]);
        const delCost = dp[i - 1][j] + 1;
        const insCost = dp[i][j - 1] + 1;
        const subCost = dp[i - 1][j - 1] + cost;
        dp[i][j] = Math.min(delCost, insCost, subCost);
      }
    }
    return { dist: dp[m][n], comps };
  }
  function stripTrailingDigits(s) {
    let endIdx = s.length;
    while (endIdx > 0 && s[endIdx - 1] >= "0" && s[endIdx - 1] <= "9") {
      endIdx--;
    }
    return s.substring(0, endIdx);
  }
  function runWeightedLevenshtein(input) {
    const startMs = performance.now();
    const matches = [];
    let totalComps = 0;
    const { text, unmatchedKeywords, threshold } = input;
    if (unmatchedKeywords.length === 0) {
      return {
        algorithm: "weighted-levenshtein",
        durationMs: performance.now() - startMs,
        comparisons: 0,
        matches: []
      };
    }
    const tokenRegex = /[a-zA-Z0-9\u0391-\u03C9\u0410-\u044F]+/g;
    const tokens = [];
    let execRes;
    while ((execRes = tokenRegex.exec(text)) !== null) {
      tokens.push({ textStr: execRes[0], pos: execRes.index });
    }
    for (const tInfo of tokens) {
      const token = tInfo.textStr;
      const tokenStart = tInfo.pos;
      const wordOnly = stripTrailingDigits(token);
      if (wordOnly.length === 0) continue;
      const wordUpper = wordOnly.toUpperCase();
      for (const keyword of unmatchedKeywords) {
        if (Math.abs(wordUpper.length - keyword.length) > MAX_LEN_DIFF) {
          continue;
        }
        const { dist, comps } = calcWLD(wordUpper, keyword);
        totalComps += comps;
        const maxLen = Math.max(wordUpper.length, keyword.length);
        const similarity = maxLen > 0 ? 1 - dist / maxLen : 1;
        if (similarity === 1) {
          continue;
        }
        if (similarity >= threshold) {
          matches.push({
            algorithm: "weighted-levenshtein",
            kind: "fuzzy",
            keyword,
            matchedText: token,
            start: tokenStart,
            end: tokenStart + token.length,
            comparisons: comps,
            score: similarity
          });
        }
      }
    }
    const endMs = performance.now();
    return {
      algorithm: "weighted-levenshtein",
      durationMs: endMs - startMs,
      comparisons: totalComps,
      matches
    };
  }

  // src/shared/stats.ts
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

  // src/detection/runDetection.ts
  function runDetection(input) {
    const kmpResult = runKmp(input);
    const boyerMooreResult = runBoyerMoore(input);
    const rabinKarpResult = runRabinKarp(input);
    const ahoCorasickResult = runAhoCorasick(input);
    const regexResult = runRegexMatcher(input);
    const exactMatchedKeywords = /* @__PURE__ */ new Set();
    for (const result of [kmpResult, boyerMooreResult, rabinKarpResult, ahoCorasickResult]) {
      for (const match of result.matches) {
        exactMatchedKeywords.add(match.keyword);
      }
    }
    const fuzzyResult = runWeightedLevenshtein({
      ...input,
      unmatchedKeywords: input.keywords,
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
  var STORAGE_BLUR_KEY = "judolDetector:blurEnabled";
  var RESCAN_REQUEST_MESSAGE = "JUDOL_DETECTOR_RESCAN";
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
  var HL_CLASS = "judol-hl";
  var BLUR_CLASS = "judol-blur";
  var TOOLTIP_CLASS = "judol-tooltip";
  var STYLE_ID = "judol-detector-inject-css";
  var HIGHLIGHT_COLORS = {
    exact: "rgba(19, 255, 7, 0.38)",
    regex: "rgba(246, 242, 11, 0.32)",
    fuzzy: "rgba(156, 39, 176, 0.32)"
  };
  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .${HL_CLASS} {
      border-radius: 2px;
      cursor: pointer;
      position: relative;
      transition: filter 0.2s ease;
    }
    .${HL_CLASS}.${BLUR_CLASS} {
      filter: blur(4px);
      user-select: none;
    }
    .${TOOLTIP_CLASS} {
      position: fixed;
      z-index: 2147483647;
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      padding: 10px 14px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      pointer-events: none;
      max-width: 300px;
      display: none;
    }
    .${TOOLTIP_CLASS} b {
      color: #ffd43b;
    }
  `;
    document.head.appendChild(style);
  }
  var tooltipEl = null;
  function getTooltip() {
    if (tooltipEl && document.body.contains(tooltipEl)) {
      return tooltipEl;
    }
    tooltipEl = document.createElement("div");
    tooltipEl.className = TOOLTIP_CLASS;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }
  function showTooltip(e) {
    const span = e.currentTarget;
    const tooltip = getTooltip();
    const keyword = span.dataset.judolKeyword ?? "?";
    const algo = span.dataset.judolAlgo ?? "?";
    const kind = span.dataset.judolKind ?? "exact";
    const count = span.dataset.judolCount ?? "0";
    const time = span.dataset.judolTime ?? "0";
    tooltip.innerHTML = [
      `<b>Keyword:</b> ${keyword}`,
      `<b>Algoritma:</b> ${algo} (${kind})`,
      `<b>Jumlah:</b> ${count}x kemunculan`,
      `<b>Waktu:</b> ${time} ms`
    ].join("<br>");
    tooltip.style.display = "block";
    tooltip.style.left = "-9999px";
    tooltip.style.top = "-9999px";
    const tipWidth = tooltip.offsetWidth;
    const tipHeight = tooltip.offsetHeight;
    let posX = e.clientX + 14;
    let posY = e.clientY + 14;
    if (posX + tipWidth > window.innerWidth) {
      posX = e.clientX - tipWidth - 10;
    }
    if (posY + tipHeight > window.innerHeight) {
      posY = e.clientY - tipHeight - 10;
    }
    tooltip.style.left = `${posX}px`;
    tooltip.style.top = `${posY}px`;
  }
  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.display = "none";
    }
  }
  function groupDetections(detections) {
    const byPos = /* @__PURE__ */ new Map();
    for (const det of detections) {
      const key = `${det.start}:${det.end}`;
      const existing = byPos.get(key);
      if (existing) {
        if (!existing.algos.includes(det.algorithm)) {
          existing.algos.push(det.algorithm);
        }
      } else {
        byPos.set(key, {
          keyword: det.keyword,
          matchedText: det.matchedText,
          start: det.start,
          end: det.end,
          kind: det.kind,
          algos: [det.algorithm]
        });
      }
    }
    return Array.from(byPos.values());
  }
  function findTargetNode(targets, start, end) {
    for (const t of targets) {
      if (start >= t.documentStart && end <= t.documentEnd) {
        return t;
      }
    }
    return null;
  }
  function createDetectionHighlighter() {
    let isBlurActive = false;
    return {
      clear() {
        const allSpans = document.querySelectorAll(`span.${HL_CLASS}`);
        const parentSet = /* @__PURE__ */ new Set();
        allSpans.forEach((span) => {
          const parent = span.parentNode;
          if (!parent) return;
          parentSet.add(parent);
          const textNode = document.createTextNode(span.textContent ?? "");
          parent.replaceChild(textNode, span);
        });
        parentSet.forEach((p) => p.normalize());
        if (tooltipEl && tooltipEl.parentNode) {
          tooltipEl.parentNode.removeChild(tooltipEl);
          tooltipEl = null;
        }
      },
      apply(targets, result) {
        injectCSS();
        if (result.detections.length === 0) return;
        const grouped = groupDetections(result.detections);
        const keywordCounts = {};
        for (const g of grouped) {
          keywordCounts[g.keyword] = (keywordCounts[g.keyword] ?? 0) + 1;
        }
        const algoTimes = {};
        for (const stat of result.algorithmStats) {
          algoTimes[stat.algorithm] = stat.durationMs;
        }
        const matchesByTarget = /* @__PURE__ */ new Map();
        for (const g of grouped) {
          const target = findTargetNode(targets, g.start, g.end);
          if (!target) continue;
          let list = matchesByTarget.get(target.id);
          if (!list) {
            list = [];
            matchesByTarget.set(target.id, list);
          }
          list.push(g);
        }
        for (const target of targets) {
          const targetMatches = matchesByTarget.get(target.id);
          if (!targetMatches || targetMatches.length === 0) continue;
          const node = target.node;
          const textStr = node.nodeValue ?? "";
          const parent = node.parentElement;
          if (!parent) continue;
          const sorted = [...targetMatches].sort((a, b) => {
            if (a.start === b.start) {
              return b.end - a.end;
            }
            return a.start - b.start;
          });
          const fragment = document.createDocumentFragment();
          let cursor = 0;
          for (const match of sorted) {
            const localStart = match.start - target.documentStart;
            const localEnd = match.end - target.documentStart;
            const start = Math.max(0, localStart);
            const end = Math.min(textStr.length, localEnd);
            if (start >= end || start < cursor) continue;
            if (cursor < start) {
              fragment.appendChild(
                document.createTextNode(textStr.substring(cursor, start))
              );
            }
            const span = document.createElement("span");
            span.className = HL_CLASS;
            if (isBlurActive) span.classList.add(BLUR_CLASS);
            const color = HIGHLIGHT_COLORS[match.kind] ?? HIGHLIGHT_COLORS.exact;
            span.style.backgroundColor = color;
            span.dataset.judolKeyword = match.keyword;
            span.dataset.judolAlgo = match.algos.join(", ");
            span.dataset.judolKind = match.kind;
            span.dataset.judolCount = String(keywordCounts[match.keyword] ?? 0);
            const mainAlgo = match.algos[0];
            span.dataset.judolTime = (algoTimes[mainAlgo] ?? 0).toFixed(2);
            span.textContent = textStr.substring(start, end);
            span.addEventListener("mouseenter", showTooltip);
            span.addEventListener("mouseleave", hideTooltip);
            fragment.appendChild(span);
            cursor = end;
          }
          if (cursor < textStr.length) {
            fragment.appendChild(
              document.createTextNode(textStr.substring(cursor))
            );
          }
          parent.replaceChild(fragment, node);
        }
      },
      setBlur(enabled) {
        isBlurActive = enabled;
        document.querySelectorAll(`span.${HL_CLASS}`).forEach((span) => {
          if (enabled) {
            span.classList.add(BLUR_CLASS);
          } else {
            span.classList.remove(BLUR_CLASS);
          }
        });
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
      highlighter.clear();
      const targets = collectTextTargets();
      const text = joinTargetText(targets);
      const result = runDetection({ text, keywords });
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
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === RESCAN_REQUEST_MESSAGE) {
        scheduleScan(0);
      }
    });
  }
})();
//# sourceMappingURL=content.js.map
