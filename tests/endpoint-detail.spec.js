const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

test.beforeEach(async ({ page }) => {
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  await page.locator('h3').filter({ hasText: 'Webhook Endpoints' }).waitFor({ timeout: 10000 });

  const firstRow = page.locator('table.wh-table tbody tr').first();
  await firstRow.locator('button.wh-url').filter({ hasText: data.ENDPOINT_1.url }).click();
  await page.waitForTimeout(500);

  await expect(page.locator('a').filter({ hasText: '← Back to Endpoints' })).toBeVisible();
  resetCalls();
});

test.describe('Endpoint Detail', () => {
  test('shows endpoint URL and description', async ({ page }) => {
    await expect(page.locator('.wh-url').filter({ hasText: data.ENDPOINT_1.url })).toBeVisible();
    await expect(page.getByText(data.ENDPOINT_1.description)).toBeVisible();
  });

  test('renders delivery stats correctly', async ({ page }) => {
    const deliveryCard = page
      .locator('.wh-detail-main .wh-api-card')
      .filter({ has: page.getByRole('heading', { name: 'Delivery Stats' }) });

    // Counts come from the mocked attempts list (1 success, 1 failed, 0 pending), not a stale aggregate (e.g. 6).
    const statNums = deliveryCard.locator('div[style*="24px"]');
    await expect(statNums.nth(0)).toHaveText('1');
    await expect(statNums.nth(1)).toHaveText('1');
    await expect(statNums.nth(2)).toHaveText('0');

    await expect(deliveryCard.getByText('Successful')).toBeVisible();
    await expect(deliveryCard.getByText('Failed')).toBeVisible();
    await expect(deliveryCard.getByText('Pending')).toBeVisible();

    await expect(deliveryCard.locator(':scope > div').nth(1)).toBeVisible();
  });

  test('shows message attempts table', async ({ page }) => {
    const table = page.locator('.wh-detail-main table.wh-table');
    await expect(table.getByRole('columnheader', { name: /status/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /http/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /message id/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /timestamp/i })).toBeVisible();

    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(2);

    const row0 = rows.nth(0);
    await expect(row0.getByText('Success')).toBeVisible();
    await expect(row0.getByText('200')).toBeVisible();

    const row1 = rows.nth(1);
    await expect(row1.getByText('Failed')).toBeVisible();
    await expect(row1.getByText('500')).toBeVisible();
  });

  test('filters attempts by succeeded/failed', async ({ page }) => {
    const table = page.locator('.wh-detail-main table.wh-table');
    const rows = table.locator('tbody tr');

    const main = page.locator('.wh-detail-main');
    await main.getByRole('button', { name: 'Succeeded' }).click();
    await page.waitForTimeout(500);
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText('msg_test_message_1')).toBeVisible();
    await expect(rows.first().getByText('msg_test_message_2')).toHaveCount(0);

    await main.getByRole('button', { name: 'Failed', exact: true }).click();
    await page.waitForTimeout(500);
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByText('msg_test_message_2')).toBeVisible();

    await main.getByRole('button', { name: 'All' }).click();
    await page.waitForTimeout(500);
    await expect(rows).toHaveCount(2);
  });

  test('navigates to message detail when clicking message ID', async ({ page }) => {
    await page
      .locator('.wh-detail-main table.wh-table tbody a')
      .filter({ hasText: 'msg_test_message_1' })
      .click();
    await page.waitForTimeout(500);

    await expect(page.locator('a').filter({ hasText: '← Back to Messages' })).toBeVisible();

    await expect(page.getByText('order.created').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Message Payload' })).toBeVisible();
    await expect(
      page.locator('pre').filter({ visible: true }).filter({ hasText: '"orderId"' }).first(),
    ).toBeVisible();
    await expect(page.getByText('ORD-001').filter({ visible: true }).first()).toBeVisible();

    const msgGet = lastCall('GET', 'app/user_1/msg/msg_test_message_1/');
    expect(msgGet, 'expected GET app/user_1/msg/msg_test_message_1/').toBeTruthy();
    expect(msgGet.path).toBe('app/user_1/msg/msg_test_message_1/');
  });

  test('sidebar shows endpoint metadata', async ({ page }) => {
    const sidebar = page.locator('.wh-detail-sidebar');

    await expect(sidebar.getByText('Active').first()).toBeVisible();
    await expect(sidebar.getByText('Version', { exact: true }).locator('xpath=following-sibling::div[1]')).toHaveText('1');
    await expect(sidebar.getByText('Rate Limit', { exact: true }).locator('xpath=following-sibling::div[1]')).toHaveText('None');

    await expect(sidebar.getByText('Created', { exact: true }).locator('xpath=following-sibling::div[1]')).toContainText('2026');
    await expect(sidebar.getByText('Last Updated', { exact: true }).locator('xpath=following-sibling::div[1]')).toContainText('2026');

    await expect(sidebar.getByText('Subscribed Events')).toBeVisible();
    await expect(sidebar.getByText('order.created')).toBeVisible();
    await expect(sidebar.getByText('user.signup')).toBeVisible();

    await expect(sidebar.getByText('Signing Secret')).toBeVisible();
    await expect(sidebar.getByText('••••••••••••••••••')).toBeVisible();
  });

  test('show/hide signing secret', async ({ page }) => {
    const sidebar = page.locator('.wh-detail-sidebar');

    await sidebar.getByRole('button', { name: 'Show' }).click();
    await page.waitForTimeout(500);
    await expect(sidebar.getByText(data.SECRET.key)).toBeVisible();

    await sidebar.getByRole('button', { name: 'Hide' }).click();
    await page.waitForTimeout(500);
    await expect(sidebar.getByText('••••••••••••••••••')).toBeVisible();
  });

  test('Edit button opens edit form', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.waitForTimeout(500);

    const form = page.locator('.wh-form');
    await expect(form).toBeVisible();
    const urlInput = form.locator('input').first();
    const descInput = form.locator('input').nth(1);
    await expect(urlInput).toHaveValue(data.ENDPOINT_1.url);
    await expect(descInput).toHaveValue(data.ENDPOINT_1.description);

    await form.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);
    await expect(form).toBeHidden();
  });

  test('subtabs: Overview / Testing / Advanced', async ({ page }) => {
    await expect(page.locator('.wh-tab.active').filter({ hasText: 'Overview' })).toBeVisible();

    await page.locator('.wh-tab').filter({ hasText: 'Testing' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Send Test Webhook' })).toBeVisible();

    await page.locator('.wh-tab').filter({ hasText: 'Advanced' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: 'Retry Policy' })).toBeVisible();
  });

  test('Testing tab: send test webhook', async ({ page }) => {
    await page.locator('.wh-tab').filter({ hasText: 'Testing' }).click();
    await page.waitForTimeout(500);

    const testCard = page.locator('.wh-api-card').filter({ has: page.getByRole('heading', { name: 'Send Test Webhook' }) });
    await testCard.locator('select').selectOption('order.created');
    await testCard.locator('textarea').fill(JSON.stringify({ orderId: 'ORD-999', amount: 1 }, null, 2));

    const postBefore = findCalls('POST', 'app/user_1/msg/').length;
    await testCard.getByRole('button', { name: 'Send Example' }).click();
    await page.waitForTimeout(500);

    expect(findCalls('POST', 'app/user_1/msg/').length).toBeGreaterThan(postBefore);
    const post = lastCall('POST', 'app/user_1/msg/');
    expect(post.body).toMatchObject({
      eventType: 'order.created',
      payload: { orderId: 'ORD-999', amount: 1 },
    });
  });

  test('Advanced tab: save rate limit', async ({ page }) => {
    await page.locator('.wh-tab').filter({ hasText: 'Advanced' }).click();
    await page.waitForTimeout(500);

    const rateCard = page.locator('.wh-api-card').filter({ has: page.getByRole('heading', { name: 'Rate Limiting' }) });
    await rateCard.locator('input[type="number"]').fill('100');
    await rateCard.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    const patch = lastCall('PATCH', 'app/user_1/endpoint/ep_test_endpoint_1/');
    expect(patch, 'expected PATCH app/user_1/endpoint/ep_test_endpoint_1/').toBeTruthy();
    expect(patch.body).toMatchObject({ rateLimit: 100 });
  });

  test('context menu shows actions', async ({ page }) => {
    await page.getByRole('button', { name: '⋮' }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'Recover failed messages...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Replay missing messages...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bulk replay messages...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disable Endpoint' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });
});
