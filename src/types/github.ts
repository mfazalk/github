export type TabType = 'api' | 'webhooks' | 'actions' | 'pr' | 'tokens';

export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp seconds
  used: number;
  resource: string;
}

export interface ApiEndpointTemplate {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: 'Repositories' | 'Pull Requests' | 'Issues' | 'Actions' | 'Users' | 'Rate Limit';
  defaultBody?: string;
  params?: { [key: string]: string };
}

export interface ApiResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
  timestamp: string;
  url: string;
  error?: string;
}

export interface WebhookEventTemplate {
  event: string;
  action?: string;
  name: string;
  description: string;
  defaultPayload: Record<string, any>;
}

export interface WebhookDeliveryLog {
  id: string;
  event: string;
  action?: string;
  targetUrl: string;
  timestamp: string;
  signature: string;
  payload: string;
  responseStatus?: number;
  responseStatusText?: string;
  responseBody?: string;
  durationMs?: number;
  error?: string;
}

export interface WorkflowValidationError {
  line?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface WorkflowStepState {
  name: string;
  command?: string;
  uses?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  durationMs: number;
  logs: string[];
}

export interface WorkflowRunState {
  id: string;
  workflowName: string;
  eventTrigger: string;
  ref: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  totalDurationMs: number;
  steps: WorkflowStepState[];
}

export interface PrCheckItem {
  id: string;
  name: string;
  category: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled';
  details: string;
  required: boolean;
}

export interface PrReviewItem {
  id: string;
  author: string;
  role: 'CODEOWNER' | 'COLLABORATOR' | 'CONTRIBUTOR';
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  submittedAt: string;
  comment: string;
}
