const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

/**
 * Event Catalog tab — list, categories, scope, CRUD, retry schedule.
 * Dev server at baseURL (playwright.config.js), Svix API mocked at fixtures/api-interceptor.js.
 */

/** Main catalog row (categories sidebar + cards); sibling of the Event Catalog toolbar under the tab panel. */
function eventCatalogListRow(page) {
  const toolbar = page.locator('.wh-toolbar').filter({ has: page.getByRole('heading', { name: 'Event Catalog' }) });
  return toolbar.locator('..').locator('> div').filter({ has: page.getByText('Categories', { exact: true }) });
}

function eventTypeCards(page) {
  return eventCatalogListRow(page).locator('.wh-api-card');
}

/** List GET uses path `event-type/`; per-type GETs also match `includes('event-type/')`. */
function listEventTypeGets() {
  return findCalls('GET', 'event-type/').filter((c) => c.path === 'event-type/');
}

function lastListEventTypeGet() {
  return listEventTypeGets().at(-1) || null;
}

/** PATCH/DELETE use path `event-type/{name}/` — not retry-schedule subpaths. */
function lastCallExactPath(method, exactPath) {
  const matches = findCalls(method, 'event-type/').filter((c) => c.path === exactPath);
  return matches.at(-1) || null;
}

/** Left column: Categories + All (N); group headers come from the first segment of each event name. */
function categorySidebar(page) {
  return page.getByText('All (2)', { exact: true }).locator('xpath=..');
}

test.beforeEach(async ({ page }) => {
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  await page.locator('button.wh-tab').filter({ hasText: 'Event Catalog' }).click();
  await page.waitForTimeout(1000);
  await page.locator('h3').filter({ hasText: 'Event Catalog' }).waitFor({ timeout: 10000 });
  resetCalls();
});

test.describe('Event Catalog', () => {
  test('renders event types list', async ({ page }) => {
    const cards = eventTypeCards(page);
    await expect(cards.nth(0).locator('code').first()).toHaveText('order.created');
    await expect(cards.nth(1).locator('code').first()).toHaveText('user.signup');
    await expect(cards.nth(0)).toContainText(data.EVENT_TYPE_1.description);
    await expect(cards.nth(1)).toContainText(data.EVENT_TYPE_2.description);
    await expect(page.getByText('2 event types', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'All' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Mine' }).click();
    await page.waitForTimeout(500);
    expect(listEventTypeGets().length).toBeGreaterThanOrEqual(1);
  });

  test('shows category sidebar', async ({ page }) => {
    const side = categorySidebar(page);
    await expect(side.getByText('Categories', { exact: true })).toBeVisible();
    await expect(page.getByText('All (2)', { exact: true })).toBeVisible();
    await expect(side.getByText('order', { exact: true })).toBeVisible();
    await expect(side.getByText('user', { exact: true })).toBeVisible();
  });

  test('clicking category filters event types', async ({ page }) => {
    const side = categorySidebar(page);
    await side.getByText('order.created', { exact: true }).click();
    await page.waitForTimeout(500);

    const cards = eventTypeCards(page);
    await expect(cards.filter({ hasText: 'order.created' })).toHaveCount(1);
    await expect(cards.filter({ hasText: 'user.signup' })).toHaveCount(0);

    await page.getByText('All (2)', { exact: true }).click();
    await page.waitForTimeout(500);
    await expect(eventTypeCards(page)).toHaveCount(2);
  });

  test('Mine/All scope toggle', async ({ page }) => {
    const mine = page.getByRole('button', { name: 'Mine' });
    const all = page.getByRole('button', { name: 'All' });
    await expect(mine).not.toHaveClass(/btn-ghost/);
    await expect(all).toHaveClass(/btn-ghost/);

    await all.click();
    await page.waitForTimeout(500);
    const scopeAll = lastListEventTypeGet();
    expect(scopeAll).toBeTruthy();
    expect(scopeAll.search).toContain('scope=all');
  });

  test('+ Add Event Type opens form and creates', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Event Type' }).click();
    const form = page.locator('form.wh-form');
    await expect(form).toBeVisible();

    await form.locator('input[placeholder="e.g. user.created"]').fill('payment.completed');
    await form.locator('input[placeholder="Triggered when..."]').fill('Payment was processed');
    await form.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    const post = lastCall('POST', 'event-type/');
    expect(post).toBeTruthy();
    expect(post.path).toBe('event-type/');
    expect(post.body).toMatchObject({
      name: 'payment.completed',
      description: 'Payment was processed',
    });
    await expect(form).toBeHidden();
  });

  test('Edit button opens inline editor', async ({ page }) => {
    const firstCard = eventTypeCards(page).first();
    await firstCard.getByRole('button', { name: 'Edit' }).first().click();
    await page.waitForTimeout(300);

    const input = firstCard.locator('input[placeholder="Description"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue(data.EVENT_TYPE_1.description);

    await input.fill('Updated order description');
    await firstCard.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    const patch = lastCallExactPath('PATCH', 'event-type/order.created/');
    expect(patch).toBeTruthy();
    expect(patch.body).toMatchObject({ description: 'Updated order description' });
  });

  test('Delete button with confirmation', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    const firstCard = eventTypeCards(page).first();
    await firstCard.getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(500);

    const del = lastCallExactPath('DELETE', 'event-type/order.created/');
    expect(del).toBeTruthy();
  });

  test('retry schedule shows default', async ({ page }) => {
    const cards = eventTypeCards(page);
    await expect(cards).toHaveCount(2);
    for (let i = 0; i < 2; i += 1) {
      const card = cards.nth(i);
      await expect(card.getByText('Retry Schedule', { exact: true })).toBeVisible();
      await expect(card.getByText('5s', { exact: true })).toBeVisible();
      await expect(card.getByText('5m', { exact: true })).toBeVisible();
      await expect(card.getByText('30m', { exact: true })).toBeVisible();
    }
  });

  test('edit retry schedule with custom values', async ({ page }) => {
    const firstCard = eventTypeCards(page).first();
    await firstCard
      .getByText('Retry Schedule', { exact: true })
      .locator('xpath=../..')
      .getByRole('button', { name: 'Edit' })
      .click();
    await page.waitForTimeout(300);

    const retryInput = firstCard.locator('input[placeholder="5, 300, 1800, 7200"]');
    await expect(retryInput).toBeVisible();
    await retryInput.fill('10, 60, 600');
    await retryInput.locator('xpath=..').getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(500);

    const put = findCalls('PUT', 'retry-schedule/').find((c) => c.path === 'event-type/order.created/retry-schedule/');
    expect(put).toBeTruthy();
    expect(put.body).toEqual({ retrySchedule: [10, 60, 600] });
  });

  test('retry schedule preset buttons', async ({ page }) => {
    const firstCard = eventTypeCards(page).first();
    await firstCard
      .getByText('Retry Schedule', { exact: true })
      .locator('xpath=../..')
      .getByRole('button', { name: 'Edit' })
      .click();
    await page.waitForTimeout(300);

    const retryInput = firstCard.locator('input[placeholder="5, 300, 1800, 7200"]');
    await firstCard.getByRole('button', { name: /aggressive/i }).click();
    await expect(retryInput).toHaveValue('2, 10, 30, 120, 300');
    await firstCard.getByRole('button', { name: /relaxed/i }).click();
    await expect(retryInput).toHaveValue('60, 600, 3600, 14400, 43200, 86400');
  });
});
