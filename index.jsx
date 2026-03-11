import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are ACCUVA — an elite AI wealth and asset management advisor built exclusively for professional financial advisors and portfolio managers. You operate at the caliber of a senior analyst at Goldman Sachs Private Wealth, JPMorgan Private Bank, or UBS Wealth Management.

CURRENT DATE CONTEXT:
- The current year is 2026. All analysis, forecasts, and market context must reflect 2026 market conditions.
- Key 2026 macro context: Federal Reserve has been in a rate normalization cycle; AI infrastructure buildout is a dominant investment theme; geopolitical tensions (US-China trade, Middle East, Europe) remain key risk factors; crypto has seen significant institutional adoption post-ETF approvals; energy transition is accelerating with significant capital flows.
- Always reference 2026 as the present year in all analysis. Never reference 2024 or earlier as "current."

ACCURACY & INTEGRITY RULES — CRITICAL:
- NEVER fabricate specific price levels, exact earnings figures, or precise economic data you are not certain about
- When you do not have real-time data for a specific price or figure, clearly state: "Note: verify current price via live data feed" 
- Always distinguish between FACTS (confirmed historical data), ANALYSIS (your interpretation), and FORECASTS (probabilistic outlooks)
- Label every forecast clearly as a probability-weighted scenario, not a guarantee
- If asked for a specific live price (e.g. "what is AAPL trading at right now"), clearly state you do not have real-time pricing and advise the advisor to verify via Bloomberg, Reuters, or their trading terminal
- Never present opinions as facts
- Always include relevant risk factors that could invalidate your thesis
- Be conservative with return projections — institutional advisors need defensible numbers
- Cross-reference macro factors when making sector or stock calls
- If a question is outside your knowledge with high confidence, say so clearly rather than guessing

LANGUAGE & TONE:
- You understand ALL types of input — casual, formal, shorthand, slang, abbreviations, incomplete sentences
- If someone says "yo what's BTC doing" you give a full institutional-grade BTC analysis with 2026 context
- If someone says "check my portfolio" you ask them to paste their holdings
- If someone says "any good tech plays rn" you give high-conviction tech recommendations
- Never ask the user to rephrase — always infer intent and respond with full analysis
- Match the advisor's tone — casual but always institutional quality
- ALWAYS deliver institutional-quality content regardless of how casual the question is

ASSET CLASS COVERAGE:
- Equities (stocks, NYSE, NASDAQ, global indices)
- Fixed Income (bonds, treasuries, credit spreads, yield curves)
- Alternative Investments (private equity, hedge funds, real assets, commodities)
- Crypto & Digital Assets (BTC, ETH, institutional-grade digital assets)

CORE CAPABILITIES:

1. PORTFOLIO ANALYSIS & REVIEW
- Assess allocation, concentration risk, correlation, Sharpe ratio, max drawdown
- Identify over/underweight positions vs benchmarks (S&P 500, MSCI World, Bloomberg Agg)
- Flag rebalancing opportunities and drift from target allocation
- Always reference 2026 benchmark performance levels

2. INVESTMENT RECOMMENDATIONS
- Specific, actionable trade ideas with full rationale grounded in 2026 macro environment
- Entry/exit levels, position sizing, risk/reward profile
- Sector rotation, macro themes, factor tilts (value, growth, momentum, quality)
- Always include: Bull case, Bear case, Key risks, and Time horizon

3. RISK PROFILING & ASSESSMENT
- VaR, beta, duration, liquidity risk, correlation matrices
- Stress test against 2026-relevant macro scenarios: Fed policy shifts, recession risk, credit events, inflation resurgence, geopolitical shocks
- Tail risk and hedging strategies (options, inverse ETFs, gold, cash, volatility products)

4. MARKET INSIGHTS
- Macro environment in 2026: Fed policy, geopolitics, earnings seasons, credit conditions
- Sector and thematic opportunities: AI infrastructure, energy transition, defense, healthcare, financials
- NYSE/NASDAQ leadership, sector rotation, breadth, momentum signals
- Always ground insights in verifiable macro trends

5. FORECASTING (ALL HORIZONS)
- Short-term (days/weeks): technical levels, momentum, catalysts, options flow
- Medium-term (1-6 months): earnings revisions, macro data, sector rotation thesis
- Long-term (1-5 years): structural trends, demographic shifts, thematic investing
- ALWAYS present as Base / Bull / Bear scenarios with probability weightings
- Clearly label all forecasts as probabilistic, not guaranteed outcomes
- Reference NYSE and NASDAQ historical patterns and 2026 context

FORMAT RULES:
- Always use ▸ headers in CAPS for sections
- Use bullet points with ▹ for sub-points
- Bold key terms with **term**
- End EVERY response with "▸ ACCUVA VERDICT:" — one sharp bottom-line sentence
- Keep responses concise and executive — no fluff
- For any data point that requires real-time verification, add: ⚠ Verify via live feed

You are the advisor's most trusted analytical partner. Accuracy above all else. Be sharp, precise, and honest about the limits of your knowledge.`;

const MODES = [
  { id: "chat", label: "AI Advisor", icon: "◈", color: "#C9A84C", placeholder: "Ask anything — 'any good tech plays rn?' or 'what's the market doing?' or paste your portfolio..." },
  { id: "portfolio", label: "Portfolio Analysis", icon: "◆", color: "#7EB8F7", placeholder: "Paste holdings — e.g. '40% AAPL, 20% TLT, 15% BTC, 25% cash, $2M AUM'" },
  { id: "risk", label: "Risk Assessment", icon: "◉", color: "#F47B7B", placeholder: "Describe the portfolio or position to stress-test..." },
  { id: "market", label: "Market Insights", icon: "◍", color: "#82D9B0", placeholder: "Ask about markets, sectors, or macro — casual is fine..." },
  { id: "forecast", label: "Forecasting", icon: "◬", color: "#B59FFF", placeholder: "Any asset, sector or theme — short, medium, long term..." },
  { id: "clients", label: "Client Profiles", icon: "◑", color: "#FFB347", placeholder: "" },
  { id: "earnings", label: "Earnings Calendar", icon: "◐", color: "#64D8CB", placeholder: "" },
  { id: "report", label: "PDF Reports", icon: "◪", color: "#E8A0BF", placeholder: "" },
];

