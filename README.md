# DGS — Digital Guard System (client)

Postman-style API workspace with an AI security engine: send a request, hand the response to the AI Engine,
get ranked weaknesses + fixes, export a PDF. Also scans whole websites.

**Status:** UI only. Every "engine" call resolves from `src/lib/mock.ts` with a small delay so the animations
have something to show. The API Tester does attempt a real `fetch`; when the browser blocks it (CORS) it falls
back to a sample response and shows a `sample` badge.

## Stack

React 19 · Vite 8 · TypeScript · Tailwind v4 (`@theme` tokens in `src/index.css`) · react-router 7 · `motion` · `lucide-react`

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint
```

## Routes

| Route | What |
| --- | --- |
| `/` | Landing (animated hero, ticker, how-it-works, live console demo, features, website-scan, pricing, FAQ, CTA) |
| `/help` | Help center |
| `/login` `/signup` `/forgot-password` | Auth screens (split layout, live findings feed) |
| `/app` | Console · Overview dashboard |
| `/app/api-tester` | Postman-style request builder → response → **Send to AI Engine** → findings / attack surface / suggestions → **Export PDF** |
| `/app/website-scan` | URL → animated scan → TLS / headers / endpoints / AI findings → Export PDF |
| `/app/reports` | Report list, preview drawer, download/delete |
| `/app/settings` | Profile, workspace, engine, API keys, notifications, report branding |

Auth is faked with `localStorage["dgs.session"]` (see `src/lib/session.ts`).

## Structure

```
src/
  index.css                 design tokens (paper/ink/brand), keyframes, utilities
  App.tsx                   routes (console + auth are lazy-loaded)
  components/
    Logo.tsx                wordmark + mark (matches public/favicon.svg)
    ui/                     Button, Field, Reveal (scroll animation), ScoreRing, Toaster
    landing/                Nav, Hero, HeroIllustration (animated SVG), Marquee, HowItWorks,
                            ConsolePreview (self-driving demo), Features, WebsiteScanSection,
                            Pricing, FAQ, CTA, Footer
    app/                    AiPanel, Findings (list/checks/code), ExportModal, JsonView,
                            KVEditor, SeverityBadge/MethodChip
  pages/
    Landing.tsx Help.tsx NotFound.tsx
    auth/                   AuthLayout, Login, Signup, Forgot, SocialRow
    app/                    AppLayout (sidebar/topbar), Dashboard, ApiTester, WebsiteScan, Reports, Settings
  lib/
    mock.ts                 types + sample request/response/analysis/scan/reports
    session.ts toast.ts utils.ts
```

## Theme

Marketing + auth use the light **paper** palette; the console uses dark **ink**. Brand violet is tuned to the
DGS logo. Display type is *Instrument Serif* (italic accents), body *Manrope*, data *JetBrains Mono*.

Built by Eng. Ali Huzaifa.
