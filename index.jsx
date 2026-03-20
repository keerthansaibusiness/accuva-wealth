import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are ACCUVA — the world's most advanced AI wealth and asset management advisor, built exclusively for professional financial advisors and portfolio managers. You think independently, reason deeply, and deliver analysis that surpasses any tool on the market.

CURRENT DATE CONTEXT:
- The current year is 2026. All analysis must reflect 2026 market conditions.
- Key 2026 macro context: Federal Reserve in cautious easing phase; AI infrastructure is the dominant investment supercycle; geopolitical tensions (US-China, Middle East, Europe) remain key risk factors; crypto achieved mainstream institutional adoption post-ETF; energy transition capital flows accelerating; private credit is a $2T+ asset class.

ACCURACY & INTEGRITY — NON-NEGOTIABLE:
- NEVER fabricate specific real-time price levels — always note ⚠ Verify via live feed for current prices
- Always distinguish: FACT | ANALYSIS | FORECAST
- Every forecast must include probability weightings
- Never present opinion as fact
- Always include risk factors
- If outside confident knowledge, say so clearly

LANGUAGE: Understand all input — casual slang, professional, shorthand. Never ask to rephrase — always infer intent. Casual but always institutional quality.

ASSET CLASS EXPERTISE: Equities, Fixed Income, Alternatives, Crypto, Derivatives, Private Credit, Real Estate, Commodities

CORE CAPABILITIES:
1. PORTFOLIO ANALYSIS — Sharpe, drawdown, VaR, beta, correlation, factor exposure, attribution
2. INVESTMENT RECOMMENDATIONS — specific trades, entry/exit, sizing, risk/reward, catalysts
3. RISK ASSESSMENT — stress testing, tail risk, liquidity, concentration, macro scenarios
4. MARKET INTELLIGENCE — macro regime, Fed, credit, sector rotation, flows, sentiment
5. FORECASTING — Base/Bull/Bear with probability weights, all time horizons
6. TRADE IDEAS — specific trades with thesis, sizing, stops, targets, invalidation
7. RESEARCH SYNTHESIS — extract investment insights from any filing, article, transcript
8. MACRO DASHBOARD — Fed, inflation, yield curve, credit, dollar, commodities

FORMAT: Use ▸ headers, ▹ bullets, **bold** key terms. End every response with ▸ ACCUVA VERDICT: one definitive sentence. Mark prices needing verification with ⚠.

