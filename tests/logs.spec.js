const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

test.beforeEach(async ({ page }) => {
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  await page.getByRole('button', { name: 'Logs' }).click();
  await page.waitForTimeout(1000);
  await page.locator('h3').filter({ hasText: 'Message Logs' }).waitFor({ timeout: 10000 });
  resetCalls();
});

test.describe('Logs Panel', () => {
  test('renders message list', async ({ page }) => {
    const table = page.locator('table.wh-table').first();
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Event Type' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Message ID' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Channels' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'order.created' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'user.signup' })).toBeVisible();
    await expect(page.getByText('2 messages', { exact: true })).toBeVisible();
  });

  test('shows Filters button', async ({ page }) => {
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByPlaceholder('e.g. order.created')).toBeVisible();
    await expect(page.getByPlaceholder('Filter by tag')).toBeVisible();
    await expect(page.getByPlaceholder('Filter by channel')).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]').nth(0)).toBeVisible();
    await expect(page.locator('input[type="datetime-local"]').nth(1)).toBeVisible();
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByPlaceholder('e.g. order.created')).toBeHidden();
  });

  test('jump to message by ID', async ({ page }) => {
    await page.getByPlaceholder('Jump to message ID').fill(data.MESSAGE_1.id);
    await page.getByRole('button', { name: 'Go' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('a').filter({ hasText: '← Back to Messages' })).toBeVisible();
    const msgGets = findCalls('GET', `msg/${data.MESSAGE_1.id}/`);
    expect(msgGets.some((c) => c.path === `app/user_1/msg/${data.MESSAGE_1.id}/`)).toBeTruthy();
  });

  test('message detail shows payload', async ({ page }) => {
    const firstRow = page.locator('table.wh-table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('order.created').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Message Payload' })).toBeVisible();
    const payloadPre = page.locator('.wh-api-card').filter({ hasText: 'Message Payload' }).locator('pre');
    await expect(payloadPre.filter({ hasText: 'orderId' })).toBeVisible();
    await expect(page.locator('button.btn-sm').filter({ hasText: 'Formatted' })).toBeVisible();
    await expect(page.locator('button.btn-sm').filter({ hasText: 'Raw' })).toBeVisible();
  });

  test('message detail shows delivery attempts', async ({ page }) => {
    await page.locator('table.wh-table tbody tr').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Delivery Attempts' })).toBeVisible();
    const attTable = page.locator('table.wh-table').filter({ has: page.getByRole('columnheader', { name: 'Endpoint' }) });
    await expect(attTable.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(attTable.getByRole('columnheader', { name: 'HTTP' })).toBeVisible();
    await expect(attTable.getByRole('columnheader', { name: 'Endpoint' })).toBeVisible();
    await expect(attTable.getByRole('columnheader', { name: 'Response' })).toBeVisible();
    await expect(attTable.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
    const attemptGets = findCalls('GET', `attempt/msg/${data.MESSAGE_1.id}/`);
    expect(attemptGets.some((c) => c.path === `app/user_1/attempt/msg/${data.MESSAGE_1.id}/`)).toBeTruthy();
  });

  test('refresh button reloads messages', async ({ page }) => {
    const before = findCalls('GET', 'app/user_1/msg/').filter((c) => c.path === 'app/user_1/msg/').length;
    await page.getByRole('button', { name: '↻' }).click();
    await page.waitForTimeout(500);
    const after = findCalls('GET', 'app/user_1/msg/').filter((c) => c.path === 'app/user_1/msg/').length;
    expect(after).toBeGreaterThan(before);
  });

  test('clicking message row opens detail', async ({ page }) => {
    await page.locator('table.wh-table tbody tr').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('a').filter({ hasText: '← Back to Messages' })).toBeVisible();
  });
});
