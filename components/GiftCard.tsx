"use client";

import { AlertCircle, ExternalLink, Package, Send } from "lucide-react";
import type { GiftRecommendation } from "@/lib/types";

interface Props {
  gift: GiftRecommendation;
  onConcierge: (gift: GiftRecommendation) => void;
}

export function GiftCard({ gift, onConcierge }: Props) {
  const recipientInfoNeeded = gift.deliveryType === "physical" && gift.requiredRecipientSpecs.length > 0;
  const href = gift.buyUrl || gift.searchUrl;

  return (
    <article className="ub-card ub-in">
      <div className="ub-card-top">
        <div>
          <span className="ub-pill"><Package size={11} /> {gift.deliveryType === "physical" ? "Physical" : "Digital / experience"}</span>
          <h3 className="ub-title">{gift.title}</h3>
        </div>
        <div className="ub-score">{gift.giftIQ}</div>
      </div>
      <p className="ub-copy" style={{ margin: "0 0 12px" }}>{gift.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span className="ub-pill">{gift.priceRange}</span>
        <span className="ub-pill">{Math.round(gift.confidence * 100)}% confidence</span>
        <span className="ub-pill">{gift.riskLevel} risk</span>
      </div>
      <div className="ub-section"><span className="ub-label">Why this fits</span><p className="ub-copy" style={{ margin: 0 }}>{gift.whyThisFits}</p></div>
      <div className="ub-section"><span className="ub-label">Signal used</span><p className="ub-copy" style={{ margin: 0 }}>{gift.signalUsed}</p></div>
      {recipientInfoNeeded && (
        <div className="ub-section">
          <div className="ub-warn">
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--highlight)", marginBottom: 7 }}><AlertCircle size={15} /><span className="ub-mono" style={{ fontSize: 10 }}>Recipient info needed</span></div>
            <div className="ub-copy">Needed before purchase: {gift.requiredRecipientSpecs.join(", ")}.</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {gift.deliveryType === "physical" ? (
          <button className="ub-primary ub-btn" style={{ marginTop: 0 }} onClick={() => onConcierge(gift)}><Send size={14} /> Request Concierge</button>
        ) : href ? (
          <a className="ub-primary ub-btn" style={{ marginTop: 0 }} href={href} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {gift.buyUrl ? "Buy gift" : "Search gift"}</a>
        ) : (
          <button className="ub-primary ub-btn" style={{ marginTop: 0 }} onClick={() => onConcierge(gift)}>Request help</button>
        )}
      </div>
    </article>
  );
}
