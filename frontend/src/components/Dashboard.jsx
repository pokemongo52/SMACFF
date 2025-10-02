import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import PricesList from "./PricesList";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const socket = io(API);

export default function Dashboard() {
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState([]);
  const [appid, setAppid] = useState("730"); // 730 — CS:GO historically (для примера)

  useEffect(() => {
    fetch(`${API}/api/sim/status`).then(r=>r.json()).then(d=>setRunning(d.running));
    fetch(`${API}/api/drops/recent`).then(r=>r.json()).then(d=>setDrops(d.rows || []));

    socket.on("drop", (ev) => {
      setDrops(prev => [{ accountId: ev.accountId, drop: ev.drop, ts: ev.ts }, ...prev].slice(0, 200));
    });
    return () => socket.disconnect();
  }, []);

  const startSim = async () => {
    await fetch(`${API}/api/sim/start`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ intervalMs: 1500 }) });
    setRunning(true);
  };
  const stopSim = async () => {
    await fetch(`${API}/api/sim/stop`, { method: "POST" });
    setRunning(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
      <div>
        <div style={{ marginBottom: 10 }}>
          <button onClick={startSim} disabled={running} style={{ marginRight:8 }}>Start Simulator</button>
          <button onClick={stopSim} disabled={!running}>Stop Simulator</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>AppID для прайс-запроса: </label>
          <input value={appid} onChange={e=>setAppid(e.target.value)} style={{ width:120, marginLeft:8 }} />
        </div>

        <PricesList appid={appid} />

        <h3>Последние дропы (симуляция)</h3>
        <ul>
          {drops.slice(0,50).map((d, i) => (
            <li key={i}>
              [{new Date(d.ts).toLocaleTimeString()}] Аккаунт #{d.accountId} — {d.drop.type} — ${d.drop.value}
            </li>
          ))}
        </ul>
      </div>

      <aside style={{ borderLeft: "1px solid #eee", paddingLeft: 12 }}>
        <h3>Статистика</h3>
        <p>Симулятор: <strong>{running ? "Запущен" : "Остановлен"}</strong></p>
        <p>Всего логов дропов: {drops.length}</p>
      </aside>
    </div>
  );
}