const EARNINGS_DATA = [
  { company: "Apple Inc.", ticker: "AAPL", date: "May 1, 2025", eps: "$1.62", revenue: "$94.2B", sector: "Technology", watch: "iPhone demand in China, services growth, AI monetization roadmap", outlook: "Cautiously bullish — services margin expansion offset by hardware headwinds" },
  { company: "Microsoft Corp.", ticker: "MSFT", date: "Apr 30, 2025", eps: "$3.22", revenue: "$68.4B", sector: "Technology", watch: "Azure cloud growth rate, Copilot enterprise adoption, capex guidance", outlook: "Bullish — Azure acceleration expected, AI tailwinds structural" },
  { company: "NVIDIA Corp.", ticker: "NVDA", date: "May 28, 2025", eps: "$5.58", revenue: "$43.1B", sector: "Semiconductors", watch: "Blackwell ramp, data center demand, export restriction impact", outlook: "Strongly bullish — demand exceeds supply, pricing power intact" },
  { company: "Amazon.com Inc.", ticker: "AMZN", date: "May 1, 2025", eps: "$1.37", revenue: "$155.0B", sector: "Technology", watch: "AWS growth, advertising revenue, retail margin recovery", outlook: "Bullish — AWS re-acceleration and ad growth driving multiple expansion" },
  { company: "Tesla Inc.", ticker: "TSLA", date: "Apr 22, 2025", eps: "$0.47", revenue: "$23.7B", sector: "EV/Auto", watch: "Delivery volumes, FSD progress, energy storage growth, margin trend", outlook: "Neutral — execution risks persist, energy segment a bright spot" },
  { company: "Meta Platforms", ticker: "META", date: "Apr 23, 2025", eps: "$5.26", revenue: "$41.3B", sector: "Technology", watch: "Ad revenue ARPU, Llama AI adoption, Reality Labs losses", outlook: "Bullish — ad recovery and AI efficiency drives margin expansion" },
  { company: "Alphabet Inc.", ticker: "GOOGL", date: "Apr 29, 2025", eps: "$2.02", revenue: "$89.5B", sector: "Technology", watch: "Search market share vs AI competitors, YouTube growth, GCP acceleration", outlook: "Cautiously bullish — AI integration into search key catalyst" },
  { company: "JPMorgan Chase", ticker: "JPM", date: "Apr 11, 2025", eps: "$4.64", revenue: "$43.8B", sector: "Financials", watch: "NII trajectory, credit loss provisions, IB deal pipeline", outlook: "Neutral — rate sensitivity balanced by strong IB recovery" },
  { company: "Goldman Sachs", ticker: "GS", date: "Apr 14, 2025", eps: "$12.35", revenue: "$14.7B", sector: "Financials", watch: "Trading revenue, asset management growth, deal activity", outlook: "Bullish — M&A revival and trading volume support earnings beat" },
  { company: "ExxonMobil", ticker: "XOM", date: "May 2, 2025", eps: "$1.76", revenue: "$83.0B", sector: "Energy", watch: "Production volumes, refining margins, Pioneer integration synergies", outlook: "Neutral — oil price uncertainty offsets operational excellence" },
  { company: "Bitcoin ETF (iShares)", ticker: "IBIT", date: "Ongoing", eps: "N/A", revenue: "N/A", sector: "Crypto", watch: "Institutional inflow trends, BTC spot price, regulatory developments", outlook: "Bullish — institutional adoption accelerating, supply shock post-halving" },
  { company: "Berkshire Hathaway", ticker: "BRK.B", date: "May 3, 2025", eps: "N/A", revenue: "$92.0B", sector: "Financials", watch: "Investment portfolio changes, operating earnings, cash deployment", outlook: "Neutral — defensive positioning attractive in volatile environment" },
];

const SAMPLE_CLIENTS = [
  { id: 1, name: "Victoria Harmon", aum: "$12.4M", risk: "Moderate", mandate: "Capital preservation + income", restrictions: "No tobacco, no crypto", allocation: { Equities: 45, Bonds: 35, Alternatives: 15, Cash: 5 }, ytd: "+4.2%", lastReview: "Feb 2025" },
  { id: 2, name: "Marcus Chen", aum: "$8.7M", risk: "Aggressive", mandate: "Long-term growth", restrictions: "No fossil fuels", allocation: { Equities: 70, Bonds: 10, Alternatives: 15, Crypto: 5 }, ytd: "+11.8%", lastReview: "Jan 2025" },
  { id: 3, name: "The Whitfield Trust", aum: "$34.2M", risk: "Conservative", mandate: "Wealth preservation across generations", restrictions: "Investment-grade bonds only, no leverage", allocation: { Equities: 30, Bonds: 55, Alternatives: 10, Cash: 5 }, ytd: "+2.1%", lastReview: "Mar 2025" },
];

