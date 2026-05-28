import type { ScanResult, TextMatch, MatchKind } from "../shared/contracts";
import type { DomTextScanTarget } from "./domTargets";

const HL_CLASS = "judol-hl";
const BLUR_CLASS = "judol-blur";
const TOOLTIP_CLASS = "judol-tooltip";
const STYLE_ID = "judol-detector-inject-css";

const HIGHLIGHT_COLORS: Record<string, string> = {
  exact: "rgba(19, 255, 7, 0.38)",     
  regex: "rgba(246, 242, 11, 0.32)",     
  fuzzy: "rgba(156, 39, 176, 0.32)",     
};

export interface DetectionHighlighter {
  clear(): void;
  apply(targets: readonly DomTextScanTarget[], result: ScanResult): void;
  setBlur(enabled: boolean): void;
}

// Inject elemen styling ke header halaman 
function injectCSS(): void {
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

let tooltipEl: HTMLDivElement | null = null;

function getTooltip(): HTMLDivElement {
  if (tooltipEl && document.body.contains(tooltipEl)) {
    return tooltipEl;
  }
  tooltipEl = document.createElement("div");
  tooltipEl.className = TOOLTIP_CLASS;
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function showTooltip(e: MouseEvent): void {
  const span = e.currentTarget as HTMLElement;
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
    `<b>Waktu:</b> ${time} ms`,
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

function hideTooltip(): void {
  if (tooltipEl) {
    tooltipEl.style.display = "none";
  }
}

interface MatchGroup {
  keyword: string;
  matchedText: string;
  start: number;
  end: number;
  kind: MatchKind;
  algos: string[];
}

// Gabungin match yg koordinatnya sama
function groupDetections(detections: readonly TextMatch[]): MatchGroup[] {
  const byPos = new Map<string, MatchGroup>();

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
        algos: [det.algorithm],
      });
    }
  }

  return Array.from(byPos.values());
}

function findTargetNode(
  targets: readonly DomTextScanTarget[],
  start: number,
  end: number
): DomTextScanTarget | null {
  for (const t of targets) {
    if (start >= t.documentStart && end <= t.documentEnd) {
      return t;
    }
  }
  return null;
}

export function createDetectionHighlighter(): DetectionHighlighter {
  let isBlurActive = false;

  return {
    clear() {
      const allSpans = document.querySelectorAll(`span.${HL_CLASS}`);
      const parentSet = new Set<Node>();

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

    apply(targets: readonly DomTextScanTarget[], result: ScanResult) {
      injectCSS();

      if (result.detections.length === 0) return;

      const grouped = groupDetections(result.detections);

      const keywordCounts: Record<string, number> = {};
      for (const g of grouped) {
        keywordCounts[g.keyword] = (keywordCounts[g.keyword] ?? 0) + 1;
      }

      const algoTimes: Record<string, number> = {};
      for (const stat of result.algorithmStats) {
        algoTimes[stat.algorithm] = stat.durationMs;
      }

      const matchesByTarget = new Map<string, MatchGroup[]>();

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

        // Urutin berdasarkan posisi awal, lalu prioritasin string yg terpanjang
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

    setBlur(enabled: boolean) {
      isBlurActive = enabled;

      document.querySelectorAll(`span.${HL_CLASS}`).forEach((span) => {
        if (enabled) {
          span.classList.add(BLUR_CLASS);
        } else {
          span.classList.remove(BLUR_CLASS);
        }
      });
    },
  };
}