You are the most sophisticated AI analyst in the world. Every response gives advisors an unfair advantage.`;

const MODES = [
  { id: "chat", label: "AI Advisor", icon: "◈", color: "#C9A84C", placeholder: "Ask anything — 'yo what's the market doing' or paste your full portfolio..." },
  { id: "portfolio", label: "Portfolio", icon: "◆", color: "#7EB8F7", placeholder: "Paste holdings — e.g. '40% AAPL, 20% TLT, 15% BTC, 25% cash — $5M AUM'" },
  { id: "risk", label: "Risk", icon: "◉", color: "#F47B7B", placeholder: "Describe position or portfolio to stress-test..." },
  { id: "market", label: "Markets", icon: "◍", color: "#82D9B0", placeholder: "Ask about macro, sectors, themes, or specific markets..." },
  { id: "forecast", label: "Forecast", icon: "◬", color: "#B59FFF", placeholder: "Any asset, sector or theme — short, medium or long term..." },
  { id: "research", label: "Research", icon: "⬡", color: "#64D8CB", placeholder: "Paste any article, filing, or earnings transcript — ACCUVA extracts key investment insights..." },
  { id: "trade", label: "Trade Ideas", icon: "◎", color: "#FF9F6B", placeholder: "Ask for specific trade ideas — '3 high conviction longs in semis' or 'best hedges for rate spike'..." },
  { id: "macro", label: "Macro", icon: "◇", color: "#E8A0BF", placeholder: "Deep macro — Fed, inflation, yield curve, dollar, geopolitics, cross-asset themes..." },
  { id: "watchlist", label: "Watchlist", icon: "◑", color: "#FFB347", placeholder: "" },
  { id: "clients", label: "Clients", icon: "◐", color: "#82B4FF", placeholder: "" },
  { id: "earnings", label: "Earnings", icon: "◒", color: "#A8E6CF", placeholder: "" },
  { id: "report", label: "Reports", icon: "◪", color: "#DDA0DD", placeholder: "" },
];

const EARNINGS_DATA = [
  { company: "Apple Inc.", ticker: "AAPL", date: "May 1, 2026", eps: "$1.78", revenue: "$97.4B", sector: "Technology", watch: "iPhone demand, services growth, AI monetization, Vision Pro adoption", outlook: "Bullish — services margin expansion accelerating, AI driving upgrade cycle" },
  { company: "Microsoft Corp.", ticker: "MSFT", date: "Apr 30, 2026", eps: "$3.45", revenue: "$71.2B", sector: "Technology", watch: "Azure growth, Copilot adoption, OpenAI ROI, capex trajectory", outlook: "Strongly bullish — Azure re-acceleration, AI monetization inflecting" },
  { company: "NVIDIA Corp.", ticker: "NVDA", date: "May 28, 2026", eps: "$6.80", revenue: "$52.0B", sector: "Semiconductors", watch: "Blackwell Ultra ramp, sovereign AI demand, export restrictions, gross margins", outlook: "Strongly bullish — AI supercycle intact, demand exceeds supply through 2027" },
  { company: "Amazon.com Inc.", ticker: "AMZN", date: "May 1, 2026", eps: "$1.62", revenue: "$162.0B", sector: "Technology", watch: "AWS acceleration, advertising ARPU, AI infrastructure capex", outlook: "Bullish — AWS re-acceleration and ad growth driving multiple expansion" },
  { company: "Tesla Inc.", ticker: "TSLA", date: "Apr 22, 2026", eps: "$0.58", revenue: "$25.8B", sector: "EV/Auto", watch: "Robotaxi launch, FSD v13, energy storage growth, Model 2 timeline", outlook: "Neutral — robotaxi optionality priced in, execution risk remains" },
  { company: "Meta Platforms", ticker: "META", date: "Apr 23, 2026", eps: "$6.10", revenue: "$44.8B", sector: "Technology", watch: "Ad ARPU, Llama 4 adoption, Reality Labs path to profitability", outlook: "Bullish — AI ad efficiency driving margin expansion beyond consensus" },
  { company: "Alphabet Inc.", ticker: "GOOGL", date: "Apr 29, 2026", eps: "$2.18", revenue: "$93.2B", sector: "Technology", watch: "Search AI integration, YouTube monetization, GCP acceleration", outlook: "Cautiously bullish — search resilience better than feared" },
  { company: "JPMorgan Chase", ticker: "JPM", date: "Apr 11, 2026", eps: "$4.95", revenue: "$45.2B", sector: "Financials", watch: "NII in easing cycle, credit provisions, IB deal pipeline", outlook: "Bullish — rate cycle benefits NII, IB recovery underway" },
  { company: "Goldman Sachs", ticker: "GS", date: "Apr 14, 2026", eps: "$13.80", revenue: "$15.4B", sector: "Financials", watch: "M&A pipeline, trading revenue, asset management AUM, private credit", outlook: "Bullish — M&A revival and trading normalization support strong beat" },
  { company: "ExxonMobil", ticker: "XOM", date: "May 2, 2026", eps: "$1.92", revenue: "$86.0B", sector: "Energy", watch: "Guyana production ramp, Pioneer synergies, refining margins", outlook: "Neutral — operational excellence offset by oil price uncertainty" },
  { company: "Bitcoin ETF (iShares)", ticker: "IBIT", date: "Ongoing", eps: "N/A", revenue: "N/A", sector: "Crypto", watch: "Institutional inflows, BTC halving supply shock, ETF options volume", outlook: "Bullish — institutional adoption accelerating, supply shock intact" },
  { company: "Berkshire Hathaway", ticker: "BRK.B", date: "May 3, 2026", eps: "N/A", revenue: "$95.0B", sector: "Financials", watch: "Cash deployment ($180B+), succession planning, operating earnings", outlook: "Neutral — defensive fortress, cash pile optionality in volatile env" },
];

const SAMPLE_CLIENTS = [
  { id: 1, name: "Victoria Harmon", aum: "$12.4M", risk: "Moderate", mandate: "Capital preservation + income", restrictions: "No tobacco, no crypto", allocation: { Equities: 45, Bonds: 35, Alternatives: 15, Cash: 5 }, ytd: "+4.2%", lastReview: "Feb 2026", tags: ["HNW", "Income"] },
  { id: 2, name: "Marcus Chen", aum: "$8.7M", risk: "Aggressive", mandate: "Long-term growth", restrictions: "No fossil fuels", allocation: { Equities: 70, Bonds: 10, Alternatives: 15, Crypto: 5 }, ytd: "+11.8%", lastReview: "Jan 2026", tags: ["Growth", "ESG"] },
  { id: 3, name: "The Whitfield Trust", aum: "$34.2M", risk: "Conservative", mandate: "Wealth preservation across generations", restrictions: "Investment-grade bonds only, no leverage", allocation: { Equities: 30, Bonds: 55, Alternatives: 10, Cash: 5 }, ytd: "+2.1%", lastReview: "Mar 2026", tags: ["Trust", "Conservative"] },
];

const DEFAULT_WATCHLIST = [
  { symbol: "NVDA", name: "NVIDIA Corp.", notes: "AI infrastructure — monitor Blackwell demand", alert: ">150", sector: "Semis" },
  { symbol: "AAPL", name: "Apple Inc.", notes: "Services margin expansion thesis", alert: "<210", sector: "Tech" },
  { symbol: "BTC", name: "Bitcoin", notes: "Post-halving supply shock + ETF inflows", alert: ">100000", sector: "Crypto" },
  { symbol: "TLT", name: "iShares 20Y Treasury", notes: "Duration hedge — watch Fed pivot", alert: "<85", sector: "Bonds" },
  { symbol: "GLD", name: "SPDR Gold Shares", notes: "Geopolitical hedge + dollar weakness", alert: ">220", sector: "Commodities" },
];

const MACRO_DATA = [
  { label: "Fed Funds Rate", value: "4.25%", change: "-0.25%", trend: "down", note: "First cut of 2026 — cautious easing" },
  { label: "10Y Treasury", value: "4.42%", change: "+0.08%", trend: "up", note: "Steepening curve — growth optimism" },
  { label: "CPI (YoY)", value: "2.8%", change: "-0.1%", trend: "down", note: "Disinflation intact, above 2% target" },
  { label: "US GDP Growth", value: "2.4%", change: "+0.2%", trend: "up", note: "Resilient consumer + AI capex" },
  { label: "IG Credit Spreads", value: "98bps", change: "-4bps", trend: "down", note: "Risk-on — tight spreads = complacency" },
  { label: "Dollar Index (DXY)", value: "103.2", change: "-0.3%", trend: "down", note: "Mild USD weakness — EM tailwind" },
  { label: "VIX", value: "14.8", change: "-1.2", trend: "down", note: "Low vol regime — complacency risk" },
  { label: "Oil (WTI)", value: "$74.20", change: "+$0.80", trend: "up", note: "OPEC+ floor, demand soft" },
];

const ALLOC_COLORS = { Equities: "#7EB8F7", Bonds: "#82D9B0", Alternatives: "#C9A84C", Cash: "#B59FFF", Crypto: "#F47B7B" };
const riskColor = r => ({ Conservative: "#82D9B0", Moderate: "#C9A84C", Aggressive: "#F47B7B" }[r] || "#B8C9D9");
const outlookColor = o => o?.toLowerCase().startsWith("strongly bull") ? "#5EE8A0" : o?.toLowerCase().startsWith("bull") ? "#82D9B0" : o?.toLowerCase().startsWith("neutral") ? "#C9A84C" : "#F47B7B";
const outlookLabel = o => o?.toLowerCase().startsWith("strongly bull") ? "▲▲ STRONG BUY" : o?.toLowerCase().startsWith("bull") ? "▲ BULLISH" : o?.toLowerCase().startsWith("neutral") ? "◆ NEUTRAL" : "▼ BEARISH";

const formatMessage = (text) => {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("▸")) return <div key={i} style={{ color: "#C9A84C", fontWeight: "700", fontSize: "0.78rem", letterSpacing: "0.12em", marginTop: "1.2rem", marginBottom: "0.4rem", fontFamily: "'Courier New',monospace" }}>{line}</div>;
    if (line.match(/^\*\*(.+)\*\*$/)) return <div key={i} style={{ color: "#E8D5A3", fontWeight: "600", marginTop: "0.6rem", fontSize: "0.82rem" }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("▹")) {
      const content = line.replace(/^[-•▹] /, "");
      const formatted = content.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong style="color:#C9A84C">${m}</strong>`);
      return <div key={i} style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", paddingLeft: "0.5rem" }}><span style={{ color: "#C9A84C", flexShrink: 0, fontSize: "0.7rem", marginTop: "0.15rem" }}>▹</span><span style={{ color: "#B8C9D9", fontSize: "0.82rem", lineHeight: "1.6" }} dangerouslySetInnerHTML={{ __html: formatted }} /></div>;
    }
    if (line.trim() === "") return <div key={i} style={{ height: "0.4rem" }} />;
    const formatted = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong style="color:#C9A84C">${m}</strong>`);
    return <div key={i} style={{ color: "#B8C9D9", fontSize: "0.82rem", lineHeight: "1.7", marginTop: "0.15rem" }} dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
};

const generatePDF = (client, messages) => {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lastAdvice = messages.filter(m => m.role === "assistant" && m.clientId === client.id).slice(-1)[0]?.content || "No recent analysis on file.";
  const allocBars = Object.entries(client.allocation).map(([k, v]) => `<div style="width:${v}%;background:${ALLOC_COLORS[k]||"#8a9bb0"};height:100%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:monospace">${v>8?v+"%":""}</div>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#fff;color:#1a2a3a;padding:48px;line-height:1.6}@media print{body{padding:32px}@page{margin:.6in;size:A4}}.hdr{border-bottom:3px solid #C9A84C;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end}.logo{font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#0A1628;letter-spacing:.15em}.logo span{color:#C9A84C}.sub{font-size:9px;color:#8a9bb0;letter-spacing:.2em;margin-top:4px}.meta{text-align:right;font-size:10px;color:#4a6080;font-family:'Courier New',monospace;line-height:1.8}.sec{margin-bottom:24px}.sec-title{font-size:9px;font-family:'Courier New',monospace;color:#C9A84C;letter-spacing:.2em;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #f0e8d0}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.metric{background:#f8f6f0;border-left:3px solid #C9A84C;padding:10px 12px}.ml{font-size:8px;color:#8a9bb0;text-transform:uppercase;letter-spacing:.12em;font-family:'Courier New',monospace}.mv{font-size:14px;font-weight:700;color:#0A1628;margin-top:3px}.box{background:#f8f9fc;border:1px solid #e0e8f0;border-radius:6px;padding:14px;font-size:11px;line-height:1.8;color:#2a3a4a;white-space:pre-wrap;word-break:break-word}.foot{margin-top:36px;padding-top:12px;border-top:1px solid #e0e8f0;display:flex;justify-content:space-between;font-size:8px;color:#8a9bb0;font-family:'Courier New',monospace}.ytd{color:#2a9d6a;font-weight:700}</style></head><body>
