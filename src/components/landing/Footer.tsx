import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'

const cols = [
  { h: 'Product', items: [['API tester', '/app/api-tester'], ['AI Engine', '/#console'], ['Website scanner', '/#website'], ['Reports', '/app/reports'], ['Pricing', '/#pricing']] },
  { h: 'Resources', items: [['Help center', '/help'], ['Security docs', '/help'], ['OWASP API Top-10', '/help'], ['Changelog', '/help']] },
  { h: 'Company', items: [['About', '/help'], ['Responsible use', '/help'], ['Privacy', '/help'], ['Terms', '/help']] },
]

export default function Footer() {
  return (
    <footer className="border-t border-ink-900/8 bg-white/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-500">
              Digital Guard System — a Postman-style workspace with an AI security analyst built in. Send, analyse,
              fix, export.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-ink-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <h4 className="eyebrow mb-4">{c.h}</h4>
              <ul className="space-y-2.5">
                {c.items.map(([label, to]) => (
                  <li key={label}>
                    {to.startsWith('/#') ? (
                      <a href={to} className="text-[13.5px] text-ink-700 hover:text-brand-600">{label}</a>
                    ) : (
                      <Link to={to} className="text-[13.5px] text-ink-700 hover:text-brand-600">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink-900/8 pt-6 font-mono text-[11.5px] text-ink-400 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} DGS · Digital Guard System. Built by Eng. Ali Huzaifa.</span>
          <span>Only scan what you own or are authorised to test.</span>
        </div>
      </div>
    </footer>
  )
}
