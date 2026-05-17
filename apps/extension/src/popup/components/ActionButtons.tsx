import React from "react";

const DASHBOARD_URL = "http://localhost:3000";

interface ActionButtonsProps {
  scanId: string;
}

export function ActionButtons({ scanId }: ActionButtonsProps) {
  const openDashboard = () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/scans/${scanId}` });
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
      <button
        onClick={openDashboard}
        style={{
          flex: 1,
          padding: "8px",
          borderRadius: "6px",
          border: "none",
          background: "#2563eb",
          color: "white",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "center",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      >
        View Full Dashboard Report
      </button>
    </div>
  );
}
