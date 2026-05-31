import { useState, useEffect, useRef } from "react";
import { Search, Zap, ShoppingBag, Check, RotateCcw, ExternalLink, AlertCircle, ChevronDown, ChevronUp, Mail, Package, FileText, X, Send } from "lucide-react";

const API   = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const G = {
  bg:"#0C0B09", s1:"#131108", s2:"#1B1912", s3:"#222018",
  b0:"rgba(201,168,76,0.13)", b1:"rgba(201,168,76,0.38)", b2:"rgba(201,168,76,0.62)",
  gold:"#C9A84C", hi:"#EDD07A",
  t1:"#EDE8DE", t2:"rgba(237,232,222,0.52)", t3:"rgba(237,232,222,0.26)",
  ok:"#3DAF6E", er:"#D94F44",
};

const STAGES = [
  { Icon:Search,      name:"Sherlock AI",     note:"Searching public web for signals" },
  { Icon:Zap,         name:"Gift Strategist", note:"Mapping interests to gift angles" },
  { Icon:ShoppingBag, name:"Gift Sourcing",   note:"Locating specific, buyable gifts" },
];

const BUDGETS = [
  ["25-75",   "$25–75"],
  ["75-150",  "$75–150"],
  ["150-300", "$150–300"],
  ["300-500", "$300–500"],
  ["500+",    "$500+"],
];

const RELS = [
  ["prospect",  "Prospect"],
  ["client",    "Client"],
  ["investor",  "Investor"],
  ["personal",  "Friend / colleague"],
];

const SYSTEM_EGIFT = `You are UNBOXD — an insight-led B2B gifting intelligence engine with live web search. Use it actively.

Sherlock AI: search name + company, find and fetch the company bio page fully. "Outside the office" / "Fun facts" sections are highest-priority signals. Search at least 2-3 times.
Gift Strategist: turn validated signals into specific, feel-seen gift angles.
Gift Sourcing: find eGift cards, experience vouchers, bookable experiences from SPECIFIC LOCAL VENDORS. Never major chains. Never generic Visa/Amex cards.

Return ONLY valid JSON.

{
  "person": { "name": string, "company": string, "signals": string, "confidence": "High"|"Medium"|"Low" },
  "gifts": [
    { "name": string, "merchant": string, "price_band": string, "buy_url": string, "giftiq": number, "why": string, "tags": string[], "caveat": string|null }
  ],
  "stop": null | { "reason": string, "suggestion": string }
}

Rules: real working buy_url to vendor's own site. Specific names. No alcohol unless unambiguous. Compliance-sensitive: under $100. Return exactly 4 gifts or a stop.`;

const SYSTEM_PHYSICAL = `You are UNBOXD — an insight-led B2B gifting intelligence engine with live web search. Use it actively.

Sherlock AI: search name + company, find and fetch the company bio page fully. "Outside the office" / "Fun facts" sections are highest-priority signals. Search at least 2-3 times.
Gift Strategist: turn validated signals into specific, feel-seen gift angles.
Gift Sourcing: find specific shippable physical products from real vendors — specialty retailers, boutique shops, makers. Avoid Amazon; prefer brand's own site.

Return ONLY valid JSON.

{
  "person": { "name": string, "company": string, "signals": string, "confidence": "High"|"Medium"|"Low" },
  "gifts": [
    { "name": string, "merchant": string, "price_band": string, "buy_url": string, "giftiq": number, "why": string, "tags": string[], "caveat": string|null }
  ],
  "stop": null | { "reason": string, "suggestion": string }
}

Rules: real working buy_url to specific product page. Specific product names. No alcohol unless unambiguous. Compliance-sensitive: under $100. Return exactly 4 gifts or a stop.`;

function extractResult(content) {
  const textBlocks = (content || []).filter(b => b.type === "text" && b.text).map(b => b.text);
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const raw = textBlocks[i].replace(/```json|```/g, "").trim();
    const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) {}
    }
  }
  throw new Error("No valid JSON found in response");
}

