// Paper trading engine: simulated execution, open positions, closed trade
// history, stop-loss / take-profit enforcement, daily loss limit, and stats.
//
// Philosophy (v3): the engine does EXACTLY what it's told. All validation
// happens in the UI *before* an order reaches the engine — so the engine never
// warns, never drops levels, never second-guesses. The activity log contains
// executed trades only.
//
// SL/TP are cross-triggered: they fire when price CROSSES the level in the
// adverse/favourable direction, so a level the user confirmed "on the wrong
// side" simply never fires until price genuinely crosses it — no complaints.

let nextId = 1;

export class TradingEngine {
  constructor({ capital = 500000, dailyLossLimit = 10000 } = {}) {
    this.startingCapital = capital;
    this.capital = capital; // free cash
    this.dailyLossLimit = dailyLossLimit;
    this.trades = []; // closed trades
    this.positions = []; // open positions
    this.paused = false; // set when daily loss limit is hit
    this.events = []; // trade log lines (newest first)
    this._evId = 0; // monotonically-increasing event id (stable animation keys)
    this.onChange = null; // optional hook, called after every trade (for persistence)
  }

  _log(msg) {
    this.events.unshift({ id: ++this._evId, time: Date.now(), msg });
    if (this.events.length > 100) this.events.pop();
  }

  _changed() {
    if (this.onChange) this.onChange(this);
  }

  /** Restore closed trades + realized capital from a saved snapshot. */
  hydrate(saved) {
    if (!saved) return;
    if (Array.isArray(saved.trades)) this.trades = saved.trades;
    if (typeof saved.capital === "number") this.capital = saved.capital;
    if (Array.isArray(saved.events)) this.events = saved.events;
    const maxId = Math.max(0, ...this.trades.map((t) => t.id || 0));
    if (maxId >= nextId) nextId = maxId + 1;
    this._checkLossLimit();
  }

  serialize() {
    return { trades: this.trades, capital: this.capital, events: this.events.slice(0, 50) };
  }

  realizedPnl() {
    return this.trades.reduce((s, t) => s + t.pnl, 0);
  }

  unrealizedPnl(priceMap) {
    return this.positions.reduce((s, p) => {
      const price = priceMap[p.symbol];
      if (price == null) return s;
      return s + pnlFor(p, price);
    }, 0);
  }

  equity(priceMap) {
    return this.startingCapital + this.realizedPnl() + this.unrealizedPnl(priceMap);
  }

  _checkLossLimit() {
    if (!this.paused && this.realizedPnl() <= -this.dailyLossLimit) {
      this.paused = true;
    }
  }

  positionFor(symbol) {
    return this.positions.find((p) => p.symbol === symbol) || null;
  }

  /**
   * Open a position exactly as instructed. side: 'LONG' | 'SHORT'.
   * SL/TP: absolute prices (stopLossPrice/takeProfitPrice) or percentages.
   * Caller is responsible for validation — this executes as-is.
   * Returns the position, or null only for hard failures (paused / cash).
   */
  open({ symbol, side, qty, price, stopLossPct, takeProfitPct, stopLossPrice, takeProfitPrice, mode }) {
    if (this.paused) return null;
    qty = Math.max(1, Math.floor(qty || 1));
    const cost = price * qty;
    if (cost > this.capital) return null;
    const dir = side === "LONG" ? 1 : -1;
    const position = {
      id: nextId++,
      symbol,
      side,
      qty,
      entry: price,
      entryTime: Date.now(),
      lastPrice: price, // for cross-based SL/TP triggering
      stopLoss: stopLossPrice ? round2(+stopLossPrice) : stopLossPct ? round2(price * (1 - dir * stopLossPct / 100)) : null,
      takeProfit: takeProfitPrice ? round2(+takeProfitPrice) : takeProfitPct ? round2(price * (1 + dir * takeProfitPct / 100)) : null,
      mode: mode || "MANUAL",
    };
    this.capital -= cost;
    this.positions.push(position);
    this._log(`✅ ${side === "LONG" ? "BOUGHT" : "SHORTED"} ${qty} ${symbol} @ ₹${fmt(price)} (${position.mode})`);
    this._changed();
    return position;
  }