const ALLOC_COLORS = { Equities: "#7EB8F7", Bonds: "#82D9B0", Alternatives: "#C9A84C", Cash: "#B59FFF", Crypto: "#F47B7B" };
const riskColor = (r) => ({ Conservative: "#82D9B0", Moderate: "#C9A84C", Aggressive: "#F47B7B" }[r] || "#B8C9D9");
const outlookColor = (o) => o?.toLowerCase().startsWith("bull") ? "#82D9B0" : o?.toLowerCase().startsWith("neutral") ? "#C9A84C" : "#F47B7B";
const outlookLabel = (o) => o?.toLowerCase().startsWith("bull") ? "▲ BULLISH" : o?.toLowerCase().startsWith("neutral") ? "◆ NEUTRAL" : "▼ BEARISH";

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
  const lastAdvice = messages.filter(m => m.role === "assistant" && m.clientId === client.id).slice(-1)[0]?.content || "No recent analysis on file. Activate this client profile and run an AI analysis first for a richer report.";
  const allocBars = Object.entries(client.allocation).map(([k, v]) => `<div style="width:${v}%;background:${ALLOC_COLORS[k] || "#8a9bb0"};height:100%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:monospace">${v > 8 ? v + "%" : ""}</div>`).join("");
  const allocLegend = Object.entries(client.allocation).map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#4a6080;margin-right:12px"><span style="width:8px;height:8px;border-radius:50%;background:${ALLOC_COLORS[k] || "#8a9bb0"};display:inline-block"></span>${k}: ${v}%</span>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#fff;color:#1a2a3a;padding:48px;line-height:1.6}@media print{body{padding:32px}@page{margin:.6in;size:A4}}.hdr{border-bottom:3px solid #C9A84C;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end}.logo{font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#0A1628;letter-spacing:.15em}.logo span{color:#C9A84C}.sub{font-size:9px;color:#8a9bb0;letter-spacing:.2em;text-transform:uppercase;margin-top:4px}.meta{text-align:right;font-size:10px;color:#4a6080;font-family:'Courier New',monospace;line-height:1.8}.sec{margin-bottom:24px}.sec-title{font-size:9px;font-family:'Courier New',monospace;color:#C9A84C;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #f0e8d0}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.metric{background:#f8f6f0;border-left:3px solid #C9A84C;padding:10px 12px;border-radius:0 5px 5px 0}.ml{font-size:8px;color:#8a9bb0;text-transform:uppercase;letter-spacing:.12em;font-family:'Courier New',monospace}.mv{font-size:14px;font-weight:700;color:#0A1628;margin-top:3px}.box{background:#f8f9fc;border:1px solid #e0e8f0;border-radius:6px;padding:14px;font-size:11px;line-height:1.8;color:#2a3a4a;white-space:pre-wrap;word-break:break-word}.foot{margin-top:36px;padding-top:12px;border-top:1px solid #e0e8f0;display:flex;justify-content:space-between;font-size:8px;color:#8a9bb0;font-family:'Courier New',monospace}.ytd{color:#2a9d6a;font-weight:700}</style></head><body>
