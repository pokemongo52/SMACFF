// server.js - Express + Socket.IO + простой sqlite cache + симулятор контрол
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import Simulator from "./simulator.js";
import sqlite3 from "sqlite3";

dotenv.config();
const PORT = process.env.PORT || 3000;
const STEAM_KEY = process.env.STEAM_API_KEY || "";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: "*" } });

// Simple sqlite db (file created automatically)
const DB_FILE = path.resolve("./db.sqlite");
const dbExists = fs.existsSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  if (!dbExists) {
    db.run(`CREATE TABLE IF NOT EXISTS price_cache (
      appid TEXT,
      payload TEXT,
      fetched_at INTEGER,
      PRIMARY KEY(appid)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      type TEXT,
      value REAL,
      ts INTEGER
    )`);
  }
});

// Simulator instance
const simulator = new Simulator(50); // 50 виртуальных аккаунтов
simulator.on("drop", async (data) => {
  // лог в БД и рассылка через Socket.IO
  const stmt = db.prepare(`INSERT INTO drops (account_id, type, value, ts) VALUES (?, ?, ?, ?)`);
  stmt.run(data.accountId, data.drop.type, data.drop.value, Date.now());
  stmt.finalize();

  io.emit("drop", { accountId: data.accountId, drop: data.drop, ts: Date.now() });
});

// ENDPOINT: Get prices (caching)
app.get("/api/prices/:appid", async (req, res) => {
  const appid = req.params.appid;
  const currency = req.query.currency || "USD";
  const now = Date.now();
  const TTL = 1000 * 60 * 5; // 5 минут кэш

  db.get("SELECT payload, fetched_at FROM price_cache WHERE appid = ?", [appid], async (err, row) => {
    if (err) return res.status(500).json({ error: "db error" });
    if (row && (now - row.fetched_at) < TTL) {
      return res.json({ source: "cache", data: JSON.parse(row.payload) });
    }

    if (!STEAM_KEY) {
      // если ключа нет — возвращаем мок/пустой набор
      const mock = { assets: {}, currency, note: "No STEAM_API_KEY provided. This is mock data." };
      db.run("INSERT OR REPLACE INTO price_cache (appid, payload, fetched_at) VALUES (?, ?, ?)", [appid, JSON.stringify(mock), now]);
      return res.json({ source: "mock", data: mock });
    }

    try {
      const url = `https://api.steampowered.com/ISteamEconomy/GetAssetPrices/v1/?key=${STEAM_KEY}&appid=${appid}&currency=${currency}`;
      const r = await fetch(url);
      if (!r.ok) return res.status(502).json({ error: "Steam API error" });
      const json = await r.json();
      db.run("INSERT OR REPLACE INTO price_cache (appid, payload, fetched_at) VALUES (?, ?, ?)", [appid, JSON.stringify(json), now]);
      res.json({ source: "steam", data: json });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "fetch error" });
    }
  });
});

// Simulator control endpoints
app.post("/api/sim/start", (req, res) => {
  simulator.start(req.body.intervalMs || 2000);
  res.json({ status: "started" });
});
app.post("/api/sim/stop", (req, res) => {
  simulator.stop();
  res.json({ status: "stopped" });
});
app.get("/api/sim/status", (req, res) => {
  res.json({ running: simulator.isRunning(), accounts: simulator.accounts.length });
});

// Get recent drops
app.get("/api/drops/recent", (req, res) => {
  db.all("SELECT * FROM drops ORDER BY ts DESC LIMIT 200", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "db error" });
    res.json({ rows });
  });
});

// Socket.IO connection (for frontend live updates)
io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on("ping", () => socket.emit("pong"));
});

server.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
