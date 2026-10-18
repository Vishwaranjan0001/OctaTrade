// Run against a started stack: node qa/docker-smoke.mjs [http://localhost:8787]
// Creates a disposable account and deposits virtual funds; no market data needed.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export async function smoke(base = 'http://localhost:8787') {
  let checks = 0;
  async function request(path, { status = 200, token, body } = {}) {
    const response = await fetch(new URL(path, base), {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, status, `${path}: ${await response.clone().text().then(t => t.slice(0, 160))}`);
    checks++;
    return response;
  }

  for (const path of ['/_health', '/health', '/', '/app.html', '/css/desk.css',
    '/js/islands-home.js', '/js/islands-landing.js', '/frames/frame_0001.webp']) {
    const response = await request(path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, `${path} must have content`);
  }
  const manifest = await (await request('/frames/manifest.json')).json();
  assert.equal(manifest.count, 428);
  for (const path of ['/.git/config', '/.env', '/server/runtime/jwt-secret', '/server/package.json', '/qa/test-account.json']) {
    await request(path, { status: 403 });
  }
  await request('/api/wallet', { status: 401 });
  const email = `docker-smoke-${randomUUID()}@example.com`;
  const password = randomUUID();
  await request('/api/auth/register', { status: 201, body: { name: 'Docker smoke test', email, password } });
  const { token } = await (await request('/api/auth/login', { body: { email, password } })).json();
  assert.ok(token);
  const user = await (await request('/api/auth/me', { token })).json();
  assert.equal(user.email, email);
  const initial = await (await request('/api/wallet', { token })).json();
  const deposit = await (await request('/api/wallet/deposit', { token, body: { amountPaise: 10000 } })).json();
  assert.equal(deposit.wallet.availableBalancePaise, initial.availableBalancePaise + 10000);
  const transactions = await (await request('/api/wallet/transactions', { token })).json();
  assert.ok(transactions.transactions.some(t => t.type === 'DEPOSIT' && t.amountPaise === 10000));
  await request('/api/orders', { token, status: 400, body: { symbol: 'TCS.NS', side: 'BUY', quantity: 0 } });

  // Authenticate Socket.IO over a raw WebSocket to exercise the upgrade proxy.
  await new Promise((resolve, reject) => {
    const url = new URL('/socket.io/?EIO=4&transport=websocket', base);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(url);
    const timer = setTimeout(() => finish(new Error('Realtime authentication timed out')), 10000);
    function finish(error) {
      clearTimeout(timer);
      socket.close();
      error ? reject(error) : resolve();
    }
    socket.addEventListener('error', () => finish(new Error('WebSocket proxy failed')));
    socket.addEventListener('message', ({ data }) => {
      if (data.startsWith('0')) socket.send(`40${JSON.stringify({ token })}`);
      else if (data.startsWith('40')) finish();
      else if (data.startsWith('44')) finish(new Error(`Socket.IO rejected authentication: ${data}`));
      else if (data === '2') socket.send('3');
    });
  });
  checks++;
  console.log(`${checks} startup checks passed (assets, API, transactions, auth, and realtime proxy).`);
  return { token, email };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await smoke(process.argv[2]);
}
