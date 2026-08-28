import dns from 'node:dns/promises';
import net from 'node:net';

const PRIVATE_RANGES = [
  /^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./
];

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) return PRIVATE_RANGES.some((re) => re.test(ip));
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }
  return false;
}

export async function assertSafeHttpUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || isPrivateIp(hostname)) throw new Error('Requests to local/private addresses are blocked');
  const records = await dns.lookup(hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) throw new Error('Requests resolving to local/private addresses are blocked');
  return url.toString();
}

export function safeTimeout(value, fallback = 15000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(60000, Math.max(1000, n)) : fallback;
}
