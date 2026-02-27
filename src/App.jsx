import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_PORTFOLIO = [
  // Tech
  { id: 1, ticker: "AAPL",  name: "Apple Inc.",           sector: "Tech",     price: 189.30, change: 1.24,  shares: 15,  currency: "USD" },
  { id: 2, ticker: "MSFT",  name: "Microsoft Corp.",       sector: "Tech",     price: 378.85, change: -0.82, shares: 8,   currency: "USD" },
  { id: 3, ticker: "NVDA",  name: "NVIDIA Corp.",          sector: "Tech",     price: 495.22, change: 3.41,  shares: 12,  currency: "USD" },
  { id: 4, ticker: "GOOGL", name: "Alphabet Inc.",         sector: "Tech",     price: 140.93, change: 0.65,  shares: 20,  currency: "USD" },
  { id: 5, ticker: "META",  name: "Meta Platforms",        sector: "Tech",     price: 502.17, change: 2.18,  shares: 6,   currency: "USD" },
  { id: 6, ticker: "TSLA",  name: "Tesla Inc.",            sector: "Tech",     price: 245.08, change: -2.33, shares: 10,  currency: "USD" },
  { id: 7, ticker: "AMZN",  name: "Amazon.com Inc.",       sector: "Tech",     price: 185.57, change: 1.05,  shares: 18,  currency: "USD" },
  // Consumer
  { id: 8, ticker: "SBUX",  name: "Starbucks Corp.",       sector: "Consumer", price: 82.41,  change: -0.45, shares: 25,  currency: "USD" },
  { id: 9, ticker: "NKE",   name: "Nike Inc.",             sector: "Consumer", price: 93.12,  change: 0.88,  shares: 15,  currency: "USD" },
  { id: 10,ticker: "MCD",   name: "McDonald's Corp.",      sector: "Consumer", price: 291.40, change: 0.33,  shares: 5,   currency: "USD" },
  { id: 11,ticker: "COST",  name: "Costco Wholesale",      sector: "Consumer", price: 912.30, change: 1.12,  shares: 3,   currency: "USD" },
  // Finance
  { id: 12,ticker: "JPM",   name: "JPMorgan Chase",        sector: "Finance",  price: 198.45, change: -0.22, shares: 12,  currency: "USD" },
  { id: 13,ticker: "BAC",   name: "Bank of America",       sector: "Finance",  price: 37.82,  change: 0.55,  shares: 50,  currency: "USD" },
  { id: 14,ticker: "GS",    name: "Goldman Sachs",         sector: "Finance",  price: 478.90, change: -1.10, shares: 4,   currency: "USD" },
  { id: 15,ticker: "BRK-B", name: "Berkshire Hathaway B",  sector: "Finance",  price: 358.20, change: 0.41,  shares: 8,   currency: "USD" },
  // ETF
  { id: 16,ticker: "SPY",   name: "SPDR S&P 500 ETF",      sector: "ETF",      price: 492.31, change: 0.78,  shares: 10,  currency: "USD" },
  { id: 17,ticker: "QQQ",   name: "Invesco Nasdaq ETF",    sector: "ETF",      price: 421.88, change: 1.02,  shares: 8,   currency: "USD" },
  { id: 18,ticker: "VTI",   name: "Vanguard Total Mkt",    sector: "ETF",      price: 238.14, change: 0.55,  shares: 15,  currency: "USD" },
  { id: 19,ticker: "SCHD",  name: "Schwab Dividend ETF",   sector: "ETF",      price: 79.22,  change: 0.18,  shares: 30,  currency: "USD" },
  // ADR
  { id: 20,ticker: "TSM",   name: "TSMC (ADR)",            sector: "ADR",      price: 168.40, change: 2.90,  shares: 20,  currency: "USD" },
  { id: 21,ticker: "ASML",  name: "ASML Holding (ADR)",    sector: "ADR",      price: 748.55, change: -0.88, shares: 3,   currency: "USD" },
  { id: 22,ticker: "SONY",  name: "Sony Group (ADR)",      sector: "ADR",      price: 88.20,  change: 0.42,  shares: 20,  currency: "USD" },
];

