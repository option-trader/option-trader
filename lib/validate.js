// Pre-execution validation (v3): all checks happen BEFORE an order is placed.
// Each issue has a message + whether the user may continue anyway.
// After the user confirms, the engine executes as-is with no further complaints.

const inr = (v) => "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

/**
 * Validate an order about to be opened.
 * @returns array of { message, blocking, fix? } — empty = all good.
 */
export function validateOrder({ side, qty, price, slPrice, tpPrice, capital }) {
  const issues = [];
  const dir = side === "LONG" ? 1 : -1;

  if (!qty || qty < 1) {
    issues.push({ message: "Quantity must be at least 1.", blocking: true });
    return issues;
  }

  const cost = price * qty;
  if (cost > capital) {
    const maxQty = Math.max(0, Math.floor(capital / price));
    issues.push({
      message: `You have ${inr(capital)} free. This trade needs ${inr(cost)}.${maxQty >= 1 ? ` Reduce quantity to ${maxQty}?` : ""}`,
      blocking: maxQty < 1,
      fix: maxQty >= 1 ? { qty: maxQty } : null,
      fixLabel: maxQty >= 1 ? `REDUCE TO ${maxQty}` : null,
    });
  }

  if (slPrice) {
    const wrongSide = dir * (price - slPrice) <= 0;
    if (wrongSide) {
      issues.push({
        message: `For ${side === "LONG" ? "LONG buy" : "SHORT sell"}, stop loss should be ${side === "LONG" ? "BELOW" : "ABOVE"} entry. Your entry: ${inr(price)}, stop loss: ${inr(slPrice)}. It will only trigger if price ${side === "LONG" ? "rises above then falls back through" : "falls below then rises back through"} it.`,
        blocking: false,
      });
    }
  }

  if (tpPrice) {
    const wrongSide = dir * (tpPrice - price) <= 0;
    if (wrongSide) {
      issues.push({
        message: `For ${side}, take profit should be ${side === "LONG" ? "ABOVE" : "BELOW"} entry. Your entry: ${inr(price)}, target: ${inr(tpPrice)}.`,
        blocking: false,
      });
    }
  }

  if (slPrice && tpPrice && Math.abs(slPrice - tpPrice) < 0.01) {
    issues.push({ message: "Stop loss and take profit are the same price.", blocking: false });
  }

  return issues;
}

/**
 * Validate an AUTO strategy before START.
 * buyLevel/sellLevel are the trigger prices; sl/tp optional risk prices.
 */
export function validateAutoStrategy({ buyLevel, sellLevel, slPrice, tpPrice, qty, price, capital }) {
  const issues = [];

  if (!buyLevel && !sellLevel) {
    issues.push({ message: "Set at least a BUY or SELL price level.", blocking: true });
    return issues;
  }

  if (buyLevel && sellLevel && +buyLevel >= +sellLevel) {
    issues.push({
      message: `Buy price (${inr(buyLevel)}) should be LESS than sell price (${inr(sellLevel)}) — buy low, sell high. As set, the bot would buy high and sell low.`,
      blocking: false,
    });
  }

  if (buyLevel && slPrice && +slPrice >= +buyLevel) {
    issues.push({
      message: `Stop loss (${inr(slPrice)}) is ABOVE your buy price (${inr(buyLevel)}). This won't work for LONG — it will only trigger after price rises past it and falls back.`,
      blocking: false,
    });
  }

  if (buyLevel && tpPrice && +tpPrice <= +buyLevel) {
    issues.push({
      message: `Take profit (${inr(tpPrice)}) is BELOW your buy price (${inr(buyLevel)}). It would trigger immediately after buying.`,
      blocking: false,
    });
  }

  if (qty && buyLevel && qty * buyLevel > capital) {
    const maxQty = Math.max(0, Math.floor(capital / buyLevel));
    issues.push({
      message: `Buying ${qty} at ${inr(buyLevel)} needs ${inr(qty * buyLevel)}, but you have ${inr(capital)} free.${maxQty >= 1 ? ` Reduce quantity to ${maxQty}?` : ""}`,
      blocking: maxQty < 1,
      fix: maxQty >= 1 ? { qty: maxQty } : null,
      fixLabel: maxQty >= 1 ? `REDUCE TO ${maxQty}` : null,
    });
  }

  return issues;
}
