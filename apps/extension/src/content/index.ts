import { MESSAGE_TYPES, POPUP_CACHE_TTL_MS } from "../shared/constants";
import { extractPageData } from "./domExtractor";

let lastScannedUrl: string | null = null;
let lastScannedAt: number | null = null;

async function analyzeCurrentPage(): Promise<void> {
  const currentUrl = window.location.href;
  const now = Date.now();

  // Debounce: skip if same URL scanned within TTL
  if (
    lastScannedUrl === currentUrl &&
    lastScannedAt !== null &&
    now - lastScannedAt < POPUP_CACHE_TTL_MS
  ) {
    return;
  }

  const pageData = extractPageData();

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SCAN_URL,
    payload: {
      url: currentUrl,
      page_text: pageData.text,
      page_title: pageData.title,
      external_link_count: pageData.externalLinkCount,
      form_count: pageData.formCount,
    },
  });

  lastScannedUrl = currentUrl;
  lastScannedAt = now;
}

// Run on initial load
analyzeCurrentPage();

// Re-run on SPA navigation
let previousUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    analyzeCurrentPage();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
