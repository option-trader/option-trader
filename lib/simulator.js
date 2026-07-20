// Deterministic-ish random walk market simulator.
// One instance per selected stock. Produces 1-second ticks, aggregates them
// into 1-minute base candles, and can seed historical candles so that the
// MA50 / MA200 indicators are populated the moment the chart loads.

const SECONDS_PER_CANDLE = 60; // 1-minute base candle = 60 one-second ticks

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export class MarketSimulator {
  /**
   * @param {object} stock  entry from STOCKS
   * @param {number} seedCandles  how many historical 1-min candles to pre-generate
   */
  constructor(stock, seedCandles = 320) {
    this.stock = stock;
    this.price = stock.base;
    // volatility per tick (fraction of price). Small so a 60-tick candle stays realistic.
    this.vol = 0.0007 * (stock.tick || 1);
    // slow-moving "regime" drift that flips occasionally to create trends/crossovers.
    this.drift = 0;
    this.regimeTicksLeft = 0;

    this.candles = []; // finalized 1-min candles {time, open, high, low, close, volume}
    this.forming = null; // the candle currently being built
    this.tickInCandle = 0;

    this._seed(seedCandles);
  }

  _rand() {
    // Uniform in [-1, 1)
    return Math.random() * 2 - 1;
  }

  _stepRegime() {
    if (this.regimeTicksLeft <= 0) {
      // new regime: mild up / down / flat trend
      const dir = this._rand();
      this.drift = dir * this.vol * 0.35;
      this.regimeTicksLeft = 200 + Math.floor(Math.random() * 400);
    }
    this.regimeTicksLeft--;
  }

  _nextPrice() {
    this._stepRegime();
    // mean reversion pull toward base keeps prices from drifting to zero/infinity
    const reversion = (this.stock.base - this.price) * 0.00002;
    const shock = this.price * this.vol * this._rand();
    const trend = this.price * this.drift;
    let next = this.price + shock + trend + reversion;
    next = clamp(next, this.stock.base * 0.6, this.stock.base * 1.6);
    this.price = Math.round(next * 100) / 100;
    return this.price;
  }

  _seed(count) {
    // Build `count` historical candles ending at the most recent completed minute.
    const now = Math.floor(Date.now() / 1000);
    const startMinute = Math.floor(now / 60) - count;
    for (let i = 0; i < count; i++) {
      const time = (startMinute + i) * 60;
      let open = this.price;
      let high = open;
      let low = open;
      let close = open;
      for (let t = 0; t < SECONDS_PER_CANDLE; t++) {
        close = this._nextPrice();
        high = Math.max(high, close);
        low = Math.min(low, close);
      }
      this.candles.push({
        time,
        open: round2(open),
        high: round2(high),
        low: round2(low),
        close: round2(close),
        volume: 500 + Math.floor(Math.random() * 4500),
      });
    }
    // start the live forming candle at the current minute
    this._startForming();
  }

  _startForming() {
    const minute = Math.floor(Date.now() / 1000 / 60) * 60;
    this.forming = {
      time: minute,
      open: this.price,
      high: this.price,
      low: this.price,
      close: this.price,
      volume: 0,
    };
    this.tickInCandle = 0;
  }

  /**
   * Advance one second. Returns { price, candle, finalized }.
   * `candle` is the current (forming or just-finalized) candle for chart update.
   * `finalized` is true when a candle just closed.
   */
  tick() {
    const price = this._nextPrice();
    return this._applyTick(price);
  }

  /**
   * Advance one second using an externally supplied price (e.g. a live Upstox
   * LTP) instead of the random walk. Candle building works identically, so
   * MAs, SL/TP and the chart don't care where the price came from.
   */
  tickWithPrice(price) {
    this.price = Math.round(price * 100) / 100;
    return this._applyTick(this.price);
  }

  _applyTick(price) {
    const f = this.forming;
    f.close = price;
    f.high = Math.max(f.high, price);
    f.low = Math.min(f.low, price);
    f.volume += 10 + Math.floor(Math.random() * 90);
    this.tickInCandle++;

    let finalized = false;
    let finalizedCandle = null;
    if (this.tickInCandle >= SECONDS_PER_CANDLE) {
      // close this candle, push to history, open the next
      finalizedCandle = { ...f, open: round2(f.open), high: round2(f.high), low: round2(f.low), close: round2(f.close) };
      this.candles.push(finalizedCandle);
      finalized = true;
      this.price = price;
      this._startForming();
    }

    return {
      price,
      candle: finalized ? finalizedCandle : { ...f, open: round2(f.open), high: round2(f.high), low: round2(f.low), close: round2(f.close) },
      finalized,
    };
  }

  /** All 1-min candles including the live forming one. */
  allCandles() {
    return [...this.candles, { ...this.forming }];
  }
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
