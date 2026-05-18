const DEFAULT_KEYWORD_PATH = "keywords/keywords.txt";

export function parseKeywords(source: string): string[] {
  const keywords: string[] = [];
  const seen = new Set<string>();

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

export async function loadKeywords(path = DEFAULT_KEYWORD_PATH): Promise<string[]> {
  const url = chrome.runtime.getURL(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load keywords from ${path}`);
  }

  return parseKeywords(await response.text());
}
