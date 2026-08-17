import React, { useState } from 'react';

const Help = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: "AI Audit Scanner application ko kaise analyze karta hai?",
      answer: "AI Audit engine aapke application endpoints, code repository, aur runtime logs ko scan karke security vulnerabilities, compliance breaches, aur privacy risks identify karta hai.",
      category: "audit"
    },
    {
      question: "AI Suggestions ko implement karne ka sahi tareeqaa kya hai?",
      answer: "Suggestions tab mein har item ke sath impact score aur direct code fix/remediation step hota hai. Aap usse 1-click auto-apply kar sakte hain ya manual implementation steps follow kar sakte hain.",
      category: "suggestions"
    },
    {
      question: "SOC Compliance Reports kis format mein export hoti hain?",
      answer: "Aap SOC 2 Type II aur ISO 27001 audit reports ko PDF, JSON, aur CSV formats mein export kar sakte hain.",
      category: "reporting"
    }
  ];

  return (
    <div className="w-full min-h-screen text-slate-900 p-6 md:p-12 font-sans">
      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <span className="text-xs font-semibold tracking-widest text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
          Help & Support Center
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mt-4 mb-3">
          How can we help you?
        </h1>
        <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
          System documentation, AI suggestion guides, aur SOC compliance guidelines ke liye search karein.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search documentation, audit rules, AI fixes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-4 px-5 pl-12 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all text-sm md:text-base"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-1.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">
            Documentation
          </h2>

          <button
            onClick={() => setActiveTab('getting-started')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'getting-started'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            🚀 Getting Started
          </button>

          <button
            onClick={() => setActiveTab('ai-engine')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ai-engine'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            🤖 AI Audit & Suggestions
          </button>

          <button
            onClick={() => setActiveTab('soc-compliance')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'soc-compliance'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            🛡️ SOC Compliance
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'faqs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            ❓ FAQs
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Quick Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Audit Scans</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Automated vulnerability analysis and risk detection.</p>
            </div>

            <div className="p-5 rounded-xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">AI Remediation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Smart contextual fixes for detected security flaws.</p>
            </div>

            <div className="p-5 rounded-xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">SOC Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Audit-ready documentation for SOC 2 Type II framework.</p>
            </div>
          </div>

          {/* Detailed Content / FAQ Section */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold mb-5 text-slate-900 border-b border-slate-100 pb-3">
              {activeTab === 'getting-started' && 'Getting Started Guide'}
              {activeTab === 'ai-engine' && 'Understanding AI Audit & Suggestions'}
              {activeTab === 'soc-compliance' && 'SOC Compliance Overview'}
              {activeTab === 'faqs' && 'Frequently Asked Questions'}
            </h2>

            <div className="space-y-4">
              {faqs
                .filter((item) => item.question.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((faq, index) => (
                  <div key={index} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 transition-all hover:bg-slate-50">
                    <h4 className="font-semibold text-sm text-purple-900 mb-1.5">
                      {faq.question}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Support / Contact Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base">Still need support?</h3>
              <p className="text-xs text-purple-200 mt-0.5">Connect with our Security Operations team for custom integrations.</p>
            </div>
            <button className="px-5 py-2.5 rounded-lg bg-white text-purple-950 text-xs md:text-sm font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap shadow-sm">
              Contact SOC Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;