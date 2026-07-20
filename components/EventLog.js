"use client";

const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-IN", { hour12: false });

// Icon accents by message content — colored dot instead of relying on emoji alone
const dotFor = (msg) => {
  if (msg.includes("BOUGHT") || msg.includes("BUY")) return "bg-bull";
  if (msg.includes("SOLD") || msg.includes("SELL") || msg.includes("STOP")) return "bg-bear";
  if (msg.includes("Complete") || msg.includes("LOCKED") || msg.includes("AUTO")) return "bg-gold";
  return "bg-zinc-600";
};

export default function EventLog({ events }) {
  return (
    <div className="card-3d glass flex h-full max-h-[240px] flex-col rounded-xl border border-ink-500 lg:max-h-none">
      <div className="border-b border-ink-500 px-3 py-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Activity Log</h2>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-2 font-mono text-[11px]">
        {events.length === 0 ? (
          <p className="p-2 text-center text-zinc-600">Bot activity will appear here.</p>
        ) : (
          events.map((e, i) => (
            <div
              key={e.id ?? `${e.time}-${i}`}
              className={`flex items-center gap-2 rounded px-1.5 py-0.5 transition-colors duration-150 hover:bg-ink-600/60 ${
                i === 0 ? "animate-slide-in" : ""
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotFor(e.msg)}`} />
              <span className="shrink-0 text-zinc-600">{fmtTime(e.time)}</span>
              <span className="text-zinc-300">{e.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
