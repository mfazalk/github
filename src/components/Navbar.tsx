import React from 'react';
import { TabType, RateLimitData } from '../types/github';
import { Terminal, Shield, KeyRound, GitPullRequest, Radio, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  rateLimit: RateLimitData | null;
  hasToken: boolean;
  onOpenTokenModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  rateLimit,
  hasToken,
  onOpenTokenModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/60 text-sky-400">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            OctoTest
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg bg-slate-900/80 p-1 border border-slate-800/80">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>API Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Webhook Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'actions'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Actions CI Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('pr')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'pr'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>PR & Branch Gates</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tokens'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Token & Quota</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Quota Peek */}
        <div className="flex items-center gap-3">
          {rateLimit && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Rate Limit</span>
              <span className="font-mono tabular-nums font-semibold text-slate-200">
                {rateLimit.remaining}/{rateLimit.limit}
              </span>
            </div>
          )}

          <button
            onClick={onOpenTokenModal}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              hasToken
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{hasToken ? 'Token Active' : 'Configure PAT'}</span>
          </button>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/80 px-2 py-1.5 gap-1">
        <button
          onClick={() => setActiveTab('api')}
          className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'api' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
          }`}
        >
          API
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'webhooks' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
          }`}
        >
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'actions' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
          }`}
        >
          CI Actions
        </button>
        <button
          onClick={() => setActiveTab('pr')}
          className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'pr' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
          }`}
        >
          PR Gates
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-2.5 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'tokens' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
          }`}
        >
          Tokens
        </button>
      </div>
    </header>
  );
};
