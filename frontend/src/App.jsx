import React from "react";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h1>Steam Analytics & Simulator</h1>
      <p style={{ color: "#666" }}>Легальный дашборд: реальный прайс через Steam API (опционально) + локальный симулятор дропов</p>
      <Dashboard />
    </div>
  );
}
