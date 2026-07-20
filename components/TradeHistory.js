"use client";

const inr = (v) =>
  "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-IN", { hour12: false });

// Trade history: closed trades + open positions (as OPEN rows), with the
// summary stats strip the spec asks for below the table.
export default function TradeHistory({ trades, positions, prices, stats }) {
  const openRows = positions.map((p) => {
    const price = prices[p.symbol];
    const dir = p.side === "LONG" ? 1 : -1;
    return {
      ...p,
      isOpen: true,
      exit: price,
      exitTime: null,
      pnl: price != null ? dir * (price - p.entry) * p.qty : 0,
    };
  });
  const rows = [...openRows, ...trades];

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-500 bg-ink-800">
      <div className="flex items-center justify-between border-b border-ink-500 px-3 py-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Trade History</h2>
        <span className="text-[11px] text-zinc-500">
          {trades.length} closed · {positions.length} open
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="p-4 text-center text-xs text-zinc-600">No trades yet. Start AUTO or trade manually.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-ink-700 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-1.5">Time</th>
                <th className="px-3 py-1.5">Stock</th>
                <th className="px-3 py-1.5">Type</th>
                <th className="px-3 py-1.5 text-right">Qty</th>
                <th className="px-3 py-1.5 text-right">Entry Price</th>
                <th className="px-3 py-1.5 text-right">Exit Price</th>
                <th className="px-3 py-1.5 text-right">P&L</th>
                <th className="px-3 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((t) => (
                <tr key={`${t.isOpen ? "o" : "c"}${t.id}`} className={`border-t border-ink-600/60 hover:bg-ink-700/50 ${t.isOpen ? "bg-gold/5" : ""}`}>
                  <td className="px-3 py-1.5 text-zinc-400">{fmtTime(t.exitTime || t.entryTime)}</td>
                  <td className="px-3 py-1.5 text-zinc-200">{t.symbol}</td>
                  <td className={`px-3 py-1.5 font-bold ${t.side === "LONG" ? "text-bull" : "text-bear"}`}>{t.side}</td>
                  <td className="px-3 py-1.5 text-right">{t.qty}</td>
                  <td className="px-3 py-1.5 text-right">{inr(t.entry)}</td>
                  <td className="px-3 py-1.5 text-right">{t.exit != null ? inr(t.exit) : "—"}</td>
                  <td className={`px-3 py-1.5 text-right font-bold ${t.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                    {t.pnl >= 0 ? "+" : ""}
                    {inr(t.pnl)}
                  </td>
                  <td className="px-3 py-1.5">
                    {t.isOpen ? (
                      <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">OPEN</span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">CLOSED · {t.reason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* stats strip below table (per spec) */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-500 px-3 py-1.5 text-[11px] text-zinc-500">
        <span>Total: <b className="text-zinc-300">{stats.totalTrades + positions.length}</b></span>
        <span>Closed: <b className="text-zinc-300">{stats.totalTrades}</b></span>
        <span>Open: <b className="text-zinc-300">{positions.length}</b></span>
        <span>Win Rate: <b className={stats.winRate >= 50 ? "text-bull" : "text-zinc-300"}>{stats.winRate}%</b></span>
        <span>Avg Win: <b className="text-bull">+{inr(stats.avgWin)}</b></span>
        <span>Avg Loss: <b className="text-bear">{inr(stats.avgLoss)}</b></span>
        <span>
          Total P&L: <b className={stats.totalPnl >= 0 ? "text-bull" : "text-bear"}>{stats.totalPnl >= 0 ? "+" : ""}{inr(stats.totalPnl)}</b>
        </span>
      </div>
    </div>
  );
}
