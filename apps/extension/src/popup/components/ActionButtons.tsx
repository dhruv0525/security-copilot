import React from "react";

const DASHBOARD_URL = "http://localhost:3000";

export function ActionButtons() {
  const openDashboard = () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/scans` });
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        disabled
        style={{
          flex: 1,
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #374151",
          background: "#1f2937",
          color: "#9ca3af",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "not-allowed",
        }}
      >
        Dashboard Coming Soon
      </button>
    </div>
  );
}
