interface PageData {
  text: string;
  title: string;
  externalLinkCount: number;
  formCount: number;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "HEAD"]);
const MAX_TEXT_LENGTH = 8_000;

export function extractPageData(): PageData {
  return {
    text: extractVisibleText(),
    title: document.title ?? "",
    externalLinkCount: countExternalLinks(),
    formCount: document.querySelectorAll("form").length,
  };
}

function extractVisibleText(): string {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;

        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const chunks: string[] = [];
  let totalLength = 0;
  let node: Node | null;

  while ((node = walker.nextNode()) && totalLength < MAX_TEXT_LENGTH) {
    const text = (node.textContent ?? "").trim();
    if (text.length > 0) {
      chunks.push(text);
      totalLength += text.length;
    }
  }

  return chunks.join(" ").slice(0, MAX_TEXT_LENGTH);
}

function countExternalLinks(): number {
  const currentHost = window.location.hostname;
  return Array.from(document.querySelectorAll("a[href]")).filter((a) => {
    try {
      const url = new URL((a as HTMLAnchorElement).href);
      return url.hostname !== currentHost;
    } catch {
      return false;
    }
  }).length;
}
