import React, { useState } from 'react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 font-sans relative z-50 sticky top-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <div className="flex items-center space-x-3">
          {/* Rotating Glow Border Container */}
          <div className="flex items-center space-x-3">
            {/* Glowing Circle Wrapper */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">

              {/* Background Track Circle */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="5"
                />
              </svg>

              {/* Rotating Glow Arc Line */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9B26B6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#9B26B6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#purpleGlow)"
                  strokeWidth="6"
                  strokeDasharray="140 140"
                  strokeLinecap="round"
                  className="animate-glow-border"
                />
              </svg>

              {/* Exact Fitting Logo Image */}
              <img
                src="/Images/logo.png"
                alt="SOC AI Logo"
                className="w-100 h-auto object-cover rounded-full relative z-10"
              />
            </div>
          </div>
        </div>

        {/* Unique Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider text-slate-700">

          {/* AI Platform Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('platform')}
              className="flex items-center space-x-1 hover:text-purple-600 transition-colors py-2 focus:outline-none"
            >
              <span>AI Platform</span>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeDropdown === 'platform' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === 'platform' && (
              <div className="absolute top-full -left-4 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-3 mt-2 grid gap-2 lowercase normal-case">
                <a href="#scanners" className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-sm font-semibold text-slate-900">Vulnerability Scanners</div>
                  <div className="text-xs text-slate-500">Continuous endpoint & repo audits</div>
                </a>
                <a href="#remediation" className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-sm font-semibold text-slate-900">1-Click Auto Fixes</div>
                  <div className="text-xs text-slate-500">AI-generated pull requests & patches</div>
                </a>
              </div>
            )}
          </div>

          {/* Compliance Rules */}
          <a href="#compliance" className="hover:text-purple-600 transition-colors py-2">
            SOC 2 & ISO Framework
          </a>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('solutions')}
              className="flex items-center space-x-1 hover:text-purple-600 transition-colors py-2 focus:outline-none"
            >
              <span>Solutions</span>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === 'solutions' && (
              <div className="absolute top-full -left-4 w-60 bg-white border border-slate-200 shadow-xl rounded-xl p-3 mt-2 grid gap-2 lowercase normal-case">
                <a href="#startups" className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-sm font-semibold text-slate-900">For Tech Startups</div>
                </a>
                <a href="#enterprise" className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-sm font-semibold text-slate-900">For Enterprise Audits</div>
                </a>
              </div>
            )}
          </div>

          {/* Pricing */}
          <a href="#pricing" className="hover:text-purple-600 transition-colors py-2">
            Pricing
          </a>

          {/* Security Docs */}
          <a href="#docs" className="hover:text-purple-600 transition-colors py-2">
            Security Docs
          </a>
        </div>

     
        <div className="hidden lg:flex items-center space-x-3">
        
          <button className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-purple-900 rounded-lg shadow-sm transition-all">
            Launch Console
          </button>
        </div>

        {/* Mobile / Tablet Hamburger Toggle */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-purple-600 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-slate-800">
            <a href="#scanners" className="py-2 border-b border-slate-100 hover:text-purple-600">
              AI Platform & Scanners
            </a>
            <a href="#compliance" className="py-2 border-b border-slate-100 hover:text-purple-600">
              SOC 2 & ISO Compliance
            </a>
            <a href="#solutions" className="py-2 border-b border-slate-100 hover:text-purple-600">
              Solutions
            </a>
            <a href="#pricing" className="py-2 border-b border-slate-100 hover:text-purple-600">
              Pricing Plans
            </a>
            <a href="#docs" className="py-2 border-b border-slate-100 hover:text-purple-600">
              Security Documentation
            </a>
          </div>

          <div className="pt-3 flex flex-col space-y-2">
            <button className="w-full py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              Log In
            </button>
            <button className="w-full py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              Book Live Audit
            </button>
            <button className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-purple-900 transition-colors shadow-sm">
              Launch Console
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;