export default function App() {
  const [form, setForm] = useState({ name:"", company:"", linkedin:"", budget:"150-300", rel:"prospect", ctx:"", transcript:"" });
  const [mode,      setMode]      = useState("egift");
  const [advanced,  setAdvanced]  = useState(false);
  const [phase,     setPhase]     = useState(null);
  const [result,    setResult]    = useState(null);
  const [err,       setErr]       = useState(null);
  const [sendModal, setSendModal] = useState(null); // gift object when open
  const [fulfillModal, setFulfillModal] = useState(null);
  const timers = useRef([]);
  const resRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("ub-fonts")) {
      const l = document.createElement("link");
      l.id = "ub-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("ub-css")) {
      const s = document.createElement("style");
      s.id = "ub-css";
      s.textContent = `
        *{box-sizing:border-box}
        @keyframes ub-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.7)}}
        @keyframes ub-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ub-spin{to{transform:rotate(360deg)}}
        .ub-in{animation:ub-fadein .5s ease both}
        .ub-in:nth-child(1){animation-delay:.06s}.ub-in:nth-child(2){animation-delay:.13s}
        .ub-in:nth-child(3){animation-delay:.20s}.ub-in:nth-child(4){animation-delay:.27s}
        input,select,textarea{color-scheme:dark;outline:none}
        .ub-field:focus{border-color:rgba(201,168,76,0.55)!important}
        .ub-btn{cursor:pointer;transition:background .18s,border-color .18s,opacity .18s,transform .1s}
        .ub-btn:hover:not(:disabled){background:rgba(201,168,76,0.1)!important;border-color:rgba(201,168,76,0.65)!important}
        .ub-btn:active:not(:disabled){transform:scale(.985)}
        .ub-btn:disabled{opacity:.38;cursor:not-allowed}
        a.ub-buy:hover{background:rgba(201,168,76,0.18)!important}
        .ub-mode{cursor:pointer;transition:background .18s,border-color .18s,color .18s}
        .ub-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
      `;
      document.head.appendChild(s);
    }
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function run() {
    if (!form.name.trim() || !form.company.trim()) return;
    timers.current.forEach(clearTimeout);
    setResult(null); setErr(null); setPhase(0);
    timers.current[0] = setTimeout(() => setPhase(p => typeof p === "number" ? 1 : p), 6000);
    timers.current[1] = setTimeout(() => setPhase(p => typeof p === "number" ? 2 : p), 12000);
    try {
      const system = mode === "egift" ? SYSTEM_EGIFT : SYSTEM_PHYSICAL;
      const res = await fetch(API, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model: MODEL, max_tokens: 4000, system,
          tools: [{ type:"web_search_20250305", name:"web_search", max_uses:8 }],
          messages: [{ role:"user", content: JSON.stringify({
            name:         form.name.trim(),
            company:      form.company.trim(),
            budget:       advanced ? form.budget   : "150-300",
            relationship: advanced ? form.rel       : "prospect",
            context:      advanced && form.ctx      ? form.ctx      : null,
            linkedin:     advanced && form.linkedin ? form.linkedin  : null,
            transcript:   advanced && form.transcript ? form.transcript : null,
            gift_mode:    mode,
          })}],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0,200)}`);
      const d = await res.json();
      timers.current.forEach(clearTimeout);
      const parsed = extractResult(d.content);
      setPhase(parsed.stop ? "stop" : "done");
      setResult(parsed);
      if (!parsed.stop) setTimeout(() => resRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 120);
    } catch(e) {
      timers.current.forEach(clearTimeout);
      setPhase("error"); setErr(e.message);
    }
  }

  const running = typeof phase === "number";
  const canRun  = !!form.name.trim() && !!form.company.trim() && !running;

  return (
    <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:"'DM Sans',sans-serif", paddingBottom:80 }}>
      <BrandBar />
      <div style={{ maxWidth:680, margin:"0 auto", padding:"0 20px" }}>
        <Hero />
        <InputForm form={form} sf={sf} onRun={run} canRun={canRun} running={running}
          mode={mode} setMode={setMode} advanced={advanced} setAdvanced={setAdvanced} />
        {phase !== null && <Pipeline phase={phase} />}
        {phase === "done" && result?.gifts &&
          <div ref={resRef}>
            <Results result={result} onRegen={run} running={running} mode={mode}
              onSend={g => mode === "egift" ? setSendModal(g) : setFulfillModal(g)} />
          </div>}
        {phase === "stop"  && result?.stop  && <StopView stop={result.stop} />}
        {phase === "error" && <ErrView msg={err} />}
      </div>

      {/* eGift send modal */}
      {sendModal && (
        <SendModal gift={sendModal} person={result?.person} onClose={() => setSendModal(null)} />
      )}

      {/* Physical fulfillment modal */}
      {fulfillModal && (
        <FulfillModal gift={fulfillModal} person={result?.person} onClose={() => setFulfillModal(null)} />
      )}
    </div>
  );
}

// ── Brand bar ─────────────────────────────────────────────────────────────
function BrandBar() {
  return (
    <div style={{ borderBottom:`0.5px solid ${G.b0}`, padding:"15px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, fontWeight:500, color:G.t1 }}>UNBOXD</span>
        <span style={{ fontSize:9, padding:"2px 7px", border:`0.5px solid ${G.b1}`, borderRadius:4, color:G.gold, fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase" }}>Beta</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:18 }}>
        {[{Icon:Search,l:"Sherlock AI"},{Icon:Zap,l:"GiftIQ"},{Icon:ShoppingBag,l:"Sourcing"}].map(({Icon,l}) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, opacity:0.4 }}>
            <Icon size={11} color={G.gold} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:G.t2, letterSpacing:"0.07em", textTransform:"uppercase" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{ padding:"52px 0 36px", textAlign:"center" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.2em", color:G.gold, textTransform:"uppercase", marginBottom:18, opacity:0.8 }}>
        Sherlock AI · GiftIQ · UNBOXD
      </div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:46, fontWeight:300, margin:"0 0 16px", color:G.t1, lineHeight:1.1, letterSpacing:"-0.01em" }}>
        Gifting that makes them<br />feel seen.
      </h1>
      <p style={{ fontSize:15, color:G.t2, maxWidth:440, margin:"0 auto", lineHeight:1.68 }}>
        Name and company in. Sherlock AI searches the live web, scores gift angles by impact, and returns four specific recommendations — each ready to send.
      </p>
    </div>
  );
}

// ── Mode toggle ───────────────────────────────────────────────────────────
function ModeToggle({ mode, setMode }) {
  const btn = (val, Icon, label, sub) => {
    const active = mode === val;
    return (
      <div className="ub-mode" onClick={() => setMode(val)} style={{
        flex:1, padding:"12px 14px", borderRadius:8, textAlign:"center",
        background: active ? "rgba(201,168,76,0.1)" : "transparent",
        border: `1px solid ${active ? G.b2 : G.b0}`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
      }}>
        <Icon size={16} color={active ? G.hi : G.t3} />
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color: active ? G.hi : G.t2 }}>{label}</div>
        <div style={{ fontSize:11, color: active ? G.t2 : G.t3 }}>{sub}</div>
      </div>
    );
  };
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:G.t3, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Delivery</div>
      <div style={{ display:"flex", gap:8 }}>
        {btn("egift",    Mail,    "Send now",      "eGift · voucher · experience")}
        {btn("physical", Package, "Ship something","Physical · UNBOXD fulfillment")}
      </div>
    </div>
  );
}

// ── Input form ────────────────────────────────────────────────────────────
function InputForm({ form, sf, onRun, canRun, running, mode, setMode, advanced, setAdvanced }) {
  const inp = {
    background:G.s2, border:`1px solid ${G.b0}`, borderRadius:8,
    padding:"11px 14px", color:G.t1, fontSize:15,
    fontFamily:"'DM Sans',sans-serif", width:"100%", display:"block",
  };
  const lbl = { fontSize:11, color:G.t3, fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:7 };

  return (
    <div style={{ background:G.s1, border:`0.5px solid ${G.b0}`, borderRadius:12, padding:"28px 28px 24px" }}>
      <ModeToggle mode={mode} setMode={setMode} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div>
          <label style={lbl}>Name</label>
          <input className="ub-field" style={inp} placeholder="Jakob Berger"
            value={form.name} onChange={e => sf("name", e.target.value)}
            onKeyDown={e => e.key === "Enter" && canRun && onRun()} />
        </div>
        <div>
          <label style={lbl}>Company</label>
          <input className="ub-field" style={inp} placeholder="Aztec Group"
            value={form.company} onChange={e => sf("company", e.target.value)}
            onKeyDown={e => e.key === "Enter" && canRun && onRun()} />
        </div>
      </div>

      <button className="ub-btn" onClick={() => setAdvanced(a => !a)} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 14px", background:"transparent",
        border:`0.5px solid ${advanced ? G.b1 : G.b0}`, borderRadius:8,
        color: advanced ? G.t2 : G.t3, fontFamily:"'DM Mono',monospace",
        fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase",
        marginBottom: advanced ? 16 : 20,
      }}>
        <span>Advanced options</span>
        {advanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>

      {advanced && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div>
              <label style={lbl}>Budget</label>
              <select className="ub-field" style={{ ...inp, appearance:"none", cursor:"pointer" }}
                value={form.budget} onChange={e => sf("budget", e.target.value)}>
                {BUDGETS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Relationship</label>
              <select className="ub-field" style={{ ...inp, appearance:"none", cursor:"pointer" }}
                value={form.rel} onChange={e => sf("rel", e.target.value)}>
                {RELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>LinkedIn URL <span style={{ color:G.t3, fontSize:10, letterSpacing:0, textTransform:"none" }}>optional</span></label>
            <input className="ub-field" style={inp} placeholder="https://linkedin.com/in/..."
              value={form.linkedin} onChange={e => sf("linkedin", e.target.value)} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Call transcript <span style={{ color:G.t3, fontSize:10, letterSpacing:0, textTransform:"none" }}>optional — paste from Gong, Chorus, or notes</span></label>
            <textarea className="ub-field" style={{ ...inp, resize:"vertical", minHeight:88, lineHeight:1.6, fontSize:13 }}
              placeholder="Paste a recent call transcript or meeting notes here…"
              value={form.transcript} onChange={e => sf("transcript", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Additional context <span style={{ color:G.t3, fontSize:10, letterSpacing:0, textTransform:"none" }}>optional</span></label>
            <textarea className="ub-field" style={{ ...inp, resize:"vertical", minHeight:68, lineHeight:1.6 }}
              placeholder="Any other signals you know about this person…"
              value={form.ctx} onChange={e => sf("ctx", e.target.value)} />
          </div>
        </div>
      )}

      <button className="ub-btn" disabled={!canRun} onClick={onRun} style={{
        width:"100%", padding:"13px 20px", background:"transparent",
        border:`1px solid ${canRun ? G.b2 : G.b0}`, borderRadius:8,
        color: canRun ? G.hi : G.t3, fontFamily:"'DM Mono',monospace",
        fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase",
        display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      }}>
        {running ? (
          <>
            <span style={{ width:13, height:13, border:`1.5px solid ${G.gold}`, borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"ub-spin 0.75s linear infinite" }} />
            Sherlock is searching the web…
          </>
        ) : (
          <>
            <Search size={13} />
            {form.name.trim() ? `Find gifts for ${form.name.trim().split(" ")[0]}` : "Find gifts"}
          </>
        )}
      </button>
    </div>
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────
function Pipeline({ phase }) {
  const isDone = phase === "done" || phase === "stop" || phase === "error";
  const cur    = typeof phase === "number" ? phase : 3;
  return (
    <div style={{ background:G.s1, border:`0.5px solid ${G.b0}`, borderRadius:12, padding:"18px 22px", margin:"10px 0" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:"0.18em", color:G.t3, textTransform:"uppercase", marginBottom:14 }}>Pipeline</div>
      {STAGES.map(({ Icon, name, note }, i) => {
        const active   = i === cur;
        const complete = i < cur || isDone;
        return (
          <div key={name} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 0", borderBottom: i < 2 ? `0.5px solid ${G.b0}` : "none" }}>
            <div style={{
              width:34, height:34, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              background: complete ? "rgba(201,168,76,0.1)" : active ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${complete ? G.b2 : active ? G.b1 : G.b0}`,
            }}>
              {complete ? <Check size={13} color={G.gold} />
                : active ? <span style={{ width:8, height:8, borderRadius:"50%", background:G.gold, display:"block", animation:"ub-pulse 1.1s ease-in-out infinite" }} />
                : <Icon size={12} color={G.t3} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.07em", textTransform:"uppercase", color: active ? G.hi : complete ? G.gold : G.t3 }}>{name}</div>
              <div style={{ fontSize:12, color: active ? G.t2 : complete ? "rgba(201,168,76,0.38)" : G.t3, marginTop:2 }}>
                {active && name === "Sherlock AI" ? "Browsing the live web for real signals…" : note}
              </div>
            </div>
            {active   && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:G.t3 }}>running…</span>}
            {complete && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(201,168,76,0.4)" }}>done</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Results ───────────────────────────────────────────────────────────────
function Results({ result, onRegen, running, mode, onSend }) {
  const { person, gifts } = result;
  return (
    <div style={{ marginTop:4 }}>
      <PersonBanner person={person} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:12, margin:"14px 0 10px" }}>
        {gifts.map((g, i) => <GiftCard key={i} gift={g} mode={mode} onSend={() => onSend(g)} />)}
      </div>
      <div style={{ display:"flex", justifyContent:"center", paddingTop:4 }}>
        <button className="ub-btn" disabled={running} onClick={onRegen} style={{
          display:"flex", alignItems:"center", gap:8, padding:"9px 20px",
          background:"transparent", border:`0.5px solid ${G.b1}`, borderRadius:8,
          color:G.t2, fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.09em", textTransform:"uppercase",
        }}>
          <RotateCcw size={11} /> Regenerate
        </button>
      </div>
    </div>
  );
}

