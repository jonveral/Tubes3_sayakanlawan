import type { AlgorithmResult, MatcherInput, TextMatch } from "../shared/contracts";

// Bonus Algoritma

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  fail: TrieNode | null = null;
  output: string[] = []; // Menyimpan keyword(s) yang match saat state mencapai node ini
}

export function runAhoCorasick(input: MatcherInput): AlgorithmResult {
  const startMs = performance.now();
  const matches: TextMatch[] = [];
  let totalComparisons = 0;

  const text = input.text.toUpperCase();
  const root = new TrieNode();

  // Membangun Trie dari kumpulan kata kunci
  for (const keyword of input.keywords) {
    if (keyword.length === 0) continue;
    const pattern = keyword.toUpperCase();
    
    let current = root;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.output.push(keyword);
  }

  // Membangun Failure Links
  const queue: TrieNode[] = [];
  for (const child of root.children.values()) {
    child.fail = root;
    queue.push(child);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [char, child] of current.children.entries()) {
      queue.push(child);
      
      let failNode = current.fail;
      while (failNode !== null && !failNode.children.has(char)) {
        totalComparisons++;
        failNode = failNode.fail;
      }
      totalComparisons++;

      if (failNode === null) {
        child.fail = root;
      } else {
        child.fail = failNode.children.get(char)!;
        child.output.push(...child.fail.output);
      }
    }
  }

  // Proses pencarian teks
  let current = root;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    while (current !== root && !current.children.has(char)) {
      totalComparisons++;
      current = current.fail!;
    }
    totalComparisons++;

    if (current.children.has(char)) {
      current = current.children.get(char)!;
    } else {
      current = root;
    }

    // Jika node ini memiliki output, berarti keyword ditemukan
    for (const matchedKeyword of current.output) {
      const m = matchedKeyword.length;
      const startIdx = i - m + 1;
      
      matches.push({
        algorithm: "aho-corasick",
        kind: "exact",
        keyword: matchedKeyword,
        matchedText: input.text.substring(startIdx, i + 1), // Kasus (case) asli
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