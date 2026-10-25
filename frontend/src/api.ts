// Small fetch wrapper for the BrewNest backend. Sends the saved login token automatically.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(method: string, path: string, body?: unknown) {
  const token = localStorage.getItem('brewnest_token');
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: unknown) => request('POST', path, body)
};
