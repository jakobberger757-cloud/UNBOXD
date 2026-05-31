"use client";

import { useRef, useState } from "react";
import { AlertCircle, Search, ShoppingBag, Zap } from "lucide-react";
import { ConciergeModal } from "@/components/ConciergeModal";
import { GiftResults } from "@/components/GiftResults";
import { IntakeForm } from "@/components/IntakeForm";
import { StopState } from "@/components/StopState";
import type { GenerateGiftsResponse, GiftRecommendation, GiftRequestPayload } from "@/lib/types";

const initialForm: GiftRequestPayload = {
  recipientName: "",
  company: "",
  linkedinUrl: "",
  context: "",
  transcript: "",
  budget: "$150–300",
  giftMode: "digital_experience",
};

const demoForm: GiftRequestPayload = {
  recipientName: "Jordan Lee",
  company: "Northstar Labs",
  linkedinUrl: "https://www.linkedin.com/in/example-profile",
  context: "Jordan is a thoughtful GTM leader who travels often, prefers useful premium gifts, and recently mentioned needing more recovery time between client trips.",
  transcript: "Meeting note: avoid alcohol; likes independent restaurants, coffee, and practical travel upgrades.",
  budget: "$150–300",
  giftMode: "physical",
};

const stages = [
  { Icon: Search, name: "Sherlock AI", note: "Reading provided context" },
  { Icon: Zap, name: "Gift Strategist", note: "Mapping signals to gift angles" },
  { Icon: ShoppingBag, name: "Gift Sourcing", note: "Structuring recommendations" },
];

type Phase = null | number | "done" | "stop" | "error";

export default function Page() {
  const [form, setForm] = useState<GiftRequestPayload>(initialForm);
  const [advanced, setAdvanced] = useState(false);
  const [phase, setPhase] = useState<Phase>(null);
  const [result, setResult] = useState<GenerateGiftsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conciergeGift, setConciergeGift] = useState<GiftRecommendation | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const running = typeof phase === "number";

  function updateForm(patch: Partial<GiftRequestPayload>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function animatePipeline() {
    timers.current.forEach(clearTimeout);
    setPhase(0);
    timers.current = [setTimeout(() => setPhase(1), 520), setTimeout(() => setPhase(2), 1100)];
  }

  async function run(payload: GiftRequestPayload = form) {
    setError(null);
    setResult(null);
    animatePipeline();
    try {
      const response = await fetch("/api/generate-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as GenerateGiftsResponse;
      if (!response.ok || data.status === "error") throw new Error(data.message || "Gift generation failed.");
      timers.current.forEach(clearTimeout);
      setResult(data);
      setPhase(data.status === "success" ? "done" : "stop");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) {
      timers.current.forEach(clearTimeout);
      setPhase("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  function loadDemo() {
    setForm(demoForm);
    setAdvanced(true);
  }

  function useFallbackGifts() {
    const fallbackPayload = { ...form, context: form.context || "Use safe, low-risk professional fallback gifts based on a busy professional recipient." };
    setForm(fallbackPayload);
    void run(fallbackPayload);
  }

  return (
    <main className="ub-shell">
      <BrandBar />
      <div className="ub-container">
        <Hero />
        <IntakeForm form={form} advanced={advanced} running={running} onChange={updateForm} onAdvancedChange={setAdvanced} onSubmit={() => run()} onDemo={loadDemo} />
        {phase !== null && <Pipeline phase={phase} />}
        <div ref={resultsRef}>
          {phase === "done" && result && <GiftResults result={result} running={running} onRegenerate={() => run()} onConcierge={setConciergeGift} />}
          {phase === "stop" && <StopState message={result?.message} onAddContext={() => setAdvanced(true)} onTryAgain={() => run()} onUseFallback={useFallbackGifts} />}
          {phase === "error" && <ErrorView message={error} />}
        </div>
      </div>
      {conciergeGift && <ConciergeModal gift={conciergeGift} recipientName={result?.recipient.name || form.recipientName} onClose={() => setConciergeGift(null)} />}
    </main>
  );
}

function BrandBar() {
  return (
    <div className="ub-brandbar">
      <div className="ub-brand"><span className="ub-wordmark">UNBOXD</span><span className="ub-beta">Beta</span></div>
      <div className="ub-nav">
        {[{ Icon: Search, label: "Sherlock AI" }, { Icon: Zap, label: "GiftIQ" }, { Icon: ShoppingBag, label: "Sourcing" }].map(({ Icon, label }) => (
          <div className="ub-navitem" key={label}><Icon size={11} color="var(--gold)" /><span className="ub-mono">{label}</span></div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="ub-hero">
      <div className="ub-kicker">Sherlock AI · GiftIQ · UNBOXD</div>
      <h1>Gifting that makes them<br />feel seen.</h1>
      <p>Name and company in. UNBOXD scores gift angles by impact and returns specific recommendations — each ready to buy, search, or request.</p>
    </section>
  );
}

function Pipeline({ phase }: { phase: Phase }) {
  if (typeof phase !== "number") return null;
  return (
    <div className="ub-panel" style={{ marginTop: 18, padding: 18 }}>
      {stages.map(({ Icon, name, note }, index) => {
        const active = phase === index;
        const done = typeof phase === "number" && phase > index;
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, opacity: active || done ? 1 : 0.38, padding: "9px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, border: "1px solid var(--border-1)", display: "grid", placeItems: "center", background: active ? "rgba(201,168,76,.1)" : "transparent" }}>
              <Icon size={14} color={active || done ? "var(--highlight)" : "var(--text-3)"} />
            </div>
            <div style={{ flex: 1 }}><div className="ub-mono" style={{ fontSize: 11, color: "var(--text-1)" }}>{name}</div><div className="ub-copy">{note}</div></div>
            {active && <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--highlight)", animation: "ub-pulse 1s ease infinite" }} />}
          </div>
        );
      })}
    </div>
  );
}

function ErrorView({ message }: { message: string | null }) {
  return (
    <div className="ub-stop" style={{ borderColor: "rgba(217,80,68,.3)" }}>
      <AlertCircle color="var(--err)" />
      <div className="ub-kicker" style={{ color: "var(--err)", margin: "10px 0" }}>Pipeline error</div>
      <p className="ub-copy" style={{ margin: 0 }}>{message || "Something went wrong. Please try again."}</p>
    </div>
  );
}