function PersonBanner({ person }) {
  if (!person) return null;
  const cc = { High:G.ok, Medium:G.gold, Low:G.er }[person.confidence] || G.t2;
  return (
    <div style={{ background:G.s1, border:`0.5px solid ${G.b0}`, borderRadius:10, padding:"13px 18px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
      <div style={{ flex:1, minWidth:180 }}>
        <div style={{ fontSize:14, fontWeight:500 }}>{person.name}<span style={{ color:G.t2, fontWeight:400 }}> · {person.company}</span></div>
        <div style={{ fontSize:12, color:G.t2, marginTop:3 }}>{person.signals}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:G.t3, letterSpacing:"0.1em", textTransform:"uppercase" }}>Signal confidence</span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:cc, padding:"3px 9px", border:`0.5px solid ${cc}`, borderRadius:4 }}>{person.confidence}</span>
      </div>
    </div>
  );
}

function IQRing({ score }) {
  const r = 19, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 88 ? G.hi : score >= 76 ? G.gold : "rgba(201,168,76,0.55)";
  return (
    <div style={{ position:"relative", width:52, height:52, flexShrink:0 }}>
      <svg width="52" height="52" style={{ position:"absolute", top:0, left:0 }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(201,168,76,0.1)" strokeWidth="2.5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 26 26)" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:14, color, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:8, color:G.t3, letterSpacing:"0.1em", textTransform:"uppercase" }}>IQ</span>
      </div>
    </div>
  );
}

