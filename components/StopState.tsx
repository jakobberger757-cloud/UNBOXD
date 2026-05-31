"use client";

interface Props {
  message?: string;
  onAddContext: () => void;
  onTryAgain: () => void;
  onUseFallback: () => void;
}

export function StopState({ message, onAddContext, onTryAgain, onUseFallback }: Props) {
  return (
    <div className="ub-stop">
      <div className="ub-kicker" style={{ marginBottom: 14 }}>No gift sent · Right call</div>
      <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 25, lineHeight: 1.25, margin: "0 0 12px" }}>
        {message || "No confident giftable signal found. Try adding a LinkedIn URL, transcript, meeting notes, or personal context."}
      </h2>
      <p className="ub-copy" style={{ maxWidth: 430, margin: "0 auto 22px" }}>
        UNBOXD only recommends gifts when there is enough signal to make the gift feel thoughtful and appropriate.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="ub-secondary ub-btn" onClick={onAddContext}>Add context</button>
        <button className="ub-secondary ub-btn" onClick={onTryAgain}>Try again</button>
        <button className="ub-secondary ub-btn" onClick={onUseFallback}>Use safe fallback gifts</button>
      </div>
    </div>
  );
}
