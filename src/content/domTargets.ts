import type { TextScanTarget } from "../shared/contracts";

export interface DomTextScanTarget extends TextScanTarget {
  node: Text;
}

const SKIPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION"
]);

function acceptsTextNode(node: Text): boolean {
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

export function collectTextTargets(root: ParentNode = document.body): DomTextScanTarget[] {
  const targets: DomTextScanTarget[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return acceptsTextNode(node as Text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  let current = walker.nextNode();
  let cursor = 0;
  let id = 0;

  while (current !== null) {
    const textNode = current as Text;
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

export function joinTargetText(targets: readonly TextScanTarget[]): string {
  return targets.map((target) => target.text).join("\n");
}
