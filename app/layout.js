import "./globals.css";

export const metadata = {
  title: "AutoTrade Bot — Paper Trading",
  description: "Paper trading simulator with live charts, MA crossover engine, and risk management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
