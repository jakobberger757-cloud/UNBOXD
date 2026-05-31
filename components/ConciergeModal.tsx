"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { GiftRecommendation } from "@/lib/types";

interface Props {
  gift: GiftRecommendation;
  recipientName: string;
  onClose: () => void;
}

export function ConciergeModal({ gift, recipientName, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="ub-overlay" onClick={onClose}>
      <div className="ub-modal" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
          <div className="ub-mono" style={{ fontSize: 9, color: "var(--text-3)" }}>UNBOXD Concierge Request</div>
          <button onClick={onClose} style={{ background: "none", border: 0, color: "var(--text-3)", cursor: "pointer" }} aria-label="Close concierge modal"><X size={18} /></button>
        </div>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Check size={34} color="var(--ok)" />
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, margin: "16px 0 8px" }}>Request captured</h2>
            <p className="ub-copy" style={{ maxWidth: 390, margin: "0 auto 22px" }}>UNBOXD will confirm gift details, specs, and delivery before anything is purchased.</p>
            <button className="ub-secondary ub-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, margin: "0 0 8px" }}>Request concierge help</h2>
            <p className="ub-copy" style={{ marginTop: 0 }}>Submit a concierge request for <strong style={{ color: "var(--text-1)" }}>{gift.title}</strong>. UNBOXD will confirm gift details, specs, and delivery before anything is purchased.</p>
            <div className="ub-grid" style={{ marginTop: 18 }}>
              <Field label="Sender name" placeholder="Your name" />
              <Field label="Sender email" placeholder="you@company.com" type="email" />
            </div>
            <div style={{ marginTop: 14 }}><TextField label={`Shipping address for ${recipientName} if known`} placeholder="Full name, street, city, state, ZIP, country" /></div>
            <div style={{ marginTop: 14 }}><TextField label="Note / message" placeholder="Optional note to include or use as context" /></div>
            <div style={{ marginTop: 14 }}><TextField label="Recipient specs if known" placeholder={gift.requiredRecipientSpecs.length ? gift.requiredRecipientSpecs.join(", ") : "Size, color, personalization, preferences"} /></div>
            <div style={{ marginTop: 14 }}><TextField label="Additional instructions" placeholder="Timing, budget guardrails, packaging preferences, anything else" /></div>
            <button className="ub-primary ub-btn" onClick={() => setSubmitted(true)}>Submit concierge request</button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return <label><span className="ub-label">{label}</span><input className="ub-field" type={type} placeholder={placeholder} /></label>;
}

function TextField({ label, placeholder }: { label: string; placeholder: string }) {
  return <label><span className="ub-label">{label}</span><textarea className="ub-field" placeholder={placeholder} style={{ minHeight: 78, resize: "vertical", lineHeight: 1.55 }} /></label>;
}
