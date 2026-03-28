/**
 * Playwright route interceptor for all Svix API calls.
 *
 * Intercepts requests to the Svix API base URL, returns deterministic
 * mock data, and records every call for assertion.
 *
 * Usage in tests:
 *   const { apiCalls, setupMockApi } = require('./fixtures/api-interceptor');
 *   test.beforeEach(async ({ page }) => { await setupMockApi(page); });
 *   // ... later: expect(apiCalls.find(c => c.method === 'POST' && c.path.includes('endpoint'))).toBeTruthy();
 */

const data = require('./mock-data');

const API_BASE = 'https://webhooks.vibey.cloud/api/v1';

let _calls = [];

function apiCalls() { return _calls; }
function resetCalls() { _calls = []; }

function findCalls(method, pathFragment) {
  return _calls.filter(c => c.method === method && c.path.includes(pathFragment));
}

function lastCall(method, pathFragment) {
  const matches = findCalls(method, pathFragment);
  return matches[matches.length - 1] || null;
}

async function setupMockApi(page) {
  resetCalls();

  await page.route(`${API_BASE}/**`, async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace('/api/v1/', '');
    const search = url.search;
    let body = null;
    try { body = route.request().postDataJSON(); } catch {}

    const call = { method, path, search, body, url: url.toString(), timestamp: Date.now() };
    _calls.push(call);

    const respond = (json, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });

    // ── Endpoints ──────────────────────────────────────────
    if (method === 'GET' && path === `app/user_1/endpoint/`) {
      return respond(data.ENDPOINTS_LIST);
    }
    if (method === 'POST' && path === `app/user_1/endpoint/`) {
      return respond(data.CREATED_ENDPOINT, 201);
    }
    if (method === 'GET' && path.match(/^app\/user_1\/endpoint\/ep_[^/]+\/$/)) {
      const id = path.match(/endpoint\/(ep_[^/]+)\//)[1];
      const ep = [data.ENDPOINT_1, data.ENDPOINT_2, data.CREATED_ENDPOINT].find(e => e.id === id);
      return respond(ep || data.ENDPOINT_1);
    }
    if (method === 'PATCH' && path.match(/^app\/user_1\/endpoint\/ep_[^/]+\/$/)) {
      const id = path.match(/endpoint\/(ep_[^/]+)\//)[1];
      const ep = [data.ENDPOINT_1, data.ENDPOINT_2].find(e => e.id === id) || data.ENDPOINT_1;
      return respond({ ...ep, ...body });
    }
    if (method === 'DELETE' && path.match(/^app\/user_1\/endpoint\/ep_[^/]+\/$/)) {
      return respond({}, 204);
    }

    // ── Endpoint secret ────────────────────────────────────
    if (method === 'GET' && path.match(/endpoint\/ep_[^/]+\/secret\/$/)) {
      return respond(data.SECRET);
    }
    if (method === 'POST' && path.match(/endpoint\/ep_[^/]+\/secret\/rotate\/$/)) {
      return respond({ key: 'whsec_rotated_new_secret_key' });
    }

    // ── Attempts by endpoint ───────────────────────────────
    if (method === 'GET' && path.match(/attempt\/endpoint\/ep_[^/]+\/$/)) {
      return respond(data.ATTEMPTS_LIST);
    }

    // ── Attempts by message ────────────────────────────────
    if (method === 'GET' && path.match(/attempt\/msg\/msg_[^/]+\/$/)) {
      return respond(data.ATTEMPTS_LIST);
    }

    // ── Recover / Replay ───────────────────────────────────
    if (method === 'POST' && path.match(/endpoint\/ep_[^/]+\/recover\/$/)) {
      return respond({}, 202);
    }
    if (method === 'POST' && path.match(/endpoint\/ep_[^/]+\/replay-missing\/$/)) {
      return respond({}, 202);
    }

    // ── Messages ───────────────────────────────────────────
    if (method === 'GET' && path === `app/user_1/msg/`) {
      return respond(data.MESSAGES_LIST);
    }
    if (method === 'GET' && path.match(/^app\/user_1\/msg\/msg_[^/]+\/$/)) {
      const id = path.match(/msg\/(msg_[^/]+)\//)[1];
      const msg = [data.MESSAGE_1, data.MESSAGE_2].find(m => m.id === id);
      return respond(msg || data.MESSAGE_1);
    }
    if (method === 'POST' && path === `app/user_1/msg/`) {
      return respond(data.CREATED_MESSAGE, 202);
    }

    // ── Resend ─────────────────────────────────────────────
    if (method === 'POST' && path.match(/msg\/msg_[^/]+\/endpoint\/ep_[^/]+\/resend\/$/)) {
      return respond({}, 202);
    }

    // ── Event Types ────────────────────────────────────────
    if (method === 'GET' && path === 'event-type/') {
      return respond(data.EVENT_TYPES_LIST);
    }
    if (method === 'POST' && path === 'event-type/') {
      return respond(data.CREATED_EVENT_TYPE, 201);
    }
    if (method === 'PATCH' && path.match(/^event-type\/[^/]+\/$/)) {
      return respond({ ...data.EVENT_TYPE_1, ...body });
    }
    if (method === 'DELETE' && path.match(/^event-type\/[^/]+\/$/)) {
      return respond({}, 204);
    }

    // ── Retry schedule ─────────────────────────────────────
    if (method === 'GET' && path.match(/^event-type\/[^/]+\/retry-schedule\/$/)) {
      return respond(data.RETRY_SCHEDULE_DEFAULT);
    }
    if (method === 'PUT' && path.match(/^event-type\/[^/]+\/retry-schedule\/$/)) {
      return respond(body);
    }

    // ── Endpoint stats / headers (used by API docs) ───────
    if (method === 'GET' && path.match(/endpoint\/ep_[^/]+\/stats\/$/)) {
      return respond({ success: 10, failure: 2, sending: 0 });
    }
    if (method === 'GET' && path.match(/endpoint\/ep_[^/]+\/headers\/$/)) {
      return respond({ headers: {} });
    }

    // Fallback
    console.warn(`[mock] Unhandled API call: ${method} ${path}${search}`);
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"detail":"Not mocked"}' });
  });
}

module.exports = { setupMockApi, apiCalls, resetCalls, findCalls, lastCall, API_BASE };