function GiftCard({ gift, mode, onSend }) {
  const score = gift.giftiq ?? 75;
  return (
    <div className="ub-in" style={{ background:G.s1, border:`0.5px solid ${G.b0}`, borderRadius:12, padding:20, display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
        <IQRing score={score} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:500, color:G.t1, lineHeight:1.25, marginBottom:5 }}>{gift.name}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:G.gold }}>{gift.merchant} · {gift.price_band}</div>
        </div>
      </div>

      {gift.tags?.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {gift.tags.map(t => (
            <span key={t} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:"0.07em", textTransform:"uppercase", padding:"3px 8px", borderRadius:4, background:"rgba(201,168,76,0.06)", border:`0.5px solid ${G.b0}`, color:G.t2 }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ borderLeft:`2px solid rgba(201,168,76,0.32)`, paddingLeft:13 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:G.t3, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>Why it fits</div>
        <div style={{ fontSize:13, color:G.t2, lineHeight:1.65 }}>{gift.why}</div>
      </div>

      {gift.caveat && (
        <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"8px 10px", background:"rgba(201,168,76,0.04)", border:`0.5px solid rgba(201,168,76,0.2)`, borderRadius:6 }}>
          <AlertCircle size={12} color={G.gold} style={{ marginTop:1, flexShrink:0 }} />
          <span style={{ fontSize:12, color:"rgba(201,168,76,0.72)", lineHeight:1.5 }}>{gift.caveat}</span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
        <a href={gift.buy_url} target="_blank" rel="noopener noreferrer" className="ub-buy" style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          padding:"9px 12px", background:"rgba(201,168,76,0.07)", border:`0.5px solid ${G.b1}`,
          borderRadius:8, textDecoration:"none", color:G.t2,
          fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
          transition:"background .18s",
        }}>
          <ExternalLink size={10} /> View
        </a>
        <button className="ub-btn" onClick={onSend} style={{
          flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          padding:"9px 12px", background:"rgba(201,168,76,0.12)", border:`1px solid ${G.b2}`,
          borderRadius:8, color:G.hi, fontFamily:"'DM Mono',monospace",
          fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
        }}>
          {mode === "egift"
            ? <><Mail size={11}/> Send gift</>
            : <><Package size={11}/> Send via UNBOXD</>}
        </button>
      </div>
    </div>
  );
}

