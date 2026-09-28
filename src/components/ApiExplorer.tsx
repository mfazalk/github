import React, { useState, useEffect } from 'react';
import { API_TEMPLATES, POPULAR_REPOS, executeGitHubRequest, parseRateLimits } from '../services/githubApi';
import { ApiEndpointTemplate, ApiResponseData, RateLimitData } from '../types/github';
import { Play, Copy, Check, Terminal, ExternalLink, RefreshCw, ChevronRight, Layers } from 'lucide-react';

interface ApiExplorerProps {
  token: string;
  onRateLimitUpdate: (rl: RateLimitData) => void;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({ token, onRateLimitUpdate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ApiEndpointTemplate>(API_TEMPLATES[0]);
  const [owner, setOwner] = useState('facebook');
  const [repo, setRepo] = useState('react');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'>('GET');
  const [customPath, setCustomPath] = useState('/repos/facebook/react');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponseData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeResTab, setActiveResTab] = useState<'body' | 'headers' | 'curl'>('body');
  const [jsonFilter, setJsonFilter] = useState('');

  // Update path when template or owner/repo changes
  useEffect(() => {
    let path = selectedTemplate.path;
    path = path.replace('{owner}', owner).replace('{repo}', repo);
    setCustomPath(path);
    setMethod(selectedTemplate.method);
    if (selectedTemplate.defaultBody) {
      setRequestBody(selectedTemplate.defaultBody);
    } else {
      setRequestBody('');
    }
  }, [selectedTemplate, owner, repo]);

  const handleSelectPopularRepo = (popular: { owner: string; repo: string }) => {
    setOwner(popular.owner);
    setRepo(popular.repo);
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await executeGitHubRequest(method, customPath, token, {}, requestBody);
      setResponse(res);
      const parsedRl = parseRateLimits(res.headers);
      if (parsedRl) {
        onRateLimitUpdate(parsedRl);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load request
  useEffect(() => {
    if (!response) {
      handleExecute();
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCurlCommand = () => {
    const fullUrl = `https://api.github.com${customPath.startsWith('/') ? '' : '/'}${customPath}`;
    let cmd = `curl -X ${method} "${fullUrl}" \\\n  -H "Accept: application/vnd.github+json" \\\n  -H "X-GitHub-Api-Version: 2022-11-28"`;
    if (token) {
      cmd += ` \\\n  -H "Authorization: Bearer ${token.substring(0, 8)}..."`;
    }
    if (requestBody && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      cmd += ` \\\n  -d '${requestBody.replace(/'/g, "'\\''")}'`;
    }
    return cmd;
  };

  // Filter or format response JSON
  const formattedJson = React.useMemo(() => {
    if (!response || !response.data) return '';
    try {
      if (jsonFilter.trim()) {
        const query = jsonFilter.toLowerCase();
        if (Array.isArray(response.data)) {
          const filtered = response.data.filter((item: any) =>
            JSON.stringify(item).toLowerCase().includes(query)
          );
          return JSON.stringify(filtered, null, 2);
        }
      }
      return JSON.stringify(response.data, null, 2);
    } catch {
      return String(response.data);
    }
  }, [response, jsonFilter]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Endpoints & Target Repo */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Target Repository Selection */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-300">Target Repository</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Quick switch</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Owner / Org</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. facebook"
                className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Repo Name</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. react"
                className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_REPOS.map((pop) => (
              <button
                key={pop.name}
                onClick={() => handleSelectPopularRepo(pop)}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  owner === pop.owner && repo === pop.repo
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {pop.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Endpoint Templates Catalog */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-300">Endpoint Catalog</span>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">{API_TEMPLATES.length} routes</span>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {API_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-sky-500/50 bg-sky-500/10 text-white'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-semibold text-sky-400">
                        {tmpl.method}
                      </span>
                      <span className="font-medium text-slate-200 truncate">{tmpl.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-sky-400 translate-x-0.5' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Console: Request & Response Inspector */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Request Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                aria-label="HTTP Request Method"
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-semibold text-sky-400 focus:border-sky-500 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                https://api.github.com
              </div>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/repos/{owner}/{repo}"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 pl-44 pr-3 py-2 text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>{loading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Request payload editor (if POST/PATCH) */}
          {(method === 'POST' || method === 'PATCH' || method === 'PUT') && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Request JSON Body</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={4}
                className="w-full font-mono text-xs rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-200 focus:border-sky-500 focus:outline-none"
                placeholder='{\n  "title": "Bug report",\n  "body": "Issue details"\n}'
              />
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="truncate">{selectedTemplate.description}</span>
            <span className="font-mono shrink-0">v2022-11-28</span>
          </div>
        </div>

        {/* Response Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          
          {/* Response Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-200">Response</span>
              {response && (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : response.status >= 400 && response.status < 500
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : response.status === 0
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {response.status === 0 ? 'Network Error' : `${response.status} ${response.statusText}`}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                    {response.durationMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Segmented response view tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveResTab('body')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  activeResTab === 'body'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON Body
              </button>
              <button
                onClick={() => setActiveResTab('headers')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  activeResTab === 'headers'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Headers ({response ? Object.keys(response.headers).length : 0})
              </button>
              <button
                onClick={() => setActiveResTab('curl')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  activeResTab === 'curl'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                cURL
              </button>
            </div>
          </div>

          {/* Response Content Viewport */}
          <div className="p-4">
            {activeResTab === 'body' && (
              <div>
                {/* Search filter within JSON */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="text"
                      value={jsonFilter}
                      onChange={(e) => setJsonFilter(e.target.value)}
                      placeholder="Filter response JSON keys/values..."
                      className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleCopy(formattedJson)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="font-mono text-xs bg-slate-950 p-4 rounded-lg border border-slate-800/80 overflow-x-auto max-h-[500px] text-slate-300 leading-relaxed">
                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                      <span>Fetching GitHub REST API endpoint...</span>
                    </div>
                  ) : response?.error ? (
                    <div className="text-rose-400 p-2">
                      <p className="font-bold mb-1">Request Failed</p>
                      <p className="text-xs">{response.error}</p>
                    </div>
                  ) : (
                    formattedJson || '// No response received yet'
                  )}
                </pre>
              </div>
            )}

            {activeResTab === 'headers' && (
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(response?.headers || {}, null, 2))}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Headers'}</span>
                  </button>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Header Key</th>
                        <th className="py-2 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {response && response.headers && Object.keys(response.headers).length > 0 ? (
                        Object.entries(response.headers).map(([key, val]) => (
                          <tr key={key} className="hover:bg-slate-900/40">
                            <td className="py-1.5 px-3 text-sky-400 font-medium whitespace-nowrap">{key}</td>
                            <td className="py-1.5 px-3 text-slate-300 break-all">{val}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-slate-500">
                            No response headers available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeResTab === 'curl' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Run directly from your terminal</span>
                  <button
                    onClick={() => handleCopy(generateCurlCommand())}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs bg-slate-950 p-4 rounded-lg border border-slate-800/80 overflow-x-auto text-sky-300">
                  {generateCurlCommand()}
                </pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
