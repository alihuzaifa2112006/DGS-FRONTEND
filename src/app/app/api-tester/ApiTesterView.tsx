'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Send, Sparkles, History, ChevronDown, Clock, HardDrive, AlertTriangle, Copy, Check, WrapText, Save, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { KVEditor, type KV } from '@/components/console/KVEditor'
import { JsonView } from '@/components/console/JsonView'
import { MethodChip } from '@/components/console/SeverityBadge'
import { AiPanel, type AiState } from '@/components/console/AiPanel'
import { ExportModal } from '@/components/console/ExportModal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'
import { gradeFor, type AiAnalysis } from '@/lib/security'
import { auditApiResponse } from '@/lib/scan/api-response'
import type { Advice } from '@/lib/scan/advice'
import { sampleRequest } from '@/lib/demo'
import { apiPost, ApiClientError } from '@/lib/api'
import type { ProxyResult } from '@/app/api/tools/http/route'
import { cn, formatBytes, tryPrettyJson } from '@/lib/utils'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
type Method = (typeof METHODS)[number]
type ReqTab = 'params' | 'headers' | 'body' | 'auth'
type ResTab = 'body' | 'headers' | 'cookies'

interface Resp {
  status: number
  statusText: string
  timeMs: number
  size: number
  headers: Record<string, string>
  cookies: string[]
  body: string
  truncated: boolean
  redirects: string[]
  finalUrl: string
  resolvedTo: string[]
}

/** One entry per request actually sent in this browser session. */
interface HistoryEntry {
  id: number
  method: Method
  url: string
  status: number
  at: number
}

/**
 * Reads the correct method off a 405 response.
 *
 * An endpoint that only accepts POST answers a GET with 405 and an `Allow`
 * header listing what it does take. That is the server telling us exactly
 * what the user meant — so we switch and retry instead of making them
 * work it out from a status code.
 */
function methodFromAllowHeader(
  headers: Record<string, string>,
  current: Method,
): Method | null {
  const allow = Object.entries(headers).find(([k]) => k.toLowerCase() === 'allow')?.[1]
  if (!allow) return null

  const allowed = allow
    .split(',')
    .map((m) => m.trim().toUpperCase())
    .filter((m): m is Method => (METHODS as readonly string[]).includes(m))
    // HEAD and OPTIONS are almost never what someone was reaching for.
    .filter((m) => m !== 'HEAD' && m !== 'OPTIONS' && m !== current)

  if (allowed.length === 0) return null
  // Prefer a body-carrying verb when several are offered — that is the
  // usual intent behind hitting an endpoint that rejected GET.
  return allowed.find((m) => m === 'POST') ?? allowed[0]!
}

const statusTone = (s: number) =>
  s >= 500 ? 'bg-red-500/20 text-red-300 ring-red-500/30' : s >= 400 ? 'bg-amber-500/20 text-amber-300 ring-amber-500/30' : s >= 300 ? 'bg-sky-500/20 text-sky-300 ring-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30'

