"use client";

import { ChevronDown, ChevronUp, Mail, Package, Search } from "lucide-react";
import type { GiftMode, GiftRequestPayload } from "@/lib/types";
import { giftModeLabels } from "@/lib/giftMode";

interface Props {
  form: GiftRequestPayload;
  advanced: boolean;
  running: boolean;
  onChange: (patch: Partial<GiftRequestPayload>) => void;
  onAdvancedChange: (advanced: boolean) => void;
  onSubmit: () => void;
  onDemo: () => void;
}

const budgets = ["$25–75", "$75–150", "$150–300", "$300–500", "$500+"];

export function IntakeForm({ form, advanced, running, onChange, onAdvancedChange, onSubmit, onDemo }: Props) {
  const canRun = Boolean(form.recipientName.trim() && form.company.trim() && !running);

  return (
    <section className="ub-panel">
      <div className="ub-grid">
        <label><span className="ub-label">Recipient name</span><input className="ub-field" placeholder="e.g. Maya Chen" value={form.recipientName} onChange={(e) => onChange({ recipientName: e.target.value })} /></label>
        <label><span className="ub-label">Company</span><input className="ub-field" placeholder="e.g. Linear" value={form.company} onChange={(e) => onChange({ company: e.target.value })} /></label>
      </div>

      <div style={{ marginTop: 18 }}>
        <span className="ub-label">Delivery</span>
        <div className="ub-mode-row">
          <ModeButton mode="digital_experience" active={form.giftMode === "digital_experience"} onClick={() => onChange({ giftMode: "digital_experience" })} />
          <ModeButton mode="physical" active={form.giftMode === "physical"} onClick={() => onChange({ giftMode: "physical" })} />
        </div>
      </div>

      <div className="ub-grid" style={{ marginTop: 18 }}>
        <label><span className="ub-label">Budget</span><select className="ub-field" value={form.budget} onChange={(e) => onChange({ budget: e.target.value })}>{budgets.map((budget) => <option key={budget}>{budget}</option>)}</select></label>
        <label><span className="ub-label">LinkedIn URL optional</span><input className="ub-field" placeholder="Identity/context only — no scraping" value={form.linkedinUrl || ""} onChange={(e) => onChange({ linkedinUrl: e.target.value })} /></label>
      </div>

      <button className="ub-secondary ub-btn" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }} onClick={() => onAdvancedChange(!advanced)}>
        {advanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Context / transcript
      </button>

      {advanced && (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <label><span className="ub-label">Relationship context</span><textarea className="ub-field" style={{ minHeight: 82, resize: "vertical" }} placeholder="What do you know about them? Interests, recent milestones, meeting notes, gift boundaries…" value={form.context || ""} onChange={(e) => onChange({ context: e.target.value })} /></label>
          <label><span className="ub-label">Transcript / notes optional</span><textarea className="ub-field" style={{ minHeight: 82, resize: "vertical" }} placeholder="Paste a call transcript or notes. UNBOXD will use only user-provided context." value={form.transcript || ""} onChange={(e) => onChange({ transcript: e.target.value })} /></label>
        </div>
      )}

      <button className="ub-primary ub-btn" disabled={!canRun} onClick={onSubmit}>
        {running ? <span className="ub-spinner" /> : <Search size={15} />} {running ? "Finding gifts" : giftModeLabels[form.giftMode].cta}
      </button>
      <button className="ub-secondary ub-btn" style={{ width: "100%", marginTop: 10 }} onClick={onDemo} disabled={running}>Load demo example</button>
    </section>
  );
}

function ModeButton({ mode, active, onClick }: { mode: GiftMode; active: boolean; onClick: () => void }) {
  const labels = giftModeLabels[mode];
  const Icon = mode === "physical" ? Package : Mail;
  return (
    <button className={`ub-mode ub-btn ${active ? "active" : ""}`} onClick={onClick} type="button">
      <Icon size={16} color={active ? "var(--highlight)" : "var(--text-3)"} />
      <span className="ub-mono" style={{ fontSize: 11 }}>{labels.label}</span>
      <span style={{ fontSize: 11, color: active ? "var(--text-2)" : "var(--text-3)" }}>{labels.sublabel}</span>
    </button>
  );
}