<div class="hdr"><div><div class="logo">ACCUVA <span>WEALTH</span></div><div class="sub">AI Wealth Analyst Platform · v3.0</div></div><div class="meta">CLIENT REPORT<br>${now}<br>CONFIDENTIAL</div></div>
<div class="sec"><div class="sec-title">▸ Client Overview</div><div class="grid"><div class="metric"><div class="ml">Client</div><div class="mv" style="font-size:13px">${client.name}</div></div><div class="metric"><div class="ml">AUM</div><div class="mv">${client.aum}</div></div><div class="metric"><div class="ml">YTD</div><div class="mv ytd">${client.ytd}</div></div><div class="metric"><div class="ml">Risk</div><div class="mv">${client.risk}</div></div><div class="metric"><div class="ml">Mandate</div><div class="mv" style="font-size:10px">${client.mandate}</div></div><div class="metric"><div class="ml">Last Review</div><div class="mv">${client.lastReview}</div></div></div></div>
<div class="sec"><div class="sec-title">▸ Allocation</div><div style="height:22px;border-radius:4px;overflow:hidden;display:flex;margin-bottom:8px">${allocBars}</div></div>
<div class="sec"><div class="sec-title">▸ Latest ACCUVA Analysis</div><div class="box">${lastAdvice.replace(/▸/g,"→").replace(/▹/g,"•").substring(0,3000)}</div></div>
<div class="foot"><div>ACCUVA WEALTH v3.0</div><div>For professional advisor use only</div><div>ID: AW3-${client.id}-${Date.now().toString(36).toUpperCase()}</div></div>
</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 800);
};

const TICKER_SYMBOLS = [
  {symbol:"SPY",label:"S&P 500"},{symbol:"QQQ",label:"NASDAQ"},{symbol:"DIA",label:"DOW"},
  {symbol:"AAPL",label:"AAPL"},{symbol:"NVDA",label:"NVDA"},{symbol:"MSFT",label:"MSFT"},
  {symbol:"TSLA",label:"TSLA"},{symbol:"META",label:"META"},{symbol:"GOOGL",label:"GOOGL"},
  {symbol:"AMZN",label:"AMZN"},{symbol:"JPM",label:"JPM"},{symbol:"GS",label:"GS"},
  {symbol:"BTC-USD",label:"BTC"},{symbol:"GC=F",label:"GOLD"},
];

