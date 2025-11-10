'use client';

import { useMemo, useState } from 'react';

const presets = [
  {
    label: 'List Users',
    method: 'GET',
    path: '/api/users',
    body: '',
  },
  {
    label: 'Create User',
    method: 'POST',
    path: '/api/users',
    body: JSON.stringify(
      {
        email: 'demo-user@example.com',
        password: 'Passw0rd!',
        firstName: 'Demo',
        lastName: 'User',
      },
      null,
      2,
    ),
  },
  {
    label: 'List Goals',
    method: 'GET',
    path: '/api/goals',
    body: '',
  },
  {
    label: 'Create Goal',
    method: 'POST',
    path: '/api/goals',
    body: JSON.stringify(
      {
        userId: '<replace-with-user-id>',
        title: 'Daily check in',
        points: 10,
      },
      null,
      2,
    ),
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? 'test-token';

function formatResponse(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export default function ApiPlaygroundPage() {
  const [method, setMethod] = useState(presets[0].method);
  const [path, setPath] = useState(presets[0].path);
  const [body, setBody] = useState(presets[0].body);
  const [response, setResponse] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const presetButtons = useMemo(
    () =>
      presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => {
            setMethod(preset.method);
            setPath(preset.path);
            setBody(preset.body);
            setResponse('');
            setStatus('');
            setError('');
          }}
          className="px-3 py-2 rounded-md text-sm font-medium bg-slate-100 hover:bg-slate-200"
        >
          {preset.label}
        </button>
      )),
    [],
  );

  const sendRequest = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    setStatus('');
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: method === 'GET' ? undefined : body || undefined,
      });
      setStatus(`${res.status} ${res.statusText}`);

      const text = await res.text();
      if (!text) {
        setResponse('<empty response>');
      } else {
        try {
          setResponse(formatResponse(JSON.parse(text)));
        } catch {
          setResponse(text);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">API Playground</h1>
          <p className="mt-2 text-slate-600">
            Talk to the local backend without touching curl or Postman. Requests default
            to <code>{API_BASE_URL}</code> with the token{' '}
            <code>{AUTH_TOKEN}</code>.
          </p>
        </header>

        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-medium text-slate-900 mb-3">Presets</h2>
          <div className="flex flex-wrap gap-2">{presetButtons}</div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex flex-col flex-1">
              <label className="text-sm font-medium text-slate-700">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 rounded-md border border-slate-200 px-3 py-2"
              >
                {['GET', 'POST', 'PUT', 'DELETE'].map((verb) => (
                  <option key={verb}>{verb}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col flex-[2]">
              <label className="text-sm font-medium text-slate-700">Path</label>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="mt-1 rounded-md border border-slate-200 px-3 py-2"
                placeholder="/api/users"
              />
            </div>
          </div>

          {method !== 'GET' && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
              />
              <span className="text-xs text-slate-500 mt-1">
                JSON format expected. Leave blank for routes that ignore the body.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={sendRequest}
            disabled={loading}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Request'}
          </button>
        </section>

        <section className="rounded-lg bg-white p-6 shadow space-y-3">
          <h2 className="text-lg font-medium text-slate-900">Response</h2>
          {status && (
            <p className="text-sm font-medium text-slate-700">
              Status: <span className="font-mono">{status}</span>
            </p>
          )}
          {error && (
            <p className="text-sm font-medium text-red-600">
              Error: <span className="font-mono">{error}</span>
            </p>
          )}
          <pre className="whitespace-pre-wrap rounded-md bg-slate-900 p-4 text-slate-100 text-sm">
            {response || '<no response yet>'}
          </pre>
        </section>
      </div>
    </div>
  );
}
