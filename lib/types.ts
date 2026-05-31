export type GiftMode = "physical" | "digital_experience";
export type RiskLevel = "low" | "medium" | "high";
export type SourceType = "user_provided" | "public_web" | "model_inferred";
export type FulfillmentType = "direct_purchase" | "concierge_request" | "recipient_choice_link";
export type GenerateGiftsStatus = "success" | "no_signal" | "needs_more_context" | "error";

export interface GiftRequestPayload {
  recipientName: string;
  company: string;
  linkedinUrl?: string;
  context?: string;
  transcript?: string;
  budget?: string;
  giftMode: GiftMode;
}

export interface GiftSignal {
  label: string;
  evidence: string;
  sourceType: SourceType;
  sourceUrl?: string;
  confidence: number;
  riskLevel: RiskLevel;
}

export interface GiftRecommendation {
  id: string;
  title: string;
  description: string;
  deliveryType: GiftMode;
  priceRange: string;
  buyUrl?: string;
  searchUrl?: string;
  imageUrl?: string;
  whyThisFits: string;
  signalUsed: string;
  giftIQ: number;
  confidence: number;
  riskLevel: RiskLevel;
  requiredRecipientSpecs: string[];
  fulfillmentType: FulfillmentType;
}

export interface GenerateGiftsResponse {
  status: GenerateGiftsStatus;
  recipient: {
    name: string;
    company: string;
    identityConfidence: number;
  };
  signals: GiftSignal[];
  gifts: GiftRecommendation[];
  message?: string;
}

export interface ConciergeRequest {
  senderName: string;
  senderEmail: string;
  recipientShippingAddress?: string;
  note?: string;
  recipientSpecs?: string;
  additionalInstructions?: string;
}
