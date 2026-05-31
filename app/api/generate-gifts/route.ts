import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { enforceGiftMode, modeNoun, normalizeGiftMode } from "@/lib/giftMode";
import { buildMockGiftResponse } from "@/lib/mockData";
import type { GenerateGiftsResponse, GiftRecommendation, GiftRequestPayload, GiftSignal, RiskLevel } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = sanitizePayload(body);

    if (!payload.recipientName || !payload.company) {
      return NextResponse.json(errorResponse(payload, "Recipient name and company are required."), { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(applyModeRules(buildMockGiftResponse(payload), payload));
    }

    const generated = await generateWithAnthropic(payload);
    return NextResponse.json(applyModeRules(generated, payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      {
        status: "error",
        recipient: { name: "", company: "", identityConfidence: 0 },
        signals: [],
        gifts: [],
        message,
      } satisfies GenerateGiftsResponse,
      { status: 500 },
    );
  }
}

function sanitizePayload(input: Partial<GiftRequestPayload>): GiftRequestPayload {
  return {
    recipientName: stringValue(input.recipientName),
    company: stringValue(input.company),
    linkedinUrl: stringValue(input.linkedinUrl),
    context: stringValue(input.context),
    transcript: stringValue(input.transcript),
    budget: stringValue(input.budget) || "$150–300",
    giftMode: normalizeGiftMode(input.giftMode),
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function generateWithAnthropic(payload: GiftRequestPayload): Promise<GenerateGiftsResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2200,
    temperature: 0.4,
    system: systemPrompt(payload),
    messages: [{ role: "user", content: JSON.stringify(payload, null, 2) }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const parsed = extractJson(text) as Partial<GenerateGiftsResponse>;
  return normalizeResponse(parsed, payload);
}

function systemPrompt(payload: GiftRequestPayload): string {
  return `You are UNBOXD, an insight-led gift recommendation engine.

Return ONLY valid JSON matching this exact TypeScript shape:
{
  "status": "success" | "no_signal" | "needs_more_context" | "error",
  "recipient": { "name": string, "company": string, "identityConfidence": number },
  "signals": [{ "label": string, "evidence": string, "sourceType": "user_provided" | "public_web" | "model_inferred", "sourceUrl"?: string, "confidence": number, "riskLevel": "low" | "medium" | "high" }],
  "gifts": [{ "id": string, "title": string, "description": string, "deliveryType": "physical" | "digital_experience", "priceRange": string, "buyUrl"?: string, "searchUrl"?: string, "imageUrl"?: string, "whyThisFits": string, "signalUsed": string, "giftIQ": number, "confidence": number, "riskLevel": "low" | "medium" | "high", "requiredRecipientSpecs": string[], "fulfillmentType": "direct_purchase" | "concierge_request" | "recipient_choice_link" }],
  "message"?: string
}

Rules:
- Generate ${modeNoun(payload.giftMode)} only. Do not include the other delivery type.
- Do not scrape LinkedIn or login-gated/private social platforms. Treat LinkedIn URL as identity/context only.
- Use user-provided context first. You may infer safe gift angles, but label inferred signals as model_inferred.
- If there is no confident giftable signal, return status "no_signal", no gifts, and this message: "No confident giftable signal found. Try adding a LinkedIn URL, transcript, meeting notes, or personal context."
- Return at least 3 and at most 4 gifts for success.
- Avoid alcohol, medical, religious, political, romantic, or overly personal gifts unless explicitly provided by the user.
- For physical gifts requiring size, color, personalization, shipping address, dietary preference, or similar details, list those details in requiredRecipientSpecs.
- Prefer searchUrl when you are not certain about a real product URL. Never invent a fake buyUrl.
- Keep the tone premium, simple, and appropriate for a public MVP demo.
- Requested budget: ${payload.budget || "not specified"}.`;
}

function extractJson(text: string): unknown {
  const raw = text.replace(/```json|```/g, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeResponse(input: Partial<GenerateGiftsResponse>, payload: GiftRequestPayload): GenerateGiftsResponse {
  return {
    status: input.status || "success",
    recipient: {
      name: input.recipient?.name || payload.recipientName,
      company: input.recipient?.company || payload.company,
      identityConfidence: clamp01(input.recipient?.identityConfidence ?? (payload.linkedinUrl ? 0.72 : 0.55)),
    },
    signals: Array.isArray(input.signals) ? input.signals.map(normalizeSignal) : [],
    gifts: Array.isArray(input.gifts) ? input.gifts.map((gift, index) => normalizeGift(gift, index, payload)) : [],
    message: input.message,
  };
}

function normalizeSignal(signal: GiftSignal): GiftSignal {
  return {
    label: signal.label || "Giftable signal",
    evidence: signal.evidence || "Generated from available context.",
    sourceType: ["user_provided", "public_web", "model_inferred"].includes(signal.sourceType) ? signal.sourceType : "model_inferred",
    sourceUrl: signal.sourceUrl,
    confidence: clamp01(signal.confidence ?? 0.5),
    riskLevel: normalizeRisk(signal.riskLevel),
  };
}

function normalizeGift(gift: GiftRecommendation, index: number, payload: GiftRequestPayload): GiftRecommendation {
  return {
    id: gift.id || `gift-${index + 1}`,
    title: gift.title || "Thoughtful gift recommendation",
    description: gift.description || "A polished, low-risk gift matched to available context.",
    deliveryType: normalizeGiftMode(gift.deliveryType),
    priceRange: gift.priceRange || payload.budget || "$150–300",
    buyUrl: gift.buyUrl,
    searchUrl: gift.searchUrl || buildSearchUrl(gift.title || "premium professional gift"),
    imageUrl: gift.imageUrl,
    whyThisFits: gift.whyThisFits || "It aligns with the strongest available signal while staying professional.",
    signalUsed: gift.signalUsed || "Available user-provided context",
    giftIQ: clampScore(gift.giftIQ ?? Math.round((gift.confidence ?? 0.72) * 100)),
    confidence: clamp01(gift.confidence ?? 0.72),
    riskLevel: normalizeRisk(gift.riskLevel),
    requiredRecipientSpecs: Array.isArray(gift.requiredRecipientSpecs) ? gift.requiredRecipientSpecs : [],
    fulfillmentType: gift.fulfillmentType || (payload.giftMode === "physical" ? "concierge_request" : "recipient_choice_link"),
  };
}

function applyModeRules(response: GenerateGiftsResponse, payload: GiftRequestPayload): GenerateGiftsResponse {
  const gifts = enforceGiftMode(response.gifts, payload.giftMode);
  if (response.status === "success" && gifts.length < 3) {
    return {
      ...response,
      status: "needs_more_context",
      gifts: [],
      message: `No confident ${modeNoun(payload.giftMode)} remained after delivery-mode checks. Try adding a LinkedIn URL, transcript, meeting notes, or personal context.`,
    };
  }
  return { ...response, gifts };
}

function errorResponse(payload: GiftRequestPayload, message: string): GenerateGiftsResponse {
  return {
    status: "error",
    recipient: { name: payload.recipientName, company: payload.company, identityConfidence: 0 },
    signals: [],
    gifts: [],
    message,
  };
}

function buildSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function normalizeRisk(value: unknown): RiskLevel {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}