// ── eGift send modal ──────────────────────────────────────────────────────
function SendModal({ gift, person, onClose }) {
  const [to,      setTo]      = useState("");
  const [from,    setFrom]    = useState("");
  const [note,    setNote]    = useState("");
  const [sent,    setSent]    = useState(false);

  function handleSend() {
    if (!to.trim()) return;
    const subject = encodeURIComponent(`A gift for you`);
    const body = encodeURIComponent(
      `${note || "Thought you'd appreciate this."}\n\nGift: ${gift.name}\nFrom: ${gift.merchant}\nLink: ${gift.buy_url}\n\n— ${from || "Your name"}`
    );
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
  }

  const inp = { background:G.s2, border:`1px solid ${G.b0}`, borderRadius:8, padding:"10px 13px", color:G.t1, fontSize:14, fontFamily:"'DM Sans',sans-serif", width:"100%", outline:"none" };
  const lbl = { fontSize:10, color:G.t3, fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:6 };

  return (
    <div className="ub-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:G.s1, border:`0.5px solid ${G.b1}`, borderRadius:14, padding:28, width:"100%", maxWidth:480 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:500, color:G.t1 }}>Send this gift</div>
            <div style={{ fontSize:12, color:G.t2, marginTop:3 }}>{gift.name}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.t3, padding:4 }}><X size={18}/></button>
        </div>

        {sent ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <Check size={32} color={G.ok} style={{ margin:"0 auto 12px", display:"block" }} />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:G.t1, marginBottom:8 }}>Email drafted</div>
            <div style={{ fontSize:13, color:G.t2 }}>Your email client should have opened with the gift details pre-filled.</div>
            <button className="ub-btn" onClick={onClose} style={{ marginTop:20, padding:"9px 24px", background:"transparent", border:`0.5px solid ${G.b1}`, borderRadius:8, color:G.t2, fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>To (email)</label>
              <input style={inp} className="ub-field" placeholder="recipient@company.com" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>From (your name)</label>
              <input style={inp} className="ub-field" placeholder="Your name" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Personal note</label>
              <textarea className="ub-field" style={{ ...inp, resize:"vertical", minHeight:80, lineHeight:1.6 }}
                placeholder="Write a personal note to include with the gift…"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div style={{ background:G.s2, borderRadius:8, padding:"12px 14px", marginBottom:20 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:G.t3, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Gift link</div>
              <div style={{ fontSize:13, color:G.t2 }}>{gift.merchant} · <a href={gift.buy_url} target="_blank" rel="noopener noreferrer" style={{ color:G.gold }}>{gift.price_band}</a></div>
            </div>
            <button className="ub-btn" onClick={handleSend} disabled={!to.trim()} style={{
              width:"100%", padding:"12px 20px", background:"rgba(201,168,76,0.12)", border:`1px solid ${G.b2}`, borderRadius:8,
              color:G.hi, fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              <Send size={13}/> Open in email client
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Physical fulfillment modal ────────────────────────────────────────────
function FulfillModal({ gift, person, onClose }) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [noteText, setNoteText] = useState("");
  const inp = { background:G.s2, border:`1px solid ${G.b0}`, borderRadius:8, padding:"10px 13px", color:G.t1, fontSize:14, fontFamily:"'DM Sans',sans-serif", width:"100%", outline:"none" };
  const lbl = { fontSize:10, color:G.t3, fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:6 };

  const steps = [
    {
      title: "Confirm this gift",
      content: (
        <>
          <div style={{ background:G.s2, borderRadius:10, padding:"16px 18px", marginBottom:20 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:500, color:G.t1, marginBottom:4 }}>{gift.name}</div>
            <div style={{ fontSize:12, color:G.gold, fontFamily:"'DM Mono',monospace" }}>{gift.merchant} · {gift.price_band}</div>
            <div style={{ fontSize:13, color:G.t2, marginTop:10, lineHeight:1.6 }}>{gift.why}</div>
          </div>
          <div style={{ fontSize:13, color:G.t2, lineHeight:1.7, marginBottom:20 }}>
            UNBOXD will source this item, package it in branded presentation materials, include your handwritten note, and ship it directly to your recipient.
          </div>
          <button className="ub-btn" onClick={() => setStep(1)} style={{ width:"100%", padding:"12px", background:"rgba(201,168,76,0.12)", border:`1px solid ${G.b2}`, borderRadius:8, color:G.hi, fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Yes, send this gift →
          </button>
        </>
      )
    },
    {
      title: "Delivery address",
      content: (
        <>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Recipient's address</label>
            <textarea className="ub-field" style={{ ...inp, resize:"vertical", minHeight:96, lineHeight:1.6 }}
              placeholder={"Full name\nStreet address\nCity, State, ZIP\nCountry"}
              value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div style={{ fontSize:12, color:G.t3, marginBottom:20, lineHeight:1.6 }}>
            Address is used solely for this delivery and is not stored beyond order fulfillment.
          </div>
          <button className="ub-btn" onClick={() => setStep(2)} disabled={!address.trim()} style={{ width:"100%", padding:"12px", background:"rgba(201,168,76,0.12)", border:`1px solid ${G.b2}`, borderRadius:8, color:G.hi, fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Continue →
          </button>
        </>
      )
    },
    {
      title: "Your handwritten note",
      content: (
        <>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Note to include</label>
            <textarea className="ub-field" style={{ ...inp, resize:"vertical", minHeight:100, lineHeight:1.6, fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontStyle:"italic" }}
              placeholder="Write your personal note here — UNBOXD will transcribe it by hand onto premium card stock…"
              value={noteText} onChange={e => setNoteText(e.target.value)} />
          </div>
          <button className="ub-btn" onClick={() => setStep(3)} disabled={!noteText.trim()} style={{ width:"100%", padding:"12px", background:"rgba(201,168,76,0.12)", border:`1px solid ${G.b2}`, borderRadius:8, color:G.hi, fontFamily:"'DM Mono',monospace", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Submit order →
          </button>
        </>
      )
    },
    {
      title: "Order received",
      content: (
        <div style={{ textAlign:"center", padding:"16px 0" }}>
          <Check size={32} color={G.ok} style={{ margin:"0 auto 16px", display:"block" }} />
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:G.t1, marginBottom:10 }}>Order submitted</div>
          <div style={{ fontSize:13, color:G.t2, lineHeight:1.7, maxWidth:340, margin:"0 auto 20px" }}>
            UNBOXD will source, package, and hand-note your gift. Expect a confirmation email with tracking within 24 hours.
          </div>
          <button className="ub-btn" onClick={onClose} style={{ padding:"9px 24px", background:"transparent", border:`0.5px solid ${G.b1}`, borderRadius:8, color:G.t2, fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>Done</button>
        </div>
      )
    }
  ];

  return (
    <div className="ub-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:G.s1, border:`0.5px solid ${G.b1}`, borderRadius:14, padding:28, width:"100%", maxWidth:480 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:G.t3, letterSpacing:"0.14em", textTransform:"uppercase" }}>
            UNBOXD Fulfillment · Step {step + 1} of {steps.length}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.t3, padding:4 }}><X size={18}/></button>
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:500, color:G.t1, marginBottom:20 }}>{steps[step].title}</div>
        {steps[step].content}
      </div>
    </div>
  );
}

// ── Stop / Error ──────────────────────────────────────────────────────────
function StopView({ stop }) {
  return (
    <div style={{ background:G.s1, border:`0.5px solid ${G.b0}`, borderRadius:12, padding:32, textAlign:"center", marginTop:10 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:G.gold, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:16 }}>No gift sent · Right call</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, color:G.t1, marginBottom:12, lineHeight:1.4 }}>{stop.reason}</div>
      <div style={{ fontSize:13, color:G.t2, lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>{stop.suggestion}</div>
    </div>
  );
}

function ErrView({ msg }) {
  return (
    <div style={{ background:G.s1, border:`0.5px solid rgba(217,80,68,0.3)`, borderRadius:12, padding:28, textAlign:"center", marginTop:10 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:G.er, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Pipeline error</div>
      <div style={{ fontSize:13, color:G.t2, marginBottom:8 }}>{msg || "Something went wrong. Please try again."}</div>
      {msg?.includes("web_search") && (
        <div style={{ fontSize:12, color:G.t3 }}>Enable web search in your Anthropic Console under Settings → Privacy.</div>
      )}
    </div>
  );
}
