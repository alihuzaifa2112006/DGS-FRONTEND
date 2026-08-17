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
    <div className="w-full min-h-screen bg-transparent text-white p-6 md:p-10 font-sans">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          SOC AI Audit <span className="text-[#9B26B6]">Help Center</span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          System documentation, AI suggestion guides, aur SOC compliance guidelines ke liye yahan search karein.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <input
            type="text"
            placeholder="Search docs, audit rules, AI fixes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3.5 px-5 pl-12 rounded-xl bg-[#262626] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#9B26B6] focus:ring-1 focus:ring-[#9B26B6] transition-all"
          />
          <svg
            className="w-5 h-5 absolute left-4 top-4 text-gray-400"
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
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Quick Navigation
          </h2>

          <button
            onClick={() => setActiveTab('getting-started')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'getting-started'
                ? 'bg-[#9B26B6] text-white'
                : 'text-gray-300 hover:bg-[#262626]'
            }`}
          >
            🚀 Getting Started
          </button>

          <button
            onClick={() => setActiveTab('ai-engine')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ai-engine'
                ? 'bg-[#9B26B6] text-white'
                : 'text-gray-300 hover:bg-[#262626]'
            }`}
          >
            🤖 AI Audit & Suggestions
          </button>

          <button
            onClick={() => setActiveTab('soc-compliance')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'soc-compliance'
                ? 'bg-[#9B26B6] text-white'
                : 'text-gray-300 hover:bg-[#262626]'
            }`}
          >
            🛡️ SOC Compliance
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'faqs'
                ? 'bg-[#9B26B6] text-white'
                : 'text-gray-300 hover:bg-[#262626]'
            }`}
          >
            ❓ FAQs
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Quick Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-[#262626] border border-gray-800 hover:border-[#9B26B6]/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#9B26B6]/20 text-[#9B26B6] flex items-center justify-center font-bold mb-3">
                01
              </div>
              <h3 className="font-semibold text-lg mb-1">Audit Scans</h3>
              <p className="text-sm text-gray-400">Automated vulnerability analysis and risk detection.</p>
            </div>

            <div className="p-5 rounded-xl bg-[#262626] border border-gray-800 hover:border-[#9B26B6]/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#9B26B6]/20 text-[#9B26B6] flex items-center justify-center font-bold mb-3">
                02
              </div>
              <h3 className="font-semibold text-lg mb-1">AI Remediation</h3>
              <p className="text-sm text-gray-400">Smart contextual fixes for detected security flaws.</p>
            </div>

            <div className="p-5 rounded-xl bg-[#262626] border border-gray-800 hover:border-[#9B26B6]/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#9B26B6]/20 text-[#9B26B6] flex items-center justify-center font-bold mb-3">
                03
              </div>
              <h3 className="font-semibold text-lg mb-1">SOC Reports</h3>
              <p className="text-sm text-gray-400">Audit-ready documentation for SOC 2 Type II framework.</p>
            </div>
          </div>

          {/* Detailed Content / FAQ Section */}
          <div className="bg-[#262626] p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-3">
              {activeTab === 'getting-started' && 'Getting Started Guide'}
              {activeTab === 'ai-engine' && 'Understanding AI Audit & Suggestions'}
              {activeTab === 'soc-compliance' && 'SOC Compliance Overview'}
              {activeTab === 'faqs' && 'Frequently Asked Questions'}
            </h2>

            <div className="space-y-4">
              {faqs
                .filter((item) => item.question.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((faq, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#1A1A1A] border border-gray-800">
                    <h4 className="font-semibold text-base text-[#9B26B6] mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Support / Contact Banner */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-[#262626] to-[#9B26B6]/30 border border-[#9B26B6]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Still need support?</h3>
              <p className="text-sm text-gray-300">Connect with our Security Operations team for custom integrations.</p>
            </div>
            <button className="px-5 py-2.5 rounded-lg bg-[#9B26B6] text-white text-sm font-semibold hover:bg-[#831fa0] transition-colors whitespace-nowrap">
              Contact SOC Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;