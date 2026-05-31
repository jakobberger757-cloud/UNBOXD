import type { RiskLevel } from "./types";

const riskPenalty: Record<RiskLevel, number> = {
  low: 0,
  medium: 8,
  high: 18,
};

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateGiftIQ(input: {
  signalConfidence: number;
  giftConfidence: number;
  riskLevel: RiskLevel;
  hasSpecificSignal: boolean;
}): number {
  const base = input.signalConfidence * 45 + input.giftConfidence * 45;
  const signalBonus = input.hasSpecificSignal ? 10 : 0;
  return clampScore(base + signalBonus - riskPenalty[input.riskLevel]);
}
