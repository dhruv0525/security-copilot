import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { storage } from "../shared/storage";
import { STORAGE_KEYS } from "../shared/constants";

function Options() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.get<string>(STORAGE_KEYS.authToken).then((t) => {
      if (t) setToken(t);
    });
  }, []);

  const handleSave = async () => {
    await storage.set(STORAGE_KEYS.authToken, token.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>
        🛡 Security Copilot Settings
      </h1>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
        API Auth Token
      </label>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your access token from the dashboard"
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          fontSize: "13px",
          marginBottom: "12px",
        }}
      />
      <button
        onClick={handleSave}
        style={{
          padding: "8px 20px",
          borderRadius: "6px",
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(<React.StrictMode><Options /></React.StrictMode>);

export {};
