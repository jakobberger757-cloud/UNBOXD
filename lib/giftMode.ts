import type { GiftMode, GiftRecommendation } from "./types";

export const giftModeLabels: Record<GiftMode, { label: string; sublabel: string; cta: string }> = {
  physical: {
    label: "Ship a gift",
    sublabel: "Physical product",
    cta: "Find physical gifts",
  },
  digital_experience: {
    label: "Send now",
    sublabel: "Digital · voucher · experience",
    cta: "Find digital gifts",
  },
};

export function normalizeGiftMode(value: unknown): GiftMode {
  return value === "physical" ? "physical" : "digital_experience";
}

export function enforceGiftMode(gifts: GiftRecommendation[], giftMode: GiftMode): GiftRecommendation[] {
  return gifts.filter((gift) => gift.deliveryType === giftMode);
}

export function modeNoun(giftMode: GiftMode): string {
  return giftMode === "physical" ? "physical gifts" : "digital gifts and experiences";
}