<div class="hdr"><div><div class="logo">ACCUVA <span>WEALTH</span></div><div class="sub">Wealth Analyst Platform</div></div><div class="meta">CLIENT PORTFOLIO REPORT<br>Generated: ${now}<br>CONFIDENTIAL — ADVISOR USE ONLY</div></div>
<div class="sec"><div class="sec-title">▸ Client Overview</div><div class="grid"><div class="metric"><div class="ml">Client</div><div class="mv" style="font-size:13px">${client.name}</div></div><div class="metric"><div class="ml">AUM</div><div class="mv">${client.aum}</div></div><div class="metric"><div class="ml">YTD</div><div class="mv ytd">${client.ytd}</div></div><div class="metric"><div class="ml">Risk Profile</div><div class="mv" style="font-size:12px">${client.risk}</div></div><div class="metric"><div class="ml">Mandate</div><div class="mv" style="font-size:10px;margin-top:4px">${client.mandate}</div></div><div class="metric"><div class="ml">Last Review</div><div class="mv" style="font-size:12px">${client.lastReview}</div></div></div></div>
<div class="sec"><div class="sec-title">▸ Portfolio Allocation</div><div style="height:22px;border-radius:4px;overflow:hidden;display:flex;margin-bottom:8px">${allocBars}</div><div>${allocLegend}</div></div>
<div class="sec"><div class="sec-title">▸ Mandate & Restrictions</div><div class="box" style="font-size:11px">Mandate: ${client.mandate}\nRestrictions: ${client.restrictions}</div></div>
<div class="sec"><div class="sec-title">▸ Latest Accuva Analysis</div><div class="box">${lastAdvice.replace(/▸/g, "→").replace(/▹/g, "•").substring(0, 2000)}${lastAdvice.length > 2000 ? "\n\n[Full analysis available in Accuva Wealth platform]" : ""}</div></div>
<div class="foot"><div>ACCUVA WEALTH — CONFIDENTIAL</div><div>For professional advisor use only. Not for direct client distribution.</div><div>ID: ACCUVA-${client.id}-${Date.now().toString(36).toUpperCase()}</div></div>
</body></html>`;

  const printHtml = html;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(printHtml);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 800);
};

const TICKER_SYMBOLS = [
  { symbol: "SPY", label: "S&P 500" }, { symbol: "QQQ", label: "NASDAQ" }, { symbol: "DIA", label: "DOW" },
  { symbol: "AAPL", label: "AAPL" }, { symbol: "NVDA", label: "NVDA" }, { symbol: "MSFT", label: "MSFT" },
  { symbol: "TSLA", label: "TSLA" }, { symbol: "META", label: "META" }, { symbol: "GOOGL", label: "GOOGL" },
  { symbol: "AMZN", label: "AMZN" }, { symbol: "JPM", label: "JPM" }, { symbol: "GS", label: "GS" },
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
  const chatEndRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Fetch live prices from Finnhub
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

  // Continuous scroll animation
  useEffect(() => {
    if (tickerData.length === 0) return;
    let frame;
    let offset = 0;
    const itemWidth = 180;
    const total = tickerData.length * itemWidth;
    const animate = () => {
      offset = (offset + 0.5) % total;
      setTickerOffset(offset);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tickerData]);

  // Fetch news from Finnhub
  useEffect(() => {
    if (!finnhubKey) return;
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        const data = await res.json();
        if (Array.isArray(data)) setNews(data.filter(n => n.headline && n.source).slice(0, 30));
      } catch {}
      setNewsLoading(false);
    };
    fetchNews();
    const iv = setInterval(fetchNews, 120000);
    return () => clearInterval(iv);
  }, [finnhubKey]);

  const handleSetKey = () => {
    if (apiKeyInput.trim().startsWith("gsk_")) {
      setApiKey(apiKeyInput.trim());
      setApiKeySet(true);
      setError("");
      if (finnhubInput.trim()) setFinnhubKey(finnhubInput.trim());
    }
    else setError("Invalid Groq API key — must start with 'gsk_'");
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const clientCtx = selectedClient ? `\n\n[ACTIVE CLIENT: ${selectedClient.name} | AUM: ${selectedClient.aum} | Risk: ${selectedClient.risk} | Mandate: ${selectedClient.mandate} | Restrictions: ${selectedClient.restrictions}]` : "";
    const prefix = activeMode.id === "chat" ? "" : `[${activeMode.label.toUpperCase()} REQUEST]\n\n`;
    const fullContent = `${prefix}${input.trim()}${clientCtx}`;
    const newMsg = { role: "user", content: fullContent, display: input.trim(), mode: activeMode, clientId: selectedClient?.id };
    const updated = [...messages, newMsg];
    setMessages(updated); setInput(""); setLoading(true); setError("");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...updated.map(m => ({ role: m.role, content: m.content }))], temperature: 0.4, max_tokens: 1800 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Groq API error"); }
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.choices[0]?.message?.content || "No response.", mode: activeMode, clientId: selectedClient?.id }]);
    } catch (err) { setError(err.message || "Failed to reach Groq API."); setMessages(updated); }
    finally { setLoading(false); }
  };

  const addClient = () => {
    if (!newClient.name.trim()) return;
    setClients([...clients, { id: Date.now(), ...newClient, aum: newClient.aum || "$0", allocation: { Equities: 50, Bonds: 30, Alternatives: 15, Cash: 5 }, ytd: "+0.0%", lastReview: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }) }]);
    setNewClient({ name: "", aum: "", risk: "Moderate", mandate: "", restrictions: "" });
    setShowAddClient(false);
  };

  const sectors = ["All", ...new Set(EARNINGS_DATA.map(e => e.sector))];
  const filteredEarnings = earningsFilter === "All" ? EARNINGS_DATA : EARNINGS_DATA.filter(e => e.sector === earningsFilter);

  const inputStyle = { width: "100%", padding: "0.65rem 0.9rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#D4E4F4", fontSize: "0.78rem", outline: "none", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const labelStyle = { color: "#2A4060", fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace", textTransform: "uppercase", marginBottom: "0.3rem", display: "block" };

  if (!apiKeySet) return (
    <>
      <Head><title>Accuva Wealth — AI Wealth Analyst Platform</title></Head>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#060D1A 0%,#0A1628 50%,#060D1A 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ width: "72px", height: "72px", background: "linear-gradient(135deg,#C9A84C,#8B6914)", borderRadius: "50%", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(201,168,76,0.3)" }}>
              <span style={{ fontSize: "1.8rem", color: "#060D1A" }}>⬡</span>
            </div>
            <div style={{ color: "#C9A84C", fontSize: "1.6rem", fontWeight: "700", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace" }}>ACCUVA WEALTH</div>
            <div style={{ color: "#4A6080", fontSize: "0.68rem", letterSpacing: "0.2em", marginTop: "0.4rem", textTransform: "uppercase" }}>Wealth Analyst Platform</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "16px", padding: "2.5rem" }}>
            <div style={{ color: "#D4E4F4", fontSize: "1rem", marginBottom: "0.5rem", fontWeight: "600" }}>Advisor Access</div>
            <div style={{ color: "#8A9BB0", fontSize: "0.78rem", marginBottom: "1.8rem", lineHeight: "1.6" }}>Enter your API keys to activate Accuva. Get Groq free at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: "#C9A84C" }}>console.groq.com</a> · Finnhub free at <a href="https://finnhub.io" target="_blank" rel="noreferrer" style={{ color: "#C9A84C" }}>finnhub.io</a></div>
            <div style={{ color: "#2A4060", fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace", marginBottom: "0.4rem" }}>GROQ API KEY (required)</div>
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <input type={showKey ? "text" : "password"} value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSetKey()} placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                style={{ ...inputStyle, padding: "0.9rem 3rem 0.9rem 1rem", border: "1px solid rgba(201,168,76,0.3)", fontFamily: "'Courier New',monospace", color: "#E8D5A3" }} />
              <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4A6080", cursor: "pointer" }}>{showKey ? "◉" : "◎"}</button>
            </div>
            <div style={{ color: "#2A4060", fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace", marginBottom: "0.4rem" }}>FINNHUB API KEY (for live prices &amp; news)</div>
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <input type="password" value={finnhubInput} onChange={e => setFinnhubInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSetKey()} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx"
                style={{ ...inputStyle, padding: "0.9rem 1rem", border: "1px solid rgba(100,216,203,0.2)", fontFamily: "'Courier New',monospace", color: "#64D8CB" }} />
            </div>
            {error && <div style={{ color: "#F47B7B", fontSize: "0.75rem", marginBottom: "1rem", padding: "0.5rem 0.8rem", background: "rgba(244,123,123,0.1)", borderRadius: "6px" }}>⚠ {error}</div>}
            <button onClick={handleSetKey} style={{ width: "100%", padding: "0.9rem", background: "linear-gradient(135deg,#C9A84C,#8B6914)", border: "none", borderRadius: "8px", color: "#060D1A", fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Courier New',monospace" }}>
              Activate Accuva →
            </button>
            <div style={{ color: "#1A2A3A", fontSize: "0.65rem", textAlign: "center", marginTop: "1.2rem", lineHeight: "1.6" }}>Your key is never stored or shared. Queries go directly to Groq's secure servers.</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head><title>Accuva Wealth — AI Wealth Analyst Platform</title></Head>
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#060D1A 0%,#0A1628 60%,#08111F 100%)", display: "flex", flexDirection: "column", color: "#B8C9D9" }}>

        {/* HEADER */}
        <header style={{ borderBottom: "1px solid rgba(201,168,76,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", flexShrink: 0, background: "rgba(6,13,26,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div style={{ width: "34px", height: "34px", background: "linear-gradient(135deg,#C9A84C,#8B6914)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(201,168,76,0.25)" }}>
              <span style={{ fontSize: "0.95rem", color: "#060D1A" }}>⬡</span>
            </div>
            <div>
              <div style={{ color: "#C9A84C", fontSize: "0.9rem", fontWeight: "700", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", lineHeight: 1 }}>ACCUVA WEALTH</div>
              <div style={{ color: "#2A4060", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Wealth Analyst Platform</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {selectedClient && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.2)", borderRadius: "6px", padding: "0.3rem 0.8rem" }}>
                <span style={{ color: "#FFB347", fontSize: "0.58rem" }}>◑</span>
                <span style={{ color: "#FFB347", fontSize: "0.63rem", fontFamily: "'Courier New',monospace" }}>{selectedClient.name}</span>
                <button onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", color: "#4A6080", cursor: "pointer", fontSize: "0.7rem", padding: 0 }}>✕</button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#82D9B0", boxShadow: "0 0 6px #82D9B0" }} />
              <span style={{ color: "#2A4060", fontSize: "0.58rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace" }}>GROQ LIVE</span>
            </div>
            {finnhubKey && (
              <button onClick={() => setShowNews(!showNews)} style={{ background: showNews ? "rgba(100,216,203,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${showNews ? "rgba(100,216,203,0.4)" : "rgba(255,255,255,0.08)"}`, color: showNews ? "#64D8CB" : "#4A6080", padding: "0.25rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace" }}>
                {showNews ? "✕ NEWS" : "◈ LIVE NEWS"}
              </button>
            )}
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError(""); }} style={{ background: "rgba(244,123,123,0.08)", border: "1px solid rgba(244,123,123,0.2)", color: "#F47B7B", padding: "0.25rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace" }}>CLEAR</button>
            )}
          </div>
        </header>

        {/* TABS */}
        <div style={{ display: "flex", gap: "0.35rem", padding: "0.7rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, overflowX: "auto" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setActiveMode(m)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.85rem", borderRadius: "8px", cursor: "pointer", border: activeMode.id === m.id ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.05)", background: activeMode.id === m.id ? `${m.color}12` : "rgba(255,255,255,0.02)", color: activeMode.id === m.id ? m.color : "#2A4060", fontSize: "0.65rem", letterSpacing: "0.08em", fontFamily: "'Courier New',monospace", whiteSpace: "nowrap", fontWeight: activeMode.id === m.id ? "700" : "400", transition: "all 0.2s" }}>
              <span>{m.icon}</span>{m.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* LIVE TICKER BANNER */}
        {finnhubKey && tickerData.length > 0 && (
          <div style={{ background: "rgba(6,13,26,0.95)", borderBottom: "1px solid rgba(201,168,76,0.12)", padding: "0.4rem 0", overflow: "hidden", position: "relative", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "0", width: "max-content", transform: `translateX(-${tickerOffset}px)`, willChange: "transform" }}>
              {[...tickerData, ...tickerData, ...tickerData].map((t, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0 1.5rem", borderRight: "1px solid rgba(255,255,255,0.04)", minWidth: "180px" }}>
                  <span style={{ color: "#4A6080", fontSize: "0.62rem", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>{t.label}</span>
                  <span style={{ color: "#D4E4F4", fontSize: "0.68rem", fontFamily: "'Courier New',monospace", fontWeight: "600" }}>${t.price}</span>
                  <span style={{ color: t.up ? "#82D9B0" : "#F47B7B", fontSize: "0.6rem", fontFamily: "'Courier New',monospace" }}>{t.pct}</span>
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "40px", background: "linear-gradient(to right, rgba(6,13,26,0.95), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "40px", background: "linear-gradient(to left, rgba(6,13,26,0.95), transparent)", pointerEvents: "none" }} />
          </div>
        )}

        {/* NEWS PANEL */}
        {showNews && finnhubKey && (
          <div style={{ background: "rgba(6,13,26,0.98)", borderBottom: "1px solid rgba(100,216,203,0.12)", padding: "1rem 1.5rem", maxHeight: "320px", overflowY: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <div style={{ color: "#64D8CB", fontSize: "0.72rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>◈ LIVE MARKET NEWS</div>
              <div style={{ color: "#2A4060", fontSize: "0.58rem", fontFamily: "'Courier New',monospace" }}>POWERED BY FINNHUB · AUTO-REFRESHES EVERY 2 MIN</div>
            </div>
            {newsLoading && <div style={{ color: "#4A6080", fontSize: "0.7rem", fontFamily: "'Courier New',monospace" }}>LOADING NEWS FEED...</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "0.6rem" }}>
              {news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(100,216,203,0.07)", borderRadius: "8px", padding: "0.75rem 0.9rem", transition: "border-color 0.2s", cursor: "pointer" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = "rgba(100,216,203,0.25)"}
                  onMouseOut={e => e.currentTarget.style.borderColor = "rgba(100,216,203,0.07)"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <span style={{ color: "#C9A84C", fontSize: "0.57rem", fontFamily: "'Courier New',monospace", fontWeight: "700", textTransform: "uppercase" }}>{n.source}</span>
                    <span style={{ color: "#1A2A3A", fontSize: "0.55rem", fontFamily: "'Courier New',monospace" }}>{new Date(n.datetime * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div style={{ color: "#B8C9D9", fontSize: "0.72rem", lineHeight: "1.5", fontWeight: "500" }}>{n.headline}</div>
                  {n.summary && <div style={{ color: "#3A5570", fontSize: "0.63rem", lineHeight: "1.4", marginTop: "0.3rem" }}>{n.summary.substring(0, 120)}...</div>}
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* CLIENT PROFILES */}
          {activeMode.id === "clients" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <div>
                  <div style={{ color: "#FFB347", fontSize: "0.78rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>◑ CLIENT PROFILES</div>
                  <div style={{ color: "#2A4060", fontSize: "0.63rem", marginTop: "0.2rem" }}>Activate a client to apply their context to all AI analysis</div>
                </div>
                <button onClick={() => setShowAddClient(!showAddClient)} style={{ background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.25)", color: "#FFB347", padding: "0.4rem 1rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.65rem", fontFamily: "'Courier New',monospace", letterSpacing: "0.1em" }}>+ ADD CLIENT</button>
              </div>
              {showAddClient && (
                <div style={{ background: "rgba(255,179,71,0.03)", border: "1px solid rgba(255,179,71,0.15)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                    {[["name", "Client Name *"], ["aum", "AUM (e.g. $5M)"], ["mandate", "Investment Mandate"], ["restrictions", "Restrictions"]].map(([f, l]) => (
                      <div key={f}><label style={labelStyle}>{l}</label><input value={newClient[f]} onChange={e => setNewClient({ ...newClient, [f]: e.target.value })} placeholder={l} style={inputStyle} /></div>
                    ))}
                    <div><label style={labelStyle}>Risk Profile</label><select value={newClient.risk} onChange={e => setNewClient({ ...newClient, risk: e.target.value })} style={{ ...inputStyle, background: "#0A1628" }}>{["Conservative", "Moderate", "Aggressive"].map(r => <option key={r}>{r}</option>)}</select></div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem" }}>
                      <button onClick={addClient} style={{ flex: 1, padding: "0.65rem", background: "linear-gradient(135deg,#C9A84C,#8B6914)", border: "none", borderRadius: "6px", color: "#060D1A", fontSize: "0.7rem", fontWeight: "700", cursor: "pointer", fontFamily: "'Courier New',monospace" }}>SAVE CLIENT</button>
                      <button onClick={() => setShowAddClient(false)} style={{ padding: "0.65rem 0.9rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#4A6080", cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}>
                {clients.map(c => (
                  <div key={c.id} style={{ background: selectedClient?.id === c.id ? "rgba(255,179,71,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${selectedClient?.id === c.id ? "rgba(255,179,71,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", padding: "1.2rem", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                      <div>
                        <div style={{ color: "#D4E4F4", fontSize: "0.88rem", fontWeight: "600" }}>{c.name}</div>
                        <div style={{ color: "#2A4060", fontSize: "0.6rem", fontFamily: "'Courier New',monospace", marginTop: "0.15rem" }}>Last review: {c.lastReview}</div>
                      </div>
                      <span style={{ background: `${riskColor(c.risk)}18`, color: riskColor(c.risk), padding: "0.18rem 0.65rem", borderRadius: "20px", fontSize: "0.6rem", fontFamily: "'Courier New',monospace", fontWeight: "700", border: `1px solid ${riskColor(c.risk)}30` }}>{c.risk}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.45rem", marginBottom: "0.8rem" }}>
                      {[["AUM", c.aum, "#C9A84C"], ["YTD", c.ytd, "#82D9B0"], ["Mandate", c.mandate.split(" ").slice(0, 3).join(" ") + "…", "#8A9BB0"]].map(([l, v, col]) => (
                        <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "6px", padding: "0.45rem 0.55rem" }}>
                          <div style={{ color: "#2A4060", fontSize: "0.57rem", fontFamily: "'Courier New',monospace", textTransform: "uppercase" }}>{l}</div>
                          <div style={{ color: col, fontSize: "0.72rem", fontWeight: "700", marginTop: "0.15rem" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", gap: "1px" }}>
                        {Object.entries(c.allocation).map(([k, v]) => <div key={k} style={{ width: `${v}%`, background: ALLOC_COLORS[k] || "#8a9bb0", borderRadius: "2px" }} />)}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                        {Object.entries(c.allocation).map(([k, v]) => <span key={k} style={{ color: ALLOC_COLORS[k] || "#8a9bb0", fontSize: "0.57rem", fontFamily: "'Courier New',monospace" }}>{k} {v}%</span>)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => { setSelectedClient(selectedClient?.id === c.id ? null : c); setActiveMode(MODES[0]); }} style={{ flex: 1, padding: "0.45rem", background: selectedClient?.id === c.id ? "rgba(255,179,71,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedClient?.id === c.id ? "rgba(255,179,71,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "6px", color: selectedClient?.id === c.id ? "#FFB347" : "#4A6080", fontSize: "0.63rem", cursor: "pointer", fontFamily: "'Courier New',monospace" }}>
                        {selectedClient?.id === c.id ? "✓ ACTIVE" : "ACTIVATE"}
                      </button>
                      <button onClick={() => generatePDF(c, messages)} style={{ padding: "0.45rem 0.8rem", background: "rgba(232,160,191,0.07)", border: "1px solid rgba(232,160,191,0.2)", borderRadius: "6px", color: "#E8A0BF", fontSize: "0.63rem", cursor: "pointer", fontFamily: "'Courier New',monospace" }}>PDF ↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EARNINGS CALENDAR */}
          {activeMode.id === "earnings" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ color: "#64D8CB", fontSize: "0.78rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700", marginBottom: "0.2rem" }}>◐ EARNINGS CALENDAR — Q1/Q2 2025</div>
                <div style={{ color: "#2A4060", fontSize: "0.63rem", marginBottom: "0.9rem" }}>Pre-earnings outlook with ACCUVA analysis — click Deep Analysis for full breakdown</div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {sectors.map(s => <button key={s} onClick={() => setEarningsFilter(s)} style={{ padding: "0.28rem 0.75rem", borderRadius: "20px", border: earningsFilter === s ? "1px solid rgba(100,216,203,0.5)" : "1px solid rgba(255,255,255,0.07)", background: earningsFilter === s ? "rgba(100,216,203,0.1)" : "transparent", color: earningsFilter === s ? "#64D8CB" : "#2A4060", fontSize: "0.6rem", cursor: "pointer", fontFamily: "'Courier New',monospace" }}>{s}</button>)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {filteredEarnings.map((e, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(100,216,203,0.08)", borderRadius: "10px", padding: "1rem 1.2rem", transition: "border-color 0.2s", cursor: "default" }}
                    onMouseOver={ev => ev.currentTarget.style.borderColor = "rgba(100,216,203,0.2)"}
                    onMouseOut={ev => ev.currentTarget.style.borderColor = "rgba(100,216,203,0.08)"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ background: "rgba(100,216,203,0.08)", border: "1px solid rgba(100,216,203,0.15)", borderRadius: "5px", padding: "0.25rem 0.65rem", fontFamily: "'Courier New',monospace", fontSize: "0.73rem", color: "#64D8CB", fontWeight: "700" }}>{e.ticker}</div>
                        <div>
                          <div style={{ color: "#D4E4F4", fontSize: "0.82rem", fontWeight: "600" }}>{e.company}</div>
                          <div style={{ color: "#2A4060", fontSize: "0.58rem", fontFamily: "'Courier New',monospace" }}>{e.sector}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#C9A84C", fontSize: "0.68rem", fontFamily: "'Courier New',monospace" }}>{e.date}</div>
                        {e.eps !== "N/A" && <div style={{ color: "#4A6080", fontSize: "0.6rem" }}>EPS: {e.eps}</div>}
                        {e.revenue !== "N/A" && <div style={{ color: "#4A6080", fontSize: "0.6rem" }}>Rev: {e.revenue}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <div style={{ color: "#8A9BB0", fontSize: "0.7rem", flex: 1 }}><span style={{ color: "#4A6080", fontFamily: "'Courier New',monospace", fontSize: "0.58rem" }}>WATCH → </span>{e.watch}</div>
                      <span style={{ color: outlookColor(e.outlook), fontFamily: "'Courier New',monospace", fontSize: "0.65rem", fontWeight: "700", marginLeft: "1rem", whiteSpace: "nowrap" }}>{outlookLabel(e.outlook)}</span>
                    </div>
                    <div style={{ color: "#8A9BB0", fontSize: "0.7rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.45rem", marginBottom: "0.6rem" }}>
                      <span style={{ color: "#64D8CB", fontFamily: "'Courier New',monospace", fontSize: "0.58rem" }}>ACCUVA → </span>{e.outlook}
                    </div>
                    <button onClick={() => { setActiveMode(MODES[0]); setInput(`Give me a full pre-earnings deep dive on ${e.ticker} (${e.company}). Report date: ${e.date}. EPS consensus: ${e.eps}, Revenue est: ${e.revenue}. Key things to watch: ${e.watch}. Give me bull, base, and bear scenarios.`); }}
                      style={{ background: "rgba(100,216,203,0.05)", border: "1px solid rgba(100,216,203,0.15)", borderRadius: "6px", color: "#64D8CB", padding: "0.3rem 0.75rem", fontSize: "0.6rem", cursor: "pointer", fontFamily: "'Courier New',monospace", letterSpacing: "0.08em" }}>
                      DEEP ANALYSIS →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF REPORTS */}
          {activeMode.id === "report" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ color: "#E8A0BF", fontSize: "0.78rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700", marginBottom: "0.2rem" }}>◪ PDF REPORT GENERATOR</div>
                <div style={{ color: "#2A4060", fontSize: "0.63rem" }}>Tip: activate a client and run an AI analysis first — the report will include ACCUVA's latest insights for that client.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
                {clients.map(c => {
                  const hasAnalysis = messages.some(m => m.role === "assistant" && m.clientId === c.id);
                  return (
                    <div key={c.id} style={{ background: "rgba(232,160,191,0.03)", border: "1px solid rgba(232,160,191,0.1)", borderRadius: "12px", padding: "1.2rem" }}>
                      <div style={{ color: "#D4E4F4", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.2rem" }}>{c.name}</div>
                      <div style={{ color: "#4A6080", fontSize: "0.63rem", fontFamily: "'Courier New',monospace", marginBottom: "0.8rem" }}>{c.aum} · {c.risk}</div>
                      {[["Mandate", c.mandate], ["YTD Performance", c.ytd], ["Last Review", c.lastReview]].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.67rem", marginBottom: "0.25rem" }}>
                          <span style={{ color: "#2A4060", fontFamily: "'Courier New',monospace" }}>{l}</span>
                          <span style={{ color: "#8A9BB0" }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ margin: "0.8rem 0" }}>
                        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", gap: "1px" }}>
                          {Object.entries(c.allocation).map(([k, v]) => <div key={k} style={{ width: `${v}%`, background: ALLOC_COLORS[k] || "#8a9bb0" }} />)}
                        </div>
                      </div>
                      {hasAnalysis && <div style={{ color: "#82D9B0", fontSize: "0.6rem", fontFamily: "'Courier New',monospace", marginBottom: "0.5rem" }}>✓ ACCUVA analysis ready to include</div>}
                      <button onClick={() => generatePDF(c, messages)} style={{ width: "100%", padding: "0.6rem", background: "linear-gradient(135deg,rgba(232,160,191,0.15),rgba(232,160,191,0.07))", border: "1px solid rgba(232,160,191,0.25)", borderRadius: "8px", color: "#E8A0BF", fontSize: "0.68rem", cursor: "pointer", fontFamily: "'Courier New',monospace", letterSpacing: "0.1em", fontWeight: "700" }}>
                        ↓ DOWNLOAD PDF REPORT
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI CHAT */}
          {!["clients", "earnings", "report"].includes(activeMode.id) && (
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "2rem", animation: "fadeIn 0.5s ease" }}>
                    <div style={{ width: "68px", height: "68px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem" }}>
                      <span style={{ fontSize: "1.5rem", color: "rgba(201,168,76,0.4)" }}>⬡</span>
                    </div>
                    <div style={{ color: "#C9A84C", fontSize: "1rem", letterSpacing: "0.2em", fontFamily: "'Courier New',monospace", marginBottom: "0.4rem" }}>ACCUVA READY</div>
                    <div style={{ color: "#2A4060", fontSize: "0.72rem", textAlign: "center", maxWidth: "400px", lineHeight: "1.8" }}>
                      Talk however you want — casual, formal, shorthand. Accuva always delivers institutional-grade analysis.
                    </div>
                    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.45rem", width: "100%", maxWidth: "520px" }}>
                      {[
                        { m: MODES[0], t: "yo what's the market doing rn" },
                        { m: MODES[0], t: "any high conviction tech plays for Q2?" },
                        { m: MODES[1], t: "45% AAPL, 20% TLT, 15% BTC, 20% cash — $5M AUM, check this" },
                        { m: MODES[4], t: "where's the S&P going next 6 months? all scenarios" },
                        { m: MODES[2], t: "stress test heavy bond book if rates spike 150bps" },
                      ].map((item, i) => (
                        <button key={i} onClick={() => { setActiveMode(item.m); setInput(item.t); }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "0.55rem 0.9rem", color: "#3A5570", fontSize: "0.72rem", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = `${item.m.color}40`; e.currentTarget.style.color = item.m.color; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#3A5570"; }}>
                          <span style={{ color: item.m.color, marginRight: "0.5rem" }}>{item.m.icon}</span>{item.t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.3s ease" }}>
                    {msg.role === "user" ? (
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem", justifyContent: "flex-end" }}>
                          {msg.clientId && <span style={{ color: "#FFB347", fontSize: "0.57rem", fontFamily: "'Courier New',monospace" }}>{clients.find(c => c.id === msg.clientId)?.name}</span>}
                          <span style={{ color: "#2A4060", fontSize: "0.57rem", letterSpacing: "0.1em", fontFamily: "'Courier New',monospace" }}>ADVISOR</span>
                          <span style={{ color: msg.mode?.color || "#C9A84C", fontSize: "0.68rem" }}>{msg.mode?.icon}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px 12px 2px 12px", padding: "0.8rem 1rem", color: "#D4E4F4", fontSize: "0.82rem", lineHeight: "1.7" }}>
                          {msg.display || msg.content}
                        </div>
                      </div>
                    ) : (
                      <div style={{ maxWidth: "92%", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                          <div style={{ width: "18px", height: "18px", background: "linear-gradient(135deg,#C9A84C,#8B6914)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "0.5rem", color: "#060D1A" }}>⬡</span>
                          </div>
                          <span style={{ color: "#C9A84C", fontSize: "0.6rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>ACCUVA</span>
                          <span style={{ color: "#1A2A3A", fontSize: "0.58rem", fontFamily: "'Courier New',monospace" }}>· {msg.mode?.label?.toUpperCase()}</span>
                        </div>
                        <div style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2px 12px 12px 12px", padding: "1rem 1.2rem" }}>
                          {formatMessage(msg.content)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <div style={{ width: "18px", height: "18px", background: "linear-gradient(135deg,#C9A84C,#8B6914)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "0.5rem", color: "#060D1A" }}>⬡</span>
                      </div>
                      <span style={{ color: "#C9A84C", fontSize: "0.6rem", letterSpacing: "0.15em", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>ACCUVA</span>
                    </div>
                    <div style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2px 12px 12px 12px", padding: "1rem 1.4rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      {[0, 1, 2].map(j => <div key={j} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C9A84C", animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
                      <span style={{ color: "#4A6080", fontSize: "0.68rem", fontFamily: "'Courier New',monospace", letterSpacing: "0.1em" }}>ANALYZING...</span>
                    </div>
                  </div>
                )}

                {error && <div style={{ background: "rgba(244,123,123,0.08)", border: "1px solid rgba(244,123,123,0.2)", borderRadius: "8px", padding: "0.7rem 1rem", color: "#F47B7B", fontSize: "0.72rem", fontFamily: "'Courier New',monospace" }}>⚠ {error}</div>}
                <div ref={chatEndRef} />
              </div>

              {/* INPUT */}
              <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", padding: "1rem 1.5rem", background: "rgba(6,13,26,0.9)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: activeMode.color, fontSize: "0.75rem" }}>{activeMode.icon}</span>
                  <span style={{ color: activeMode.color, fontSize: "0.6rem", letterSpacing: "0.12em", fontFamily: "'Courier New',monospace", fontWeight: "700" }}>{activeMode.label.toUpperCase()}</span>
                  {selectedClient && <span style={{ color: "#FFB347", fontSize: "0.6rem", fontFamily: "'Courier New',monospace" }}>· {selectedClient.name}</span>}
                </div>
                <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-end" }}>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                    placeholder={activeMode.placeholder || "Ask anything — casual or formal, ACCUVA understands everything..."}
                    rows={2} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${activeMode.color}20`, borderRadius: "10px", padding: "0.8rem 1rem", color: "#D4E4F4", fontSize: "0.82rem", fontFamily: "Georgia,serif", lineHeight: "1.6", resize: "none", outline: "none", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = `${activeMode.color}50`}
                    onBlur={e => e.target.style.borderColor = `${activeMode.color}20`} />
                  <button onClick={handleSubmit} disabled={loading || !input.trim()} style={{ padding: "0.8rem 1.2rem", background: loading || !input.trim() ? "rgba(201,168,76,0.08)" : "linear-gradient(135deg,#C9A84C,#8B6914)", border: "none", borderRadius: "10px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", color: loading || !input.trim() ? "#2A4060" : "#060D1A", fontSize: "1rem", minWidth: "48px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    {loading ? "◌" : "→"}
                  </button>
                </div>
                <div style={{ color: "#1A2A3A", fontSize: "0.57rem", marginTop: "0.4rem", fontFamily: "'Courier New',monospace" }}>ENTER TO SEND · SHIFT+ENTER NEW LINE · ACCUVA WEALTH v2.0 · POWERED BY GROQ</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
