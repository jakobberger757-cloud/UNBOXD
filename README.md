# UNBOXD MVP

UNBOXD is a simple AI-powered gift recommendation MVP. A user enters a recipient name, company, optional LinkedIn URL for identity/context only, relationship context or transcript, budget, and delivery mode. The app calls a server-side route and returns polished, swipeable gift cards with GiftIQ scores and clear reasoning.

## What is implemented

- Next.js App Router structure.
- Client UI split into focused components.
- Server-side `/api/generate-gifts` route for gift generation.
- No model calls or API keys in browser code.
- Mock/fallback mode when no API key is configured.
- Strict delivery-mode filtering so physical searches return only physical gifts and digital/experience searches return only digital/experience gifts.
- Stop states for low-signal or insufficient delivery-mode-safe results.
- Physical gift concierge request flow that does not promise automatic fulfillment.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Available variables:

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

If `ANTHROPIC_API_KEY` is empty, the app automatically uses `lib/mockData.ts` so you can test the UI immediately.

## Switching from mock mode to real model calls

1. Add `ANTHROPIC_API_KEY` to `.env.local` locally or to your Vercel project environment variables.
2. Optionally set `ANTHROPIC_MODEL`.
3. Restart the dev server.
4. Submit the form. The browser still calls only `/api/generate-gifts`; the server route calls Anthropic.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add `ANTHROPIC_API_KEY` and optional `ANTHROPIC_MODEL` in Vercel Project Settings → Environment Variables.
4. Deploy.

## Safety and product notes

- Do not call OpenAI, Anthropic, or any LLM API directly from the browser.
- Do not expose API keys in client code.
- Do not scrape LinkedIn or private/login-gated social platforms; the LinkedIn URL is treated as identity/context only.
- The MVP can use user-provided context, safe model inference, public web context if later added server-side, and search-style gift links.
