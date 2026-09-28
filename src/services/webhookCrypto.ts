import { WebhookEventTemplate } from '../types/github';

/**
 * Calculates GitHub X-Hub-Signature-256 (HMAC-SHA256)
 * Format: "sha256=<hex_digest>"
 */
export async function generateGitHubHmacSignature(secret: string, payloadText: string): Promise<string> {
  if (!secret) return '';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payloadText);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexDigest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hexDigest}`;
}

/**
 * Verifies if a given signature matches computed signature
 */
export async function verifyGitHubSignature(secret: string, payloadText: string, signatureHeader: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const expected = await generateGitHubHmacSignature(secret, payloadText);
  return expected.toLowerCase() === signatureHeader.trim().toLowerCase();
}

export const WEBHOOK_TEMPLATES: WebhookEventTemplate[] = [
  {
    event: 'push',
    name: 'Push (Commits pushed)',
    description: 'Triggered on git push to a repository branch or tag',
    defaultPayload: {
      ref: 'refs/heads/main',
      before: '4f2d8a9b1c3e5d7a9b0c2e4f6a8b1c3d5e7f9a0b',
      after: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      repository: {
        id: 987654321,
        name: 'octotest-demo',
        full_name: 'octo-org/octotest-demo',
        private: false,
        html_url: 'https://github.com/octo-org/octotest-demo',
        default_branch: 'main',
        stargazers_count: 142
      },
      pusher: {
        name: 'alex-dev',
        email: 'alex.developer@example.com'
      },
      sender: {
        login: 'alex-dev',
        id: 1234567,
        avatar_url: 'https://github.com/identicons/alex-dev.png',
        type: 'User'
      },
      commits: [
        {
          id: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
          message: 'feat: add automated rate-limit monitoring and retry policy',
          timestamp: new Date().toISOString(),
          author: {
            name: 'Alex Developer',
            email: 'alex.developer@example.com',
            username: 'alex-dev'
          },
          added: ['src/services/rateLimiter.ts', 'tests/rateLimiter.test.ts'],
          removed: [],
          modified: ['src/index.ts', 'package.json']
        }
      ],
      head_commit: {
        id: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        message: 'feat: add automated rate-limit monitoring and retry policy',
        timestamp: new Date().toISOString()
      }
    }
  },
  {
    event: 'pull_request',
    action: 'opened',
    name: 'Pull Request: Opened',
    description: 'Triggered when a new pull request is created',
    defaultPayload: {
      action: 'opened',
      number: 42,
      pull_request: {
        id: 1122334455,
        number: 42,
        state: 'open',
        title: 'fix(api): handle exponential backoff on 403 secondary rate limits',
        body: 'Closes #38. Implements randomized jitter and parses Retry-After header.',
        created_at: new Date().toISOString(),
        user: {
          login: 'sarah-qa',
          id: 7654321,
          avatar_url: 'https://github.com/identicons/sarah-qa.png'
        },
        head: {
          label: 'sarah-qa:fix/secondary-rate-limit',
          ref: 'fix/secondary-rate-limit',
          sha: '3b2a1c0e9d8f7e6a5b4c3d2e1f0a9b8c7d6e5f4a'
        },
        base: {
          label: 'octo-org:main',
          ref: 'main',
          sha: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d'
        },
        merged: false,
        mergeable: true,
        comments: 0,
        commits: 2,
        additions: 84,
        deletions: 12,
        changed_files: 3
      },
      repository: {
        id: 987654321,
        name: 'octotest-demo',
        full_name: 'octo-org/octotest-demo'
      },
      sender: {
        login: 'sarah-qa',
        id: 7654321
      }
    }
  },
  {
    event: 'pull_request',
    action: 'closed',
    name: 'Pull Request: Merged / Closed',
    description: 'Triggered when a PR is merged into target branch or closed',
    defaultPayload: {
      action: 'closed',
      number: 42,
      pull_request: {
        number: 42,
        state: 'closed',
        title: 'fix(api): handle exponential backoff on 403 secondary rate limits',
        merged: true,
        merged_by: {
          login: 'tech-lead-marcus',
          id: 9988776
        },
        merged_at: new Date().toISOString()
      },
      repository: {
        full_name: 'octo-org/octotest-demo'
      }
    }
  },
  {
    event: 'workflow_run',
    action: 'completed',
    name: 'Workflow Run: Completed',
    description: 'Triggered when a GitHub Actions workflow run finishes execution',
    defaultPayload: {
      action: 'completed',
      workflow_run: {
        id: 948372615,
        name: 'CI Suite & Integration Tests',
        head_branch: 'main',
        head_sha: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        status: 'completed',
        conclusion: 'success',
        run_number: 148,
        event: 'push',
        html_url: 'https://github.com/octo-org/octotest-demo/actions/runs/948372615',
        run_attempt: 1,
        created_at: new Date(Date.now() - 120000).toISOString(),
        updated_at: new Date().toISOString(),
        jobs_url: 'https://api.github.com/repos/octo-org/octotest-demo/actions/runs/948372615/jobs'
      },
      repository: {
        full_name: 'octo-org/octotest-demo'
      },
      sender: {
        login: 'github-actions[bot]'
      }
    }
  },
  {
    event: 'issue_comment',
    action: 'created',
    name: 'Issue / PR Comment: Created',
    description: 'Triggered when a comment is added to an issue or pull request',
    defaultPayload: {
      action: 'created',
      issue: {
        number: 42,
        title: 'fix(api): handle exponential backoff on 403 secondary rate limits',
        pull_request: {
          url: 'https://api.github.com/repos/octo-org/octotest-demo/pulls/42'
        }
      },
      comment: {
        id: 88776655,
        body: '/test e2e-cross-browser --verbose',
        user: {
          login: 'dev-reviewer',
          id: 445566
        },
        created_at: new Date().toISOString()
      },
      repository: {
        full_name: 'octo-org/octotest-demo'
      }
    }
  },
  {
    event: 'release',
    action: 'published',
    name: 'Release: Published',
    description: 'Triggered when a new release or tag is published',
    defaultPayload: {
      action: 'published',
      release: {
        id: 554433,
        tag_name: 'v2.4.0',
        target_commitish: 'main',
        name: 'v2.4.0 — High Availability & Webhook Verification',
        draft: false,
        prerelease: false,
        published_at: new Date().toISOString(),
        author: {
          login: 'octo-maintainer'
        }
      },
      repository: {
        full_name: 'octo-org/octotest-demo'
      }
    }
  },
  {
    event: 'ping',
    name: 'Ping (Webhook Created Test)',
    description: 'GitHub initial handshake event when adding a new webhook',
    defaultPayload: {
      zen: 'Favor focus over features.',
      hook_id: 12345678,
      hook: {
        type: 'Repository',
        id: 12345678,
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'workflow_run'],
        config: {
          content_type: 'json',
          insecure_ssl: '0',
          url: 'https://octotest.example.dev/webhook'
        }
      },
      repository: {
        id: 987654321,
        full_name: 'octo-org/octotest-demo'
      },
      sender: {
        login: 'octo-admin'
      }
    }
  }
];