export default function ApiTester() {
  const [method, setMethod] = useState<Method>(sampleRequest.method as Method)
  const [url, setUrl] = useState(sampleRequest.url)
  const [params, setParams] = useState<KV[]>(sampleRequest.params)
  const [headers, setHeaders] = useState<KV[]>(sampleRequest.headers)
  const [body, setBody] = useState(sampleRequest.body)
  const [auth, setAuth] = useState<{ type: 'none' | 'bearer' | 'basic' | 'apikey'; token: string; user: string; pass: string; keyName: string }>({
    type: 'bearer',
    token: '',
    user: '',
    pass: '',
    keyName: 'X-API-Key',
  })
  const [reqTab, setReqTab] = useState<ReqTab>('body')
  const [resTab, setResTab] = useState<ResTab>('body')
  const [sending, setSending] = useState(false)
  const [resp, setResp] = useState<Resp | null>(null)
  const [wrap, setWrap] = useState(true)
  const [aiState, setAiState] = useState<AiState>('idle')
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  // Collapsed by default. Three columns on a 1280px laptop leaves the
  // request builder — the thing people actually use — squeezed to nothing.
  const [showHistory, setShowHistory] = useState(false)
  // Not persisted anywhere yet — this is what has been sent since the page loaded.
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [methodOpen, setMethodOpen] = useState(false)
  const methodRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!methodRef.current?.contains(e.target as Node)) setMethodOpen(false)
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [])

  // Ctrl/⌘ + Enter sends
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, url, params, headers, body, auth])

  const hasBody = !['GET', 'HEAD'].includes(method)

  async function send(override?: { method?: Method; isAutoRetry?: boolean }) {
    if (!url.trim()) return toast('Enter a URL first', { kind: 'error' })
    const useMethod = override?.method ?? method
    setSending(true)
    setResp(null)
    setAiState('idle')
    setAnalysis(null)

    try {
      // Build the final URL client-side so the query string the user sees in
      // the params tab is exactly what gets sent.
      let target = url.trim()
      if (!/^[a-z][a-z0-9+.-]*:/i.test(target)) target = `https://${target}`
      const u = new URL(target)
      params.filter((p) => p.on && p.key).forEach((p) => u.searchParams.set(p.key, p.value))

      const h: Record<string, string> = {}
      headers.filter((x) => x.on && x.key).forEach((x) => (h[x.key] = x.value))
      if (auth.type === 'bearer' && auth.token) h['Authorization'] = `Bearer ${auth.token}`
      if (auth.type === 'basic' && auth.user) h['Authorization'] = `Basic ${btoa(`${auth.user}:${auth.pass}`)}`
      if (auth.type === 'apikey' && auth.token) h[auth.keyName || 'X-API-Key'] = auth.token

      // Relayed through our own server rather than fetched from the page.
      // A browser fetch to a third-party host dies on CORS and can never
      // read Set-Cookie; the proxy has neither limitation.
      const sendsBody = !['GET', 'HEAD'].includes(useMethod)
      const r = await apiPost<ProxyResult>('/api/tools/http', {
        method: useMethod,
        url: u.toString(),
        headers: h,
        body: sendsBody && body ? body : undefined,
      })

      // The endpoint told us which verb it wants. Switch to it and resend
      // once, rather than leaving the user staring at a 405. Guarded by
      // isAutoRetry so a server that always answers 405 cannot loop us.
      if (!override?.isAutoRetry && r.status === 405) {
        const suggested = methodFromAllowHeader(r.headers, useMethod)
        if (suggested) {
          setMethod(suggested)
          toast(`Switched to ${suggested}`, {
            kind: 'info',
            body: `This endpoint does not accept ${useMethod}. Resending as ${suggested}…`,
          })
          setSending(false)
          return send({ method: suggested, isAutoRetry: true })
        }
        // 405 with no Allow header. The server has not said which verb it
        // wants, and guessing would be worse than saying so.
        toast(`${useMethod} is not allowed here`, {
          kind: 'error',
          body: 'The endpoint rejected this method but did not say which one it accepts. Try POST or GET.',
        })
      }

      // A body on a verb that cannot carry one is almost always a mistake
      // rather than an intent — worth flagging, not worth overriding.
      if (!sendsBody && body.trim() && !override?.isAutoRetry) {
        toast('Body ignored', {
          kind: 'info',
          body: `${useMethod} requests do not send a body. Switch to POST or PUT if you meant to.`,
        })
      }

      setResp({
        status: r.status,
        statusText: r.statusText || statusName(r.status),
        timeMs: r.timeMs,
        size: r.size,
        headers: r.headers,
        cookies: r.cookies,
        body: tryPrettyJson(r.body),
        truncated: r.truncated,
        redirects: r.redirects,
        finalUrl: r.finalUrl,
        resolvedTo: r.resolvedTo,
      })

      setHistory((prev) =>
        [{ id: Date.now(), method: useMethod, url: u.toString(), status: r.status, at: Date.now() }, ...prev].slice(0, 25),
      )
    } catch (err) {
      const message =
        err instanceof ApiClientError ? (err.fieldError('url') ?? err.message) : 'The request could not be sent.'
      toast('Request failed', { kind: 'error', body: message })
    } finally {
      setSending(false)
      setResTab('body')
    }
  }

  async function analyse() {
    if (!resp) return
    setAiState('thinking')

    // The findings are derived from the real response here in the browser,
    // so they exist with or without the advice service. The service only
    // rewrites them into plain language.
    const audit = auditApiResponse({
      url: resp.finalUrl,
      method,
      status: resp.status,
      headers: resp.headers,
      cookies: resp.cookies,
      body: resp.body,
    })

    let advice: Advice | null = null
    try {
      advice = await apiPost<Advice>('/api/tools/advice', {
        target: resp.finalUrl,
        kind: 'api',
        score: audit.score,
        grade: gradeFor(audit.score),
        findings: audit.findings,
        checks: audit.checks,
      })
    } catch {
      // Non-fatal: show the findings without the narrative.
    }

    setAnalysis({
      score: audit.score,
      grade: gradeFor(audit.score),
      summary: advice?.plain_summary ?? `${audit.findings.length} issue(s) found in this response.`,
      attackSurface: audit.attackSurface,
      findings: audit.findings,
      suggestions: advice?.quick_wins ?? audit.findings.map((f) => f.fix).slice(0, 5),
      checks: audit.checks.map((c) => ({ name: c.name, status: c.status })),
    })
    setAiState('done')

    toast('Analysis complete', {
      kind: 'success',
      body: `${audit.findings.length} findings · score ${audit.score}/100`,
    })
  }

  // Derived from the engine's own findings once it exists — never hardcoded.
  const flaggedKeys = useMemo(
    () => (aiState === 'done' && analysis ? analysis.findings.flatMap((f) => (f.evidence ? [f.evidence] : [])) : []),
    [aiState, analysis],
  )
  const cookies = useMemo(() => {
    // The proxy hands back each Set-Cookie header separately, so there is no
    // need to guess where one cookie ends and the next begins — splitting a
    // merged header on commas breaks on `Expires=Sat, 21 Aug ...`.
    return (resp?.cookies ?? []).map((c) => {
      const [nv, ...attrs] = c.split(';')
      const eq = (nv ?? '').indexOf('=')
      return {
        name: (eq === -1 ? nv : nv.slice(0, eq)).trim(),
        value: (eq === -1 ? '' : nv.slice(eq + 1)).trim(),
        attrs: attrs.map((a) => a.trim()).filter(Boolean),
      }
    })
  }, [resp])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
      {/* ── history rail ── */}
      <AnimatePresence initial={false}>
        {showHistory && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden shrink-0 overflow-hidden border-r border-white/8 bg-ink-950/40 xl:block"
          >
            <div className="flex h-11 items-center justify-between border-b border-white/8 px-3">
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                <History size={14} className="text-ink-300" /> History
              </span>
              <button onClick={() => setShowHistory(false)} className="rounded p-1 text-ink-300 hover:text-white" aria-label="Hide history">
                <PanelLeftClose size={15} />
              </button>
            </div>
            <ul className="p-2">
              {history.length === 0 && (
                <li className="px-2 py-6 text-center text-[12px] leading-relaxed text-ink-400">
                  Requests you send appear here for this session.
                </li>
              )}
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      setMethod(h.method)
                      setUrl(h.url)
                    }}
                    className="group flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left hover:bg-white/4"
                  >
                    <div className="flex items-center gap-2">
                      <MethodChip method={h.method} />
                      <span
                        className={cn(
                          'rounded px-1 font-mono text-[10px] ring-1',
                          statusTone(h.status),
                        )}
                      >
                        {h.status}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-ink-400">
                        {relativeTime(h.at)}
                      </span>
                    </div>
                    <span className="truncate font-mono text-[11.5px] text-ink-200 group-hover:text-white">
                      {h.url.replace(/^https?:\/\//, '')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── workspace ── */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-12 lg:overflow-hidden">
        {/* request + response column */}
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-8 lg:overflow-hidden xl:col-span-8">
          {/* url bar */}
          <div className="flex items-stretch gap-2">
            {!showHistory && (
              <button onClick={() => setShowHistory(true)} className="hidden h-11 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-300 ring-1 ring-white/8 hover:text-white xl:flex" aria-label="Show history">
                <PanelLeftOpen size={16} />
              </button>
            )}
            <div className="flex h-11 min-w-0 flex-1 items-stretch overflow-visible rounded-lg bg-ink-800 ring-1 ring-white/8 focus-within:ring-brand-500/60">
              <div ref={methodRef} className="relative">
                <button onClick={() => setMethodOpen((o) => !o)} className="flex h-full items-center gap-1.5 border-r border-white/8 px-3 font-mono text-[12.5px] font-bold" aria-haspopup="listbox" aria-expanded={methodOpen}>
                  <MethodChip method={method} />
                  <ChevronDown size={14} className="text-ink-300" />
                </button>
                <AnimatePresence>
                  {methodOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      role="listbox"
                      className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg bg-ink-800 p-1 shadow-lift ring-1 ring-white/10"
                    >
                      {METHODS.map((m) => (
                        <li key={m}>
                          <button
                            onClick={() => {
                              setMethod(m)
                              setMethodOpen(false)
                            }}
                            className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/6', m === method && 'bg-white/6')}
                          >
                            <MethodChip method={m} />
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                spellCheck={false}
                placeholder="https://api.example.com/v1/resource"
                className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] text-white outline-none placeholder:text-ink-400"
              />
            </div>
            <Button onClick={() => void send()} loading={sending} size="md" className="h-11 px-4" leftIcon={<Send size={15} />}>
              <span className="hidden sm:inline">Send</span>
            </Button>
            <Button
              onClick={analyse}
              disabled={!resp || aiState === 'thinking'}
              size="md"
              variant="outline"
              className={cn('h-11 px-3 bg-ink-800 text-white ring-0 hover:bg-ink-700', resp && aiState === 'idle' && 'shadow-glow')}
              leftIcon={<Sparkles size={15} className="text-brand-300" />}
            >
              <span className="hidden 2xl:inline">Send to AI Engine</span>
              <span className="hidden md:inline 2xl:hidden">AI Engine</span>
              <span className="md:hidden">AI</span>
            </Button>
          </div>

          {/* request panel */}
          <section className="flex min-h-[220px] flex-col rounded-xl bg-ink-800 ring-1 ring-white/8 lg:max-h-[42%]">
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-white/8 px-2">
              {(
                [
                  ['params', 'Params', params.filter((p) => p.on && p.key).length],
                  ['headers', 'Headers', headers.filter((p) => p.on && p.key).length],
                  ['body', 'Body', hasBody && body ? 1 : 0],
                  ['auth', 'Auth', auth.type !== 'none' ? 1 : 0],
                ] as const
              ).map(([k, l, n]) => (
                <button key={k} onClick={() => setReqTab(k)} className={cn('relative flex h-10 items-center gap-1.5 px-3 text-[12.5px] font-semibold transition', reqTab === k ? 'text-white' : 'text-ink-300 hover:text-white')}>
                  {l}
                  {n ? <span className="rounded bg-brand-500/20 px-1 font-mono text-[10px] text-brand-200">{n}</span> : null}
                  {reqTab === k && <motion.span layoutId="req-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-brand-400" />}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1 pr-1">
                <button onClick={() => toast('Collections are not available yet', { kind: 'info' })} className="rounded p-1.5 text-ink-300 hover:bg-white/5 hover:text-white" aria-label="Save request" title="Save">
                  <Save size={14} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {reqTab === 'params' && <KVEditor rows={params} onChange={setParams} keyPlaceholder="param" />}
              {reqTab === 'headers' && <KVEditor rows={headers} onChange={setHeaders} keyPlaceholder="Header-Name" />}
              {reqTab === 'body' &&
                (hasBody ? (
                  <div className="relative">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      spellCheck={false}
                      rows={8}
                      className="w-full resize-y rounded-lg bg-ink-900 p-3 font-mono text-[12.5px] leading-relaxed text-ink-100 outline-none ring-1 ring-white/8 focus:ring-brand-500/50"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button onClick={() => setBody(tryPrettyJson(body))} className="rounded bg-ink-800 px-2 py-1 font-mono text-[10.5px] text-ink-200 ring-1 ring-white/10 hover:text-white">
                        beautify
                      </button>
                      <span className="rounded bg-ink-800 px-2 py-1 font-mono text-[10.5px] text-ink-300 ring-1 ring-white/10">JSON</span>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[12.5px] text-ink-300">{method} requests don't carry a body.</p>
                ))}
              {reqTab === 'auth' && (
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <div className="space-y-1">
                    {(
                      [
                        ['none', 'No auth'],
                        ['bearer', 'Bearer token'],
                        ['basic', 'Basic'],
                        ['apikey', 'API key'],
                      ] as const
                    ).map(([k, l]) => (
                      <button key={k} onClick={() => setAuth((a) => ({ ...a, type: k }))} className={cn('flex w-full items-center rounded-md px-3 py-2 text-left text-[12.5px] font-semibold', auth.type === k ? 'bg-white/8 text-white' : 'text-ink-300 hover:bg-white/4 hover:text-white')}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {auth.type === 'none' && <p className="text-[12.5px] text-ink-300">This request will be sent without credentials.</p>}
                    {auth.type === 'bearer' && <AuthInput label="Token" value={auth.token} onChange={(v) => setAuth((a) => ({ ...a, token: v }))} placeholder="eyJhbGciOi…" secret />}
                    {auth.type === 'basic' && (
                      <>
                        <AuthInput label="Username" value={auth.user} onChange={(v) => setAuth((a) => ({ ...a, user: v }))} />
                        <AuthInput label="Password" value={auth.pass} onChange={(v) => setAuth((a) => ({ ...a, pass: v }))} secret />
                      </>
                    )}
                    {auth.type === 'apikey' && (
                      <>
                        <AuthInput label="Header name" value={auth.keyName} onChange={(v) => setAuth((a) => ({ ...a, keyName: v }))} />
                        <AuthInput label="Key" value={auth.token} onChange={(v) => setAuth((a) => ({ ...a, token: v }))} secret />
                      </>
                    )}
                    <p className="font-mono text-[10.5px] text-ink-400">Credentials are kept in this tab only and can be redacted before AI analysis.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* response panel */}
          <section className="flex min-h-[260px] flex-1 flex-col rounded-xl bg-ink-800 ring-1 ring-white/8 lg:min-h-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-300">Response</span>
              <AnimatePresence>
                {resp && (
                  <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-200">
                    <span className={cn('rounded px-1.5 py-0.5 ring-1', statusTone(resp.status))}>
                      {resp.status} {resp.statusText}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {resp.timeMs} ms
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive size={11} /> {formatBytes(resp.size)}
                    </span>
                    {resp.redirects.length > 0 && (
                      <span
                        className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300 ring-1 ring-sky-500/30"
                        title={[...resp.redirects, resp.finalUrl].join('  →  ')}
                      >
                        {resp.redirects.length} redirect{resp.redirects.length === 1 ? '' : 's'}
                      </span>
                    )}
                    {resp.truncated && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300 ring-1 ring-amber-500/30" title="Response was larger than 2 MB and was cut off.">
                        truncated
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="ml-auto flex items-center gap-1">
                {(['body', 'headers', 'cookies'] as const).map((k) => (
                  <button key={k} onClick={() => setResTab(k)} className={cn('rounded-md px-2.5 py-1 text-[12px] font-semibold capitalize transition', resTab === k ? 'bg-white/8 text-white' : 'text-ink-300 hover:text-white')}>
                    {k}
                    {k === 'headers' && resp && <span className="ml-1 font-mono text-[10px] text-ink-400">{Object.keys(resp.headers).length}</span>}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-white/10" />
                <button onClick={() => setWrap((w) => !w)} className={cn('rounded p-1.5', wrap ? 'text-brand-300' : 'text-ink-300 hover:text-white')} aria-label="Toggle wrap" title="Wrap lines">
                  <WrapText size={14} />
                </button>
                <CopyBtn text={resp?.body ?? ''} />
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-auto p-3">
              {!resp && !sending && (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                  <p className="text-[13px] text-ink-300">
                    Hit <kbd className="rounded bg-white/8 px-1.5 font-mono text-[11px]">Send</kbd> or press <kbd className="rounded bg-white/8 px-1.5 font-mono text-[11px]">⌘/Ctrl + Enter</kbd>
                  </p>
                </div>
              )}
              {sending && (
                <div className="space-y-2">
                  {[85, 60, 72, 40, 66, 30].map((w, i) => (
                    <div key={i} className="h-3 rounded bg-white/5 shimmer" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
              {resp?.truncated && resTab === 'body' && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-[12px] text-amber-100 ring-1 ring-amber-500/25">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                  Response exceeded 2 MB and was cut off. Status, headers and timing are complete.
                </div>
              )}
              {resp && resTab === 'body' && <JsonView text={resp.body} highlightKeys={flaggedKeys} className={cn(!wrap && 'whitespace-pre')} />}
              {resp && resTab === 'headers' && (
                <table className="w-full text-left font-mono text-[12px]">
                  <tbody className="divide-y divide-white/6">
                    {Object.entries(resp.headers).map(([k, v]) => (
                      <tr key={k} className="align-top">
                        <td className="w-[38%] py-1.5 pr-3 text-brand-300">{k}</td>
                        <td className="break-all py-1.5 text-ink-100">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {resp && resTab === 'cookies' && (
                cookies.length ? (
                  <ul className="space-y-2">
                    {cookies.map((c) => (
                      <li key={c.name} className="rounded-lg bg-ink-900/70 p-3 font-mono text-[12px] ring-1 ring-white/8">
                        <div>
                          <span className="text-brand-300">{c.name}</span>
                          <span className="text-ink-400">=</span>
                          <span className="text-ink-100">{c.value}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {['HttpOnly', 'Secure', 'SameSite'].map((f) => {
                            const has = c.attrs.some((a) => a.toLowerCase().startsWith(f.toLowerCase()))
                            return (
                              <span key={f} className={cn('rounded px-1.5 py-0.5 text-[10.5px] ring-1', has ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' : 'bg-red-500/15 text-red-300 ring-red-500/30')}>
                                {has ? '✓' : '✗'} {f}
                              </span>
                            )
                          })}
                          {c.attrs.map((a) => (
                            <span key={a} className="rounded bg-white/5 px-1.5 py-0.5 text-[10.5px] text-ink-200">
                              {a}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12.5px] text-ink-300">No cookies set by this response.</p>
                )
              )}
            </div>
          </section>
        </div>

        {/* AI column */}
        <AiPanel
          state={aiState}
          analysis={analysis}
          onAnalyse={() => void analyse()}
          onExport={() => setExportOpen(true)}
          canAnalyse={!!resp}
          className="min-h-[360px] lg:col-span-4 lg:min-h-0 xl:col-span-4"
        />
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`${method} ${url}`}
        target={`${method} ${url}`}
        reportId="—"
      />
    </div>
  )
}

function AuthInput({ label, value, onChange, placeholder, secret }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-ink-300">{label}</span>
      <input
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="h-9 w-full rounded-md bg-ink-900 px-3 font-mono text-[12.5px] text-white outline-none ring-1 ring-white/8 placeholder:text-ink-400 focus:ring-brand-500/50"
      />
    </label>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={async () => {
        if (!text) return
        try {
          await navigator.clipboard.writeText(text)
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        } catch {
          /* ignore */
        }
      }}
      className="rounded p-1.5 text-ink-300 hover:text-white"
      aria-label="Copy response"
      title="Copy"
    >
      {ok ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
    </button>
  )
}

function statusName(s: number) {
  const m: Record<number, string> = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved', 302: 'Found', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 429: 'Too Many Requests', 500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable' }
  return m[s] ?? ''
}

/** Compact "how long ago" for the session history rail. */
function relativeTime(at: number): string {
  const secs = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  return `${Math.floor(secs / 3600)}h`
}
