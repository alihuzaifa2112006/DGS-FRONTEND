# DGS — Digital Guard System

Postman-style API workspace with an AI security engine: send a request, hand the response to the AI Engine,
get ranked weaknesses + fixes, export a PDF. Also scans whole websites.

**Status:** UI only. Every "engine" call resolves from `src/lib/mock.ts` with a small delay so the animations
have something to show. The API Tester does attempt a real `fetch`; when the browser blocks it (CORS) it falls
back to a sample response and shows a `sample` badge.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (`@theme` tokens in `src/app/globals.css`) ·
`motion` · `lucide-react` · fonts via `next/font`

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # next build
npm start          # serve the production build
npm run lint
npm run typecheck
```

## Routes

| Route | What |
| --- | --- |
| `/` | Landing (animated hero, ticker, how-it-works, live console demo, features, website-scan, pricing, FAQ, CTA) |
| `/help` | Help center |
| `/login` `/signup` `/forgot-password` | Auth screens — share `(auth)` layout (split screen + live findings feed) |
| `/app` | Console · Overview dashboard |
| `/app/api-tester` | Request builder → response → **Send to AI Engine** → findings / attack surface / suggestions → **Export PDF** |
| `/app/website-scan` | URL → animated scan → TLS / headers / endpoints / AI findings → Export PDF |
| `/app/reports` | Report list, preview drawer, download/delete |
| `/app/settings` | Profile, workspace, engine, API keys, notifications, report branding |

All 12 routes prerender as static HTML (`next build` output).

## Structure

```
src/
  app/                          ← routes only; each page.tsx is a thin server
    layout.tsx                    component that exports `metadata` and renders
    globals.css                   its client view
    page.tsx                      /            (landing)
    not-found.tsx                 404
    help/page.tsx                 /help
    (auth)/                       route group — shared auth layout, no URL segment
      layout.tsx                  split screen + live findings feed
      login/{page,LoginForm}.tsx
      signup/{page,SignupForm}.tsx
      forgot-password/{page,ForgotForm}.tsx
    app/                          /app/* console
      layout.tsx                  sidebar + topbar + page transition
      page.tsx + DashboardView.tsx
      api-tester/{page,ApiTesterView}.tsx
      website-scan/{page,WebsiteScanView}.tsx
      reports/{page,ReportsView}.tsx
      settings/{page,SettingsView}.tsx
  components/
    Logo.tsx                    wordmark + mark (matches public/favicon.svg)
    ui/                         Button, Field, Reveal, ScoreRing, Toaster
    landing/                    Nav, Hero, HeroIllustration (animated SVG), Marquee,
                                HowItWorks, ConsolePreview, Features,
                                WebsiteScanSection, Pricing, FAQ, CTA, Footer
    auth/SocialRow.tsx
    help/HelpCenter.tsx
    console/                    AiPanel, Findings, ExportModal, JsonView,
                                KVEditor, SeverityBadge — shared console widgets
  lib/
    mock.ts                     types + sample request/response/analysis/scan/reports
    session.ts                  fake auth (localStorage) + `useSession()` hook
    toast.ts  utils.ts
```

**Conventions**

- `page.tsx` = server component, exports `metadata`. Interactive UI lives in a co-located
  `*View.tsx` / `*Form.tsx` marked `'use client'`. Add a route by creating a folder with those two files.
- Only components that use hooks or `motion` carry `'use client'`; everything else stays a server component.
- `useSession()` reads localStorage through `useSyncExternalStore`, so SSR and hydration agree.
- `typedRoutes` is off (see `next.config.ts`) so shared components can take plain `href: string`.

## Theme

Marketing + auth use the light **paper** palette; the console uses dark **ink**. Brand violet is tuned to the
DGS logo. Display type is *Instrument Serif* (italic accents), body *Manrope*, data *JetBrains Mono* — all
loaded with `next/font` and exposed to Tailwind as `font-display` / `font-sans` / `font-mono`.

## Wiring up a real backend

1. `src/lib/mock.ts` — replace `sampleAnalysis` / `sampleSiteScan` with API calls; the types are the contract.
2. `src/lib/session.ts` — swap the three localStorage functions for real auth.
3. `ApiTesterView.send()` — point the request at your proxy route instead of `fetch` direct (kills the CORS fallback).
4. Add route handlers under `src/app/api/*` when the backend lands.

Built by Eng. Ali Huzaifa.
