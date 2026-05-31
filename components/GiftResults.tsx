"use client";

import { RotateCcw } from "lucide-react";
import type { GenerateGiftsResponse, GiftRecommendation } from "@/lib/types";
import { GiftCard } from "./GiftCard";

interface Props {
  result: GenerateGiftsResponse;
  running: boolean;
  onRegenerate: () => void;
  onConcierge: (gift: GiftRecommendation) => void;
}

export function GiftResults({ result, running, onRegenerate, onConcierge }: Props) {
  return (
    <section>
      <div className="ub-results-head">
        <div>
          <div className="ub-kicker" style={{ marginBottom: 8 }}>GiftIQ recommendations</div>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, margin: 0, fontWeight: 300 }}>
            {result.recipient.name} at {result.recipient.company}
          </h2>
          {result.message && <p className="ub-copy" style={{ margin: "8px 0 0" }}>{result.message}</p>}
        </div>
        <button className="ub-secondary ub-btn" onClick={onRegenerate} disabled={running}><RotateCcw size={12} /> Regenerate</button>
      </div>
      {result.signals.length > 0 && (
        <div className="ub-panel" style={{ padding: 16, marginBottom: 16 }}>
          <span className="ub-label">Signals found</span>
          <div style={{ display: "grid", gap: 10 }}>
            {result.signals.map((signal) => (
              <div key={`${signal.label}-${signal.evidence}`}>
                <div style={{ color: "var(--text-1)", fontSize: 14 }}>{signal.label} <span style={{ color: "var(--text-3)" }}>· {Math.round(signal.confidence * 100)}%</span></div>
                <div className="ub-copy">{signal.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="ub-card-stack">
        {result.gifts.map((gift) => <GiftCard key={gift.id} gift={gift} onConcierge={onConcierge} />)}
      </div>
    </section>
  );
}
