// Mock Indian market indices — random walk, updated every 2 seconds.
export const INDICES = [
  { key: "NIFTY", label: "🇮🇳 NIFTY 50", base: 19850.5, vol: 0.0005 },
  { key: "SENSEX", label: "SENSEX", base: 65420.3, vol: 0.0005 },
  { key: "BANKNIFTY", label: "BANKNIFTY", base: 48950.75, vol: 0.0008 },
  { key: "FINNIFTY", label: "FINNIFTY", base: 22180.4, vol: 0.0007 },
];

export class IndexSimulator {
  constructor() {
    // open = today's session open; % change is measured against it
    this.state = Object.fromEntries(
      INDICES.map((ix) => [ix.key, { price: ix.base, open: ix.base, history: [ix.base] }])
    );
  }

  tick() {
    for (const ix of INDICES) {
      const s = this.state[ix.key];
      const shock = s.price * ix.vol * (Math.random() * 2 - 1);
      const reversion = (ix.base - s.price) * 0.001;
      s.price = Math.round((s.price + shock + reversion) * 100) / 100;
      s.history.push(s.price);
      if (s.history.length > 120) s.history.shift(); // ~4 min of 2s points
    }
    return this.snapshot();
  }

  snapshot() {
    return INDICES.map((ix) => {
      const s = this.state[ix.key];
      const changePct = ((s.price - s.open) / s.open) * 100;
      return {
        ...ix,
        price: s.price,
        changePct: Math.round(changePct * 100) / 100,
        up: s.price >= s.open,
        history: s.history,
      };
    });
  }
}
