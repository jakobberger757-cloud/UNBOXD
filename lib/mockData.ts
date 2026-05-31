import type { GenerateGiftsResponse, GiftMode, GiftRequestPayload } from "./types";
import { calculateGiftIQ } from "./giftiq";

const demoSignals = [
  {
    label: "Thoughtful operator who values focus",
    evidence: "The provided context mentions packed travel days, client meetings, and a preference for useful gifts over novelty items.",
    sourceType: "user_provided" as const,
    confidence: 0.82,
    riskLevel: "low" as const,
  },
  {
    label: "Workday recovery and premium routine",
    evidence: "Budget and relationship context suggest a polished, low-risk gift that supports a busy professional routine.",
    sourceType: "model_inferred" as const,
    confidence: 0.74,
    riskLevel: "low" as const,
  },
];

export function buildMockGiftResponse(payload: GiftRequestPayload): GenerateGiftsResponse {
  const name = payload.recipientName || "Jordan Lee";
  const company = payload.company || "Acme Co.";
  const mode: GiftMode = payload.giftMode;
  const hasSignal = Boolean(payload.context?.trim() || payload.transcript?.trim() || payload.linkedinUrl?.trim() || payload.recipientName?.trim());

  if (!hasSignal) {
    return {
      status: "no_signal",
      recipient: { name, company, identityConfidence: 0.35 },
      signals: [],
      gifts: [],
      message: "No confident giftable signal found. Try adding a LinkedIn URL, transcript, meeting notes, or personal context.",
    };
  }

  const physical = [
    {
      id: "mock-phys-1",
      title: "Premium Desk Reset Kit",
      description: "A refined bundle with a brass pen, low-profile notebook, and calming desk accessory from boutique office brands.",
      deliveryType: "physical" as const,
      priceRange: payload.budget || "$75–150",
      searchUrl: "https://www.google.com/search?q=premium+desk+reset+kit+brass+pen+notebook",
      whyThisFits: "It feels polished and useful without being overly personal, ideal for a busy operator who appreciates practical upgrades.",
      signalUsed: demoSignals[0].label,
      giftIQ: calculateGiftIQ({ signalConfidence: 0.82, giftConfidence: 0.86, riskLevel: "low", hasSpecificSignal: true }),
      confidence: 0.86,
      riskLevel: "low" as const,
      requiredRecipientSpecs: ["shipping address"],
      fulfillmentType: "concierge_request" as const,
    },
    {
      id: "mock-phys-2",
      title: "Specialty Coffee Discovery Box",
      description: "A rotating set of small-batch beans or brew-ready coffee from independent roasters.",
      deliveryType: "physical" as const,
      priceRange: payload.budget || "$75–150",
      searchUrl: "https://www.google.com/search?q=specialty+coffee+gift+box+independent+roaster",
      whyThisFits: "A premium but safe workday ritual gift that can be shared at home or the office.",
      signalUsed: demoSignals[1].label,
      giftIQ: calculateGiftIQ({ signalConfidence: 0.74, giftConfidence: 0.83, riskLevel: "low", hasSpecificSignal: true }),
      confidence: 0.83,
      riskLevel: "low" as const,
      requiredRecipientSpecs: ["shipping address", "caffeine preference if known"],
      fulfillmentType: "concierge_request" as const,
    },
    {
      id: "mock-phys-3",
      title: "Monogrammable Travel Tech Organizer",
      description: "A compact organizer for chargers, adapters, and travel-day essentials in a premium finish.",
      deliveryType: "physical" as const,
      priceRange: payload.budget || "$75–150",
      searchUrl: "https://www.google.com/search?q=monogrammable+travel+tech+organizer+premium",
      whyThisFits: "Useful for frequent meetings and travel while still feeling personal and elevated.",
      signalUsed: "Busy travel and client-meeting cadence",
      giftIQ: calculateGiftIQ({ signalConfidence: 0.8, giftConfidence: 0.81, riskLevel: "medium", hasSpecificSignal: true }),
      confidence: 0.81,
      riskLevel: "medium" as const,
      requiredRecipientSpecs: ["shipping address", "color preference", "personalization initials"],
      fulfillmentType: "concierge_request" as const,
    },
  ];

  const digital = [
    {
      id: "mock-dig-1",
      title: "Curated Local Dinner Experience",
      description: "A recipient-choice dining voucher/search link for a highly rated independent restaurant near their city.",
      deliveryType: "digital_experience" as const,
      priceRange: payload.budget || "$150–300",
      searchUrl: "https://www.google.com/search?q=best+independent+restaurant+gift+card+near+me",
      whyThisFits: "It creates a memorable experience while letting the recipient choose timing and cuisine.",
      signalUsed: demoSignals[0].label,
      giftIQ: calculateGiftIQ({ signalConfidence: 0.82, giftConfidence: 0.84, riskLevel: "low", hasSpecificSignal: true }),
      confidence: 0.84,
      riskLevel: "low" as const,
      requiredRecipientSpecs: [],
      fulfillmentType: "recipient_choice_link" as const,
    },
    {
      id: "mock-dig-2",
      title: "MasterClass-Style Learning Pass",
      description: "A flexible digital learning or workshop credit matched to leadership, creativity, or wellness interests.",
      deliveryType: "digital_experience" as const,
      priceRange: payload.budget || "$75–150",
      searchUrl: "https://www.google.com/search?q=premium+online+workshop+gift+card",
      whyThisFits: "It is professional, low-risk, and gives them control over the exact class or experience.",
      signalUsed: demoSignals[1].label,
      giftIQ: calculateGiftIQ({ signalConfidence: 0.74, giftConfidence: 0.8, riskLevel: "low", hasSpecificSignal: true }),
      confidence: 0.8,
      riskLevel: "low" as const,
      requiredRecipientSpecs: [],
      fulfillmentType: "recipient_choice_link" as const,
    },
    {
      id: "mock-dig-3",
      title: "Boutique Wellness Recovery Credit",
      description: "A digital certificate for a massage, sauna, or recovery studio experience from a local provider.",
      deliveryType: "digital_experience" as const,
      priceRange: payload.budget || "$150–300",
      searchUrl: "https://www.google.com/search?q=boutique+wellness+spa+gift+certificate+local",
      whyThisFits: "A thoughtful reset for a busy schedule, with recipient choice reducing personal-preference risk.",
      signalUsed: "Workday recovery and premium routine",
      giftIQ: calculateGiftIQ({ signalConfidence: 0.76, giftConfidence: 0.78, riskLevel: "medium", hasSpecificSignal: true }),
      confidence: 0.78,
      riskLevel: "medium" as const,
      requiredRecipientSpecs: [],
      fulfillmentType: "recipient_choice_link" as const,
    },
  ];

  return {
    status: "success",
    recipient: { name, company, identityConfidence: payload.linkedinUrl ? 0.78 : 0.62 },
    signals: demoSignals,
    gifts: mode === "physical" ? physical : digital,
    message: "Demo recommendations generated in mock mode. Add an Anthropic API key to enable live model generation.",
  };
}
