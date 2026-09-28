import { ApiEndpointTemplate, ApiResponseData, RateLimitData } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

export const POPULAR_REPOS = [
  { owner: 'facebook', repo: 'react', name: 'facebook/react' },
  { owner: 'vercel', repo: 'next.js', name: 'vercel/next.js' },
  { owner: 'tailwindlabs', repo: 'tailwindcss', name: 'tailwindlabs/tailwindcss' },
  { owner: 'torvalds', repo: 'linux', name: 'torvalds/linux' },
  { owner: 'octocat', repo: 'Hello-World', name: 'octocat/Hello-World' }
];

export const API_TEMPLATES: ApiEndpointTemplate[] = [
  {
    id: 'repo-info',
    name: 'Get Repository Info',
    method: 'GET',
    path: '/repos/{owner}/{repo}',
    category: 'Repositories',
    description: 'Fetch repository details including stars, forks, default branch, and visibility.'
  },
  {
    id: 'repo-pulls',
    name: 'List Pull Requests',
    method: 'GET',
    path: '/repos/{owner}/{repo}/pulls?state=all&per_page=10',
    category: 'Pull Requests',
    description: 'List recent pull requests, branches, review requests, and merged status.'
  },
  {
    id: 'repo-issues',
    name: 'List Issues',
    method: 'GET',
    path: '/repos/{owner}/{repo}/issues?state=open&per_page=10',
    category: 'Issues',
    description: 'Fetch open issues, issue labels, assignees, and comment counts.'
  },
  {
    id: 'repo-actions',
    name: 'List Workflow Runs',
    method: 'GET',
    path: '/repos/{owner}/{repo}/actions/runs?per_page=5',
    category: 'Actions',
    description: 'Fetch recent GitHub Actions CI/CD runs, status, conclusion, and execution times.'
  },
  {
    id: 'repo-commits',
    name: 'List Recent Commits',
    method: 'GET',
    path: '/repos/{owner}/{repo}/commits?per_page=10',
    category: 'Repositories',
    description: 'View commit author, commit message, SHA hash, and verification status.'
  },
  {
    id: 'repo-releases',
    name: 'List Releases',
    method: 'GET',
    path: '/repos/{owner}/{repo}/releases?per_page=5',
    category: 'Repositories',
    description: 'Retrieve published releases, changelog notes, git tags, and asset downloads.'
  },
  {
    id: 'user-profile',
    name: 'Get User Profile',
    method: 'GET',
    path: '/users/{owner}',
    category: 'Users',
    description: 'Retrieve public user info, company, bio, public repo count, and follower count.'
  },
  {
    id: 'rate-limit',
    name: 'Check Rate Limit Status',
    method: 'GET',
    path: '/rate_limit',
    category: 'Rate Limit',
    description: 'Inspect exact remaining quota for core, search, graphql, and integration tiers.'
  }
];

export async function executeGitHubRequest(
  method: string,
  pathOrUrl: string,
  token?: string,
  customHeaders: Record<string, string> = {},
  bodyData?: string
): Promise<ApiResponseData> {
  const fullUrl = pathOrUrl.startsWith('http') ? pathOrUrl : `${GITHUB_API_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...customHeaders
  };

  if (token && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  try {
    const fetchOptions: RequestInit = {
      method,
      headers
    };

    if (bodyData && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = bodyData;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(fullUrl, fetchOptions);
    const durationMs = Math.round(performance.now() - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      durationMs,
      timestamp,
      url: fullUrl
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      status: 0,
      statusText: 'Network / CORS Error',
      headers: {},
      data: null,
      durationMs,
      timestamp,
      url: fullUrl,
      error: err.message || 'Failed to fetch from GitHub API.'
    };
  }
}

export function parseRateLimits(headers: Record<string, string>): RateLimitData | null {
  const limit = headers['x-ratelimit-limit'];
  const remaining = headers['x-ratelimit-remaining'];
  const reset = headers['x-ratelimit-reset'];
  const used = headers['x-ratelimit-used'];

  if (limit !== undefined && remaining !== undefined) {
    const limitNum = parseInt(limit, 10);
    const remNum = parseInt(remaining, 10);
    const resetNum = reset ? parseInt(reset, 10) : 0;
    const usedNum = used ? parseInt(used, 10) : (limitNum - remNum);
    return {
      limit: limitNum,
      remaining: remNum,
      reset: resetNum,
      used: usedNum,
      resource: headers['x-ratelimit-resource'] || 'core'
    };
  }
  return null;
}
