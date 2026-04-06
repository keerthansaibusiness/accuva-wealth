import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are ACCUVA — the world's most advanced AI wealth and asset management advisor. You operate at the highest level of institutional financial analysis, combining the depth of a seasoned portfolio manager, the precision of a quant analyst, and the breadth of a macro strategist.

CURRENT DATE: 2026. All analysis must reflect 2026 market conditions.

2026 MACRO CONTEXT:
- Federal Reserve: cautious easing cycle begun, fed funds at 4.25%, 2 cuts expected in H2 2026
- AI Infrastructure: dominant investment supercycle, NVDA/MSFT/AMZN/META leading capex buildout
- Geopolitics: US-China tech restrictions escalating, Middle East tensions persistent, Europe energy security improving
- Crypto: mainstream institutional adoption post-ETF approvals, BTC post-halving supply shock playing out
- Private Credit: $2T+ asset class, displacing traditional bank lending
- Energy Transition: $1.8T annual capital flows, infrastructure buildout accelerating
- Labor Market: resilient but cooling, wage growth moderating to 3.2%
- Corporate Earnings: S&P 500 EPS growth ~12% YoY, AI productivity gains inflecting margins

ACCURACY RULES — ABSOLUTE:
- Mark any current price with ⚠ Verify via live feed
- Label all content: [FACT] [ANALYSIS] [FORECAST]
- Every forecast needs probability: Base X% / Bull X% / Bear X%
- Never fabricate data points
- State clearly when outside confident knowledge

COMMUNICATION: Understand ALL input styles — casual slang to formal requests. Never ask to rephrase. Always infer intent. Respond at institutional quality regardless of how casual the question.

ASSET COVERAGE: Equities (global), Fixed Income, Alternatives, Crypto, Derivatives, Private Credit, Real Estate, Commodities, FX, Structured Products

ANALYTICAL FRAMEWORKS:
- Portfolio: Sharpe, Sortino, max drawdown, VaR, CVaR, beta, correlation, factor exposure, Fama-French attribution
- Risk: Monte Carlo stress testing, tail risk, liquidity-adjusted VaR, concentration risk, macro scenario analysis  
- Trade Ideas: specific entry/exit/stop, position sizing (Kelly criterion aware), risk/reward, catalyst timeline, invalidation levels
- Macro: regime identification, cross-asset implications, Fed reaction function, credit cycle positioning
- Options: Greeks (Delta/Gamma/Theta/Vega), strategy construction, vol surface analysis, hedging ratios
- ESG: factor scoring, exclusion screening, impact metrics, regulatory compliance (SFDR, EU taxonomy)

RESPONSE FORMAT:
▸ SECTION HEADERS in caps
▹ bullet points for sub-items  
**bold** for key terms
End every response: ▸ ACCUVA VERDICT: one definitive sentence
Price data needing verification: ⚠
Conviction levels: 🔴 HIGH 🟡 MEDIUM 🟢 LOW