  /**
   * Close an open position (fully, or partially with `qty`) at `price`.
   * reason: 'MANUAL'|'STOP LOSS'|'TAKE PROFIT'|'SIGNAL'.
   */
  close(positionId, price, reason = "MANUAL", qty = null) {
    const idx = this.positions.findIndex((p) => p.id === positionId);
    if (idx === -1) return null;
    const p = this.positions[idx];
    const closeQty = Math.min(Math.max(1, Math.floor(qty || p.qty)), p.qty);
    const closedPart = { ...p, qty: closeQty };
    const pnl = round2(pnlFor(closedPart, price));
    this.capital += p.entry * closeQty + pnl;
    if (closeQty >= p.qty) {
      this.positions.splice(idx, 1);
    } else {
      p.qty -= closeQty;
    }
    const trade = {
      id: nextId++,
      symbol: p.symbol,
      side: p.side,
      qty: closeQty,
      entry: p.entry,
      exit: price,
      entryTime: p.entryTime,
      exitTime: Date.now(),
      pnl,
      reason,
      mode: p.mode,
    };
    this.trades.unshift(trade);
    const tag = reason === "MANUAL" || reason === "SIGNAL" ? p.mode : reason;
    this._log(
      `🔴 ${p.side === "LONG" ? "SOLD" : "COVERED"} ${closeQty} ${p.symbol} @ ₹${fmt(price)} | P&L: ${pnl >= 0 ? "+" : ""}₹${fmt(pnl)} (${tag})`
    );
    this._checkLossLimit();
    this._changed();
    return trade;
  }

  /**
   * Called on every price tick. Cross-triggers stop loss / take profit:
   * fires only when price crosses the level since the last tick, so levels
   * placed on the "wrong side" of entry stay dormant instead of firing
   * instantly (user was warned before placing them — bot executes as told).
   */
  onTick(symbol, price) {
    const closed = [];
    for (const p of [...this.positions]) {
      if (p.symbol !== symbol) continue;
      const prev = p.lastPrice ?? p.entry;
      const dir = p.side === "LONG" ? 1 : -1;
      const slHit =
        p.stopLoss != null &&
        (dir === 1 ? prev > p.stopLoss && price <= p.stopLoss : prev < p.stopLoss && price >= p.stopLoss);
      const tpHit =
        p.takeProfit != null &&
        (dir === 1 ? prev < p.takeProfit && price >= p.takeProfit : prev > p.takeProfit && price <= p.takeProfit);
      if (slHit) {
        closed.push(this.close(p.id, price, "STOP LOSS"));
      } else if (tpHit) {
        closed.push(this.close(p.id, price, "TAKE PROFIT"));
      } else {
        p.lastPrice = price;
      }
    }
    return closed;
  }

  stats(priceMap = {}) {
    const total = this.trades.length;
    const wins = this.trades.filter((t) => t.pnl > 0).length;
    const losses = total - wins;
    const realized = round2(this.realizedPnl());
    const unrealized = round2(this.unrealizedPnl(priceMap));
    const winTrades = this.trades.filter((t) => t.pnl > 0);
    const lossTrades = this.trades.filter((t) => t.pnl <= 0);
    return {
      totalTrades: total,
      wins,
      losses,
      winRate: total ? Math.round((wins / total) * 100) : 0,
      realizedPnl: realized,
      unrealizedPnl: unrealized,
      totalPnl: round2(realized + unrealized),
      avgWin: winTrades.length ? round2(winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length) : 0,
      avgLoss: lossTrades.length ? round2(lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length) : 0,
      capital: round2(this.capital),
      equity: round2(this.equity(priceMap)),
      startingCapital: this.startingCapital,
      openPositions: this.positions.length,
      paused: this.paused,
    };
  }

  /** Resume after daily-loss pause (user acknowledgment). */
  resume() {
    this.paused = false;
  }
}

function pnlFor(position, price) {
  const dir = position.side === "LONG" ? 1 : -1;
  return dir * (price - position.entry) * position.qty;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

function fmt(v) {
  return Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
