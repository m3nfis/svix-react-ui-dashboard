const { test, expect } = require('@playwright/test');
const { setupMockApi, apiCalls, resetCalls, findCalls, lastCall } = require('./fixtures/api-interceptor');
const data = require('./fixtures/mock-data');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('vibey_wh_guide_dismissed', '1');
    } catch {
      /* ignore: localStorage may be unavailable */
    }
  });
  await setupMockApi(page);
  await page.goto('/');
  await page.waitForSelector('.svix-ui', { timeout: 15000 });
  resetCalls();
});

test.describe('HOC & UI Controls', () => {
  test('renders inside .svix-ui container', async ({ page }) => {
    await expect(page.locator('.svix-ui')).toBeVisible();
  });

  test('displays configured title and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Test Harness — Svix UI' })).toBeVisible();
    await expect(page.getByText('Testing the open-source package', { exact: false })).toBeVisible();
  });

  test('shows Svix link in subtitle', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Svix' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com\/svix\/svix-webhooks/);
  });

  test('tab navigation works', async ({ page }) => {
    const tabs = ['Endpoints', 'Event Catalog', 'Logs', 'Activity'];
    for (const label of tabs) {
      await expect(page.locator('button.wh-tab', { hasText: label })).toBeVisible();
    }

    const endpointsTab = page.locator('button.wh-tab', { hasText: 'Endpoints' });
    const catalogTab = page.locator('button.wh-tab', { hasText: 'Event Catalog' });
    const logsTab = page.locator('button.wh-tab', { hasText: 'Logs' });
    const activityTab = page.locator('button.wh-tab', { hasText: 'Activity' });

    await endpointsTab.click();
    await page.waitForTimeout(500);
    await expect(endpointsTab).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: 'Webhook Endpoints' })).toBeVisible();

    await catalogTab.click();
    await page.waitForTimeout(500);
    await expect(catalogTab).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: 'Event Catalog' })).toBeVisible();

    await logsTab.click();
    await page.waitForTimeout(500);
    await expect(logsTab).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: 'Message Logs' })).toBeVisible();

    await activityTab.click();
    await page.waitForTimeout(500);
    await expect(activityTab).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: 'Activity Overview' })).toBeVisible();
  });

  test('How it works guide toggle', async ({ page }) => {
    const toggle = page.locator('.wh-page-header-actions').getByRole('button', { name: 'How it works' });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(500);

    const guide = page.locator('.wh-api-card').filter({ has: page.locator('h4', { hasText: 'How it works' }) });
    await expect(guide).toBeVisible();
    await expect(page.locator('.wh-page-header-actions').getByRole('button', { name: 'Hide guide' })).toBeVisible();

    await page.locator('.wh-page-header-actions').getByRole('button', { name: 'Hide guide' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.wh-api-card').filter({ has: page.locator('h4', { hasText: 'How it works' }) })).toHaveCount(0);
    await expect(page.locator('.wh-page-header-actions').getByRole('button', { name: 'How it works' })).toBeVisible();
  });

  test('guide content: quick start section', async ({ page }) => {
    await page.locator('.wh-page-header-actions').getByRole('button', { name: 'How it works' }).click();
    await page.waitForTimeout(500);

    const guide = page.locator('.wh-api-card').filter({ has: page.locator('h4', { hasText: 'How it works' }) });
    await expect(guide).toBeVisible();

    await guide.locator('summary').filter({ hasText: 'Quick start' }).click();
    await page.waitForTimeout(300);
    await expect(guide.getByText('Add an endpoint', { exact: false })).toBeVisible();
    await expect(guide.getByText('Define event types', { exact: false })).toBeVisible();
  });

  test('API Credentials toggle', async ({ page }) => {
    const openBtn = page.locator('.wh-page-header-actions').getByRole('button', { name: 'API Credentials' });
    await openBtn.click();
    await page.waitForTimeout(500);

    const card = page
      .locator('.wh-api-card')
      .filter({ has: page.locator('.wh-grid-3') })
      .filter({ has: page.getByText('API URL', { exact: true }) });
    await expect(card).toBeVisible();
    await expect(card.getByText('Auth Token', { exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Copy' })).toHaveCount(3);

    await page.locator('.wh-page-header-actions').getByRole('button', { name: 'Hide API' }).click();
    await page.waitForTimeout(500);
    await expect(card).toBeHidden();
  });

  test('API Credentials shows curl examples', async ({ page }) => {
    await page.locator('.wh-page-header-actions').getByRole('button', { name: 'API Credentials' }).click();
    await page.waitForTimeout(500);

    const card = page.locator('.wh-api-card').filter({ has: page.locator('summary').filter({ hasText: 'cURL examples' }) });
    await card.locator('summary').filter({ hasText: 'cURL examples' }).click();
    await page.waitForTimeout(300);

    await expect(card.getByText('Send a message', { exact: true })).toBeVisible();
    await expect(card.getByText('Add an endpoint', { exact: true })).toBeVisible();
    await expect(card.getByText('Add an event type', { exact: true })).toBeVisible();
  });

  test('header buttons are all present', async ({ page }) => {
    const actions = page.locator('.wh-page-header-actions');
    await expect(actions.getByRole('button', { name: 'How it works' })).toBeVisible();
    await expect(actions.getByRole('button', { name: 'API Credentials' })).toBeVisible();
    await expect(actions.getByRole('button', { name: 'API Docs' })).toBeVisible();
  });

  test('Endpoints tab is default active', async ({ page }) => {
    await expect(page.locator('button.wh-tab', { hasText: 'Endpoints' })).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: 'Webhook Endpoints' })).toBeVisible();
  });
});
