import { MESSAGE_TYPES } from "../shared/constants";
import { extractPageData } from "./domExtractor";

// On page load, if we are on the dashboard/webapp domain, let's try reading the access token cookie and sync it to the extension storage
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")?.[1];
  
  if (token) {
    console.log("[SecurityCopilot Content] Syncing auth token to extension storage");
    chrome.runtime.sendMessage({
      type: "SYNC_AUTH_TOKEN",
      payload: { token }
    });
  }
}

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
