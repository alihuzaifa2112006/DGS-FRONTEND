import type { Finding, Severity } from '@/lib/security'

/* ------------------------------------------------------------------
   Plain-English advice.

   A score of 61/100 means nothing to someone who just wants to know
   whether their site is safe. This turns findings into an answer in
   ordinary words, with the consequence spelled out.

   The same shape comes back from the Python service when it is
   running; `localAdvice` below is the fallback, so the console never
   depends on that service being up.
   ------------------------------------------------------------------ */

export type Verdict = 'safe' | 'mostly_safe' | 'needs_attention' | 'at_risk'

export interface PriorityAction {
  title: string
  /** Consequence in ordinary words — no CWE numbers, no jargon. */
  why_it_matters: string
  how_to_fix: string
  severity: string
  effort: string
}

export interface Advice {
  verdict: Verdict
  /** One sentence, readable by someone with no security background. */
  headline: string
  plain_summary: string
  risk_explanation: string
  priority_actions: PriorityAction[]
  quick_wins: string[]
  generated_by: string
  is_ai_generated: boolean
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; tone: string; ring: string; dot: string; blurb: string }
> = {
  safe: {
    label: 'Looks safe',
    tone: 'text-emerald-300',
    ring: 'bg-emerald-500/12 ring-emerald-500/30',
    dot: 'bg-emerald-400',
    blurb: 'Nothing worrying turned up in the checks we ran.',
  },
  mostly_safe: {
    label: 'Mostly fine',
    tone: 'text-sky-300',
    ring: 'bg-sky-500/12 ring-sky-500/30',
    dot: 'bg-sky-400',
    blurb: 'A few small things to tidy up, nothing urgent.',
  },
  needs_attention: {
    label: 'Needs attention',
    tone: 'text-amber-300',
    ring: 'bg-amber-500/12 ring-amber-500/30',
    dot: 'bg-amber-400',
    blurb: 'Real gaps worth fixing soon.',
  },
  at_risk: {
    label: 'At risk',
    tone: 'text-red-300',
    ring: 'bg-red-500/12 ring-red-500/30',
    dot: 'bg-red-400',
    blurb: 'Serious problems. Fix these before anything else.',
  },
}

