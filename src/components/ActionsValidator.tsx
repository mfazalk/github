import React, { useState, useEffect, useRef } from 'react';
import { WORKFLOW_TEMPLATES, validateWorkflowYaml, extractWorkflowSteps } from '../services/workflowEngine';
import { WorkflowStepState, WorkflowValidationError } from '../types/github';
import { Play, AlertCircle, CheckCircle2, XCircle, RotateCcw, Copy, Check, Terminal, Bug } from 'lucide-react';

export const ActionsValidator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(WORKFLOW_TEMPLATES[0]);
  const [yamlContent, setYamlContent] = useState(WORKFLOW_TEMPLATES[0].content);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: WorkflowValidationError[]; parsedObj: any }>({
    isValid: true,
    errors: [],
    parsedObj: null
  });
  const [copied, setCopied] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [steps, setSteps] = useState<WorkflowStepState[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<number>(0);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Validate on content change
  useEffect(() => {
    const res = validateWorkflowYaml(yamlContent);
    setValidation(res);
    if (res.isValid && !isRunning) {
      setSteps(extractWorkflowSteps(res.parsedObj));
    }
  }, [yamlContent]);

  // Load template
  const handleSelectTemplate = (tmpl: typeof WORKFLOW_TEMPLATES[0]) => {
    setSelectedTemplate(tmpl);
    setYamlContent(tmpl.content);
    setIsRunning(false);
    setCurrentStepIndex(-1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run simulation
  const handleRunSimulation = async () => {
    if (!validation.isValid || steps.length === 0) return;
    setIsRunning(true);
    setCurrentStepIndex(0);

    // Reset steps state
    const newSteps: WorkflowStepState[] = steps.map((s) => ({
      ...s,
      status: 'pending',
      durationMs: 0,
      logs: []
    }));
    setSteps(newSteps);
    setActiveLogTab(0);

    for (let i = 0; i < newSteps.length; i++) {
      setCurrentStepIndex(i);
      setActiveLogTab(i);
      newSteps[i].status = 'running';
      setSteps([...newSteps]);

      // Emit simulated step log lines
      const stepName = newSteps[i].name;
      const logs: string[] = [
        `\x1b[36m##[group]Starting step: ${stepName}\x1b[0m`,
        `Runner OS: Linux (Ubuntu 24.04 LTS x86_64)`,
        `Working directory: /home/runner/work/octotest/repo`
      ];

      if (newSteps[i].uses) {
        logs.push(`Loading action '${newSteps[i].uses}' from GitHub Marketplace cache...`);
        logs.push(`Action inputs verified. Node.js runtime loaded.`);
      }

      if (newSteps[i].command) {
        logs.push(`$ ${newSteps[i].command}`);
        if (stepName.toLowerCase().includes('install') || stepName.toLowerCase().includes('npm')) {
          logs.push(`added 482 packages in 3.4s`);
          logs.push(`audited 483 packages in 780ms`);
          logs.push(`found 0 vulnerabilities`);
        } else if (stepName.toLowerCase().includes('test')) {
          logs.push(`PASS src/tests/api.test.ts (1.2s)`);
          logs.push(`PASS src/tests/auth.test.ts (820ms)`);
          logs.push(`PASS src/tests/webhook.test.ts (410ms)`);
          logs.push(`Tests: 18 passed, 18 total`);
          logs.push(`Snapshots: 0 total`);
          logs.push(`Time: 3.14s`);
        }
      }

      newSteps[i].logs = logs;
      setSteps([...newSteps]);

      // Simulate step duration
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Check simulated failure condition on test step
      if (simulateFailure && (stepName.toLowerCase().includes('test') || i === Math.floor(newSteps.length / 2))) {
        newSteps[i].status = 'failed';
        newSteps[i].durationMs = 820;
        newSteps[i].logs.push(
          `\x1b[31mError: Process completed with exit code 1.\x1b[0m`,
          `AssertionError: Expected status code 200 but received 500 in auth.test.ts:42`,
          `##[error]Test suite execution failed.`
        );
        // Mark subsequent steps as skipped
        for (let j = i + 1; j < newSteps.length; j++) {
          newSteps[j].status = 'skipped';
          newSteps[j].logs = ['##[warning]Step skipped due to previous failure.'];
        }
        setSteps([...newSteps]);
        setIsRunning(false);
        return;
      }

      newSteps[i].status = 'success';
      newSteps[i].durationMs = 600 + Math.floor(Math.random() * 400);
      newSteps[i].logs.push(`\x1b[32m##[endgroup]Step completed successfully in ${(newSteps[i].durationMs / 1000).toFixed(2)}s\x1b[0m`);
      setSteps([...newSteps]);
    }

    setIsRunning(false);
  };

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps, currentStepIndex]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Templates & Lint Diagnostics */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Template Catalog */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-300">Workflow Templates</span>
            <span className="text-[11px] font-mono tabular-nums text-slate-500">
              {WORKFLOW_TEMPLATES.length} workflows
            </span>
          </div>

          <div className="space-y-1.5">
            {WORKFLOW_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-1 ${
                  selectedTemplate.id === tmpl.id
                    ? 'border-sky-500/50 bg-sky-500/10 text-white'
                    : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{tmpl.name}</span>
                  <span className="font-mono text-[10px] text-sky-400">
                    {tmpl.filename}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">{tmpl.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Linter & Syntax Diagnostics */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-300">Schema & Syntax Audit</span>
            <div className="flex items-center gap-1.5">
              {validation.isValid ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Valid YAML</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Errors found</span>
                </span>
              )}
            </div>
          </div>

          {validation.errors.length === 0 ? (
            <p className="text-xs text-slate-400">
              No schema violations detected. Actions workflow conforms to GitHub runner specifications.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {validation.errors.map((err, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded text-xs border ${
                    err.severity === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {err.line && <span className="font-mono font-semibold mr-1.5">Line {err.line}:</span>}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <span className="text-xs font-semibold text-slate-300">Simulation Controls</span>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Bug className="h-3.5 w-3.5 text-slate-400" />
              <label htmlFor="simulate-fail" className="text-xs text-slate-300 cursor-pointer">
                Inject Step Failure
              </label>
            </div>
            <input
              id="simulate-fail"
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            When enabled, simulates a test assertion exit code 1 to verify failure alerting and CI gates.
          </p>
        </div>

      </div>

      {/* Main Column: YAML Editor & Runner Simulator */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* YAML Editor */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-semibold text-slate-200">
                .github/workflows/{selectedTemplate.filename}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setYamlContent(selectedTemplate.content)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRunSimulation}
                disabled={isRunning || !validation.isValid}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-sm ml-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isRunning ? 'Running CI...' : 'Simulate Run'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950">
            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              rows={11}
              className="w-full font-mono text-xs text-slate-200 bg-transparent resize-y focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Live Step Runner Pipeline & Terminal */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <span className="text-xs font-semibold text-slate-200">Execution Pipeline & Steps</span>
          </div>

          {/* Steps Horizontal Pipeline / List */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {steps.map((step, idx) => {
                const isActive = activeLogTab === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveLogTab(idx)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isActive
                        ? 'border-sky-500/60 bg-sky-500/10'
                        : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-medium text-slate-200 truncate">{step.name}</span>
                      {step.status === 'running' && (
                        <div className="h-3 w-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
                      )}
                      {step.status === 'success' && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                      {step.status === 'failed' && (
                        <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      )}
                      {step.status === 'skipped' && (
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">SKIPPED</span>
                      )}
                      {step.status === 'pending' && (
                        <div className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>Step #{idx + 1}</span>
                      <span>{step.durationMs ? `${(step.durationMs / 1000).toFixed(2)}s` : '0.0s'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Terminal Output */}
          <div className="bg-slate-950 p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900 text-xs text-slate-400">
              <span className="font-mono">
                Terminal Output &bull; Step {activeLogTab + 1}: {steps[activeLogTab]?.name || 'Logs'}
              </span>
              <span className="font-mono text-slate-500">github-runner-vm</span>
            </div>

            <pre className="font-mono text-xs text-slate-300 min-h-[160px] max-h-[260px] overflow-y-auto leading-relaxed select-text">
              {steps[activeLogTab]?.logs && steps[activeLogTab].logs.length > 0 ? (
                steps[activeLogTab].logs.map((line, lIdx) => (
                  <div key={lIdx} className="hover:bg-slate-900/40 px-1 rounded">
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic py-6 text-center">
                  Click &apos;Simulate Run&apos; to trigger execution logs and inspect output streams.
                </div>
              )}
              <div ref={terminalBottomRef} />
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
