import React, { useState, useEffect } from 'react';
import { TabType, RateLimitData } from './types/github';
import { Navbar } from './components/Navbar';
import { ApiExplorer } from './components/ApiExplorer';
import { WebhookSimulator } from './components/WebhookSimulator';
import { ActionsValidator } from './components/ActionsValidator';
import { PrPlayground } from './components/PrPlayground';
import { TokenInspector } from './components/TokenInspector';
import { executeGitHubRequest, parseRateLimits } from './services/githubApi';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('api');
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('octotest_github_pat') || '';
  });
  const [rateLimit, setRateLimit] = useState<RateLimitData | null>(null);

  // Load initial rate limit from GitHub API
  useEffect(() => {
    executeGitHubRequest('GET', '/rate_limit', token).then((res) => {
      const rl = parseRateLimits(res.headers);
      if (rl) {
        setRateLimit(rl);
      }
    });
  }, [token]);

  const handleSaveToken = (newToken: string) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('octotest_github_pat', newToken);
    } else {
      localStorage.removeItem('octotest_github_pat');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar adheres to Top Bar Contract: 3 zones */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rateLimit={rateLimit}
        hasToken={Boolean(token)}
        onOpenTokenModal={() => setActiveTab('tokens')}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Workspace Sub-header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeTab === 'api' && 'GitHub REST API Testbench'}
              {activeTab === 'webhooks' && 'Webhook Event Simulator & HMAC Verifier'}
              {activeTab === 'actions' && 'GitHub Actions CI/CD Validator & Runner'}
              {activeTab === 'pr' && 'Pull Request & Branch Protection Gates'}
              {activeTab === 'tokens' && 'Token Permissions & Rate Limit Auditor'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {activeTab === 'api' && 'Execute live requests against the GitHub REST v2022-11-28 API with response header telemetry.'}
              {activeTab === 'webhooks' && 'Generate cryptographic HMAC-SHA256 signatures and dispatch realistic webhook payloads.'}
              {activeTab === 'actions' && 'Validate GitHub Actions workflow YAML schemas and execute step-by-step CI simulations.'}
              {activeTab === 'pr' && 'Test branch protection policies, status check matrix gates, CODEOWNERS, and git diffs.'}
              {activeTab === 'tokens' && 'Audit Personal Access Token scopes and monitor real-time rate limit reset countdowns.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-slate-500">API Target:</span>
            <span className="font-mono text-sky-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
              api.github.com
            </span>
          </div>
        </div>

        {/* Tab Viewports */}
        {activeTab === 'api' && (
          <ApiExplorer token={token} onRateLimitUpdate={setRateLimit} />
        )}

        {activeTab === 'webhooks' && (
          <WebhookSimulator />
        )}

        {activeTab === 'actions' && (
          <ActionsValidator />
        )}

        {activeTab === 'pr' && (
          <PrPlayground />
        )}

        {activeTab === 'tokens' && (
          <TokenInspector
            token={token}
            onSaveToken={handleSaveToken}
            rateLimit={rateLimit}
            onRateLimitUpdate={setRateLimit}
          />
        )}
      </main>

      {/* Clean Footer adhering to design rules (no buzzword telemetry tickers) */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>OctoTest developer workbench &bull; Powered by official GitHub REST & Webhook specifications</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub REST Docs
            </a>
            <a
              href="https://docs.github.com/en/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Webhooks Guide
            </a>
            <a
              href="https://docs.github.com/en/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Actions Syntax
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
