"use client";

import { motion, AnimatePresence } from "framer-motion";

const inr = (v) =>
  "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// 2-step confirmation dialog shown when a signal fires in "Ask me first" mode.
export default function SignalModal({ signal, onYes, onNo }) {
  return (
    <AnimatePresence>
      {signal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="gold-glow w-full max-w-sm rounded-xl border border-gold/40 bg-ink-800 p-5"
          >
            <div className={`mb-1 text-lg font-black ${signal.type === "BUY" ? "text-bull" : "text-bear"}`}>
              {signal.type === "BUY" ? "🟢 BUY SIGNAL!" : "🔴 SELL SIGNAL!"}
            </div>
            <p className="mb-1 text-sm text-zinc-300">
              {signal.symbol} — {signal.reason}
            </p>
            <p className="mb-4 font-mono text-2xl text-gold-light">{inr(signal.price)}</p>
            <p className="mb-3 text-xs text-zinc-500">
              Execute {signal.type === "BUY" ? "buy" : "sell"} of <b className="text-zinc-300">{signal.qty}</b> shares now?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onYes}
                className={`rounded-md p-2.5 text-sm font-bold text-white ${signal.type === "BUY" ? "bg-bull" : "bg-bear"}`}
              >
                ✅ YES, EXECUTE
              </motion.button>
              <button
                onClick={onNo}
                className="rounded-md border border-ink-500 bg-ink-700 p-2.5 text-sm font-bold text-zinc-400 hover:border-zinc-500"
              >
                ❌ NO, SKIP
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