const SECTOR_COLORS = {
  Tech:     "#00f5d4",
  Consumer: "#f7931e",
  Finance:  "#7b5ea7",
  ETF:      "#3a86ff",
  ADR:      "#ff006e",
};

const FX_BASE = { "USD/KRW": 1342.5, "JPY/KRW": 9.12, "EUR/KRW": 1457.8, "USD/JPY": 147.2 };
const INDEX_BASE = { SPY: 492.31, QQQ: 421.88, DIA: 381.20 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtKRW(n) { return "₩" + Math.round(n).toLocaleString("ko-KR"); }
function fmtUSD(n) { return "$" + fmt(n); }

// ─── Sparkline Data Generator ─────────────────────────────────────────────────
function genSparkline(base, points = 20) {
  const data = []; let v = base;
  for (let i = 0; i < points; i++) { v += (Math.random() - 0.48) * base * 0.005; data.push({ v: Math.max(v, 0) }); }
  return data;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function Sparkline({ data, positive }) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={positive ? "#00f5d4" : "#ff4d6d"} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChangeChip({ value }) {
  const pos = value >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: "2px 8px", borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
      background: pos ? "rgba(0,245,212,.12)" : "rgba(255,77,109,.12)",
      color: pos ? "#00f5d4" : "#ff4d6d",
      border: `1px solid ${pos ? "rgba(0,245,212,.3)" : "rgba(255,77,109,.3)"}`,
    }}>
      {pos ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function FxTicker({ pair, rate, tick }) {
  const dir = tick > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", borderRight: "1px solid rgba(255,255,255,.07)" }}>
      <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace", letterSpacing: 1 }}>{pair}</span>
      <span style={{ fontSize: 20, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#e8e8e8", marginTop: 2 }}>{fmt(rate, 2)}</span>
      <span style={{ fontSize: 11, color: dir ? "#00f5d4" : "#ff4d6d", marginTop: 2 }}>{dir ? "▲" : "▼"} {Math.abs(tick).toFixed(2)}</span>
    </div>
  );
}

const SECTOR_ORDER = ["Tech", "Consumer", "Finance", "ETF", "ADR"];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [portfolio, setPortfolio]   = useState(() => INITIAL_PORTFOLIO.map(s => ({ ...s, sparkline: genSparkline(s.price) })));
  const [fx, setFx]                 = useState(FX_BASE);
  const [fxTick, setFxTick]         = useState({ "USD/KRW": 0, "JPY/KRW": 0, "EUR/KRW": 0, "USD/JPY": 0 });
  const [indices, setIndices]       = useState(INDEX_BASE);
  const [activeTab, setActiveTab]   = useState("overview");
  const [activeSector, setActiveSector] = useState("All");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [pulse, setPulse]           = useState(false);
  const [sortBy, setSortBy]         = useState("value");

  // Simulate live data
  const tick = useCallback(() => {
    setPulse(p => !p);
    setLastUpdate(new Date());

    setFx(prev => {
      const next = {};
      const ticks = {};
      for (const k in prev) {
        const d = (Math.random() - 0.49) * prev[k] * 0.0008;
        next[k] = prev[k] + d;
        ticks[k] = d;
      }
      setFxTick(ticks);
      return next;
    });

    setIndices(prev => {
      const next = {};
      for (const k in prev) next[k] = prev[k] + (Math.random() - 0.48) * prev[k] * 0.001;
      return next;
    });

    setPortfolio(prev => prev.map(s => {
      const d = (Math.random() - 0.49) * s.price * 0.003;
      const newPrice = Math.max(s.price + d, 0.01);
      const newChange = s.change + (Math.random() - 0.5) * 0.1;
      const newSpark = [...s.sparkline.slice(1), { v: newPrice }];
      return { ...s, price: newPrice, change: newChange, sparkline: newSpark };
    }));
  }, []);

  useEffect(() => { const id = setInterval(tick, 2500); return () => clearInterval(id); }, [tick]);

  // Derived
  const usdKrw = fx["USD/KRW"];
  const filtered = activeSector === "All" ? portfolio : portfolio.filter(s => s.sector === activeSector);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "value") return (b.price * b.shares) - (a.price * a.shares);
    if (sortBy === "change") return b.change - a.change;
    if (sortBy === "ticker") return a.ticker.localeCompare(b.ticker);
    return 0;
  });

  const totalUSD = portfolio.reduce((acc, s) => acc + s.price * s.shares, 0);
  const totalKRW = totalUSD * usdKrw;

  // Sector pie data
  const sectorData = SECTOR_ORDER.map(sec => {
    const val = portfolio.filter(s => s.sector === sec).reduce((a, s) => a + s.price * s.shares, 0);
    return { name: sec, value: Math.round(val), pct: ((val / totalUSD) * 100).toFixed(1) };
  });

  // Bar data (top 10 by value)
  const barData = [...portfolio].sort((a, b) => b.price * b.shares - a.price * a.shares).slice(0, 10).map(s => ({
    ticker: s.ticker, value: Math.round(s.price * s.shares), krw: Math.round(s.price * s.shares * usdKrw / 1e6),
    color: SECTOR_COLORS[s.sector],
  }));

  const dayGain = portfolio.reduce((a, s) => a + (s.price * s.shares * s.change / 100), 0);
  const dayGainPct = (dayGain / (totalUSD - dayGain)) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", color: "#c8d0d8", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        .row-hover:hover { background: rgba(255,255,255,.04) !important; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; font-family: 'Syne',sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .5px; transition: all .2s; }
        .sec-btn { background: none; border: none; cursor: pointer; padding: 5px 14px; border-radius: 20px; font-family: 'Syne',sans-serif; font-size: 12px; font-weight: 600; transition: all .2s; }
        .sort-btn { background: none; border: none; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-family: 'JetBrains Mono',monospace; font-size: 11px; color: #555; transition: all .2s; }
        .sort-btn:hover { color: #aaa; }
        @keyframes pulse-ring { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(400px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .card-in { animation: fadeUp .4s ease both; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,.06)", padding: "0 32px", background: "rgba(8,12,16,.95)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#00f5d4,#3a86ff)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#080c10" }}>G</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: "#fff" }}>Global Asset Tracker</span>
            <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace", marginLeft: 4 }}>v2.0</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Live pulse */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f5d4", animation: "pulse-ring 2s ease infinite" }} />
              <span style={{ fontSize: 11, color: "#00f5d4", fontFamily: "monospace" }}>LIVE</span>
              <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{lastUpdate.toLocaleTimeString("ko-KR")}</span>
            </div>
          </div>
        </div>

        {/* FX Bar */}
        <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.05)", overflow: "hidden" }}>
          {Object.entries(fx).map(([pair, rate]) => (
            <FxTicker key={pair} pair={pair} rate={rate} tick={fxTick[pair] || 0} />
          ))}
          {/* Indices */}
          {Object.entries(indices).map(([sym, val]) => (
            <div key={sym} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", borderRight: "1px solid rgba(255,255,255,.07)" }}>
              <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace", letterSpacing: 1 }}>{sym}</span>
              <span style={{ fontSize: 20, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#e8e8e8", marginTop: 2 }}>{fmt(val, 2)}</span>
              <span style={{ fontSize: 11, color: "#3a86ff", marginTop: 2 }}>▲ ETF</span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>

        {/* ── Summary Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "총 자산 (USD)", value: fmtUSD(totalUSD), sub: "포트폴리오 평가액", accent: "#3a86ff" },
            { label: "총 자산 (KRW)", value: fmtKRW(totalKRW), sub: `USD/KRW ${fmt(usdKrw, 1)}`, accent: "#00f5d4" },
            { label: "일간 수익", value: (dayGain >= 0 ? "+" : "") + fmtUSD(dayGain), sub: `${dayGainPct >= 0 ? "+" : ""}${fmt(dayGainPct)}%`, accent: dayGain >= 0 ? "#00f5d4" : "#ff4d6d" },
            { label: "보유 종목", value: portfolio.length + "개", sub: `${SECTOR_ORDER.length}개 섹터`, accent: "#f7931e" },
          ].map((c, i) => (
            <div key={i} className="card-in" style={{ animationDelay: `${i * 80}ms`, background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.accent, opacity: 0.7 }} />
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.accent, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Nav Tabs ── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 24 }}>
          {[["overview", "📊 Overview"], ["portfolio", "📋 Portfolio"], ["charts", "📈 Charts"]].map(([id, label]) => (
            <button key={id} className="tab-btn" onClick={() => setActiveTab(id)} style={{
              color: activeTab === id ? "#00f5d4" : "#555",
              borderBottom: activeTab === id ? "2px solid #00f5d4" : "2px solid transparent",
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Sector Pie */}
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#e0e0e0", letterSpacing: .5 }}>섹터 비중</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <PieChart width={180} height={180}>
                  <Pie data={sectorData} cx={85} cy={85} innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {sectorData.map((entry, i) => <Cell key={i} fill={SECTOR_COLORS[entry.name]} opacity={0.9} />)}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1 }}>
                  {sectorData.map(d => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: SECTOR_COLORS[d.name] }} />
                        <span style={{ fontSize: 13, color: "#aaa" }}>{d.name}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontFamily: "monospace", color: "#e0e0e0" }}>{fmtUSD(d.value / 1000).replace("$", "$")}K</div>
                        <div style={{ fontSize: 11, color: SECTOR_COLORS[d.name] }}>{d.pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top 5 Movers */}
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#e0e0e0", letterSpacing: .5 }}>🔥 Top Movers (일간)</h3>
              {[...portfolio].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${SECTOR_COLORS[s.sector]}22`, border: `1px solid ${SECTOR_COLORS[s.sector]}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: SECTOR_COLORS[s.sector], fontFamily: "monospace" }}>{s.ticker.slice(0, 4)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>{s.ticker}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{s.sector}</div>
                    </div>
                  </div>
                  <div style={{ width: 80 }}><Sparkline data={s.sparkline} positive={s.change >= 0} /></div>
                  <ChangeChip value={s.change} />
                </div>
              ))}
            </div>

            {/* Portfolio Value Bar */}
            <div style={{ gridColumn: "1 / -1", background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#e0e0e0", letterSpacing: .5 }}>종목별 보유 가치 (Top 10, 백만원)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                  <XAxis dataKey="ticker" tick={{ fill: "#555", fontSize: 12, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#141920", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontFamily: "monospace" }} labelStyle={{ color: "#aaa" }} formatter={(v) => [`₩${v}M`, "가치"]} />
                  <Bar dataKey="krw" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Portfolio List ── */}
        {activeTab === "portfolio" && (
          <div>
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["All", ...SECTOR_ORDER].map(sec => (
                  <button key={sec} className="sec-btn" onClick={() => setActiveSector(sec)} style={{
                    background: activeSector === sec ? `${SECTOR_COLORS[sec] || "#00f5d4"}22` : "transparent",
                    color: activeSector === sec ? (SECTOR_COLORS[sec] || "#00f5d4") : "#555",
                    border: `1px solid ${activeSector === sec ? (SECTOR_COLORS[sec] || "#00f5d4") + "66" : "rgba(255,255,255,.07)"}`,
                  }}>{sec}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#444", marginRight: 4 }}>정렬:</span>
                {["value", "change", "ticker"].map(s => (
                  <button key={s} className="sort-btn" onClick={() => setSortBy(s)} style={{ background: sortBy === s ? "rgba(255,255,255,.07)" : "transparent", color: sortBy === s ? "#aaa" : "#444" }}>
                    {s === "value" ? "가치" : s === "change" ? "등락" : "티커"}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "50px 120px 1fr 100px 130px 130px 90px 110px 80px", gap: 0, padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 4 }}>
              {["#", "티커", "종목명", "섹터", "USD 가격", "KRW 가격", "수량", "평가액 (원)", "등락"].map(h => (
                <span key={h} style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: .5 }}>{h}</span>
              ))}
            </div>

            {sorted.map((s, i) => {
              const valueUSD = s.price * s.shares;
              const valueKRW = valueUSD * usdKrw;
              return (
                <div key={s.id} className="row-hover" style={{ display: "grid", gridTemplateColumns: "50px 120px 1fr 100px 130px 130px 90px 110px 80px", gap: 0, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.035)", borderRadius: 6, transition: "background .15s", cursor: "default" }}>
                  <span style={{ fontSize: 12, color: "#444", fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${SECTOR_COLORS[s.sector]}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: SECTOR_COLORS[s.sector], fontFamily: "monospace" }}>{s.ticker.slice(0, 3)}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0", fontFamily: "monospace" }}>{s.ticker}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#888", alignSelf: "center" }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: SECTOR_COLORS[s.sector], alignSelf: "center", background: `${SECTOR_COLORS[s.sector]}15`, padding: "2px 8px", borderRadius: 20, textAlign: "center", width: "fit-content" }}>{s.sector}</span>
                  <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", color: "#c8d0d8", alignSelf: "center" }}>{fmtUSD(s.price)}</span>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#7a8a9a", alignSelf: "center" }}>{fmtKRW(s.price * usdKrw)}</span>
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#888", alignSelf: "center" }}>{s.shares}주</span>
                  <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#c8d0d8", alignSelf: "center" }}>{fmtKRW(valueKRW)}</span>
                  <div style={{ alignSelf: "center" }}><ChangeChip value={s.change} /></div>
                </div>
              );
            })}

            {/* Total Row */}
            <div style={{ display: "grid", gridTemplateColumns: "50px 120px 1fr 100px 130px 130px 90px 110px 80px", padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 8, background: "rgba(0,245,212,.03)", borderRadius: 8 }}>
              <span />
              <span style={{ fontSize: 12, color: "#00f5d4", fontFamily: "monospace", fontWeight: 700, gridColumn: "2 / 5" }}>TOTAL ({sorted.length}종목)</span>
              <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", color: "#00f5d4", fontWeight: 700 }}>{fmtUSD(sorted.reduce((a, s) => a + s.price * s.shares, 0))}</span>
              <span />
              <span />
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#00f5d4", fontWeight: 700 }}>{fmtKRW(sorted.reduce((a, s) => a + s.price * s.shares * usdKrw, 0))}</span>
              <div><ChangeChip value={dayGainPct} /></div>
            </div>
          </div>
        )}

        {/* ── Charts ── */}
        {activeTab === "charts" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Sector Donut with legend */}
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 24, gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#e0e0e0" }}>섹터별 자산 비중 분석</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
                <PieChart width={300} height={300}>
                  <Pie data={sectorData} cx={145} cy={145} innerRadius={80} outerRadius={130} dataKey="value" strokeWidth={2} stroke="#080c10" label={({ name, pct }) => `${pct}%`} labelLine={false}>
                    {sectorData.map((entry, i) => <Cell key={i} fill={SECTOR_COLORS[entry.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#141920", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} formatter={(v) => [fmtUSD(v), "평가액"]} />
                </PieChart>
                <div>
                  {sectorData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: SECTOR_COLORS[d.name] }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0" }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{portfolio.filter(s => s.sector === d.name).length}개 종목</div>
                      </div>
                      <div style={{ marginLeft: 20, textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: SECTOR_COLORS[d.name] }}>{d.pct}%</div>
                        <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>{fmtUSD(d.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full bar chart */}
            <div style={{ gridColumn: "1 / -1", background: "#0d1117", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#e0e0e0" }}>종목별 보유 가치 순위 (USD)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...portfolio].sort((a, b) => b.price * b.shares - a.price * a.shares).map(s => ({ ticker: s.ticker, value: Math.round(s.price * s.shares), color: SECTOR_COLORS[s.sector] }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#555", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="ticker" tick={{ fill: "#888", fontSize: 12, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ background: "#141920", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontFamily: "monospace" }} formatter={(v) => [fmtUSD(v), "평가액"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {[...portfolio].sort((a, b) => b.price * b.shares - a.price * a.shares).map((s, i) => <Cell key={i} fill={SECTOR_COLORS[s.sector]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "16px 32px", textAlign: "center", marginTop: 40 }}>
        <span style={{ fontSize: 11, color: "#333", fontFamily: "monospace" }}>Global Asset Tracker • Data simulated every 2.5s • USD/KRW {fmt(usdKrw, 1)} • {portfolio.length} assets tracked</span>
      </footer>
    </div>
  );
}