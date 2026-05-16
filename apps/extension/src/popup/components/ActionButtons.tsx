import React from "react";

const DASHBOARD_URL = "http://localhost:3000";

export function ActionButtons() {
  const openDashboard = () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/scans` });
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={openDashboard}
        style={{
          flex: 1,
          padding: "8px",
          borderRadius: "6px",
          border: "none",
          background: "#111827",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        View in Dashboard →
      </button>
    </div>
  );
}