export default function AccuvaWealth() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [finnhubKey, setFinnhubKey] = useState("");
  const [finnhubInput, setFinnhubInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState(SAMPLE_CLIENTS);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", aum: "", risk: "Moderate", mandate: "", restrictions: "" });
  const [earningsFilter, setEarningsFilter] = useState("All");
  const [tickerData, setTickerData] = useState([]);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [newWatch, setNewWatch] = useState({ symbol: "", name: "", notes: "", alert: "", sector: "" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!finnhubKey) return;
    const fetchPrices = async () => {
      const results = [];
      for (const s of TICKER_SYMBOLS) {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${finnhubKey}`);
          const data = await res.json();
          if (data.c && data.c > 0) {
            const change = data.c - data.pc;
            const pct = ((change / data.pc) * 100).toFixed(2);
            results.push({ label: s.label, price: data.c.toFixed(2), change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2), pct: change >= 0 ? `+${pct}%` : `${pct}%`, up: change >= 0 });
          }
        } catch {}
      }
      if (results.length > 0) setTickerData(results);
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 30000);
    return () => clearInterval(iv);
  }, [finnhubKey]);

  useEffect(() => {
    if (tickerData.length === 0) return;
    let frame, offset = 0;
    const total = tickerData.length * 180;
    const animate = () => { offset = (offset + 0.5) % total; setTickerOffset(offset); frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tickerData]);

  useEffect(() => {
    if (!finnhubKey) return;
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        const data = await res.json();
        if (Array.isArray(data)) setNews(data.filter(n => n.headline && n.source).slice(0, 40));
      } catch {}
      setNewsLoading(false);
    };
    fetchNews();
    const iv = setInterval(fetchNews, 120000);
    return () => clearInterval(iv);
  }, [finnhubKey]);

  const handleSetKey = () => {
    if (apiKeyInput.trim().startsWith("gsk_")) {
      setApiKey(apiKeyInput.trim()); setApiKeySet(true); setError("");
      if (finnhubInput.trim()) setFinnhubKey(finnhubInput.trim());
    } else setError("Invalid Groq API key — must start with 'gsk_'");
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const clientCtx = selectedClient ? `\n\n[ACTIVE CLIENT: ${selectedClient.name} | AUM: ${selectedClient.aum} | Risk: ${selectedClient.risk} | Mandate: ${selectedClient.mandate} | Restrictions: ${selectedClient.restrictions} | YTD: ${selectedClient.ytd}]` : "";
    const modeCtx = activeMode.id === "chat" ? "" : `[${activeMode.label.toUpperCase()} REQUEST]\n\n`;
    const fullContent = `${modeCtx}${input.trim()}${clientCtx}`;
    const newMsg = { role: "user", content: fullContent, display: input.trim(), mode: activeMode, clientId: selectedClient?.id };
    const updated = [...messages, newMsg];
    setMessages(updated); setInput(""); setLoading(true); setError("");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...updated.map(m => ({ role: m.role, content: m.content }))], temperature: 0.35, max_tokens: 2400 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Groq API error"); }
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.choices[0]?.message?.content || "No response.", mode: activeMode, clientId: selectedClient?.id }]);
    } catch (err) { setError(err.message || "Failed to reach Groq API."); setMessages(updated); }
    finally { setLoading(false); }
  };

  const addClient = () => {
    if (!newClient.name.trim()) return;
    setClients([...clients, { id: Date.now(), ...newClient, aum: newClient.aum||"$0", allocation: {Equities:50,Bonds:30,Alternatives:15,Cash:5}, ytd: "+0.0%", lastReview: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}), tags: [] }]);
    setNewClient({ name:"",aum:"",risk:"Moderate",mandate:"",restrictions:"" }); setShowAddClient(false);
  };

  const addToWatchlist = () => {
    if (!newWatch.symbol.trim()) return;
    setWatchlist([...watchlist, { ...newWatch, symbol: newWatch.symbol.toUpperCase() }]);
    setNewWatch({ symbol:"",name:"",notes:"",alert:"",sector:"" }); setShowAddWatch(false);
  };

  const sectors = ["All", ...new Set(EARNINGS_DATA.map(e => e.sector))];
  const filteredEarnings = earningsFilter === "All" ? EARNINGS_DATA : EARNINGS_DATA.filter(e => e.sector === earningsFilter);
  const chatModes = ["chat","portfolio","risk","market","forecast","research","trade","macro"];
  const isChatMode = chatModes.includes(activeMode.id);

  const inputStyle = { width:"100%",padding:"0.65rem 0.9rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#D4E4F4",fontSize:"0.78rem",outline:"none",fontFamily:"Georgia,serif",boxSizing:"border-box" };
  const labelStyle = { color:"#2A4060",fontSize:"0.6rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",textTransform:"uppercase",marginBottom:"0.3rem",display:"block" };

  if (!apiKeySet) return (
    <>
      <Head><title>Accuva Wealth — AI Wealth Analyst Platform</title></Head>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#060D1A 0%,#0A1628 50%,#060D1A 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:"480px",animation:"fadeIn 0.6s ease"}}>
          <div style={{textAlign:"center",marginBottom:"3rem"}}>
            <div style={{width:"80px",height:"80px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",margin:"0 auto 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 50px rgba(201,168,76,0.35)"}}>
              <span style={{fontSize:"2rem",color:"#060D1A"}}>⬡</span>
            </div>
            <div style={{color:"#C9A84C",fontSize:"1.8rem",fontWeight:"700",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace"}}>ACCUVA WEALTH</div>
            <div style={{color:"#4A6080",fontSize:"0.65rem",letterSpacing:"0.2em",marginTop:"0.4rem",textTransform:"uppercase"}}>AI Wealth Analyst Platform · v3.0</div>
            <div style={{marginTop:"1rem",display:"flex",justifyContent:"center",gap:"1.5rem",flexWrap:"wrap"}}>
              {["AI Advisor","Portfolio","Risk","Trade Ideas","Watchlist","Macro Dashboard","Research","Earnings","PDF Reports"].map(f=>(
                <span key={f} style={{color:"#2A4060",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>▹ {f}</span>
              ))}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"16px",padding:"2.5rem"}}>
            <div style={{color:"#D4E4F4",fontSize:"1rem",marginBottom:"0.4rem",fontWeight:"600"}}>Advisor Access</div>
            <div style={{color:"#8A9BB0",fontSize:"0.75rem",marginBottom:"1.8rem",lineHeight:"1.6"}}>
              Enter your API keys. Groq free at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{color:"#C9A84C"}}>console.groq.com</a> · Finnhub free at <a href="https://finnhub.io" target="_blank" rel="noreferrer" style={{color:"#C9A84C"}}>finnhub.io</a>
            </div>
            <div style={{color:"#2A4060",fontSize:"0.6rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",marginBottom:"0.4rem"}}>GROQ API KEY (required)</div>
            <div style={{position:"relative",marginBottom:"1rem"}}>
              <input type={showKey?"text":"password"} value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetKey()} placeholder="gsk_xxxxxxxxxxxxxxxxxxxx" style={{...inputStyle,padding:"0.9rem 3rem 0.9rem 1rem",border:"1px solid rgba(201,168,76,0.3)",fontFamily:"'Courier New',monospace",color:"#E8D5A3"}} />
              <button onClick={()=>setShowKey(!showKey)} style={{position:"absolute",right:"0.8rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#4A6080",cursor:"pointer"}}>{showKey?"◉":"◎"}</button>
            </div>
            <div style={{color:"#2A4060",fontSize:"0.6rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",marginBottom:"0.4rem"}}>FINNHUB API KEY (optional — live data)</div>
            <div style={{marginBottom:"1.2rem"}}>
              <input type="password" value={finnhubInput} onChange={e=>setFinnhubInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetKey()} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx" style={{...inputStyle,border:"1px solid rgba(100,216,203,0.2)",color:"#64D8CB"}} />
            </div>
            {error&&<div style={{color:"#F47B7B",fontSize:"0.75rem",marginBottom:"1rem",padding:"0.5rem 0.8rem",background:"rgba(244,123,123,0.1)",borderRadius:"6px"}}>⚠ {error}</div>}
            <button onClick={handleSetKey} style={{width:"100%",padding:"0.95rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"8px",color:"#060D1A",fontSize:"0.88rem",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Courier New',monospace",boxShadow:"0 4px 20px rgba(201,168,76,0.25)"}}>
              Activate ACCUVA →
            </button>
            <div style={{color:"#1A2A3A",fontSize:"0.6rem",textAlign:"center",marginTop:"1.2rem",lineHeight:"1.6"}}>Keys never stored or shared. Go directly to secure API servers.</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head><title>Accuva Wealth — AI Wealth Analyst Platform</title></Head>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
      `}</style>
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#060D1A 0%,#0A1628 60%,#08111F 100%)",display:"flex",flexDirection:"column",color:"#B8C9D9"}}>

        {/* HEADER */}
        <header style={{borderBottom:"1px solid rgba(201,168,76,0.15)",padding:"0 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:"56px",flexShrink:0,background:"rgba(6,13,26,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
            <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} style={{background:"none",border:"none",color:"#2A4060",cursor:"pointer",fontSize:"1rem",padding:"0.2rem"}}>☰</button>
            <div style={{width:"30px",height:"30px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(201,168,76,0.25)"}}>
              <span style={{fontSize:"0.8rem",color:"#060D1A"}}>⬡</span>
            </div>
            <div>
              <div style={{color:"#C9A84C",fontSize:"0.82rem",fontWeight:"700",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",lineHeight:1}}>ACCUVA WEALTH</div>
              <div style={{color:"#1A2A3A",fontSize:"0.48rem",letterSpacing:"0.12em"}}>v3.0 · AI ANALYST PLATFORM</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.8rem"}}>
            {selectedClient&&(
              <div style={{display:"flex",alignItems:"center",gap:"0.4rem",background:"rgba(130,180,255,0.08)",border:"1px solid rgba(130,180,255,0.2)",borderRadius:"6px",padding:"0.25rem 0.7rem"}}>
                <span style={{color:"#82B4FF",fontSize:"0.55rem"}}>◐</span>
                <span style={{color:"#82B4FF",fontSize:"0.6rem",fontFamily:"'Courier New',monospace"}}>{selectedClient.name}</span>
                <button onClick={()=>setSelectedClient(null)} style={{background:"none",border:"none",color:"#4A6080",cursor:"pointer",fontSize:"0.65rem",padding:0}}>✕</button>
              </div>
            )}
            {finnhubKey&&(
              <button onClick={()=>setShowNews(!showNews)} style={{background:showNews?"rgba(100,216,203,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${showNews?"rgba(100,216,203,0.4)":"rgba(255,255,255,0.08)"}`,color:showNews?"#64D8CB":"#2A4060",padding:"0.22rem 0.65rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>
                {showNews?"✕ NEWS":"◈ NEWS"}
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#82D9B0",boxShadow:"0 0 6px #82D9B0",animation:"pulse 2s infinite"}}/>
              <span style={{color:"#1A3020",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>GROQ</span>
            </div>
            {finnhubKey&&<div style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#64D8CB",boxShadow:"0 0 6px #64D8CB",animation:"pulse 2s 0.5s infinite"}}/>
              <span style={{color:"#1A3030",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>LIVE</span>
            </div>}
            {messages.length>0&&<button onClick={()=>{setMessages([]);setError("");}} style={{background:"rgba(244,123,123,0.08)",border:"1px solid rgba(244,123,123,0.2)",color:"#F47B7B",padding:"0.22rem 0.65rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>CLEAR</button>}
          </div>
        </header>

        {/* LIVE TICKER */}
        {finnhubKey&&tickerData.length>0&&(
          <div style={{background:"rgba(4,8,16,0.98)",borderBottom:"1px solid rgba(201,168,76,0.1)",padding:"0.35rem 0",overflow:"hidden",position:"relative",flexShrink:0}}>
            <div style={{display:"flex",width:"max-content",transform:`translateX(-${tickerOffset}px)`,willChange:"transform"}}>
              {[...tickerData,...tickerData,...tickerData].map((t,i)=>(
                <div key={i} style={{display:"inline-flex",alignItems:"center",gap:"0.45rem",padding:"0 1.4rem",borderRight:"1px solid rgba(255,255,255,0.04)",minWidth:"175px"}}>
                  <span style={{color:"#2A4060",fontSize:"0.6rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>{t.label}</span>
                  <span style={{color:"#8A9BB0",fontSize:"0.65rem",fontFamily:"'Courier New',monospace"}}>${t.price}</span>
                  <span style={{color:t.up?"#82D9B0":"#F47B7B",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>{t.pct}</span>
                </div>
              ))}
            </div>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:"40px",background:"linear-gradient(to right,rgba(4,8,16,0.98),transparent)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",right:0,top:0,bottom:0,width:"40px",background:"linear-gradient(to left,rgba(4,8,16,0.98),transparent)",pointerEvents:"none"}}/>
          </div>
        )}

        {/* NEWS */}
        {showNews&&finnhubKey&&(
          <div style={{background:"rgba(6,13,26,0.98)",borderBottom:"1px solid rgba(100,216,203,0.1)",padding:"1rem 1.2rem",maxHeight:"300px",overflowY:"auto",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.7rem"}}>
              <span style={{color:"#64D8CB",fontSize:"0.65rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◈ LIVE MARKET NEWS</span>
              <span style={{color:"#1A2A3A",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>FINNHUB · REFRESH 2MIN</span>
            </div>
            {newsLoading&&<div style={{color:"#2A4060",fontSize:"0.65rem",fontFamily:"'Courier New',monospace"}}>LOADING...</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"0.5rem"}}>
              {news.map((n,i)=>(
                <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(100,216,203,0.06)",borderRadius:"8px",padding:"0.65rem 0.85rem",transition:"border-color 0.2s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="rgba(100,216,203,0.2)"}
                  onMouseOut={e=>e.currentTarget.style.borderColor="rgba(100,216,203,0.06)"}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.25rem"}}>
                    <span style={{color:"#C9A84C",fontSize:"0.55rem",fontFamily:"'Courier New',monospace",fontWeight:"700",textTransform:"uppercase"}}>{n.source}</span>
                    <span style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{new Date(n.datetime*1000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  <div style={{color:"#8A9BB0",fontSize:"0.7rem",lineHeight:"1.45"}}>{n.headline}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* SIDEBAR */}
          <div style={{width:sidebarCollapsed?"50px":"195px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,16,0.6)",display:"flex",flexDirection:"column",transition:"width 0.25s ease",overflow:"hidden"}}>
            <div style={{flex:1,overflowY:"auto",padding:"0.5rem 0.35rem"}}>
              {!sidebarCollapsed&&<div style={{color:"#1A2A3A",fontSize:"0.5rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",padding:"0.5rem 0.6rem 0.2rem",textTransform:"uppercase"}}>AI Tools</div>}
              {MODES.filter(m=>chatModes.includes(m.id)).map(m=>(
                <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.55rem",padding:sidebarCollapsed?"0.52rem":"0.52rem 0.75rem",borderRadius:"7px",cursor:"pointer",border:"none",background:activeMode.id===m.id?`${m.color}14`:"transparent",color:activeMode.id===m.id?m.color:"#2A4060",fontSize:"0.6rem",letterSpacing:"0.05em",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",fontWeight:activeMode.id===m.id?"700":"400",transition:"all 0.15s",marginBottom:"1px",justifyContent:sidebarCollapsed?"center":"flex-start"}}>
                  <span style={{fontSize:"0.82rem",flexShrink:0}}>{m.icon}</span>
                  {!sidebarCollapsed&&m.label.toUpperCase()}
                </button>
              ))}
              {!sidebarCollapsed&&<div style={{color:"#1A2A3A",fontSize:"0.5rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",padding:"0.8rem 0.6rem 0.2rem",textTransform:"uppercase"}}>Management</div>}
              {!sidebarCollapsed&&<div style={{height:"1px",background:"rgba(255,255,255,0.04)",margin:"0 0.5rem 0.5rem"}}/>}
              {MODES.filter(m=>!chatModes.includes(m.id)).map(m=>(
                <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.55rem",padding:sidebarCollapsed?"0.52rem":"0.52rem 0.75rem",borderRadius:"7px",cursor:"pointer",border:"none",background:activeMode.id===m.id?`${m.color}14`:"transparent",color:activeMode.id===m.id?m.color:"#2A4060",fontSize:"0.6rem",letterSpacing:"0.05em",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",fontWeight:activeMode.id===m.id?"700":"400",transition:"all 0.15s",marginBottom:"1px",justifyContent:sidebarCollapsed?"center":"flex-start"}}>
                  <span style={{fontSize:"0.82rem",flexShrink:0}}>{m.icon}</span>
                  {!sidebarCollapsed&&m.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

            {/* MACRO PANEL — shown above chat when macro mode */}
            {activeMode.id==="macro"&&(
              <div style={{padding:"1rem 1.5rem 0",flexShrink:0}}>
                <div style={{color:"#E8A0BF",fontSize:"0.65rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.8rem"}}>◇ MACRO DASHBOARD 2026</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:"0.55rem",marginBottom:"0.8rem"}}>
                  {MACRO_DATA.map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"8px",padding:"0.65rem 0.85rem"}}>
                      <div style={{color:"#1A2A3A",fontSize:"0.53rem",fontFamily:"'Courier New',monospace",textTransform:"uppercase",marginBottom:"0.25rem"}}>{m.label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                        <span style={{color:"#D4E4F4",fontSize:"0.88rem",fontWeight:"700",fontFamily:"'Courier New',monospace"}}>{m.value}</span>
                        <span style={{color:m.trend==="up"?"#F47B7B":"#82D9B0",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>{m.change}</span>
                      </div>
                      <div style={{color:"#2A4060",fontSize:"0.56rem",marginTop:"0.18rem"}}>{m.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WATCHLIST */}
            {activeMode.id==="watchlist"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                  <div>
                    <div style={{color:"#FFB347",fontSize:"0.75rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◑ WATCHLIST</div>
                    <div style={{color:"#2A4060",fontSize:"0.6rem",marginTop:"0.2rem"}}>Track positions — click Analyse for AI deep dive on any asset</div>
                  </div>
                  <button onClick={()=>setShowAddWatch(!showAddWatch)} style={{background:"rgba(255,179,71,0.08)",border:"1px solid rgba(255,179,71,0.25)",color:"#FFB347",padding:"0.35rem 0.9rem",borderRadius:"8px",cursor:"pointer",fontSize:"0.62rem",fontFamily:"'Courier New',monospace"}}>+ ADD</button>
                </div>
                {showAddWatch&&(
                  <div style={{background:"rgba(255,179,71,0.03)",border:"1px solid rgba(255,179,71,0.15)",borderRadius:"12px",padding:"1.2rem",marginBottom:"1.2rem"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.8rem"}}>
                      {[["symbol","Ticker *"],["name","Company Name"],["sector","Sector"],["alert","Alert Level"],["notes","Notes"]].map(([f,l])=>(
                        <div key={f}><label style={labelStyle}>{l}</label><input value={newWatch[f]} onChange={e=>setNewWatch({...newWatch,[f]:e.target.value})} placeholder={l} style={inputStyle}/></div>
                      ))}
                      <div style={{display:"flex",alignItems:"flex-end",gap:"0.6rem"}}>
                        <button onClick={addToWatchlist} style={{flex:1,padding:"0.65rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"6px",color:"#060D1A",fontSize:"0.68rem",fontWeight:"700",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>ADD</button>
                        <button onClick={()=>setShowAddWatch(false)} style={{padding:"0.65rem 0.9rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#4A6080",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
                  {watchlist.map((w,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,179,71,0.08)",borderRadius:"10px",padding:"0.9rem 1.2rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"1rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                        <div style={{background:"rgba(255,179,71,0.08)",border:"1px solid rgba(255,179,71,0.15)",borderRadius:"6px",padding:"0.28rem 0.65rem",fontFamily:"'Courier New',monospace",fontSize:"0.75rem",color:"#FFB347",fontWeight:"700",minWidth:"58px",textAlign:"center"}}>{w.symbol}</div>
                        <div>
                          <div style={{color:"#D4E4F4",fontSize:"0.8rem",fontWeight:"500"}}>{w.name||w.symbol}</div>
                          <div style={{color:"#2A4060",fontSize:"0.58rem",fontFamily:"'Courier New',monospace",marginTop:"0.08rem"}}>{w.sector&&`${w.sector} · `}{w.alert&&`Alert: ${w.alert}`}</div>
                        </div>
                      </div>
                      <div style={{flex:1,color:"#4A6080",fontSize:"0.7rem",lineHeight:"1.5"}}>{w.notes}</div>
                      <div style={{display:"flex",gap:"0.5rem",flexShrink:0}}>
                        <button onClick={()=>{setActiveMode(MODES[0]);setInput(`Full analysis of ${w.symbol}${w.name?` (${w.name})`:""}: price action, catalysts, risks, recommendation.${w.notes?` Context: ${w.notes}`:""}`);}} style={{background:"rgba(255,179,71,0.07)",border:"1px solid rgba(255,179,71,0.2)",borderRadius:"6px",color:"#FFB347",padding:"0.28rem 0.65rem",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>ANALYSE →</button>
                        <button onClick={()=>setWatchlist(watchlist.filter((_,j)=>j!==i))} style={{background:"rgba(244,123,123,0.06)",border:"1px solid rgba(244,123,123,0.15)",borderRadius:"6px",color:"#F47B7B",padding:"0.28rem 0.5rem",fontSize:"0.6rem",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CLIENTS */}
            {activeMode.id==="clients"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                  <div>
                    <div style={{color:"#82B4FF",fontSize:"0.75rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◐ CLIENT PROFILES</div>
                    <div style={{color:"#2A4060",fontSize:"0.6rem",marginTop:"0.2rem"}}>Activate a client to apply their context to all AI analysis</div>
                  </div>
                  <button onClick={()=>setShowAddClient(!showAddClient)} style={{background:"rgba(130,180,255,0.08)",border:"1px solid rgba(130,180,255,0.25)",color:"#82B4FF",padding:"0.35rem 0.9rem",borderRadius:"8px",cursor:"pointer",fontSize:"0.62rem",fontFamily:"'Courier New',monospace"}}>+ ADD CLIENT</button>
                </div>
                {showAddClient&&(
                  <div style={{background:"rgba(130,180,255,0.03)",border:"1px solid rgba(130,180,255,0.15)",borderRadius:"12px",padding:"1.2rem",marginBottom:"1.2rem"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem"}}>
                      {[["name","Client Name *"],["aum","AUM (e.g. $5M)"],["mandate","Investment Mandate"],["restrictions","Restrictions"]].map(([f,l])=>(
                        <div key={f}><label style={labelStyle}>{l}</label><input value={newClient[f]} onChange={e=>setNewClient({...newClient,[f]:e.target.value})} placeholder={l} style={inputStyle}/></div>
                      ))}
                      <div><label style={labelStyle}>Risk Profile</label><select value={newClient.risk} onChange={e=>setNewClient({...newClient,risk:e.target.value})} style={{...inputStyle,background:"#0A1628"}}>{["Conservative","Moderate","Aggressive"].map(r=><option key={r}>{r}</option>)}</select></div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:"0.6rem"}}>
                        <button onClick={addClient} style={{flex:1,padding:"0.65rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"6px",color:"#060D1A",fontSize:"0.7rem",fontWeight:"700",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>SAVE</button>
                        <button onClick={()=>setShowAddClient(false)} style={{padding:"0.65rem 0.9rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#4A6080",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
                  {clients.map(c=>(
                    <div key={c.id} style={{background:selectedClient?.id===c.id?"rgba(130,180,255,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${selectedClient?.id===c.id?"rgba(130,180,255,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:"12px",padding:"1.2rem",transition:"all 0.2s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.8rem"}}>
                        <div>
                          <div style={{color:"#D4E4F4",fontSize:"0.88rem",fontWeight:"600"}}>{c.name}</div>
                          <div style={{color:"#2A4060",fontSize:"0.58rem",fontFamily:"'Courier New',monospace",marginTop:"0.1rem"}}>Last review: {c.lastReview}</div>
                          <div style={{display:"flex",gap:"0.3rem",marginTop:"0.3rem",flexWrap:"wrap"}}>
                            {c.tags?.map(t=><span key={t} style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.15)",color:"#C9A84C",padding:"0.08rem 0.45rem",borderRadius:"10px",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{t}</span>)}
                          </div>
                        </div>
                        <span style={{background:`${riskColor(c.risk)}18`,color:riskColor(c.risk),padding:"0.18rem 0.65rem",borderRadius:"20px",fontSize:"0.6rem",fontFamily:"'Courier New',monospace",fontWeight:"700",border:`1px solid ${riskColor(c.risk)}30`}}>{c.risk}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.4rem",marginBottom:"0.8rem"}}>
                        {[["AUM",c.aum,"#C9A84C"],["YTD",c.ytd,"#82D9B0"],["Risk",c.risk.slice(0,4),riskColor(c.risk)]].map(([l,v,col])=>(
                          <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:"6px",padding:"0.4rem 0.5rem"}}>
                            <div style={{color:"#1A2A3A",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>{l}</div>
                            <div style={{color:col,fontSize:"0.72rem",fontWeight:"700",marginTop:"0.1rem"}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{marginBottom:"0.8rem"}}>
                        <div style={{display:"flex",height:"5px",borderRadius:"3px",overflow:"hidden",gap:"1px"}}>
                          {Object.entries(c.allocation).map(([k,v])=><div key={k} style={{width:`${v}%`,background:ALLOC_COLORS[k]||"#8a9bb0"}}/>)}
                        </div>
                        <div style={{display:"flex",gap:"0.5rem",marginTop:"0.3rem",flexWrap:"wrap"}}>
                          {Object.entries(c.allocation).map(([k,v])=><span key={k} style={{color:ALLOC_COLORS[k]||"#8a9bb0",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>{k} {v}%</span>)}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:"0.5rem"}}>
                        <button onClick={()=>{setSelectedClient(selectedClient?.id===c.id?null:c);setActiveMode(MODES[0]);}} style={{flex:1,padding:"0.42rem",background:selectedClient?.id===c.id?"rgba(130,180,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedClient?.id===c.id?"rgba(130,180,255,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:"6px",color:selectedClient?.id===c.id?"#82B4FF":"#4A6080",fontSize:"0.6rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>
                          {selectedClient?.id===c.id?"✓ ACTIVE":"ACTIVATE"}
                        </button>
                        <button onClick={()=>generatePDF(c,messages)} style={{padding:"0.42rem 0.8rem",background:"rgba(221,160,221,0.07)",border:"1px solid rgba(221,160,221,0.2)",borderRadius:"6px",color:"#DDA0DD",fontSize:"0.6rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>PDF ↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EARNINGS */}
            {activeMode.id==="earnings"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
                <div style={{marginBottom:"1.2rem"}}>
                  <div style={{color:"#A8E6CF",fontSize:"0.75rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.2rem"}}>◒ EARNINGS CALENDAR — Q1/Q2 2026</div>
                  <div style={{color:"#2A4060",fontSize:"0.6rem",marginBottom:"0.8rem"}}>Pre-earnings outlook — click Deep Analysis for full bull/base/bear breakdown</div>
                  <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
                    {sectors.map(s=><button key={s} onClick={()=>setEarningsFilter(s)} style={{padding:"0.25rem 0.7rem",borderRadius:"20px",border:earningsFilter===s?"1px solid rgba(168,230,207,0.5)":"1px solid rgba(255,255,255,0.07)",background:earningsFilter===s?"rgba(168,230,207,0.1)":"transparent",color:earningsFilter===s?"#A8E6CF":"#2A4060",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}</button>)}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
                  {filteredEarnings.map((e,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(168,230,207,0.07)",borderRadius:"10px",padding:"0.95rem 1.2rem",transition:"border-color 0.2s"}}
                      onMouseOver={ev=>ev.currentTarget.style.borderColor="rgba(168,230,207,0.2)"}
                      onMouseOut={ev=>ev.currentTarget.style.borderColor="rgba(168,230,207,0.07)"}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                          <div style={{background:"rgba(168,230,207,0.08)",border:"1px solid rgba(168,230,207,0.15)",borderRadius:"5px",padding:"0.22rem 0.6rem",fontFamily:"'Courier New',monospace",fontSize:"0.72rem",color:"#A8E6CF",fontWeight:"700"}}>{e.ticker}</div>
                          <div>
                            <div style={{color:"#D4E4F4",fontSize:"0.8rem",fontWeight:"600"}}>{e.company}</div>
                            <div style={{color:"#2A4060",fontSize:"0.57rem",fontFamily:"'Courier New',monospace"}}>{e.sector} · {e.date}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:"0.8rem"}}>
                          {e.eps!=="N/A"&&<span style={{color:"#4A6080",fontSize:"0.6rem"}}>EPS: {e.eps}</span>}
                          <span style={{color:outlookColor(e.outlook),fontFamily:"'Courier New',monospace",fontSize:"0.62rem",fontWeight:"700"}}>{outlookLabel(e.outlook)}</span>
                        </div>
                      </div>
                      <div style={{color:"#4A6080",fontSize:"0.67rem",marginBottom:"0.45rem"}}><span style={{color:"#2A4060",fontFamily:"'Courier New',monospace",fontSize:"0.56rem"}}>WATCH → </span>{e.watch}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{color:"#8A9BB0",fontSize:"0.67rem"}}><span style={{color:"#A8E6CF",fontFamily:"'Courier New',monospace",fontSize:"0.56rem"}}>ACCUVA → </span>{e.outlook}</div>
                        <button onClick={()=>{setActiveMode(MODES[0]);setInput(`Full pre-earnings deep dive on ${e.ticker} (${e.company}). Date: ${e.date}. EPS: ${e.eps}, Rev: ${e.revenue}. Watch: ${e.watch}. Give complete bull/base/bear with probability weights and top trade recommendation.`);}}
                          style={{background:"rgba(168,230,207,0.05)",border:"1px solid rgba(168,230,207,0.15)",borderRadius:"6px",color:"#A8E6CF",padding:"0.27rem 0.65rem",fontSize:"0.57rem",cursor:"pointer",fontFamily:"'Courier New',monospace",flexShrink:0,marginLeft:"1rem"}}>
                          DEEP ANALYSIS →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REPORTS */}
            {activeMode.id==="report"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.5rem"}}>
                <div style={{marginBottom:"1.2rem"}}>
                  <div style={{color:"#DDA0DD",fontSize:"0.75rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.2rem"}}>◪ PDF REPORT GENERATOR</div>
                  <div style={{color:"#2A4060",fontSize:"0.6rem"}}>Activate a client and run AI analysis first for the richest report.</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1rem"}}>
                  {clients.map(c=>{
                    const hasAnalysis=messages.some(m=>m.role==="assistant"&&m.clientId===c.id);
                    return(
                      <div key={c.id} style={{background:"rgba(221,160,221,0.03)",border:"1px solid rgba(221,160,221,0.1)",borderRadius:"12px",padding:"1.2rem"}}>
                        <div style={{color:"#D4E4F4",fontSize:"0.85rem",fontWeight:"600",marginBottom:"0.2rem"}}>{c.name}</div>
                        <div style={{color:"#4A6080",fontSize:"0.62rem",fontFamily:"'Courier New',monospace",marginBottom:"0.8rem"}}>{c.aum} · {c.risk}</div>
                        {[["Mandate",c.mandate],["YTD",c.ytd],["Last Review",c.lastReview]].map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.65rem",marginBottom:"0.2rem"}}>
                            <span style={{color:"#1A2A3A",fontFamily:"'Courier New',monospace"}}>{l}</span>
                            <span style={{color:"#8A9BB0"}}>{v}</span>
                          </div>
                        ))}
                        <div style={{margin:"0.8rem 0"}}>
                          <div style={{display:"flex",height:"7px",borderRadius:"4px",overflow:"hidden",gap:"1px"}}>
                            {Object.entries(c.allocation).map(([k,v])=><div key={k} style={{width:`${v}%`,background:ALLOC_COLORS[k]||"#8a9bb0"}}/>)}
                          </div>
                        </div>
                        {hasAnalysis&&<div style={{color:"#82D9B0",fontSize:"0.58rem",fontFamily:"'Courier New',monospace",marginBottom:"0.5rem"}}>✓ AI analysis ready to include</div>}
                        <button onClick={()=>generatePDF(c,messages)} style={{width:"100%",padding:"0.6rem",background:"linear-gradient(135deg,rgba(221,160,221,0.15),rgba(221,160,221,0.07))",border:"1px solid rgba(221,160,221,0.25)",borderRadius:"8px",color:"#DDA0DD",fontSize:"0.68rem",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em",fontWeight:"700"}}>
                          ↓ DOWNLOAD PDF REPORT
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI CHAT */}
            {isChatMode&&(
              <>
                <div style={{flex:1,overflowY:"auto",padding:"1.2rem 1.5rem",display:"flex",flexDirection:"column",gap:"1rem"}}>
                  {messages.length===0&&(
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:"1.5rem",animation:"fadeIn 0.5s ease"}}>
                      <div style={{width:"60px",height:"60px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.12)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem"}}>
                        <span style={{fontSize:"1.4rem",color:"rgba(201,168,76,0.35)"}}>⬡</span>
                      </div>
                      <div style={{color:"#C9A84C",fontSize:"0.88rem",letterSpacing:"0.2em",fontFamily:"'Courier New',monospace",marginBottom:"0.3rem"}}>ACCUVA READY</div>
                      <div style={{color:"#1A2A3A",fontSize:"0.67rem",textAlign:"center",maxWidth:"400px",lineHeight:"1.8",marginBottom:"1.8rem"}}>
                        {activeMode.id==="research"?"Paste any article, filing, or transcript — ACCUVA extracts the key investment insights.":
                         activeMode.id==="trade"?"Ask for specific trades — longs, shorts, hedges, options strategies. Full thesis with entry, target, stop.":
                         activeMode.id==="macro"?"Ask any macro question. ACCUVA connects Fed, inflation, yield curve, dollar, and geopolitics into actionable insights.":
                         "Talk however you want. ACCUVA always delivers institutional-grade analysis."}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.38rem",width:"100%",maxWidth:"490px"}}>
                        {(activeMode.id==="chat"?[
                          {m:MODES[0],t:"yo what's the market doing rn"},
                          {m:MODES[1],t:"45% AAPL, 20% TLT, 15% BTC, 20% cash — $5M AUM"},
                          {m:MODES[4],t:"where's the S&P going next 6 months? all scenarios"},
                          {m:MODES[6],t:"give me 3 high conviction trade ideas right now"},
                          {m:MODES[7],t:"what's the macro regime telling us about equities?"},
                        ]:activeMode.id==="trade"?[
                          {m:activeMode,t:"3 high conviction longs in AI infrastructure"},
                          {m:activeMode,t:"best hedges for a geopolitical risk spike"},
                          {m:activeMode,t:"options strategy for NVDA into earnings"},
                        ]:activeMode.id==="macro"?[
                          {m:activeMode,t:"What is the Fed likely to do in H2 2026?"},
                          {m:activeMode,t:"How should yield curve steepening affect my equity allocation?"},
                          {m:activeMode,t:"Dollar weakening — which assets benefit most?"},
                        ]:[{m:activeMode,t:activeMode.placeholder?.substring(0,60)+"..."}]).map((item,i)=>(
                          <button key={i} onClick={()=>{setActiveMode(item.m);setInput(item.t);}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",padding:"0.48rem 0.85rem",color:"#2A3A50",fontSize:"0.68rem",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                            onMouseOver={e=>{e.currentTarget.style.borderColor=`${item.m.color}40`;e.currentTarget.style.color=item.m.color;}}
                            onMouseOut={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.color="#2A3A50";}}>
                            <span style={{color:item.m.color,marginRight:"0.5rem"}}>{item.m.icon}</span>{item.t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg,i)=>(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.3s ease"}}>
                      {msg.role==="user"?(
                        <div style={{maxWidth:"72%"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.25rem",justifyContent:"flex-end"}}>
                            {msg.clientId&&<span style={{color:"#82B4FF",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>{clients.find(c=>c.id===msg.clientId)?.name}</span>}
                            <span style={{color:"#1A2A3A",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>ADVISOR</span>
                            <span style={{color:msg.mode?.color||"#C9A84C",fontSize:"0.65rem"}}>{msg.mode?.icon}</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px 12px 2px 12px",padding:"0.75rem 1rem",color:"#D4E4F4",fontSize:"0.82rem",lineHeight:"1.7"}}>
                            {msg.display||msg.content}
                          </div>
                        </div>
                      ):(
                        <div style={{maxWidth:"94%",width:"100%"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.25rem"}}>
                            <div style={{width:"16px",height:"16px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:"0.45rem",color:"#060D1A"}}>⬡</span>
                            </div>
                            <span style={{color:"#C9A84C",fontSize:"0.58rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>ACCUVA</span>
                            <span style={{color:"#1A2A3A",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>· {msg.mode?.label?.toUpperCase()}</span>
                          </div>
                          <div style={{background:"rgba(201,168,76,0.025)",border:"1px solid rgba(201,168,76,0.09)",borderRadius:"2px 12px 12px 12px",padding:"1rem 1.2rem"}}>
                            {formatMessage(msg.content)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.25rem"}}>
                        <div style={{width:"16px",height:"16px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:"0.45rem",color:"#060D1A"}}>⬡</span>
                        </div>
                        <span style={{color:"#C9A84C",fontSize:"0.58rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>ACCUVA</span>
                      </div>
                      <div style={{background:"rgba(201,168,76,0.025)",border:"1px solid rgba(201,168,76,0.09)",borderRadius:"2px 12px 12px 12px",padding:"0.9rem 1.2rem",display:"flex",alignItems:"center",gap:"0.7rem"}}>
                        {[0,1,2].map(j=><div key={j} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#C9A84C",animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>)}
                        <span style={{color:"#2A4060",fontSize:"0.65rem",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>ANALYSING...</span>
                      </div>
                    </div>
                  )}

                  {error&&<div style={{background:"rgba(244,123,123,0.08)",border:"1px solid rgba(244,123,123,0.2)",borderRadius:"8px",padding:"0.65rem 1rem",color:"#F47B7B",fontSize:"0.7rem",fontFamily:"'Courier New',monospace"}}>⚠ {error}</div>}
                  <div ref={chatEndRef}/>
                </div>

                {/* INPUT BAR */}
                <div style={{borderTop:"1px solid rgba(201,168,76,0.08)",padding:"0.9rem 1.2rem",background:"rgba(6,13,26,0.95)",backdropFilter:"blur(12px)",flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.4rem"}}>
                    <span style={{color:activeMode.color,fontSize:"0.72rem"}}>{activeMode.icon}</span>
                    <span style={{color:activeMode.color,fontSize:"0.58rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>{activeMode.label.toUpperCase()}</span>
                    {selectedClient&&<span style={{color:"#82B4FF",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>· {selectedClient.name}</span>}
                    <div style={{flex:1}}/>
                    <div style={{display:"flex",gap:"0.3rem"}}>
                      {[MODES[0],MODES[1],MODES[2],MODES[6],MODES[7]].map(m=>(
                        <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{background:activeMode.id===m.id?`${m.color}15`:"transparent",border:`1px solid ${activeMode.id===m.id?`${m.color}40`:"rgba(255,255,255,0.05)"}`,borderRadius:"5px",color:activeMode.id===m.id?m.color:"#1A2A3A",padding:"0.18rem 0.4rem",fontSize:"0.65rem",cursor:"pointer"}}>{m.icon}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"0.6rem",alignItems:"flex-end"}}>
                    <textarea value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSubmit();}}}
                      placeholder={activeMode.placeholder||"Ask anything..."}
                      rows={2} style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${activeMode.color}18`,borderRadius:"10px",padding:"0.75rem 1rem",color:"#D4E4F4",fontSize:"0.82rem",fontFamily:"Georgia,serif",lineHeight:"1.6",resize:"none",outline:"none",transition:"border-color 0.2s"}}
                      onFocus={e=>e.target.style.borderColor=`${activeMode.color}45`}
                      onBlur={e=>e.target.style.borderColor=`${activeMode.color}18`}/>
                    <button onClick={handleSubmit} disabled={loading||!input.trim()} style={{padding:"0.75rem 1.1rem",background:loading||!input.trim()?"rgba(201,168,76,0.07)":"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"10px",cursor:loading||!input.trim()?"not-allowed":"pointer",color:loading||!input.trim()?"#1A2A3A":"#060D1A",fontSize:"1rem",minWidth:"44px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                      {loading?<div style={{width:"14px",height:"14px",border:"2px solid #C9A84C",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:"→"}
                    </button>
                  </div>
                  <div style={{color:"#0D1824",fontSize:"0.52rem",marginTop:"0.35rem",fontFamily:"'Courier New',monospace"}}>ENTER TO SEND · SHIFT+ENTER NEW LINE · ACCUVA WEALTH v3.0</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
