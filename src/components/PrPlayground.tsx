import React, { useState } from 'react';
import { PrCheckItem, PrReviewItem } from '../types/github';
import { GitPullRequest, GitMerge, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ThumbsUp, ShieldAlert, GitCommit } from 'lucide-react';

export const PrPlayground: React.FC = () => {
  // PR checks state
  const [checks, setChecks] = useState<PrCheckItem[]>([
    {
      id: 'check_ci',
      name: 'ci/matrix-tests (Node 20.x, Ubuntu)',
      category: 'Continuous Integration',
      status: 'completed',
      conclusion: 'success',
      details: 'All 48 unit and integration tests passed.',
      required: true
    },
    {
      id: 'check_sonar',
      name: 'code-quality/sonarqube-gate',
      category: 'Quality Gate',
      status: 'completed',
      conclusion: 'success',
      details: 'Maintainability: A, Coverage: 94.2%, 0 bugs.',
      required: true
    },
    {
      id: 'check_security',
      name: 'security/snyk-dependency-scan',
      category: 'Vulnerability Audit',
      status: 'completed',
      conclusion: 'success',
      details: 'No high or critical vulnerabilities identified.',
      required: true
    },
    {
      id: 'check_license',
      name: 'compliance/license-check',
      category: 'Compliance',
      status: 'completed',
      conclusion: 'success',
      details: 'All third-party packages conform to MIT/Apache-2.0.',
      required: false
    }
  ]);

  // Branch protection rules
  const [requireCodeowner, setRequireCodeowner] = useState(true);
  const [minApprovals, setMinApprovals] = useState(1);
  const [hasMergeConflict, setHasMergeConflict] = useState(false);
  const [isMerged, setIsMerged] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<PrReviewItem[]>([
    {
      id: 'rev_1',
      author: 'elena-lead',
      role: 'CODEOWNER',
      state: 'APPROVED',
      submittedAt: '25m ago',
      comment: 'Architecture looks solid. Rate limiter jitter prevents thundering herd problem.'
    }
  ]);

  const [activeDiffTab, setActiveDiffTab] = useState<'diff' | 'commits' | 'checks'>('diff');

  // Toggle check conclusion (success vs failure)
  const toggleCheck = (id: string) => {
    setChecks((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextConclusion = c.conclusion === 'success' ? 'failure' : 'success';
          return {
            ...c,
            conclusion: nextConclusion,
            details: nextConclusion === 'failure' ? 'Build failed with exit code 1.' : 'Passed without errors.'
          };
        }
        return c;
      })
    );
  };

  // Review actions
  const handleAddReview = (state: 'APPROVED' | 'CHANGES_REQUESTED') => {
    const newRev: PrReviewItem = {
      id: `rev_${Date.now()}`,
      author: 'marcus-architect',
      role: 'COLLABORATOR',
      state,
      submittedAt: 'Just now',
      comment: state === 'APPROVED' ? 'LGTM! Verified backwards compatibility.' : 'Please add timeout fallback.'
    };
    setReviews([newRev, ...reviews]);
  };

  const clearReviews = () => {
    setReviews([]);
  };

  // Compute branch protection validation
  const requiredChecksPassing = checks
    .filter((c) => c.required)
    .every((c) => c.conclusion === 'success');

  const approvedReviewsCount = reviews.filter((r) => r.state === 'APPROVED').length;
  const hasChangesRequested = reviews.some((r) => r.state === 'CHANGES_REQUESTED');
  const codeownerApproved = reviews.some((r) => r.role === 'CODEOWNER' && r.state === 'APPROVED');

  const approvalsSatisfied =
    approvedReviewsCount >= minApprovals &&
    (!requireCodeowner || codeownerApproved) &&
    !hasChangesRequested;

  const canMerge = requiredChecksPassing && approvalsSatisfied && !hasMergeConflict && !isMerged;

  const simulatedDiff = [
    { type: 'header', content: '@@ -38,7 +38,15 @@ export async function fetchWithRetry(url: string, opts: RequestOptions) {' },
    { type: 'context', content: '   const maxRetries = opts.retries ?? 3;' },
    { type: 'context', content: '   let attempt = 0;' },
    { type: 'deletion', content: '-  const delayMs = 1000;' },
    { type: 'addition', content: '+  // Apply exponential backoff with full randomized jitter' },
    { type: 'addition', content: '+  const calculateBackoff = (attemptNumber: number): number => {' },
    { type: 'addition', content: '+    const baseMs = 500 * Math.pow(2, attemptNumber);' },
    { type: 'addition', content: '+    const jitter = Math.random() * baseMs;' },
    { type: 'addition', content: '+    return Math.min(30000, baseMs + jitter);' },
    { type: 'addition', content: '+  };' },
    { type: 'context', content: '   while (attempt < maxRetries) {' },
    { type: 'context', content: '     try {' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Branch Protection & Policy Controls */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Branch Protection Rules Tester */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-200">Branch Protection Rules</span>
            <span className="text-[11px] font-mono text-sky-400">ruleset:main</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1.5">
                Required Approvals: <span className="font-mono text-sky-400 font-semibold">{minApprovals}</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMinApprovals(num)}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      minApprovals === num
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {num} Required
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="require-codeowner" className="text-xs text-slate-300 cursor-pointer">
                Require review from CODEOWNERS
              </label>
              <input
                id="require-codeowner"
                type="checkbox"
                checked={requireCodeowner}
                onChange={(e) => setRequireCodeowner(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="merge-conflict" className="text-xs text-slate-300 cursor-pointer">
                Simulate Git Merge Conflict
              </label>
              <input
                id="merge-conflict"
                type="checkbox"
                checked={hasMergeConflict}
                onChange={(e) => setHasMergeConflict(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
            </div>
          </div>
        </div>

        {/* Required Checks Matrix Toggles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-200">Interactive Status Checks</span>
            <span className="text-[11px] text-slate-500">Click to toggle</span>
          </div>

          <div className="space-y-2">
            {checks.map((check) => {
              const isPassing = check.conclusion === 'success';
              return (
                <div
                  key={check.id}
                  onClick={() => toggleCheck(check.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isPassing
                      ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-medium text-slate-200 truncate">
                      {check.name}
                    </span>
                    {isPassing ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{check.required ? 'Required check' : 'Optional check'}</span>
                    <span className="font-mono text-[10px] text-slate-500">{check.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviewers Simulator */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-200">Simulate PR Review</span>
            <button
              onClick={clearReviews}
              className="text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddReview('APPROVED')}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              <ThumbsUp className="h-3 w-3" />
              <span>+ Approve</span>
            </button>
            <button
              onClick={() => handleAddReview('CHANGES_REQUESTED')}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>+ Request Changes</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Column: Simulated PR view & Gate Decision */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Pull Request Header Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${
                    isMerged
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isMerged ? 'Merged' : 'Open'}
                </span>
                <span className="text-xs font-mono text-slate-500">#42</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                feat(retry): implement exponential backoff with jitter on secondary rate limits
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-800/80 mb-4 font-mono">
            <span>sarah-qa</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300">sarah-qa:feat/jitter-retry</span>
            <span>&rarr;</span>
            <span className="text-sky-400">main</span>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveDiffTab('diff')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeDiffTab === 'diff'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Files Changed (1)
            </button>
            <button
              onClick={() => setActiveDiffTab('checks')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeDiffTab === 'checks'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Checks ({checks.filter((c) => c.conclusion === 'success').length}/{checks.length})
            </button>
            <button
              onClick={() => setActiveDiffTab('commits')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeDiffTab === 'commits'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>

        {/* Diff & Code Viewer */}
        {activeDiffTab === 'diff' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>src/services/rateLimiter.ts</span>
              <span className="text-slate-500">+7 -1</span>
            </div>
            <div className="p-2 font-mono text-xs overflow-x-auto bg-slate-950">
              {simulatedDiff.map((line, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 leading-relaxed ${
                    line.type === 'addition'
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : line.type === 'deletion'
                      ? 'bg-rose-950/40 text-rose-300'
                      : line.type === 'header'
                      ? 'bg-slate-900/60 text-sky-400 font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  {line.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checks Tab */}
        {activeDiffTab === 'checks' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            {checks.map((chk) => (
              <div key={chk.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{chk.name}</p>
                  <p className="text-slate-400 text-[11px]">{chk.details}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  chk.conclusion === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {chk.conclusion.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeDiffTab === 'commits' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No reviews submitted yet.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{rev.author}</span>
                      <span className="text-[10px] font-mono text-sky-400">({rev.role})</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      rev.state === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {rev.state}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Merge Gate Decision Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="space-y-3 mb-4">
            {/* Status Checks summary */}
            <div className="flex items-center gap-2.5 text-xs">
              {requiredChecksPassing ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className={requiredChecksPassing ? 'text-slate-200' : 'text-rose-300'}>
                {requiredChecksPassing
                  ? 'All required status checks have succeeded'
                  : 'Required status checks are failing (merge blocked)'}
              </span>
            </div>

            {/* Reviews summary */}
            <div className="flex items-center gap-2.5 text-xs">
              {approvalsSatisfied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span className={approvalsSatisfied ? 'text-slate-200' : 'text-amber-300'}>
                {hasChangesRequested
                  ? 'Changes requested by a reviewer'
                  : approvalsSatisfied
                  ? `Review requirements met (${approvedReviewsCount} approved, CODEOWNERS satisfied)`
                  : `Waiting for ${minApprovals} approval(s) and CODEOWNERS sign-off`}
              </span>
            </div>

            {/* Merge conflict status */}
            {hasMergeConflict && (
              <div className="flex items-center gap-2.5 text-xs text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>This branch has conflicts that must be resolved prior to merging</span>
              </div>
            )}
          </div>

          {/* Merge Action Button */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {isMerged ? (
                <span className="text-purple-400 font-semibold">Pull request successfully merged into main.</span>
              ) : canMerge ? (
                <span>Branch is up to date and meets all policy requirements.</span>
              ) : (
                <span className="text-slate-500">Merging is blocked until branch protection conditions are met.</span>
              )}
            </div>

            <button
              onClick={() => setIsMerged(true)}
              disabled={!canMerge}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                canMerge
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <GitMerge className="h-4 w-4" />
              <span>{isMerged ? 'Pull Request Merged' : 'Squash and Merge'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
