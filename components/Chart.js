"use client";

import { useEffect, useRef } from "react";
import { createChart, CrosshairMode, LineStyle } from "lightweight-charts";

// TradingView Lightweight Charts wrapper.
// - Full setData() when the stock or timeframe changes (resetKey)
// - Cheap series.update() for the live bar on every tick
// - Buy/sell markers when conditions fire
// - Horizontal price lines for user-defined levels (BUY/SELL/SL/TP)
// - Optional MA50/MA200 overlay

export default function Chart({ candles, ma50, ma200, showMA, signals, levels, resetKey }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const priceLinesRef = useRef([]);
  const lastResetKey = useRef(null);
  const lastSignalCount = useRef(-1);
  const lastLevelsKey = useRef("");

  // create chart once
  useEffect(() => {
    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "#111114" },
        textColor: "#9a9aa5",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1c1c22" },
        horzLines: { color: "#1c1c22" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2a33" },
      timeScale: {
        borderColor: "#2a2a33",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    const ma50Series = chart.addLineSeries({
      color: "#e0b64a",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "MA50",
    });
    const ma200Series = chart.addLineSeries({
      color: "#7e8ce0",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "MA200",
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = { candleSeries, ma50Series, ma200Series, volumeSeries };

    const onResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // MA visibility toggle
  useEffect(() => {
    const s = seriesRef.current;
    if (!s.ma50Series) return;
    s.ma50Series.applyOptions({ visible: !!showMA });
    s.ma200Series.applyOptions({ visible: !!showMA });
  }, [showMA]);

  // data updates
  useEffect(() => {
    const s = seriesRef.current;
    if (!s.candleSeries || !candles?.length) return;

    if (lastResetKey.current !== resetKey) {
      // full reload (stock / timeframe switch)
      s.candleSeries.setData(candles);
      s.ma50Series.setData(ma50);
      s.ma200Series.setData(ma200);
      s.volumeSeries.setData(candles.map(volBar));
      chartRef.current?.timeScale().scrollToRealTime();
      lastResetKey.current = resetKey;
      lastSignalCount.current = -1;
    } else {
      // live tick: update only the last bar / points
      s.candleSeries.update(candles[candles.length - 1]);
      s.volumeSeries.update(volBar(candles[candles.length - 1]));
      if (ma50.length) s.ma50Series.update(ma50[ma50.length - 1]);
      if (ma200.length) s.ma200Series.update(ma200[ma200.length - 1]);
    }

    if (signals && signals.length !== lastSignalCount.current) {
      s.candleSeries.setMarkers(
        signals.map((sig) => ({
          time: sig.time,
          position: sig.type === "BUY" ? "belowBar" : "aboveBar",
          color: sig.type === "BUY" ? "#26a69a" : "#ef5350",
          shape: "circle",
          text: sig.text || sig.type,
        }))
      );
      lastSignalCount.current = signals.length;
    }
  }, [candles, ma50, ma200, signals, resetKey]);

  // user-defined horizontal levels (BUY/SELL/SL/TP lines)
  useEffect(() => {
    const s = seriesRef.current;
    if (!s.candleSeries) return;
    const key = JSON.stringify(levels || []);
    if (key === lastLevelsKey.current) return;
    lastLevelsKey.current = key;

    for (const line of priceLinesRef.current) {
      try {
        s.candleSeries.removePriceLine(line);
      } catch {}
    }
    priceLinesRef.current = [];

    for (const lvl of levels || []) {
      if (!lvl?.price || !isFinite(lvl.price)) continue;
      priceLinesRef.current.push(
        s.candleSeries.createPriceLine({
          price: lvl.price,
          color: lvl.color,
          lineWidth: 1,
          lineStyle: lvl.dashed ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title: lvl.title,
        })
      );
    }
  }, [levels]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function volBar(c) {
  return {
    time: c.time,
    value: c.volume || 0,
    color: c.close >= c.open ? "rgba(38,166,154,0.35)" : "rgba(239,83,80,0.35)",
  };
}
