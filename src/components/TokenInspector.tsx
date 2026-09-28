import React, { useState, useEffect } from 'react';
import { RateLimitData } from '../types/github';
import { executeGitHubRequest, parseRateLimits } from '../services/githubApi';
import { Shield, Key, RefreshCw, CheckCircle2, AlertCircle, Clock, ExternalLink, Trash2 } from 'lucide-react';

interface TokenInspectorProps {
  token: string;
  onSaveToken: (tok: string) => void;
  rateLimit: RateLimitData | null;
  onRateLimitUpdate: (rl: RateLimitData) => void;
}

export const TokenInspector: React.FC<TokenInspectorProps> = ({
  token,
  onSaveToken,
  rateLimit,
  onRateLimitUpdate
}) => {
  const [inputVal, setInputVal] = useState(token);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    user?: any;
    scopes?: string[];
    rateLimit?: any;
    error?: string;
  } | null>(null);

  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Update reset timer countdown
  useEffect(() => {
    if (!rateLimit?.reset) return;

    const updateCountdown = () => {
      const diffSec = Math.max(0, rateLimit.reset - Math.floor(Date.now() / 1000));
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setTimeUntilReset(`${mins}m ${secs.toString().padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimit]);

  const handleTestToken = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test against /user endpoint
      const userRes = await executeGitHubRequest('GET', '/user', inputVal);
      const rlRes = await executeGitHubRequest('GET', '/rate_limit', inputVal);

      if (userRes.status === 200) {
        const scopesHeader = userRes.headers['x-oauth-scopes'] || '';
        const scopes = scopesHeader.split(',').map((s) => s.trim()).filter(Boolean);

        const parsedRl = parseRateLimits(rlRes.headers) || parseRateLimits(userRes.headers);
        if (parsedRl) {
          onRateLimitUpdate(parsedRl);
        }

        setTestResult({
          success: true,
          user: userRes.data,
          scopes,
          rateLimit: rlRes.data
        });
        onSaveToken(inputVal);
      } else {
        setTestResult({
          success: false,
          error: userRes.data?.message || userRes.statusText || 'Invalid token or insufficient permissions.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network request failed.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearToken = () => {
    setInputVal('');
    onSaveToken('');
    setTestResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Token Configuration */}
      <div className="lg:col-span-5 space-y-4">
        
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-semibold text-slate-200">Personal Access Token (PAT)</span>
            </div>
            {token && (
              <button
                onClick={handleClearToken}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              GitHub Token (Classic `ghp_...` or Fine-Grained `github_pat_...`)
            </label>
            <input
              type="password"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestToken}
              disabled={testing || !inputVal.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              <span>{testing ? 'Auditing Token...' : 'Verify Token & Scopes'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Security Guarantee</span>
              <span className="text-[10px] text-emerald-400 font-mono">CLIENT-ONLY</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your token is stored strictly in your browser&apos;s local storage and dispatched directly to
              <code className="text-slate-300 ml-1">https://api.github.com</code> via HTTPS. It is never logged or sent to any intermediary server.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Need a token? Generate one in{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
            >
              GitHub Token Settings <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

      </div>

      {/* Main Column: Rate Limits & Token Audit Card */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Rate Limit Status Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
            <span className="text-xs font-semibold text-slate-200">GitHub Rate Limit Quota</span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Resets in: <span className="font-mono tabular-nums text-slate-200 font-medium">{timeUntilReset || '--'}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block mb-1">Core REST Limit</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl font-bold text-sky-400 tabular-nums">
                  {rateLimit ? rateLimit.remaining : 60}
                </span>
                <span className="text-xs text-slate-500">/ {rateLimit ? rateLimit.limit : 60}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {token ? 'Authenticated (5,000/hr)' : 'Anonymous tier (60/hr)'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block mb-1">Search API Limit</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl font-bold text-emerald-400 tabular-nums">
                  {rateLimit ? (token ? '30' : '10') : '10'}
                </span>
                <span className="text-xs text-slate-500">/ {token ? '30' : '10'}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Per minute window</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-400 block mb-1">GraphQL API Limit</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl font-bold text-purple-400 tabular-nums">
                  {token ? '5,000' : '0'}
                </span>
                <span className="text-xs text-slate-500">/ hr</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {token ? 'Token available' : 'Requires authentication'}
              </span>
            </div>
          </div>

          {/* Rate Limit Visual Progress Bar */}
          {rateLimit && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Usage Utilization</span>
                <span className="tabular-nums">
                  {Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100)}% consumed
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(3, ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Verification Result Output */}
        {testResult && (
          <div
            className={`rounded-xl border p-5 ${
              testResult.success
                ? 'border-emerald-500/30 bg-slate-900/60'
                : 'border-rose-500/30 bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              )}
              <span className="text-sm font-semibold text-slate-200">
                {testResult.success ? 'Token Verified Successfully' : 'Authentication Failed'}
              </span>
            </div>

            {testResult.success && testResult.user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950">
                  <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
                    {testResult.user.login ? testResult.user.login.slice(0, 2).toUpperCase() : 'GH'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{testResult.user.name || testResult.user.login}</p>
                    <p className="text-[11px] font-mono text-slate-400">@{testResult.user.login}</p>
                  </div>
                  <div className="ml-auto text-right text-xs text-slate-400 font-mono">
                    <span>{testResult.user.public_repos} repos</span>
                  </div>
                </div>

                {/* Scopes badge list */}
                <div>
                  <span className="text-xs font-medium text-slate-300 block mb-2">
                    Granted OAuth / PAT Scopes ({testResult.scopes?.length || 0})
                  </span>
                  {testResult.scopes && testResult.scopes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {testResult.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Fine-Grained token with custom repository permissions or read-only public scope.
                    </span>
                  )}
                </div>
              </div>
            )}

            {!testResult.success && (
              <p className="text-xs text-rose-300 font-mono">{testResult.error}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
