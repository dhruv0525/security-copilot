import { MESSAGE_TYPES } from "../shared/constants";
import { extractPageData } from "./domExtractor";

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.EXTRACT_PAGE_DATA) {
    console.log("[SecurityCopilot Content] Received EXTRACT_PAGE_DATA message");
    try {
      const data = extractPageData();
      console.log("[SecurityCopilot Content] Extraction successful");
      sendResponse({ success: true, data });
    } catch (error) {
      console.error("[SecurityCopilot Content] Error extracting page data:", error);
      sendResponse({ success: false, error: "Failed to extract page content" });
    }
  }
  return true; // Keep message channel open for async sendResponse if needed
});