export function verdictFromScore(score: number): Verdict {
  if (score >= 90) return 'safe'
  if (score >= 75) return 'mostly_safe'
  if (score >= 50) return 'needs_attention'
  return 'at_risk'
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

/**
 * Consequence-first rewrites of the findings the scanner can produce.
 * Matched on the finding title so the wording stays under our control
 * rather than being re-derived from the technical description.
 */
const PLAIN: { match: RegExp; why: string }[] = [
  {
    match: /HSTS/i,
    why: 'Someone on the same Wi-Fi as your visitor can quietly push them onto an unencrypted version of your site and read what they send.',
  },
  {
    match: /redirect.*https|http:\/\/ is served/i,
    why: 'Your site still answers over an unencrypted connection, so passwords and personal details can be read in transit.',
  },
  {
    match: /Content-Security-Policy/i,
    why: 'If a bad script ever gets onto a page, nothing is stopping it from stealing data or rewriting what visitors see.',
  },
  {
    match: /framed by any site|Clickjacking/i,
    why: 'Another site can load yours invisibly and trick your visitors into clicking things they cannot see — like a "confirm payment" button.',
  },
  {
    match: /X-Content-Type-Options|nosniff/i,
    why: 'A browser may guess a file is a script when it is not, which turns a harmless upload into running code.',
  },
  {
    match: /Referrer-Policy/i,
    why: 'Full page addresses — including anything sensitive in the link — get handed to other websites your visitors click through to.',
  },
  {
    match: /Permissions-Policy/i,
    why: 'Camera, microphone and location stay available to anything embedded in your pages.',
  },
  {
    match: /version disclosed/i,
    why: 'Your site announces exactly which software and version it runs, which is the first thing an attacker checks for a known way in.',
  },
  {
    match: /missing HttpOnly|missing Secure|missing SameSite|Cookie ".*" is missing/i,
    why: 'A cookie is not properly locked down, so a script on the page could read it or it could travel unencrypted — that is how sessions get stolen.',
  },
  {
    match: /CORS allows any origin/i,
    why: 'Any other website can read data from your site on behalf of someone who is logged in. This is as serious as it sounds.',
  },
  {
    match: /certificate has expired/i,
    why: 'Every visitor now sees a full-page browser warning telling them your site is unsafe. Most will leave.',
  },
  {
    match: /certificate expires in/i,
    why: 'Your security certificate is close to running out. If renewal fails, visitors will see a browser warning.',
  },
  {
    match: /Obsolete TLS/i,
    why: 'Your site still accepts an outdated encryption standard that is no longer considered safe.',
  },
  {
    match: /unsafe-inline|unsafe-eval/i,
    why: 'Your content policy has a loophole that lets injected scripts run anyway, which undoes most of its benefit.',
  },
]

function plainWhy(finding: Finding): string {
  const hit = PLAIN.find((p) => p.match.test(finding.title))
  if (hit) return hit.why
  // Never leave this empty — the technical description is a poor but
  // honest last resort.
  return finding.description
}

/**
 * Builds advice with no model involved. Used when the Python service is
 * unreachable, unconfigured, or slow — the console must still answer
 * "is my site safe?" either way.
 */
export function localAdvice(input: {
  target: string
  score: number
  findings: Finding[]
}): Advice {
  const sorted = [...input.findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  )
  const serious = sorted.filter((f) => f.severity === 'critical' || f.severity === 'high')
  const verdict = verdictFromScore(input.score)

  const headline =
    verdict === 'safe'
      ? 'Nothing worrying turned up on this site.'
      : verdict === 'mostly_safe'
        ? 'This site is in decent shape, with a few small things to tidy up.'
        : verdict === 'needs_attention'
          ? `This site has ${sorted.length} issue${sorted.length === 1 ? '' : 's'} worth fixing.`
          : `This site has serious problems that should be fixed now.`

  const counts = countBySeverity(sorted)
  const plain_summary =
    sorted.length === 0
      ? 'We checked the encryption, the security settings your site sends to browsers, and how its cookies are configured. Everything we can verify from the outside looked fine.'
      : `We found ${sorted.length} issue${sorted.length === 1 ? '' : 's'}${counts ? ` (${counts})` : ''}. ` +
        (serious.length > 0
          ? `${serious.length} of them ${serious.length === 1 ? 'is' : 'are'} worth dealing with first — they affect how safely your visitors' data travels and is stored.`
          : 'None of them are emergencies, but each one removes a layer of protection your visitors would otherwise have.')

  const risk_explanation =
    sorted.length === 0
      ? 'No action needed from this scan. Re-run it after any significant change to your site.'
      : serious.length > 0
        ? plainWhy(serious[0]!)
        : plainWhy(sorted[0]!)

  return {
    verdict,
    headline,
    plain_summary,
    risk_explanation,
    priority_actions: sorted
      .filter((f) => f.severity !== 'info')
      .slice(0, 5)
      .map((f) => ({
        title: f.title,
        why_it_matters: plainWhy(f),
        how_to_fix: f.fix,
        severity: f.severity,
        effort: f.effort,
      })),
    quick_wins: sorted
      .filter((f) => f.effort === 'low')
      .slice(0, 5)
      .map((f) => f.fix),
    generated_by: 'built-in',
    is_ai_generated: false,
  }
}

function countBySeverity(findings: Finding[]): string {
  const order: Severity[] = ['critical', 'high', 'medium', 'low']
  return order
    .map((s) => {
      const n = findings.filter((f) => f.severity === s).length
      return n ? `${n} ${s}` : null
    })
    .filter(Boolean)
    .join(', ')
}
