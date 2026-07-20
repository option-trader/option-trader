"use client";

import { motion, AnimatePresence } from "framer-motion";

// Pre-execution validation dialog. Shown BEFORE placing an order when
// something looks wrong. User can fix, continue anyway, or cancel.
// Once confirmed, the bot executes as instructed — no complaints later.
export default function ValidationModal({ validation, onContinue, onFix, onCancel }) {
  const issues = validation?.issues || [];
  const blocking = issues.some((i) => i.blocking);
  const fixable = issues.find((i) => i.fix);

  return (
    <AnimatePresence>
      {validation && (
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
            className="w-full max-w-md rounded-xl border border-bear/50 bg-ink-800 p-5"
          >
            <div className="mb-3 text-lg font-black text-bear">⚠️ Check your order</div>
            <ul className="mb-4 space-y-2">
              {issues.map((issue, i) => (
                <li key={i} className="rounded-md bg-ink-700 p-2.5 text-xs leading-relaxed text-zinc-300">
                  {issue.message}
                </li>
              ))}
            </ul>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${1 + (fixable ? 1 : 0) + (blocking ? 0 : 1)}, 1fr)` }}>
              {!blocking && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onContinue}
                  className="rounded-md bg-gold p-2.5 text-xs font-bold text-ink-900 hover:bg-gold-light"
                >
                  CONTINUE ANYWAY
                </motion.button>
              )}
              {fixable && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onFix(fixable.fix)}
                  className="rounded-md bg-bull p-2.5 text-xs font-bold text-white hover:brightness-110"
                >
                  {fixable.fixLabel || "FIX IT"}
                </motion.button>
              )}
              <button
                onClick={onCancel}
                className="rounded-md border border-ink-500 bg-ink-700 p-2.5 text-xs font-bold text-zinc-400 hover:border-zinc-500"
              >
                {blocking ? "GO BACK" : "CANCEL"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
