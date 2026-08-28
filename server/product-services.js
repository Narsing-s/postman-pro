import { randomUUID } from 'node:crypto';
import { assertSafeHttpUrl, safeTimeout } from './security.js';
const monitors = new Map();
const workspaces = new Map();
function resolve(value, environment = {}) { return String(value ?? '').replace(/\{\{([^}]+)\}\}/g, (_, key) => environment[key.trim()] ?? `{{${key}}}`); }
export async function checkEndpoint({ url, method = 'GET', headers = {}, body, environment = {}, timeout = 15000 }) {
  const target = await assertSafeHttpUrl(resolve(url, environment)), started = Date.now();
  try {
    const response = await fetch(target, { method, headers, body: ['GET','HEAD'].includes(method.toUpperCase()) ? undefined : body, redirect: 'follow', signal: AbortSignal.timeout(safeTimeout(timeout)) });
    const text = await response.text();
    return { ok: response.ok, status: response.status, statusText: response.statusText, time: Date.now() - started, bodyPreview: text.slice(0, 1000) };
  } catch (error) { return { ok: false, status: 0, time: Date.now() - started, error: error?.message || 'Request failed' }; }
}
export function createMonitor(input) { const id = input.id || randomUUID(); if (!input.url) throw new Error('Monitor URL is required'); const monitor = { id, name: input.name || 'API Monitor', url: input.url, method: input.method || 'GET', headers: input.headers || {}, body: input.body, environment: input.environment || {}, intervalSeconds: Math.max(10, Number(input.intervalSeconds || 60)), createdAt: new Date().toISOString(), lastRun: null }; monitors.set(id, monitor); return monitor; }
export async function runMonitor(id) { const monitor = monitors.get(id); if (!monitor) throw new Error('Monitor not found'); const result = await checkEndpoint(monitor); monitor.lastRun = { at: new Date().toISOString(), ...result }; monitors.set(id, monitor); return { monitor, result }; }
export function listMonitors() { return [...monitors.values()]; }
export function createWorkspace(input) { const id = input.id || randomUUID(); const workspace = { id, name: input.name || 'My Workspace', description: input.description || '', createdAt: new Date().toISOString() }; workspaces.set(id, workspace); return workspace; }
export function listWorkspaces() { return [...workspaces.values()]; }
export function assistant({ prompt = '', request = {}, response = null }) {
  const text = prompt.toLowerCase(), suggestions = [];
  if (text.includes('test') || text.includes('assert')) suggestions.push('Add status-code, response-time and JSON-schema assertions.');
  if (text.includes('auth') || text.includes('token')) suggestions.push('Use environment variables for secrets and OAuth 2.0/client-credentials instead of hard-coded tokens.');
  if (text.includes('slow') || text.includes('performance')) suggestions.push('Capture response time and add a threshold assertion in the collection runner.');
  if (text.includes('openapi') || text.includes('swagger')) suggestions.push('Import the specification, validate the collection, then export Collection v2.1 for CI.');
  if (text.includes('graphql')) suggestions.push('Keep the GraphQL query and variables separate so environments can supply endpoint and credentials.');
  if (text.includes('websocket') || text.includes('sse')) suggestions.push('Record connect, message, error and close events in the realtime client.');
  if (!suggestions.length) suggestions.push('Ask about tests, authentication, performance, debugging, API design, or automation.');
  return { answer: suggestions.join(' '), suggestions, requestName: request.name || null, responseStatus: response?.status ?? null };
}
