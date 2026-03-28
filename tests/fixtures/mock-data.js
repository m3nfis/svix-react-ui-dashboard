/**
 * Deterministic mock data for all Svix API responses.
 * Every API path the UI calls is represented here.
 */

const ENDPOINT_1 = {
  id: 'ep_test_endpoint_1',
  url: 'https://example.com/webhook',
  description: 'Production webhook',
  disabled: false,
  version: 1,
  rateLimit: null,
  filterTypes: ['order.created', 'user.signup'],
  channels: [],
  headers: {},
  createdAt: '2026-03-10T10:00:00Z',
  updatedAt: '2026-03-15T14:30:00Z',
};

const ENDPOINT_2 = {
  id: 'ep_test_endpoint_2',
  url: 'https://staging.example.com/hooks',
  description: 'Staging endpoint',
  disabled: true,
  version: 1,
  rateLimit: 50,
  filterTypes: [],
  channels: ['tenant_a'],
  headers: { 'X-Api-Key': 'secret123' },
  createdAt: '2026-03-12T08:00:00Z',
  updatedAt: '2026-03-14T09:00:00Z',
};

const ENDPOINTS_LIST = { data: [ENDPOINT_1, ENDPOINT_2], done: true, iterator: null };

const SECRET = { key: 'whsec_test_secret_key_12345' };

const ATTEMPT_SUCCESS = {
  id: 'atmpt_success_1',
  msgId: 'msg_test_message_1',
  endpointId: 'ep_test_endpoint_1',
  status: 0,
  responseStatusCode: 200,
  response: '{"ok":true}',
  timestamp: '2026-03-15T12:00:00Z',
};

const ATTEMPT_FAIL = {
  id: 'atmpt_fail_1',
  msgId: 'msg_test_message_2',
  endpointId: 'ep_test_endpoint_1',
  status: 2,
  responseStatusCode: 500,
  response: 'Internal Server Error',
  timestamp: '2026-03-15T11:00:00Z',
};

const ATTEMPTS_LIST = { data: [ATTEMPT_SUCCESS, ATTEMPT_FAIL], done: true, iterator: null };

const MESSAGE_1 = {
  id: 'msg_test_message_1',
  eventType: 'order.created',
  payload: { orderId: 'ORD-001', amount: 99.99 },
  channels: ['tenant_a'],
  tags: [],
  timestamp: '2026-03-15T12:00:00Z',
};

const MESSAGE_2 = {
  id: 'msg_test_message_2',
  eventType: 'user.signup',
  payload: { userId: 'usr_abc', email: 'test@example.com' },
  channels: [],
  tags: ['important'],
  timestamp: '2026-03-15T11:00:00Z',
};

const MESSAGES_LIST = { data: [MESSAGE_1, MESSAGE_2], done: true, iterator: null };

const EVENT_TYPE_1 = {
  name: 'order.created',
  description: 'Fired when a new order is placed',
  schemas: null,
  archived: false,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const EVENT_TYPE_2 = {
  name: 'user.signup',
  description: 'New user registration',
  schemas: null,
  archived: false,
  createdAt: '2026-03-02T00:00:00Z',
  updatedAt: '2026-03-02T00:00:00Z',
};

const EVENT_TYPES_LIST = { data: [EVENT_TYPE_1, EVENT_TYPE_2], done: true, iterator: null };

const RETRY_SCHEDULE_DEFAULT = { retrySchedule: null };
const RETRY_SCHEDULE_CUSTOM = { retrySchedule: [10, 60, 600, 3600] };

const CREATED_ENDPOINT = {
  id: 'ep_newly_created',
  url: 'https://new-endpoint.example.com/hook',
  description: 'New endpoint',
  disabled: false,
  version: 1,
  rateLimit: null,
  filterTypes: [],
  channels: [],
  headers: {},
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-20T10:00:00Z',
};

const CREATED_EVENT_TYPE = {
  name: 'payment.completed',
  description: 'Payment was processed',
  schemas: null,
  archived: false,
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-20T10:00:00Z',
};

const CREATED_MESSAGE = {
  id: 'msg_newly_sent',
  eventType: 'order.created',
  payload: { message: 'test webhook' },
  channels: [],
  tags: [],
  timestamp: '2026-03-20T10:00:00Z',
};

module.exports = {
  ENDPOINT_1, ENDPOINT_2, ENDPOINTS_LIST,
  SECRET,
  ATTEMPT_SUCCESS, ATTEMPT_FAIL, ATTEMPTS_LIST,
  MESSAGE_1, MESSAGE_2, MESSAGES_LIST,
  EVENT_TYPE_1, EVENT_TYPE_2, EVENT_TYPES_LIST,
  RETRY_SCHEDULE_DEFAULT, RETRY_SCHEDULE_CUSTOM,
  CREATED_ENDPOINT, CREATED_EVENT_TYPE, CREATED_MESSAGE,
};
