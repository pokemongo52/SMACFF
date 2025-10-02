// simulator.js - простой EventEmitter симулятор дропов
import EventEmitter from "events";

class Simulator extends EventEmitter {
  constructor(accountCount = 50) {
    super();
    this.accounts = Array.from({ length: accountCount }, (_, i) => ({
      id: i + 1,
      online: true,
      drops: []
    }));
    this.timer = null;
  }

  start(intervalMs = 2000) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const acc = this.accounts[Math.floor(Math.random() * this.accounts.length)];
      const roll = Math.random();
      let drop = null;
      // пример условных вероятностей и цен
      if (roll < 0.02) drop = { type: "stattrak_rare", value: 50.0 };
      else if (roll < 0.08) drop = { type: "rare_case", value: 8.0 };
      else if (roll < 0.25) drop = { type: "case", value: 0.5 };
      else if (roll < 0.6) drop = { type: "crate", value: 0.05 };

      if (drop) {
        acc.drops.push({ time: Date.now(), ...drop });
        this.emit("drop", { accountId: acc.id, drop });
      }
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning() {
    return !!this.timer;
  }
}

export default Simulator;