You give advisors an unfair advantage. Every response should feel like having a world-class analyst on call 24/7.`;

// ── MODES ──────────────────────────────────────────────────────────────
const AI_MODES = [
  { id:"chat",    label:"AI Advisor",   icon:"◈", color:"#C9A84C", group:"ai", placeholder:"Ask anything — casual or formal. 'yo whats the market doing' or paste your full book..." },
  { id:"portfolio",label:"Portfolio",   icon:"◆", color:"#7EB8F7", group:"ai", placeholder:"Paste holdings — '40% AAPL, 20% TLT, 15% BTC, 25% cash — $5M AUM, moderate risk'" },
  { id:"risk",    label:"Risk",         icon:"◉", color:"#F47B7B", group:"ai", placeholder:"Describe position or portfolio to stress-test against macro scenarios..." },
  { id:"trade",   label:"Trade Ideas",  icon:"◎", color:"#FF9F6B", group:"ai", placeholder:"'3 high conviction longs in AI infra' or 'best hedges for a geopolitical spike'..." },
  { id:"options", label:"Options Desk", icon:"◬", color:"#B59FFF", group:"ai", placeholder:"Options strategy — 'protective put on AAPL' or 'income strategy for my NVDA position'..." },
  { id:"macro",   label:"Macro",        icon:"◇", color:"#E8A0BF", group:"ai", placeholder:"Fed, inflation, yield curve, dollar, geopolitics, cross-asset — ask anything macro..." },
  { id:"global",  label:"Global Markets",icon:"⊕", color:"#82D9B0", group:"ai", placeholder:"Europe, Asia, EM, FX, commodities — global macro and markets..." },
  { id:"research",label:"Research",     icon:"⬡", color:"#64D8CB", group:"ai", placeholder:"Paste any article, filing, earnings transcript — ACCUVA extracts key investment insights..." },
  { id:"stress",  label:"Stress Test",  icon:"◈", color:"#FF6B6B", group:"ai", placeholder:"Custom scenario — 'rates +300bps + recession + credit crunch — what happens to my book?'" },
  { id:"allocator",label:"Allocator",   icon:"◑", color:"#A8D8EA", group:"ai", placeholder:"'Build me a model portfolio for a $10M aggressive mandate with no fossil fuels'..." },
];
const MGMT_MODES = [
  { id:"watchlist",label:"Watchlist",   icon:"◉", color:"#FFB347", group:"mgmt" },
  { id:"clients", label:"Clients",      icon:"◐", color:"#82B4FF", group:"mgmt" },
  { id:"earnings",label:"Earnings",     icon:"◒", color:"#A8E6CF", group:"mgmt" },
  { id:"report",  label:"Reports",      icon:"◪", color:"#DDA0DD", group:"mgmt" },
  { id:"history", label:"History",      icon:"◫", color:"#B8D4E8", group:"mgmt" },
];
const ALL_MODES = [...AI_MODES, ...MGMT_MODES];

// ── DATA ───────────────────────────────────────────────────────────────
const EARNINGS_DATA = [
  { company:"Apple Inc.",         ticker:"AAPL",  date:"May 1, 2026",  eps:"$1.78", revenue:"$97.4B",  sector:"Technology",    watch:"iPhone China demand, services growth, AI monetization, Vision Pro", outlook:"Bullish" },
  { company:"Microsoft Corp.",    ticker:"MSFT",  date:"Apr 30, 2026", eps:"$3.45", revenue:"$71.2B",  sector:"Technology",    watch:"Azure growth rate, Copilot enterprise, OpenAI ROI, capex", outlook:"Strongly Bullish" },
  { company:"NVIDIA Corp.",       ticker:"NVDA",  date:"May 28, 2026", eps:"$6.80", revenue:"$52.0B",  sector:"Semis",         watch:"Blackwell Ultra ramp, sovereign AI, export restrictions, margins", outlook:"Strongly Bullish" },
  { company:"Amazon.com Inc.",    ticker:"AMZN",  date:"May 1, 2026",  eps:"$1.62", revenue:"$162.0B", sector:"Technology",    watch:"AWS acceleration, ad ARPU, Kuiper, AI capex", outlook:"Bullish" },
  { company:"Tesla Inc.",         ticker:"TSLA",  date:"Apr 22, 2026", eps:"$0.58", revenue:"$25.8B",  sector:"EV/Auto",       watch:"Robotaxi launch, FSD v13, energy storage, Model 2", outlook:"Neutral" },
  { company:"Meta Platforms",     ticker:"META",  date:"Apr 23, 2026", eps:"$6.10", revenue:"$44.8B",  sector:"Technology",    watch:"Ad ARPU, Llama 4, Reality Labs profitability path", outlook:"Bullish" },
  { company:"Alphabet Inc.",      ticker:"GOOGL", date:"Apr 29, 2026", eps:"$2.18", revenue:"$93.2B",  sector:"Technology",    watch:"Search AI, YouTube, GCP share gains, Waymo", outlook:"Cautiously Bullish" },
  { company:"JPMorgan Chase",     ticker:"JPM",   date:"Apr 11, 2026", eps:"$4.95", revenue:"$45.2B",  sector:"Financials",    watch:"NII in easing cycle, credit provisions, IB pipeline", outlook:"Bullish" },
  { company:"Goldman Sachs",      ticker:"GS",    date:"Apr 14, 2026", eps:"$13.80",revenue:"$15.4B",  sector:"Financials",    watch:"M&A pipeline, trading, asset mgmt AUM, private credit", outlook:"Bullish" },
  { company:"ExxonMobil",         ticker:"XOM",   date:"May 2, 2026",  eps:"$1.92", revenue:"$86.0B",  sector:"Energy",        watch:"Guyana ramp, Pioneer synergies, refining margins", outlook:"Neutral" },
  { company:"Bitcoin ETF iShares",ticker:"IBIT",  date:"Ongoing",      eps:"N/A",   revenue:"N/A",     sector:"Crypto",        watch:"Institutional inflows, halving supply shock, ETF options", outlook:"Bullish" },
  { company:"Berkshire Hathaway", ticker:"BRK.B", date:"May 3, 2026",  eps:"N/A",   revenue:"$95.0B",  sector:"Financials",    watch:"$180B+ cash deployment, succession, operating earnings", outlook:"Neutral" },
];

const SAMPLE_CLIENTS = [
  { id:1, name:"Victoria Harmon",    aum:"$12.4M", risk:"Moderate",     mandate:"Capital preservation + income",          restrictions:"No tobacco, no crypto",           allocation:{Equities:45,Bonds:35,Alternatives:15,Cash:5},     ytd:"+4.2%",  lastReview:"Feb 2026", tags:["HNW","Income"],              notes:"Prefers quarterly reviews. Concerned about inflation impact on bond holdings." },
  { id:2, name:"Marcus Chen",        aum:"$8.7M",  risk:"Aggressive",   mandate:"Long-term growth",                       restrictions:"No fossil fuels",                 allocation:{Equities:70,Bonds:10,Alternatives:15,Crypto:5},   ytd:"+11.8%", lastReview:"Jan 2026", tags:["Growth","ESG"],              notes:"Tech-forward. Interested in AI infrastructure exposure. Crypto-friendly." },
  { id:3, name:"The Whitfield Trust",aum:"$34.2M", risk:"Conservative", mandate:"Wealth preservation across generations",  restrictions:"IG bonds only, no leverage",       allocation:{Equities:30,Bonds:55,Alternatives:10,Cash:5},     ytd:"+2.1%",  lastReview:"Mar 2026", tags:["Trust","Conservative"],       notes:"Multi-generational wealth. Focus on capital preservation and estate planning." },
];

const DEFAULT_WATCHLIST = [
  { id:1, symbol:"NVDA",  name:"NVIDIA Corp.",          sector:"Semis",       notes:"AI infrastructure — Blackwell demand",    alert:">150",   alertType:"above" },
  { id:2, symbol:"AAPL",  name:"Apple Inc.",             sector:"Tech",        notes:"Services margin expansion thesis",        alert:"<210",   alertType:"below" },
  { id:3, symbol:"BTC",   name:"Bitcoin",                sector:"Crypto",      notes:"Post-halving supply shock + ETF inflows", alert:">100000",alertType:"above" },
  { id:4, symbol:"TLT",   name:"iShares 20Y Treasury",   sector:"Bonds",       notes:"Duration hedge — Fed pivot timing",       alert:"<85",    alertType:"below" },
  { id:5, symbol:"GLD",   name:"SPDR Gold Shares",       sector:"Commodities", notes:"Geopolitical hedge + USD weakness play",  alert:">220",   alertType:"above" },
];

const MACRO_DATA = [
  { label:"Fed Funds Rate", value:"4.25%",  change:"-0.25%", trend:"down", note:"First 2026 cut — cautious easing" },
  { label:"10Y Treasury",   value:"4.42%",  change:"+0.08%", trend:"up",   note:"Steepening curve — growth optimism" },
  { label:"2Y Treasury",    value:"4.18%",  change:"-0.05%", trend:"down", note:"Inversion narrowing — pivot priced" },
  { label:"CPI (YoY)",      value:"2.8%",   change:"-0.1%",  trend:"down", note:"Disinflation intact, above 2% target" },
  { label:"Core PCE",       value:"2.6%",   change:"-0.1%",  trend:"down", note:"Fed's preferred measure, cooling" },
  { label:"US GDP",         value:"2.4%",   change:"+0.2%",  trend:"up",   note:"Resilient consumer + AI capex" },
  { label:"Unemployment",   value:"3.9%",   change:"+0.1%",  trend:"up",   note:"Labor market softening gradually" },
  { label:"IG Credit Sprd", value:"98bps",  change:"-4bps",  trend:"down", note:"Risk-on — tight = complacency risk" },
  { label:"HY Credit Sprd", value:"312bps", change:"-8bps",  trend:"down", note:"High yield compression — watch vol" },
  { label:"DXY (Dollar)",   value:"103.2",  change:"-0.3%",  trend:"down", note:"Mild USD weakness — EM tailwind" },
  { label:"VIX",            value:"14.8",   change:"-1.2",   trend:"down", note:"Low vol regime — complacency risk" },
  { label:"Oil (WTI)",      value:"$74.20", change:"+$0.80", trend:"up",   note:"OPEC+ floor, demand still soft" },
];

const QUICK_COMMANDS = [
  { label:"📈 Market Pulse",    prompt:"Give me a complete market pulse for today — what's moving, why, and what it means for portfolios. Cover equities, rates, credit, and crypto." },
  { label:"🏦 Fed Watch",       prompt:"What is the Fed's current stance and what should I expect from monetary policy over the next 6 months? How should I position?" },
  { label:"⚡ Top Trade Ideas", prompt:"Give me your 3 highest conviction trade ideas right now across any asset class. Full thesis, entry, target, stop for each." },
  { label:"🛡️ Risk Check",      prompt:"What are the top 5 tail risks I should be watching and hedging against right now? Give me specific hedging strategies for each." },
  { label:"🌍 Global Macro",    prompt:"Give me a complete global macro briefing — US, Europe, China, EM, and the key cross-asset implications for my portfolio." },
  { label:"🔄 Sector Rotation", prompt:"Where are we in the sector rotation cycle? Which sectors to overweight and underweight right now and why?" },
];

const ALLOC_COLORS = { Equities:"#7EB8F7", Bonds:"#82D9B0", Alternatives:"#C9A84C", Cash:"#B59FFF", Crypto:"#F47B7B" };
const riskColor   = r => ({Conservative:"#82D9B0",Moderate:"#C9A84C",Aggressive:"#F47B7B"}[r]||"#B8C9D9");
const outlookColor = o => {
  const l = o?.toLowerCase();
  if(l?.startsWith("strongly bull")) return "#5EE8A0";
  if(l?.startsWith("bull"))          return "#82D9B0";
  if(l?.startsWith("neutral"))       return "#C9A84C";
  if(l?.startsWith("cautiously"))    return "#FFB347";
  return "#F47B7B";
};
const outlookBadge = o => {
  const l = o?.toLowerCase();
  if(l?.startsWith("strongly bull")) return "▲▲ STRONG BUY";
  if(l?.startsWith("bull"))          return "▲ BULLISH";
  if(l?.startsWith("cautiously"))    return "◆ CAUTIOUS";
  if(l?.startsWith("neutral"))       return "◆ NEUTRAL";
  return "▼ BEARISH";
};

const formatMessage = text => text.split("\n").map((line,i)=>{
  if(line.startsWith("▸")) return <div key={i} style={{color:"#C9A84C",fontWeight:"700",fontSize:"0.78rem",letterSpacing:"0.12em",marginTop:"1.2rem",marginBottom:"0.4rem",fontFamily:"'Courier New',monospace"}}>{line}</div>;
  if(line.match(/^\*\*(.+)\*\*$/)) return <div key={i} style={{color:"#E8D5A3",fontWeight:"600",marginTop:"0.6rem",fontSize:"0.82rem"}}>{line.replace(/\*\*/g,"")}</div>;
  if(line.startsWith("- ")||line.startsWith("• ")||line.startsWith("▹")){
    const content=line.replace(/^[-•▹] /,"");
    const fmt=content.replace(/\*\*(.+?)\*\*/g,(_,m)=>`<strong style="color:#C9A84C">${m}</strong>`);
    return <div key={i} style={{display:"flex",gap:"0.5rem",marginTop:"0.25rem",paddingLeft:"0.5rem"}}><span style={{color:"#C9A84C",flexShrink:0,fontSize:"0.7rem",marginTop:"0.15rem"}}>▹</span><span style={{color:"#B8C9D9",fontSize:"0.82rem",lineHeight:"1.6"}} dangerouslySetInnerHTML={{__html:fmt}}/></div>;
  }
  if(line.trim()==="") return <div key={i} style={{height:"0.4rem"}}/>;
  const fmt=line.replace(/\*\*(.+?)\*\*/g,(_,m)=>`<strong style="color:#C9A84C">${m}</strong>`);
  return <div key={i} style={{color:"#B8C9D9",fontSize:"0.82rem",lineHeight:"1.7",marginTop:"0.15rem"}} dangerouslySetInnerHTML={{__html:fmt}}/>;
});

const generatePDF=(client,messages)=>{
  const now=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const allMsgs=messages.filter(m=>m.role==="assistant"&&m.clientId===client.id);
  const lastAdvice=allMsgs.slice(-1)[0]?.content||"No analysis on file. Activate client and run AI analysis first.";
  const allocBars=Object.entries(client.allocation).map(([k,v])=>`<div style="width:${v}%;background:${ALLOC_COLORS[k]||"#8a9bb0"};height:100%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:monospace">${v>8?v+"%":""}</div>`).join("");
  const allocLegend=Object.entries(client.allocation).map(([k,v])=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;color:#4a6080;margin-right:12px"><span style="width:8px;height:8px;border-radius:50%;background:${ALLOC_COLORS[k]||"#8a9bb0"};display:inline-block"></span>${k}: ${v}%</span>`).join("");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#fff;color:#1a2a3a;padding:48px;line-height:1.6}@media print{body{padding:32px}@page{margin:.6in;size:A4}}.hdr{border-bottom:3px solid #C9A84C;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-end}.logo{font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#0A1628;letter-spacing:.15em}.logo span{color:#C9A84C}.sub{font-size:9px;color:#8a9bb0;letter-spacing:.2em;margin-top:4px}.meta{text-align:right;font-size:10px;color:#4a6080;font-family:'Courier New',monospace;line-height:1.8}.sec{margin-bottom:24px}.sec-title{font-size:9px;font-family:'Courier New',monospace;color:#C9A84C;letter-spacing:.2em;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #f0e8d0}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.metric{background:#f8f6f0;border-left:3px solid #C9A84C;padding:10px 12px}.ml{font-size:8px;color:#8a9bb0;text-transform:uppercase;letter-spacing:.12em;font-family:'Courier New',monospace}.mv{font-size:14px;font-weight:700;color:#0A1628;margin-top:3px}.box{background:#f8f9fc;border:1px solid #e0e8f0;border-radius:6px;padding:14px;font-size:11px;line-height:1.8;color:#2a3a4a;white-space:pre-wrap;word-break:break-word}.foot{margin-top:36px;padding-top:12px;border-top:1px solid #e0e8f0;display:flex;justify-content:space-between;font-size:8px;color:#8a9bb0;font-family:'Courier New',monospace}.ytd{color:#2a9d6a;font-weight:700}.notes{background:#fffbf0;border-left:3px solid #C9A84C;padding:10px 14px;font-size:11px;color:#4a6080;margin-top:8px}</style></head><body>
<div class="hdr"><div><div class="logo">ACCUVA <span>WEALTH</span></div><div class="sub">AI Wealth Analyst Platform · v4.0</div></div><div class="meta">CLIENT PORTFOLIO REPORT<br>${now}<br>CONFIDENTIAL — ADVISOR USE ONLY</div></div>
<div class="sec"><div class="sec-title">▸ Client Overview</div><div class="grid"><div class="metric"><div class="ml">Client</div><div class="mv" style="font-size:13px">${client.name}</div></div><div class="metric"><div class="ml">AUM</div><div class="mv">${client.aum}</div></div><div class="metric"><div class="ml">YTD Performance</div><div class="mv ytd">${client.ytd}</div></div><div class="metric"><div class="ml">Risk Profile</div><div class="mv">${client.risk}</div></div><div class="metric"><div class="ml">Mandate</div><div class="mv" style="font-size:10px;margin-top:4px">${client.mandate}</div></div><div class="metric"><div class="ml">Last Review</div><div class="mv">${client.lastReview}</div></div></div>${client.notes?`<div class="notes">📋 Advisor Notes: ${client.notes}</div>`:""}</div>
<div class="sec"><div class="sec-title">▸ Portfolio Allocation</div><div style="height:24px;border-radius:4px;overflow:hidden;display:flex;margin-bottom:8px">${allocBars}</div><div>${allocLegend}</div></div>
<div class="sec"><div class="sec-title">▸ Mandate & Restrictions</div><div class="box" style="font-size:11px">Mandate: ${client.mandate}\nRestrictions: ${client.restrictions}</div></div>
<div class="sec"><div class="sec-title">▸ Latest ACCUVA Analysis</div><div class="box">${lastAdvice.replace(/▸/g,"→").replace(/▹/g,"•").replace(/\*\*/g,"").substring(0,3500)}${lastAdvice.length>3500?"\n\n[Continued in platform...]":""}</div></div>
<div class="foot"><div>ACCUVA WEALTH v4.0 — CONFIDENTIAL</div><div>For professional advisor use only. Not for client distribution.</div><div>ID: AW4-${client.id}-${Date.now().toString(36).toUpperCase()}</div></div>
</body></html>`;
  const iframe=document.createElement("iframe");
  iframe.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.open(); iframe.contentDocument.write(html); iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(()=>{iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),2000);},800);
};

const TICKER_SYMBOLS=[
  {symbol:"SPY",label:"S&P 500"},{symbol:"QQQ",label:"NASDAQ"},{symbol:"DIA",label:"DOW"},
  {symbol:"AAPL",label:"AAPL"},{symbol:"NVDA",label:"NVDA"},{symbol:"MSFT",label:"MSFT"},
  {symbol:"TSLA",label:"TSLA"},{symbol:"META",label:"META"},{symbol:"GOOGL",label:"GOOGL"},
  {symbol:"AMZN",label:"AMZN"},{symbol:"JPM",label:"JPM"},{symbol:"GS",label:"GS"},
  {symbol:"BTC-USD",label:"BTC"},{symbol:"GC=F",label:"GOLD"},{symbol:"CL=F",label:"OIL"},
  {symbol:"TLT",label:"TLT"},{symbol:"^VIX",label:"VIX"},
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
export default function AccuvaWealth(){
  const [apiKey,setApiKey]=useState("");
  const [apiKeySet,setApiKeySet]=useState(false);
  const [apiKeyInput,setApiKeyInput]=useState("");
  const [finnhubKey,setFinnhubKey]=useState("");
  const [finnhubInput,setFinnhubInput]=useState("");
  const [showKey,setShowKey]=useState(false);
  const [activeMode,setActiveMode]=useState(AI_MODES[0]);
  const [input,setInput]=useState("");
  const [messages,setMessages]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [clients,setClients]=useState(SAMPLE_CLIENTS);
  const [selectedClient,setSelectedClient]=useState(null);
  const [showAddClient,setShowAddClient]=useState(false);
  const [newClient,setNewClient]=useState({name:"",aum:"",risk:"Moderate",mandate:"",restrictions:"",notes:""});
  const [earningsFilter,setEarningsFilter]=useState("All");
  const [tickerData,setTickerData]=useState([]);
  const [tickerOffset,setTickerOffset]=useState(0);
  const [news,setNews]=useState([]);
  const [newsLoading,setNewsLoading]=useState(false);
  const [showNews,setShowNews]=useState(false);
  const [watchlist,setWatchlist]=useState(DEFAULT_WATCHLIST);
  const [showAddWatch,setShowAddWatch]=useState(false);
  const [newWatch,setNewWatch]=useState({symbol:"",name:"",sector:"",notes:"",alert:"",alertType:"above"});
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [sessions,setSessions]=useState([]);
  const [tickerSearch,setTickerSearch]=useState("");
  const [tickerSearchResult,setTickerSearchResult]=useState(null);
  const [searchLoading,setSearchLoading]=useState(false);
  const [showMacroPanel,setShowMacroPanel]=useState(false);
  const [commandPalette,setCommandPalette]=useState(false);
  const [copyFeedback,setCopyFeedback]=useState(null);
  const chatEndRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  // keyboard shortcuts
  useEffect(()=>{
    const handler=e=>{
      if(e.key==="/"&&document.activeElement.tagName!=="TEXTAREA"&&document.activeElement.tagName!=="INPUT"){
        e.preventDefault(); inputRef.current?.focus();
      }
      if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setCommandPalette(p=>!p);}
      if(e.key==="Escape"){setCommandPalette(false);}
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  // live ticker
  useEffect(()=>{
    if(!finnhubKey) return;
    const fetch_=async()=>{
      const results=[];
      for(const s of TICKER_SYMBOLS){
        try{
          const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${finnhubKey}`);
          const d=await r.json();
          if(d.c&&d.c>0){
            const ch=d.c-d.pc;
            const pct=((ch/d.pc)*100).toFixed(2);
            results.push({label:s.label,price:d.c.toFixed(2),pct:ch>=0?`+${pct}%`:`${pct}%`,up:ch>=0,symbol:s.symbol});
          }
        }catch{}
      }
      if(results.length>0) setTickerData(results);
    };
    fetch_(); const iv=setInterval(fetch_,30000); return()=>clearInterval(iv);
  },[finnhubKey]);

  useEffect(()=>{
    if(!tickerData.length) return;
    let frame,offset=0;
    const total=tickerData.length*180;
    const animate=()=>{offset=(offset+0.45)%total;setTickerOffset(offset);frame=requestAnimationFrame(animate);};
    frame=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(frame);
  },[tickerData]);

  // news
  useEffect(()=>{
    if(!finnhubKey) return;
    const fetch_=async()=>{
      setNewsLoading(true);
      try{
        const r=await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        const d=await r.json();
        if(Array.isArray(d)) setNews(d.filter(n=>n.headline&&n.source).slice(0,50));
      }catch{}
      setNewsLoading(false);
    };
    fetch_(); const iv=setInterval(fetch_,120000); return()=>clearInterval(iv);
  },[finnhubKey]);

  // ticker search
  const searchTicker=useCallback(async(sym)=>{
    if(!finnhubKey||!sym) return;
    setSearchLoading(true);
    try{
      const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym.toUpperCase()}&token=${finnhubKey}`);
      const d=await r.json();
      if(d.c&&d.c>0){
        const ch=d.c-d.pc; const pct=((ch/d.pc)*100).toFixed(2);
        const h=await fetch(`https://finnhub.io/api/v1/company-news?symbol=${sym.toUpperCase()}&from=2026-01-01&to=2026-12-31&token=${finnhubKey}`);
        const news_=await h.json();
        setTickerSearchResult({symbol:sym.toUpperCase(),price:d.c.toFixed(2),change:ch.toFixed(2),pct:ch>=0?`+${pct}%`:`${pct}%`,up:ch>=0,high:d.h?.toFixed(2),low:d.l?.toFixed(2),open:d.o?.toFixed(2),prevClose:d.pc?.toFixed(2),recentNews:Array.isArray(news_)?news_.slice(0,3):[]});
      }else{setTickerSearchResult({error:"Symbol not found or market closed"});}
    }catch{setTickerSearchResult({error:"Failed to fetch data"});}
    setSearchLoading(false);
  },[finnhubKey]);

  const handleSetKey=()=>{
    if(apiKeyInput.trim().startsWith("gsk_")){
      setApiKey(apiKeyInput.trim());setApiKeySet(true);setError("");
      if(finnhubInput.trim()) setFinnhubKey(finnhubInput.trim());
    }else setError("Invalid Groq API key — must start with 'gsk_'");
  };

  const handleSubmit=async(customInput)=>{
    const txt=customInput||input;
    if(!txt.trim()||loading) return;
    const clientCtx=selectedClient?`\n\n[CLIENT CONTEXT: ${selectedClient.name} | AUM: ${selectedClient.aum} | Risk: ${selectedClient.risk} | Mandate: ${selectedClient.mandate} | Restrictions: ${selectedClient.restrictions} | YTD: ${selectedClient.ytd} | Notes: ${selectedClient.notes||"None"}]`:"";
    const modeCtx=activeMode.id==="chat"?"":activeMode.id==="stress"?"[STRESS TEST REQUEST]\n\n":activeMode.id==="allocator"?"[PORTFOLIO ALLOCATION REQUEST]\n\n":activeMode.id==="options"?"[OPTIONS DESK REQUEST]\n\n":activeMode.id==="research"?"[RESEARCH SYNTHESIS REQUEST — extract all key investment insights]\n\n":activeMode.id==="global"?"[GLOBAL MARKETS REQUEST]\n\n":`[${activeMode.label.toUpperCase()} REQUEST]\n\n`;
    const full=`${modeCtx}${txt.trim()}${clientCtx}`;
    const newMsg={role:"user",content:full,display:txt.trim(),mode:activeMode,clientId:selectedClient?.id,ts:Date.now()};
    const updated=[...messages,newMsg];
    setMessages(updated);setInput("");setLoading(true);setError("");
    try{
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
        body:JSON.stringify({model:GROQ_MODEL,messages:[{role:"system",content:SYSTEM_PROMPT},...updated.map(m=>({role:m.role,content:m.content}))],temperature:0.32,max_tokens:2600}),
      });
      if(!res.ok){const e=await res.json();throw new Error(e.error?.message||"Groq API error");}
      const data=await res.json();
      const reply=data.choices[0]?.message?.content||"No response.";
      const finalMessages=[...updated,{role:"assistant",content:reply,mode:activeMode,clientId:selectedClient?.id,ts:Date.now()}];
      setMessages(finalMessages);
      // auto-save session
      setSessions(prev=>{
        const session={id:Date.now(),title:txt.trim().substring(0,50),messages:finalMessages,mode:activeMode.label,ts:Date.now()};
        return [session,...prev.slice(0,19)];
      });
    }catch(err){setError(err.message||"Failed.");setMessages(updated);}
    finally{setLoading(false);}
  };

  const copyMessage=async(text,id)=>{
    try{await navigator.clipboard.writeText(text);setCopyFeedback(id);setTimeout(()=>setCopyFeedback(null),2000);}catch{}
  };

  const addClient=()=>{
    if(!newClient.name.trim()) return;
    setClients([...clients,{id:Date.now(),...newClient,aum:newClient.aum||"$0",allocation:{Equities:50,Bonds:30,Alternatives:15,Cash:5},ytd:"+0.0%",lastReview:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),tags:[]}]);
    setNewClient({name:"",aum:"",risk:"Moderate",mandate:"",restrictions:"",notes:""});setShowAddClient(false);
  };
  const addWatch=()=>{
    if(!newWatch.symbol.trim()) return;
    setWatchlist([...watchlist,{id:Date.now(),...newWatch,symbol:newWatch.symbol.toUpperCase()}]);
    setNewWatch({symbol:"",name:"",sector:"",notes:"",alert:"",alertType:"above"});setShowAddWatch(false);
  };

  const sectors=["All",...new Set(EARNINGS_DATA.map(e=>e.sector))];
  const filtEarnings=earningsFilter==="All"?EARNINGS_DATA:EARNINGS_DATA.filter(e=>e.sector===earningsFilter);
  const isChatMode=AI_MODES.some(m=>m.id===activeMode.id);

  const iStyle={width:"100%",padding:"0.62rem 0.85rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#D4E4F4",fontSize:"0.78rem",outline:"none",fontFamily:"Georgia,serif",boxSizing:"border-box"};
  const lStyle={color:"#2A4060",fontSize:"0.58rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",textTransform:"uppercase",marginBottom:"0.3rem",display:"block"};

  // ── LOGIN ──
  if(!apiKeySet) return(
    <>
      <Head><title>Accuva Wealth v4.0 — AI Wealth Analyst Platform</title></Head>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes glow{0%,100%{box-shadow:0 0 30px rgba(201,168,76,0.2)}50%{box-shadow:0 0 60px rgba(201,168,76,0.4)}}`}</style>
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,168,76,0.06) 0%,transparent 60%),linear-gradient(135deg,#060D1A 0%,#0A1628 50%,#060D1A 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem"}}>
        <div style={{width:"100%",maxWidth:"500px",animation:"fadeUp 0.7s ease"}}>
          <div style={{textAlign:"center",marginBottom:"3rem"}}>
            <div style={{width:"88px",height:"88px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",margin:"0 auto 1.8rem",display:"flex",alignItems:"center",justifyContent:"center",animation:"glow 3s ease-in-out infinite"}}>
              <span style={{fontSize:"2.2rem",color:"#060D1A"}}>⬡</span>
            </div>
            <div style={{color:"#C9A84C",fontSize:"2rem",fontWeight:"700",letterSpacing:"0.18em",fontFamily:"'Courier New',monospace"}}>ACCUVA WEALTH</div>
            <div style={{color:"#4A6080",fontSize:"0.65rem",letterSpacing:"0.22em",marginTop:"0.4rem",textTransform:"uppercase"}}>AI Wealth Analyst Platform · v4.0</div>
            <div style={{marginTop:"1.2rem",display:"flex",justifyContent:"center",gap:"1.2rem",flexWrap:"wrap"}}>
              {["AI Advisor","Portfolio","Trade Ideas","Options Desk","Macro","Global Markets","Stress Test","Allocator","Watchlist","Research"].map(f=>(
                <span key={f} style={{color:"#2A4060",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>▹ {f}</span>
              ))}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"18px",padding:"2.5rem",backdropFilter:"blur(12px)"}}>
            <div style={{color:"#D4E4F4",fontSize:"1.05rem",marginBottom:"0.4rem",fontWeight:"600"}}>Advisor Access</div>
            <div style={{color:"#8A9BB0",fontSize:"0.75rem",marginBottom:"2rem",lineHeight:"1.7"}}>
              Groq free at <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{color:"#C9A84C"}}>console.groq.com</a> · Finnhub free at <a href="https://finnhub.io" target="_blank" rel="noreferrer" style={{color:"#C9A84C"}}>finnhub.io</a>
            </div>
            <label style={lStyle}>Groq API Key (required)</label>
            <div style={{position:"relative",marginBottom:"1.2rem"}}>
              <input type={showKey?"text":"password"} value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetKey()} placeholder="gsk_xxxxxxxxxxxxxxxxxxxx" style={{...iStyle,padding:"0.95rem 3rem 0.95rem 1rem",border:"1px solid rgba(201,168,76,0.35)",fontFamily:"'Courier New',monospace",color:"#E8D5A3"}}/>
              <button onClick={()=>setShowKey(!showKey)} style={{position:"absolute",right:"0.8rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#4A6080",cursor:"pointer",fontSize:"1rem"}}>{showKey?"◉":"◎"}</button>
            </div>
            <label style={lStyle}>Finnhub API Key (optional — live prices &amp; news)</label>
            <div style={{marginBottom:"1.5rem"}}>
              <input type="password" value={finnhubInput} onChange={e=>setFinnhubInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetKey()} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx" style={{...iStyle,border:"1px solid rgba(100,216,203,0.25)",color:"#64D8CB"}}/>
            </div>
            {error&&<div style={{color:"#F47B7B",fontSize:"0.75rem",marginBottom:"1rem",padding:"0.6rem 0.9rem",background:"rgba(244,123,123,0.1)",borderRadius:"8px",border:"1px solid rgba(244,123,123,0.2)"}}>⚠ {error}</div>}
            <button onClick={handleSetKey} style={{width:"100%",padding:"1rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"10px",color:"#060D1A",fontSize:"0.9rem",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'Courier New',monospace",boxShadow:"0 6px 24px rgba(201,168,76,0.3)"}}>
              Activate ACCUVA →
            </button>
            <div style={{color:"#1A2A3A",fontSize:"0.6rem",textAlign:"center",marginTop:"1.2rem",lineHeight:"1.7"}}>Keys never stored. Queries go directly to secure API servers.</div>
          </div>
        </div>
      </div>
    </>
  );

  // ── MAIN APP ──
  return(
    <>
      <Head><title>Accuva Wealth v4.0</title></Head>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
      `}</style>

      {/* COMMAND PALETTE */}
      {commandPalette&&(
        <div onClick={()=>setCommandPalette(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"15vh"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"560px",background:"#0A1628",border:"1px solid rgba(201,168,76,0.3)",borderRadius:"16px",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.8)",animation:"slideDown 0.2s ease"}}>
            <div style={{padding:"0.8rem 1.2rem",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <span style={{color:"#C9A84C",fontSize:"0.8rem"}}>⌘</span>
              <span style={{color:"#4A6080",fontSize:"0.75rem",fontFamily:"'Courier New',monospace"}}>COMMAND PALETTE — Click to run</span>
            </div>
            <div style={{padding:"0.6rem"}}>
              {QUICK_COMMANDS.map((cmd,i)=>(
                <button key={i} onClick={()=>{setActiveMode(AI_MODES[0]);setCommandPalette(false);handleSubmit(cmd.prompt);}} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.8rem",padding:"0.75rem 1rem",borderRadius:"8px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",transition:"background 0.15s"}}
                  onMouseOver={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"}
                  onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:"1.1rem"}}>{cmd.label.split(" ")[0]}</span>
                  <span style={{color:"#B8C9D9",fontSize:"0.8rem"}}>{cmd.label.substring(2)}</span>
                </button>
              ))}
            </div>
            <div style={{padding:"0.6rem 1.2rem",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:"1.5rem"}}>
              <span style={{color:"#1A2A3A",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>/ to focus input</span>
              <span style={{color:"#1A2A3A",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>Ctrl+K to open</span>
              <span style={{color:"#1A2A3A",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#060D1A 0%,#0A1628 60%,#08111F 100%)",display:"flex",flexDirection:"column",color:"#B8C9D9"}}>

        {/* HEADER */}
        <header style={{borderBottom:"1px solid rgba(201,168,76,0.12)",padding:"0 1.2rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:"54px",flexShrink:0,background:"rgba(6,13,26,0.97)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
            <button onClick={()=>setSidebarCollapsed(p=>!p)} style={{background:"none",border:"none",color:"#2A4060",cursor:"pointer",fontSize:"1rem",padding:"0.2rem",lineHeight:1}}>☰</button>
            <div style={{width:"28px",height:"28px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(201,168,76,0.3)"}}>
              <span style={{fontSize:"0.75rem",color:"#060D1A"}}>⬡</span>
            </div>
            <div>
              <div style={{color:"#C9A84C",fontSize:"0.8rem",fontWeight:"700",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",lineHeight:1}}>ACCUVA WEALTH</div>
              <div style={{color:"#1A2A3A",fontSize:"0.44rem",letterSpacing:"0.12em"}}>v4.0 · AI ANALYST PLATFORM</div>
            </div>
          </div>

          {/* TICKER SEARCH */}
          {finnhubKey&&(
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem",position:"relative"}}>
              <input value={tickerSearch} onChange={e=>setTickerSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")searchTicker(tickerSearch);}} placeholder="Search ticker..." style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",padding:"0.3rem 0.7rem",color:"#D4E4F4",fontSize:"0.7rem",outline:"none",fontFamily:"'Courier New',monospace",width:"140px"}}/>
              <button onClick={()=>searchTicker(tickerSearch)} disabled={searchLoading} style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"6px",padding:"0.3rem 0.6rem",color:"#C9A84C",fontSize:"0.65rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>
                {searchLoading?"...":"GO"}
              </button>
              {tickerSearchResult&&(
                <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,width:"320px",background:"#0A1628",border:"1px solid rgba(201,168,76,0.25)",borderRadius:"12px",padding:"1rem",zIndex:200,animation:"slideDown 0.2s ease",boxShadow:"0 12px 40px rgba(0,0,0,0.6)"}}>
                  <button onClick={()=>setTickerSearchResult(null)} style={{position:"absolute",top:"0.5rem",right:"0.6rem",background:"none",border:"none",color:"#4A6080",cursor:"pointer",fontSize:"0.8rem"}}>✕</button>
                  {tickerSearchResult.error?(
                    <div style={{color:"#F47B7B",fontSize:"0.75rem",fontFamily:"'Courier New',monospace"}}>{tickerSearchResult.error}</div>
                  ):(
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.8rem"}}>
                        <div>
                          <div style={{color:"#C9A84C",fontSize:"0.9rem",fontWeight:"700",fontFamily:"'Courier New',monospace"}}>{tickerSearchResult.symbol}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:"#D4E4F4",fontSize:"1.1rem",fontWeight:"700",fontFamily:"'Courier New',monospace"}}>${tickerSearchResult.price}</div>
                          <div style={{color:tickerSearchResult.up?"#82D9B0":"#F47B7B",fontSize:"0.7rem",fontFamily:"'Courier New',monospace"}}>{tickerSearchResult.pct}</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem",marginBottom:"0.8rem"}}>
                        {[["Open",tickerSearchResult.open],["Prev Close",tickerSearchResult.prevClose],["High",tickerSearchResult.high],["Low",tickerSearchResult.low]].map(([l,v])=>(
                          <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:"5px",padding:"0.3rem 0.5rem"}}>
                            <div style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{l}</div>
                            <div style={{color:"#8A9BB0",fontSize:"0.7rem",fontFamily:"'Courier New',monospace"}}>${v}</div>
                          </div>
                        ))}
                      </div>
                      {tickerSearchResult.recentNews?.length>0&&(
                        <div>
                          <div style={{color:"#2A4060",fontSize:"0.55rem",fontFamily:"'Courier New',monospace",marginBottom:"0.4rem",letterSpacing:"0.1em"}}>RECENT NEWS</div>
                          {tickerSearchResult.recentNews.map((n,i)=>(
                            <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{display:"block",color:"#8A9BB0",fontSize:"0.65rem",lineHeight:"1.4",marginBottom:"0.3rem",textDecoration:"none",borderLeft:"2px solid rgba(201,168,76,0.2)",paddingLeft:"0.5rem"}}>
                              {n.headline?.substring(0,80)}...
                            </a>
                          ))}
                        </div>
                      )}
                      <button onClick={()=>{setActiveMode(AI_MODES[0]);setInput(`Full analysis of ${tickerSearchResult.symbol}: current price $${tickerSearchResult.price} (${tickerSearchResult.pct}). Give me comprehensive view — technicals, fundamentals, catalysts, risks, and your recommendation.`);setTickerSearchResult(null);}} style={{width:"100%",marginTop:"0.6rem",padding:"0.4rem",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"6px",color:"#C9A84C",fontSize:"0.62rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>
                        AI DEEP DIVE →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
            <button onClick={()=>setCommandPalette(true)} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",padding:"0.22rem 0.7rem",color:"#2A4060",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>⌘K</button>
            {selectedClient&&(
              <div style={{display:"flex",alignItems:"center",gap:"0.4rem",background:"rgba(130,180,255,0.08)",border:"1px solid rgba(130,180,255,0.2)",borderRadius:"6px",padding:"0.22rem 0.65rem"}}>
                <span style={{color:"#82B4FF",fontSize:"0.55rem"}}>◐</span>
                <span style={{color:"#82B4FF",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>{selectedClient.name}</span>
                <button onClick={()=>setSelectedClient(null)} style={{background:"none",border:"none",color:"#4A6060",cursor:"pointer",fontSize:"0.6rem",padding:0}}>✕</button>
              </div>
            )}
            {finnhubKey&&(
              <button onClick={()=>setShowNews(p=>!p)} style={{background:showNews?"rgba(100,216,203,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${showNews?"rgba(100,216,203,0.35)":"rgba(255,255,255,0.07)"}`,color:showNews?"#64D8CB":"#2A4060",padding:"0.22rem 0.65rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>
                {showNews?"✕ NEWS":"◈ NEWS"}
              </button>
            )}
            <button onClick={()=>setShowMacroPanel(p=>!p)} style={{background:showMacroPanel?"rgba(232,160,191,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${showMacroPanel?"rgba(232,160,191,0.35)":"rgba(255,255,255,0.07)"}`,color:showMacroPanel?"#E8A0BF":"#2A4060",padding:"0.22rem 0.65rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>◇ MACRO</button>
            <div style={{display:"flex",alignItems:"center",gap:"0.3rem"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#82D9B0",boxShadow:"0 0 6px #82D9B0",animation:"pulse 2s infinite"}}/>
              <span style={{color:"#1A3020",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>GROQ</span>
            </div>
            {finnhubKey&&<div style={{display:"flex",alignItems:"center",gap:"0.3rem"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#64D8CB",boxShadow:"0 0 6px #64D8CB",animation:"pulse 2s 0.5s infinite"}}/>
              <span style={{color:"#1A3030",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>LIVE</span>
            </div>}
            {messages.length>0&&<button onClick={()=>{setMessages([]);setError("");}} style={{background:"rgba(244,123,123,0.07)",border:"1px solid rgba(244,123,123,0.18)",color:"#F47B7B",padding:"0.22rem 0.65rem",borderRadius:"6px",cursor:"pointer",fontSize:"0.58rem",fontFamily:"'Courier New',monospace"}}>CLEAR</button>}
          </div>
        </header>

        {/* LIVE TICKER */}
        {finnhubKey&&tickerData.length>0&&(
          <div style={{background:"rgba(3,6,12,0.98)",borderBottom:"1px solid rgba(201,168,76,0.08)",padding:"0.32rem 0",overflow:"hidden",position:"relative",flexShrink:0}}>
            <div style={{display:"flex",width:"max-content",transform:`translateX(-${tickerOffset}px)`,willChange:"transform"}}>
              {[...tickerData,...tickerData,...tickerData].map((t,i)=>(
                <div key={i} onClick={()=>{setTickerSearch(t.label);searchTicker(t.symbol||t.label);}} style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",padding:"0 1.3rem",borderRight:"1px solid rgba(255,255,255,0.04)",minWidth:"170px",cursor:"pointer"}}>
                  <span style={{color:"#2A4060",fontSize:"0.58rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>{t.label}</span>
                  <span style={{color:"#8A9BB0",fontSize:"0.63rem",fontFamily:"'Courier New',monospace"}}>${t.price}</span>
                  <span style={{color:t.up?"#82D9B0":"#F47B7B",fontSize:"0.56rem",fontFamily:"'Courier New',monospace"}}>{t.pct}</span>
                </div>
              ))}
            </div>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:"36px",background:"linear-gradient(to right,rgba(3,6,12,0.98),transparent)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",right:0,top:0,bottom:0,width:"36px",background:"linear-gradient(to left,rgba(3,6,12,0.98),transparent)",pointerEvents:"none"}}/>
          </div>
        )}

        {/* MACRO PANEL */}
        {showMacroPanel&&(
          <div style={{background:"rgba(6,10,20,0.98)",borderBottom:"1px solid rgba(232,160,191,0.12)",padding:"0.8rem 1.2rem",flexShrink:0,animation:"slideDown 0.2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem"}}>
              <span style={{color:"#E8A0BF",fontSize:"0.62rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◇ MACRO DASHBOARD 2026</span>
              <span style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>⚠ Indicative — verify via live feed</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"0.45rem"}}>
              {MACRO_DATA.map((m,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"7px",padding:"0.55rem 0.75rem"}}>
                  <div style={{color:"#1A2A3A",fontSize:"0.5rem",fontFamily:"'Courier New',monospace",textTransform:"uppercase",marginBottom:"0.2rem"}}>{m.label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    <span style={{color:"#D4E4F4",fontSize:"0.85rem",fontWeight:"700",fontFamily:"'Courier New',monospace"}}>{m.value}</span>
                    <span style={{color:m.trend==="up"?"#F47B7B":"#82D9B0",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>{m.change}</span>
                  </div>
                  <div style={{color:"#2A4060",fontSize:"0.52rem",marginTop:"0.15rem",lineHeight:1.4}}>{m.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEWS PANEL */}
        {showNews&&finnhubKey&&(
          <div style={{background:"rgba(6,13,26,0.98)",borderBottom:"1px solid rgba(100,216,203,0.1)",padding:"0.8rem 1.2rem",maxHeight:"280px",overflowY:"auto",flexShrink:0,animation:"slideDown 0.2s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.6rem"}}>
              <span style={{color:"#64D8CB",fontSize:"0.62rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◈ LIVE MARKET NEWS</span>
              <span style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{newsLoading?"LOADING...":"FINNHUB · REFRESH 2MIN"}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:"0.45rem"}}>
              {news.map((n,i)=>(
                <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(100,216,203,0.06)",borderRadius:"7px",padding:"0.6rem 0.8rem",transition:"border-color 0.2s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor="rgba(100,216,203,0.2)"}
                  onMouseOut={e=>e.currentTarget.style.borderColor="rgba(100,216,203,0.06)"}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.22rem"}}>
                    <span style={{color:"#C9A84C",fontSize:"0.52rem",fontFamily:"'Courier New',monospace",fontWeight:"700",textTransform:"uppercase"}}>{n.source}</span>
                    <span style={{color:"#1A2A3A",fontSize:"0.5rem",fontFamily:"'Courier New',monospace"}}>{new Date(n.datetime*1000).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  <div style={{color:"#8A9BB0",fontSize:"0.68rem",lineHeight:"1.4"}}>{n.headline}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* SIDEBAR */}
          <div style={{width:sidebarCollapsed?"48px":"188px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)",background:"rgba(3,6,12,0.7)",display:"flex",flexDirection:"column",transition:"width 0.22s ease",overflow:"hidden"}}>
            <div style={{flex:1,overflowY:"auto",padding:"0.4rem 0.3rem"}}>
              {!sidebarCollapsed&&<div style={{color:"#1A2A3A",fontSize:"0.48rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",padding:"0.5rem 0.6rem 0.2rem",textTransform:"uppercase"}}>AI Tools</div>}
              {AI_MODES.map(m=>(
                <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.5rem",padding:sidebarCollapsed?"0.5rem":"0.48rem 0.7rem",borderRadius:"7px",cursor:"pointer",border:"none",background:activeMode.id===m.id?`${m.color}12`:"transparent",color:activeMode.id===m.id?m.color:"#2A4060",fontSize:"0.58rem",letterSpacing:"0.04em",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",fontWeight:activeMode.id===m.id?"700":"400",transition:"all 0.15s",marginBottom:"1px",justifyContent:sidebarCollapsed?"center":"flex-start"}}>
                  <span style={{fontSize:"0.78rem",flexShrink:0}}>{m.icon}</span>
                  {!sidebarCollapsed&&m.label.toUpperCase()}
                </button>
              ))}
              {!sidebarCollapsed&&<div style={{height:"1px",background:"rgba(255,255,255,0.04)",margin:"0.4rem 0.4rem 0.2rem"}}/>}
              {!sidebarCollapsed&&<div style={{color:"#1A2A3A",fontSize:"0.48rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",padding:"0.3rem 0.6rem 0.2rem",textTransform:"uppercase"}}>Management</div>}
              {MGMT_MODES.map(m=>(
                <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.5rem",padding:sidebarCollapsed?"0.5rem":"0.48rem 0.7rem",borderRadius:"7px",cursor:"pointer",border:"none",background:activeMode.id===m.id?`${m.color}12`:"transparent",color:activeMode.id===m.id?m.color:"#2A4060",fontSize:"0.58rem",letterSpacing:"0.04em",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",fontWeight:activeMode.id===m.id?"700":"400",transition:"all 0.15s",marginBottom:"1px",justifyContent:sidebarCollapsed?"center":"flex-start"}}>
                  <span style={{fontSize:"0.78rem",flexShrink:0}}>{m.icon}</span>
                  {!sidebarCollapsed&&m.label.toUpperCase()}
                </button>
              ))}
              {/* QUICK COMMANDS */}
              {!sidebarCollapsed&&(
                <>
                  <div style={{height:"1px",background:"rgba(255,255,255,0.04)",margin:"0.4rem 0.4rem 0.2rem"}}/>
                  <div style={{color:"#1A2A3A",fontSize:"0.48rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",padding:"0.3rem 0.6rem 0.2rem",textTransform:"uppercase"}}>Quick Commands</div>
                  {QUICK_COMMANDS.slice(0,4).map((cmd,i)=>(
                    <button key={i} onClick={()=>{setActiveMode(AI_MODES[0]);handleSubmit(cmd.prompt);}} style={{width:"100%",display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.42rem 0.7rem",borderRadius:"7px",cursor:"pointer",border:"none",background:"transparent",color:"#2A4060",fontSize:"0.55rem",letterSpacing:"0.03em",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",transition:"all 0.15s",marginBottom:"1px",textAlign:"left"}}
                      onMouseOver={e=>{e.currentTarget.style.background="rgba(201,168,76,0.06)";e.currentTarget.style.color="#C9A84C";}}
                      onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#2A4060";}}>
                      <span style={{fontSize:"0.7rem"}}>{cmd.label.split(" ")[0]}</span>
                      {cmd.label.substring(2)}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

            {/* WATCHLIST */}
            {activeMode.id==="watchlist"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.4rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div>
                    <div style={{color:"#FFB347",fontSize:"0.72rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◉ WATCHLIST</div>
                    <div style={{color:"#2A4060",fontSize:"0.58rem",marginTop:"0.15rem"}}>Track positions · click to get AI deep dive · ticker prices update live if Finnhub connected</div>
                  </div>
                  <button onClick={()=>setShowAddWatch(p=>!p)} style={{background:"rgba(255,179,71,0.08)",border:"1px solid rgba(255,179,71,0.25)",color:"#FFB347",padding:"0.32rem 0.85rem",borderRadius:"7px",cursor:"pointer",fontSize:"0.6rem",fontFamily:"'Courier New',monospace"}}>+ ADD</button>
                </div>
                {showAddWatch&&(
                  <div style={{background:"rgba(255,179,71,0.03)",border:"1px solid rgba(255,179,71,0.15)",borderRadius:"12px",padding:"1.1rem",marginBottom:"1rem"}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.7rem"}}>
                      {[["symbol","Ticker *"],["name","Company"],["sector","Sector"],["alert","Alert Level"],["notes","Notes"]].map(([f,l])=>(
                        <div key={f}><label style={lStyle}>{l}</label><input value={newWatch[f]} onChange={e=>setNewWatch({...newWatch,[f]:e.target.value})} placeholder={l} style={iStyle}/></div>
                      ))}
                      <div style={{display:"flex",alignItems:"flex-end",gap:"0.5rem"}}>
                        <button onClick={addWatch} style={{flex:1,padding:"0.62rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"6px",color:"#060D1A",fontSize:"0.65rem",fontWeight:"700",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>ADD</button>
                        <button onClick={()=>setShowAddWatch(false)} style={{padding:"0.62rem 0.8rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#4A6080",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {watchlist.map((w,i)=>{
                    const live=tickerData.find(t=>t.label===w.symbol||t.symbol===w.symbol);
                    return(
                      <div key={w.id||i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,179,71,0.08)",borderRadius:"10px",padding:"0.85rem 1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"1rem",transition:"border-color 0.2s"}}
                        onMouseOver={e=>e.currentTarget.style.borderColor="rgba(255,179,71,0.18)"}
                        onMouseOut={e=>e.currentTarget.style.borderColor="rgba(255,179,71,0.08)"}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.9rem"}}>
                          <div style={{background:"rgba(255,179,71,0.08)",border:"1px solid rgba(255,179,71,0.15)",borderRadius:"6px",padding:"0.25rem 0.6rem",fontFamily:"'Courier New',monospace",fontSize:"0.72rem",color:"#FFB347",fontWeight:"700",minWidth:"56px",textAlign:"center"}}>{w.symbol}</div>
                          <div>
                            <div style={{color:"#D4E4F4",fontSize:"0.78rem",fontWeight:"500"}}>{w.name||w.symbol}</div>
                            <div style={{color:"#2A4060",fontSize:"0.56rem",fontFamily:"'Courier New',monospace"}}>{w.sector&&`${w.sector} · `}{w.alert&&`Alert: ${w.alert}`}</div>
                          </div>
                        </div>
                        {live&&(
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{color:"#D4E4F4",fontSize:"0.82rem",fontWeight:"700",fontFamily:"'Courier New',monospace"}}>${live.price}</div>
                            <div style={{color:live.up?"#82D9B0":"#F47B7B",fontSize:"0.6rem",fontFamily:"'Courier New',monospace"}}>{live.pct}</div>
                          </div>
                        )}
                        <div style={{flex:1,color:"#4A6080",fontSize:"0.68rem",lineHeight:"1.5"}}>{w.notes}</div>
                        <div style={{display:"flex",gap:"0.4rem",flexShrink:0}}>
                          <button onClick={()=>{setActiveMode(AI_MODES[0]);setInput(`Full analysis of ${w.symbol}${w.name?` (${w.name})`:""}.${live?` Current price: $${live.price} (${live.pct}).`:""} Give comprehensive view: price action, catalysts, risks, recommendation.${w.notes?` Context: ${w.notes}`:""}`);}} style={{background:"rgba(255,179,71,0.07)",border:"1px solid rgba(255,179,71,0.2)",borderRadius:"6px",color:"#FFB347",padding:"0.26rem 0.6rem",fontSize:"0.56rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>ANALYSE →</button>
                          <button onClick={()=>setWatchlist(watchlist.filter((_,j)=>j!==i))} style={{background:"rgba(244,123,123,0.06)",border:"1px solid rgba(244,123,123,0.15)",borderRadius:"6px",color:"#F47B7B",padding:"0.26rem 0.45rem",fontSize:"0.58rem",cursor:"pointer"}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CLIENTS */}
            {activeMode.id==="clients"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.4rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div>
                    <div style={{color:"#82B4FF",fontSize:"0.72rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>◐ CLIENT PROFILES</div>
                    <div style={{color:"#2A4060",fontSize:"0.58rem",marginTop:"0.15rem"}}>Activate a client — their full context applies to every AI analysis</div>
                  </div>
                  <button onClick={()=>setShowAddClient(p=>!p)} style={{background:"rgba(130,180,255,0.08)",border:"1px solid rgba(130,180,255,0.25)",color:"#82B4FF",padding:"0.32rem 0.85rem",borderRadius:"7px",cursor:"pointer",fontSize:"0.6rem",fontFamily:"'Courier New',monospace"}}>+ ADD CLIENT</button>
                </div>
                {showAddClient&&(
                  <div style={{background:"rgba(130,180,255,0.03)",border:"1px solid rgba(130,180,255,0.15)",borderRadius:"12px",padding:"1.1rem",marginBottom:"1rem"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.7rem"}}>
                      {[["name","Client Name *"],["aum","AUM (e.g. $5M)"],["mandate","Investment Mandate"],["restrictions","Restrictions"],["notes","Advisor Notes"]].map(([f,l])=>(
                        <div key={f}><label style={lStyle}>{l}</label><input value={newClient[f]} onChange={e=>setNewClient({...newClient,[f]:e.target.value})} placeholder={l} style={iStyle}/></div>
                      ))}
                      <div><label style={lStyle}>Risk Profile</label><select value={newClient.risk} onChange={e=>setNewClient({...newClient,risk:e.target.value})} style={{...iStyle,background:"#0A1628"}}>{["Conservative","Moderate","Aggressive"].map(r=><option key={r}>{r}</option>)}</select></div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:"0.5rem"}}>
                        <button onClick={addClient} style={{flex:1,padding:"0.62rem",background:"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"6px",color:"#060D1A",fontSize:"0.68rem",fontWeight:"700",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>SAVE</button>
                        <button onClick={()=>setShowAddClient(false)} style={{padding:"0.62rem 0.8rem",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",color:"#4A6080",cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(295px,1fr))",gap:"1rem"}}>
                  {clients.map(c=>(
                    <div key={c.id} style={{background:selectedClient?.id===c.id?"rgba(130,180,255,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${selectedClient?.id===c.id?"rgba(130,180,255,0.28)":"rgba(255,255,255,0.06)"}`,borderRadius:"12px",padding:"1.1rem",transition:"all 0.2s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem"}}>
                        <div>
                          <div style={{color:"#D4E4F4",fontSize:"0.86rem",fontWeight:"600"}}>{c.name}</div>
                          <div style={{color:"#2A4060",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",marginTop:"0.08rem"}}>Last review: {c.lastReview}</div>
                          <div style={{display:"flex",gap:"0.3rem",marginTop:"0.28rem",flexWrap:"wrap"}}>
                            {c.tags?.map(t=><span key={t} style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.15)",color:"#C9A84C",padding:"0.07rem 0.42rem",borderRadius:"10px",fontSize:"0.5rem",fontFamily:"'Courier New',monospace"}}>{t}</span>)}
                          </div>
                        </div>
                        <span style={{background:`${riskColor(c.risk)}18`,color:riskColor(c.risk),padding:"0.16rem 0.6rem",borderRadius:"20px",fontSize:"0.57rem",fontFamily:"'Courier New',monospace",fontWeight:"700",border:`1px solid ${riskColor(c.risk)}28`}}>{c.risk}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.38rem",marginBottom:"0.75rem"}}>
                        {[["AUM",c.aum,"#C9A84C"],["YTD",c.ytd,"#82D9B0"],["Type",c.risk.slice(0,4),riskColor(c.risk)]].map(([l,v,col])=>(
                          <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:"6px",padding:"0.38rem 0.48rem"}}>
                            <div style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{l}</div>
                            <div style={{color:col,fontSize:"0.7rem",fontWeight:"700",marginTop:"0.08rem"}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{marginBottom:"0.75rem"}}>
                        <div style={{display:"flex",height:"5px",borderRadius:"3px",overflow:"hidden",gap:"1px"}}>
                          {Object.entries(c.allocation).map(([k,v])=><div key={k} style={{width:`${v}%`,background:ALLOC_COLORS[k]||"#8a9bb0"}}/>)}
                        </div>
                        <div style={{display:"flex",gap:"0.45rem",marginTop:"0.28rem",flexWrap:"wrap"}}>
                          {Object.entries(c.allocation).map(([k,v])=><span key={k} style={{color:ALLOC_COLORS[k]||"#8a9bb0",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{k} {v}%</span>)}
                        </div>
                      </div>
                      {c.notes&&<div style={{color:"#2A4060",fontSize:"0.6rem",lineHeight:"1.5",marginBottom:"0.7rem",fontStyle:"italic",borderLeft:"2px solid rgba(201,168,76,0.2)",paddingLeft:"0.5rem"}}>{c.notes}</div>}
                      <div style={{display:"flex",gap:"0.45rem"}}>
                        <button onClick={()=>{setSelectedClient(selectedClient?.id===c.id?null:c);setActiveMode(AI_MODES[0]);}} style={{flex:1,padding:"0.4rem",background:selectedClient?.id===c.id?"rgba(130,180,255,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedClient?.id===c.id?"rgba(130,180,255,0.38)":"rgba(255,255,255,0.08)"}`,borderRadius:"6px",color:selectedClient?.id===c.id?"#82B4FF":"#4A6080",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>
                          {selectedClient?.id===c.id?"✓ ACTIVE":"ACTIVATE"}
                        </button>
                        <button onClick={()=>{setActiveMode(AI_MODES[0]);setInput(`Give me a complete portfolio review for ${c.name}. AUM: ${c.aum}, Risk: ${c.risk}, Mandate: ${c.mandate}, Restrictions: ${c.restrictions}, YTD: ${c.ytd}. Allocation: ${JSON.stringify(c.allocation)}. What changes should I make?`);}} style={{padding:"0.4rem 0.7rem",background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.18)",borderRadius:"6px",color:"#C9A84C",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>REVIEW</button>
                        <button onClick={()=>generatePDF(c,messages)} style={{padding:"0.4rem 0.7rem",background:"rgba(221,160,221,0.07)",border:"1px solid rgba(221,160,221,0.18)",borderRadius:"6px",color:"#DDA0DD",fontSize:"0.58rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EARNINGS */}
            {activeMode.id==="earnings"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.4rem"}}>
                <div style={{marginBottom:"1rem"}}>
                  <div style={{color:"#A8E6CF",fontSize:"0.72rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.15rem"}}>◒ EARNINGS CALENDAR — Q1/Q2 2026</div>
                  <div style={{color:"#2A4060",fontSize:"0.58rem",marginBottom:"0.75rem"}}>ACCUVA pre-earnings outlook — click Deep Analysis for full bull/base/bear with probability weights</div>
                  <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
                    {sectors.map(s=><button key={s} onClick={()=>setEarningsFilter(s)} style={{padding:"0.22rem 0.65rem",borderRadius:"20px",border:earningsFilter===s?"1px solid rgba(168,230,207,0.45)":"1px solid rgba(255,255,255,0.07)",background:earningsFilter===s?"rgba(168,230,207,0.1)":"transparent",color:earningsFilter===s?"#A8E6CF":"#2A4060",fontSize:"0.56rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>{s}</button>)}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {filtEarnings.map((e,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(168,230,207,0.07)",borderRadius:"10px",padding:"0.85rem 1.1rem",transition:"border-color 0.2s"}}
                      onMouseOver={ev=>ev.currentTarget.style.borderColor="rgba(168,230,207,0.18)"}
                      onMouseOut={ev=>ev.currentTarget.style.borderColor="rgba(168,230,207,0.07)"}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.45rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
                          <div style={{background:"rgba(168,230,207,0.08)",border:"1px solid rgba(168,230,207,0.15)",borderRadius:"5px",padding:"0.2rem 0.55rem",fontFamily:"'Courier New',monospace",fontSize:"0.7rem",color:"#A8E6CF",fontWeight:"700"}}>{e.ticker}</div>
                          <div>
                            <div style={{color:"#D4E4F4",fontSize:"0.78rem",fontWeight:"600"}}>{e.company}</div>
                            <div style={{color:"#2A4060",fontSize:"0.55rem",fontFamily:"'Courier New',monospace"}}>{e.sector} · {e.date}{e.eps!=="N/A"&&` · EPS: ${e.eps}`}</div>
                          </div>
                        </div>
                        <span style={{color:outlookColor(e.outlook),fontFamily:"'Courier New',monospace",fontSize:"0.6rem",fontWeight:"700",flexShrink:0}}>{outlookBadge(e.outlook)}</span>
                      </div>
                      <div style={{color:"#4A6080",fontSize:"0.66rem",marginBottom:"0.4rem"}}><span style={{color:"#2A4060",fontFamily:"'Courier New',monospace",fontSize:"0.54rem"}}>WATCH → </span>{e.watch}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{color:"#8A9BB0",fontSize:"0.66rem"}}><span style={{color:"#A8E6CF",fontFamily:"'Courier New',monospace",fontSize:"0.54rem"}}>ACCUVA → </span>{e.outlook}</div>
                        <button onClick={()=>{setActiveMode(AI_MODES[0]);setInput(`Full pre-earnings analysis of ${e.ticker} (${e.company}). Date: ${e.date}. EPS consensus: ${e.eps}, Revenue: ${e.revenue}. Key things to watch: ${e.watch}. Give complete bull/base/bear scenarios with probability weights (must sum to 100%), specific price targets for each scenario, key catalysts, risks, and your recommended trade.`);}}
                          style={{background:"rgba(168,230,207,0.05)",border:"1px solid rgba(168,230,207,0.15)",borderRadius:"6px",color:"#A8E6CF",padding:"0.25rem 0.6rem",fontSize:"0.56rem",cursor:"pointer",fontFamily:"'Courier New',monospace",flexShrink:0,marginLeft:"1rem"}}>
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
              <div style={{flex:1,overflowY:"auto",padding:"1.4rem"}}>
                <div style={{marginBottom:"1rem"}}>
                  <div style={{color:"#DDA0DD",fontSize:"0.72rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.15rem"}}>◪ PDF REPORT GENERATOR</div>
                  <div style={{color:"#2A4060",fontSize:"0.58rem"}}>Activate a client, run AI analysis, then generate a professional branded report.</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(278px,1fr))",gap:"1rem"}}>
                  {clients.map(c=>{
                    const hasAnalysis=messages.some(m=>m.role==="assistant"&&m.clientId===c.id);
                    return(
                      <div key={c.id} style={{background:"rgba(221,160,221,0.03)",border:"1px solid rgba(221,160,221,0.1)",borderRadius:"12px",padding:"1.1rem"}}>
                        <div style={{color:"#D4E4F4",fontSize:"0.84rem",fontWeight:"600",marginBottom:"0.18rem"}}>{c.name}</div>
                        <div style={{color:"#4A6080",fontSize:"0.6rem",fontFamily:"'Courier New',monospace",marginBottom:"0.75rem"}}>{c.aum} · {c.risk}</div>
                        {[["Mandate",c.mandate],["YTD",c.ytd],["Last Review",c.lastReview]].map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.63rem",marginBottom:"0.18rem"}}>
                            <span style={{color:"#1A2A3A",fontFamily:"'Courier New',monospace"}}>{l}</span>
                            <span style={{color:"#8A9BB0"}}>{v}</span>
                          </div>
                        ))}
                        <div style={{margin:"0.75rem 0"}}>
                          <div style={{display:"flex",height:"6px",borderRadius:"3px",overflow:"hidden",gap:"1px"}}>
                            {Object.entries(c.allocation).map(([k,v])=><div key={k} style={{width:`${v}%`,background:ALLOC_COLORS[k]||"#8a9bb0"}}/>)}
                          </div>
                        </div>
                        {hasAnalysis?<div style={{color:"#82D9B0",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",marginBottom:"0.5rem"}}>✓ AI analysis ready to include</div>:<div style={{color:"#2A4060",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",marginBottom:"0.5rem"}}>○ Activate client and run analysis first</div>}
                        <button onClick={()=>generatePDF(c,messages)} style={{width:"100%",padding:"0.58rem",background:"linear-gradient(135deg,rgba(221,160,221,0.15),rgba(221,160,221,0.07))",border:"1px solid rgba(221,160,221,0.25)",borderRadius:"8px",color:"#DDA0DD",fontSize:"0.65rem",cursor:"pointer",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em",fontWeight:"700"}}>↓ DOWNLOAD PDF REPORT</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SESSION HISTORY */}
            {activeMode.id==="history"&&(
              <div style={{flex:1,overflowY:"auto",padding:"1.4rem"}}>
                <div style={{marginBottom:"1rem"}}>
                  <div style={{color:"#B8D4E8",fontSize:"0.72rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700",marginBottom:"0.15rem"}}>◫ SESSION HISTORY</div>
                  <div style={{color:"#2A4060",fontSize:"0.58rem"}}>Your recent AI conversations — click to restore any session</div>
                </div>
                {sessions.length===0?(
                  <div style={{color:"#2A4060",fontSize:"0.72rem",textAlign:"center",paddingTop:"3rem",fontFamily:"'Courier New',monospace"}}>No sessions yet — start chatting with ACCUVA</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                    {sessions.map((s,i)=>(
                      <div key={s.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(184,212,232,0.08)",borderRadius:"10px",padding:"0.85rem 1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"1rem",cursor:"pointer",transition:"border-color 0.2s"}}
                        onMouseOver={e=>e.currentTarget.style.borderColor="rgba(184,212,232,0.2)"}
                        onMouseOut={e=>e.currentTarget.style.borderColor="rgba(184,212,232,0.08)"}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{color:"#D4E4F4",fontSize:"0.78rem",fontWeight:"500",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</div>
                          <div style={{color:"#2A4060",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",marginTop:"0.1rem"}}>{s.mode} · {new Date(s.ts).toLocaleDateString()} {new Date(s.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                        </div>
                        <div style={{display:"flex",gap:"0.4rem",flexShrink:0}}>
                          <button onClick={()=>{setMessages(s.messages);setActiveMode(AI_MODES[0]);}} style={{background:"rgba(184,212,232,0.07)",border:"1px solid rgba(184,212,232,0.18)",borderRadius:"6px",color:"#B8D4E8",padding:"0.26rem 0.6rem",fontSize:"0.56rem",cursor:"pointer",fontFamily:"'Courier New',monospace"}}>RESTORE</button>
                          <button onClick={()=>setSessions(sessions.filter((_,j)=>j!==i))} style={{background:"rgba(244,123,123,0.06)",border:"1px solid rgba(244,123,123,0.15)",borderRadius:"6px",color:"#F47B7B",padding:"0.26rem 0.45rem",fontSize:"0.58rem",cursor:"pointer"}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI CHAT */}
            {isChatMode&&(
              <>
                <div style={{flex:1,overflowY:"auto",padding:"1.1rem 1.4rem",display:"flex",flexDirection:"column",gap:"0.95rem"}}>
                  {messages.length===0&&(
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:"1rem",animation:"fadeIn 0.5s ease"}}>
                      <div style={{width:"58px",height:"58px",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.12)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.9rem"}}>
                        <span style={{fontSize:"1.35rem",color:"rgba(201,168,76,0.35)"}}>⬡</span>
                      </div>
                      <div style={{color:"#C9A84C",fontSize:"0.85rem",letterSpacing:"0.2em",fontFamily:"'Courier New',monospace",marginBottom:"0.25rem"}}>ACCUVA v4.0 READY</div>
                      <div style={{color:"#1A2A3A",fontSize:"0.65rem",textAlign:"center",maxWidth:"420px",lineHeight:"1.8",marginBottom:"0.5rem"}}>
                        {activeMode.id==="research"?"Paste any article, filing, transcript, or press release. ACCUVA will extract all key investment insights and implications.":
                         activeMode.id==="trade"?"Ask for specific trade ideas. ACCUVA gives full thesis, entry, target, stop, and invalidation for each.":
                         activeMode.id==="options"?"Ask for options strategies — protective puts, income generation, spreads, or hedging. ACCUVA explains Greeks and structures the trade.":
                         activeMode.id==="macro"?"Ask any macro question. ACCUVA connects Fed, inflation, yield curve, dollar, geopolitics into clear actionable portfolio implications.":
                         activeMode.id==="global"?"Ask about any global market — Europe, Asia, EM, FX, commodities. ACCUVA covers the world.":
                         activeMode.id==="stress"?"Describe any macro scenario — ACCUVA stress tests it against your portfolio and recommends hedges.":
                         activeMode.id==="allocator"?"Describe your mandate and ACCUVA builds you a complete model portfolio with allocation, rationale, and implementation.":
                         "Ask anything — casual or formal. ACCUVA always delivers institutional-grade analysis."}
                      </div>
                      <div style={{color:"#1A2A3A",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",marginBottom:"1.5rem"}}>Press / to focus · Ctrl+K for quick commands</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",width:"100%",maxWidth:"480px"}}>
                        {(activeMode.id==="chat"?[
                          {m:AI_MODES[0],t:"yo what's the market doing rn"},
                          {m:AI_MODES[1],t:"45% AAPL, 20% TLT, 15% BTC, 20% cash — $5M AUM"},
                          {m:AI_MODES[3],t:"give me 3 high conviction trade ideas right now"},
                          {m:AI_MODES[5],t:"what's the macro regime telling us about equities?"},
                          {m:AI_MODES[7],t:"best hedges for a geopolitical risk spike right now"},
                        ]:activeMode.id==="trade"?[
                          {m:activeMode,t:"3 high conviction longs in AI infrastructure"},
                          {m:activeMode,t:"best risk/reward short ideas in the market now"},
                          {m:activeMode,t:"event-driven trade ideas around the next Fed meeting"},
                        ]:activeMode.id==="options"?[
                          {m:activeMode,t:"protective put strategy for my NVDA position"},
                          {m:activeMode,t:"best income-generating options strategy for a large AAPL position"},
                          {m:activeMode,t:"collar strategy to protect gains in a tech-heavy portfolio"},
                        ]:activeMode.id==="stress"?[
                          {m:activeMode,t:"rates +300bps, recession, credit crunch — impact on my portfolio"},
                          {m:activeMode,t:"China invades Taiwan — cross-asset impact and hedges"},
                          {m:activeMode,t:"S&P drops 30% from here — what survives?"},
                        ]:activeMode.id==="allocator"?[
                          {m:activeMode,t:"Build a $10M aggressive growth portfolio with no fossil fuels"},
                          {m:activeMode,t:"Conservative $50M multi-generational trust portfolio"},
                          {m:activeMode,t:"Moderate $5M portfolio with 30% alternatives allocation"},
                        ]:[
                          {m:activeMode,t:activeMode.placeholder?.substring(0,55)+"..."},
                        ]).map((item,i)=>(
                          <button key={i} onClick={()=>{setActiveMode(item.m);setInput(item.t);inputRef.current?.focus();}} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",padding:"0.45rem 0.82rem",color:"#2A3A50",fontSize:"0.67rem",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                            onMouseOver={e=>{e.currentTarget.style.borderColor=`${item.m.color}38`;e.currentTarget.style.color=item.m.color;}}
                            onMouseOut={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.color="#2A3A50";}}>
                            <span style={{color:item.m.color,marginRight:"0.45rem"}}>{item.m.icon}</span>{item.t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg,i)=>(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.25s ease"}}>
                      {msg.role==="user"?(
                        <div style={{maxWidth:"72%"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.35rem",marginBottom:"0.22rem",justifyContent:"flex-end"}}>
                            {msg.clientId&&<span style={{color:"#82B4FF",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>{clients.find(c=>c.id===msg.clientId)?.name}</span>}
                            <span style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>ADVISOR</span>
                            <span style={{color:msg.mode?.color||"#C9A84C",fontSize:"0.62rem"}}>{msg.mode?.icon}</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px 12px 2px 12px",padding:"0.72rem 0.95rem",color:"#D4E4F4",fontSize:"0.8rem",lineHeight:"1.7"}}>
                            {msg.display||msg.content}
                          </div>
                        </div>
                      ):(
                        <div style={{maxWidth:"95%",width:"100%"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"0.35rem",marginBottom:"0.22rem"}}>
                            <div style={{width:"15px",height:"15px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:"0.42rem",color:"#060D1A"}}>⬡</span>
                            </div>
                            <span style={{color:"#C9A84C",fontSize:"0.56rem",letterSpacing:"0.15em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>ACCUVA</span>
                            <span style={{color:"#1A2A3A",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>· {msg.mode?.label?.toUpperCase()}</span>
                            <span style={{color:"#1A2A3A",fontSize:"0.48rem",fontFamily:"'Courier New',monospace",marginLeft:"auto"}}>{new Date(msg.ts||Date.now()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                            <button onClick={()=>copyMessage(msg.content,i)} style={{background:"none",border:"none",color:copyFeedback===i?"#82D9B0":"#2A4060",cursor:"pointer",fontSize:"0.65rem",padding:"0 0.2rem",transition:"color 0.2s"}} title="Copy response">
                              {copyFeedback===i?"✓":"⧉"}
                            </button>
                          </div>
                          <div style={{background:"rgba(201,168,76,0.022)",border:"1px solid rgba(201,168,76,0.085)",borderRadius:"2px 12px 12px 12px",padding:"0.95rem 1.15rem"}}>
                            {formatMessage(msg.content)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.35rem",marginBottom:"0.22rem"}}>
                        <div style={{width:"15px",height:"15px",background:"linear-gradient(135deg,#C9A84C,#8B6914)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:"0.42rem",color:"#060D1A"}}>⬡</span>
                        </div>
                        <span style={{color:"#C9A84C",fontSize:"0.56rem",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>ACCUVA</span>
                        <span style={{color:"#2A4060",fontSize:"0.52rem",fontFamily:"'Courier New',monospace"}}>· ANALYSING</span>
                      </div>
                      <div style={{background:"rgba(201,168,76,0.022)",border:"1px solid rgba(201,168,76,0.085)",borderRadius:"2px 12px 12px 12px",padding:"0.85rem 1.15rem",display:"flex",alignItems:"center",gap:"0.65rem"}}>
                        {[0,1,2].map(j=><div key={j} style={{width:"5px",height:"5px",borderRadius:"50%",background:"#C9A84C",animation:`pulse 1.2s ease-in-out ${j*0.22}s infinite`}}/>)}
                        <span style={{color:"#2A4060",fontSize:"0.62rem",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em"}}>PROCESSING...</span>
                      </div>
                    </div>
                  )}

                  {error&&<div style={{background:"rgba(244,123,123,0.07)",border:"1px solid rgba(244,123,123,0.18)",borderRadius:"8px",padding:"0.6rem 0.95rem",color:"#F47B7B",fontSize:"0.68rem",fontFamily:"'Courier New',monospace"}}>⚠ {error}</div>}
                  <div ref={chatEndRef}/>
                </div>

                {/* INPUT */}
                <div style={{borderTop:"1px solid rgba(201,168,76,0.07)",padding:"0.8rem 1.1rem",background:"rgba(6,13,26,0.97)",backdropFilter:"blur(16px)",flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.38rem",marginBottom:"0.38rem"}}>
                    <span style={{color:activeMode.color,fontSize:"0.7rem"}}>{activeMode.icon}</span>
                    <span style={{color:activeMode.color,fontSize:"0.56rem",letterSpacing:"0.1em",fontFamily:"'Courier New',monospace",fontWeight:"700"}}>{activeMode.label.toUpperCase()}</span>
                    {selectedClient&&<span style={{color:"#82B4FF",fontSize:"0.56rem",fontFamily:"'Courier New',monospace"}}>· {selectedClient.name}</span>}
                    <div style={{flex:1}}/>
                    {/* MODE SWITCHER */}
                    <div style={{display:"flex",gap:"0.25rem"}}>
                      {AI_MODES.slice(0,6).map(m=>(
                        <button key={m.id} onClick={()=>setActiveMode(m)} title={m.label} style={{background:activeMode.id===m.id?`${m.color}14`:"transparent",border:`1px solid ${activeMode.id===m.id?`${m.color}38`:"rgba(255,255,255,0.05)"}`,borderRadius:"5px",color:activeMode.id===m.id?m.color:"#1A2A3A",padding:"0.16rem 0.38rem",fontSize:"0.62rem",cursor:"pointer",transition:"all 0.15s"}}>{m.icon}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"0.55rem",alignItems:"flex-end"}}>
                    <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSubmit();}}}
                      placeholder={activeMode.placeholder||"Ask ACCUVA anything..."}
                      rows={2} style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${activeMode.color}16`,borderRadius:"10px",padding:"0.72rem 0.95rem",color:"#D4E4F4",fontSize:"0.8rem",fontFamily:"Georgia,serif",lineHeight:"1.6",resize:"none",outline:"none",transition:"border-color 0.2s"}}
                      onFocus={e=>e.target.style.borderColor=`${activeMode.color}42`}
                      onBlur={e=>e.target.style.borderColor=`${activeMode.color}16`}/>
                    <button onClick={()=>handleSubmit()} disabled={loading||!input.trim()} style={{padding:"0.72rem 1.05rem",background:loading||!input.trim()?"rgba(201,168,76,0.07)":"linear-gradient(135deg,#C9A84C,#8B6914)",border:"none",borderRadius:"10px",cursor:loading||!input.trim()?"not-allowed":"pointer",color:loading||!input.trim()?"#1A2A3A":"#060D1A",fontSize:"1rem",minWidth:"42px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:loading||!input.trim()?"none":"0 4px 16px rgba(201,168,76,0.2)"}}>
                      {loading?<div style={{width:"13px",height:"13px",border:"2px solid #C9A84C",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:"→"}
                    </button>
                  </div>
                  <div style={{color:"#0A1420",fontSize:"0.5rem",marginTop:"0.32rem",fontFamily:"'Courier New',monospace",display:"flex",gap:"1.5rem"}}>
                    <span>ENTER TO SEND</span><span>SHIFT+ENTER NEW LINE</span><span>/ TO FOCUS</span><span>CTRL+K COMMANDS</span><span>ACCUVA WEALTH v4.0</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
