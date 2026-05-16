interface PageData {
  text: string;
  title: string;
  externalLinkCount: number;
  formCount: number;
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "HEAD"]);
const MAX_TEXT_LENGTH = 8_000;

export function extractPageData(): PageData {
  let text = "";
  let title = "";
  let externalLinkCount = 0;
  let formCount = 0;

  try {
    text = extractVisibleText();
  } catch (e) {
    console.warn("[SecurityCopilot Content] Failed to extract text:", e);
  }

  try {
    title = document.title ?? "";
  } catch (e) {
    console.warn("[SecurityCopilot Content] Failed to extract title:", e);
  }

  try {
    externalLinkCount = countExternalLinks();
  } catch (e) {
    console.warn("[SecurityCopilot Content] Failed to count links:", e);
  }

  try {
    formCount = document.querySelectorAll("form").length;
  } catch (e) {
    console.warn("[SecurityCopilot Content] Failed to count forms:", e);
  }

  return { text, title, externalLinkCount, formCount };
}

function extractVisibleText(): string {
  if (!document.body) {
    console.warn("[SecurityCopilot Content] document.body is null");
    return "";
  }

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
