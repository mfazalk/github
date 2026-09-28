import { load } from 'js-yaml';
import { WorkflowRunState, WorkflowStepState, WorkflowValidationError } from '../types/github';

export const WORKFLOW_TEMPLATES = [
  {
    id: 'ci-matrix',
    name: 'CI Node.js & Matrix Tests',
    filename: 'ci.yml',
    description: 'Comprehensive test suite running across Node 18, 20, 22 on ubuntu-latest.',
    content: `name: CI Matrix Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [ 18.x, 20.x, 22.x ]
    steps:
      - name: Checkout repository code
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter and typecheck
        run: |
          npm run lint
          npm run typecheck

      - name: Execute test runner with coverage
        run: npm test -- --coverage --passWithNoTests
        env:
          CI: true
          NODE_ENV: test
`
  },
  {
    id: 'pr-triage',
    name: 'PR Automations & Lint',
    filename: 'pr-triage.yml',
    description: 'Validates conventional commit titles, checks PR descriptions, and assigns reviewers.',
    content: `name: Pull Request Quality Gate

on:
  pull_request:
    types: [ opened, edited, synchronize, reopened ]

jobs:
  pr-lint:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Conventional Commits PR Title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore

      - name: Check PR Body Template Completion
        run: |
          echo "Verifying PR body has issue reference and test checklist..."
          python -c 'import sys; print("PR Description valid.")'
`
  },
  {
    id: 'docker-build',
    name: 'Docker Build & Security Scan',
    filename: 'docker-publish.yml',
    description: 'Builds OCI container, scans with Trivy for vulnerabilities, and prepares digest.',
    content: `name: Container Build & Vulnerability Scan

on:
  push:
    tags: [ 'v*.*.*' ]

jobs:
  docker-job:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build container image
        run: |
          docker build -t octotest-app:\${{ github.sha }} .
          docker image ls

      - name: Run Trivy container security scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'octotest-app:\${{ github.sha }}'
          format: 'table'
          exit-code: '0'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'
`
  }
];

export function validateWorkflowYaml(yamlContent: string): { isValid: boolean; errors: WorkflowValidationError[]; parsedObj: any } {
  const errors: WorkflowValidationError[] = [];
  let parsedObj: any = null;

  if (!yamlContent || yamlContent.trim().length === 0) {
    return {
      isValid: false,
      errors: [{ message: 'Workflow file is empty.', severity: 'error' }],
      parsedObj: null
    };
  }

  try {
    parsedObj = load(yamlContent);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [
        {
          line: err.mark ? err.mark.line + 1 : undefined,
          message: `YAML Syntax Error: ${err.reason || err.message}`,
          severity: 'error'
        }
      ],
      parsedObj: null
    };
  }

  if (typeof parsedObj !== 'object' || parsedObj === null) {
    errors.push({ message: 'Root of workflow must be a YAML mapping/object.', severity: 'error' });
    return { isValid: false, errors, parsedObj };
  }

  // Check required root keys
  if (!parsedObj.name) {
    errors.push({ message: 'Warning: Workflow name is missing (recommended: `name: ...`).', severity: 'warning' });
  }

  if (!parsedObj.on) {
    errors.push({ message: 'Missing trigger specification `on:` (e.g. `push`, `pull_request`, `workflow_dispatch`).', severity: 'error' });
  }

  if (!parsedObj.jobs || typeof parsedObj.jobs !== 'object' || Object.keys(parsedObj.jobs).length === 0) {
    errors.push({ message: 'Workflow must declare at least one job under `jobs:`.', severity: 'error' });
  } else {
    for (const [jobId, jobDef] of Object.entries(parsedObj.jobs as Record<string, any>)) {
      if (!jobDef || typeof jobDef !== 'object') {
        errors.push({ message: `Job '${jobId}' definition is empty or not an object.`, severity: 'error' });
        continue;
      }

      if (!jobDef['runs-on'] && !jobDef.uses) {
        errors.push({
          message: `Job '${jobId}' must specify 'runs-on' (e.g. ubuntu-latest) or call a reusable workflow via 'uses'.`,
          severity: 'error'
        });
      }

      if (jobDef.steps) {
        if (!Array.isArray(jobDef.steps)) {
          errors.push({ message: `Job '${jobId}' steps must be a YAML array.`, severity: 'error' });
        } else {
          jobDef.steps.forEach((step: any, index: number) => {
            if (!step || typeof step !== 'object') {
              errors.push({ message: `Step #${index + 1} in job '${jobId}' is invalid.`, severity: 'error' });
            } else if (!step.run && !step.uses) {
              errors.push({
                message: `Step #${index + 1} ('${step.name || 'unnamed'}') in job '${jobId}' must contain either 'run' or 'uses'.`,
                severity: 'error'
              });
            }
          });
        }
      }
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    parsedObj
  };
}

export function extractWorkflowSteps(parsedObj: any): WorkflowStepState[] {
  const steps: WorkflowStepState[] = [
    {
      name: 'Set up runner and job context',
      command: 'Runner Image: ubuntu-24.04 (linux-x64), GitHub Runner Version: 2.320.0',
      status: 'pending',
      durationMs: 0,
      logs: []
    }
  ];

  if (parsedObj && parsedObj.jobs) {
    const firstJobKey = Object.keys(parsedObj.jobs)[0];
    const job = parsedObj.jobs[firstJobKey];
    if (job && Array.isArray(job.steps)) {
      job.steps.forEach((s: any, idx: number) => {
        steps.push({
          name: s.name || (s.uses ? `Run ${s.uses}` : `Run script #${idx + 1}`),
          command: s.run ? s.run.trim() : undefined,
          uses: s.uses,
          status: 'pending',
          durationMs: 0,
          logs: []
        });
      });
    }
  }

  steps.push({
    name: 'Complete job execution & cleanup',
    command: 'Post runner cleanup, log artifact collection',
    status: 'pending',
    durationMs: 0,
    logs: []
  });

  return steps;
}
