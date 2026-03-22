import { expect, test, type Page } from '@playwright/test';

const DEMO_EMAIL = 'user@mail.ru';
const DEMO_PASSWORD = 'user-123';

function watchRemoteEntry(page: Page): string[] {
  const urls: string[] = [];
  page.on('response', (response) => {
    const u = response.url();
    if (u.includes('remoteEntry.js')) urls.push(u);
  });
  return urls;
}

function isBookingsRemoteEntry(url: string): boolean {
  if (!url.includes('remoteEntry.js')) return false;
  return url.includes('/mf/bookings') || /:3081(\/|$)/.test(url);
}

function isMeetingsRemoteEntry(url: string): boolean {
  if (!url.includes('remoteEntry.js')) return false;
  return url.includes('/mf/meetings') || /:3082(\/|$)/.test(url);
}

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Пароль').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByRole('link', { name: 'Переговорные' })).toBeVisible({ timeout: 20_000 });
}

async function waitForMainText(page: Page, pattern: string) {
  await page.waitForFunction(
    ({ p }) => {
      const re = new RegExp(p);
      const t = document.querySelector('main')?.innerText ?? '';
      return re.test(t);
    },
    { p: pattern },
    { timeout: 60_000 }
  );
}

test.describe('Microfrontends (Module Federation)', () => {
  test('remote «bookings»: remoteEntry на главной после входа, затем /book/by-date', async ({ page }) => {
    const remoteUrls = watchRemoteEntry(page);

    const bookingsEntry = page.waitForResponse(
      (r) => isBookingsRemoteEntry(r.url()),
      { timeout: 60_000 }
    );
    await loginAsDemo(page);
    const res = await bookingsEntry;
    expect(res.ok(), `bookings remoteEntry HTTP ${res.status()}`).toBeTruthy();

    await page.goto('/book', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Забронировать переговорку' })).toBeVisible({
      timeout: 60_000,
    });
    await page
      .getByRole('link', { name: /По дате.*покажем свободные комнаты/i })
      .click();
    await expect(page).toHaveURL(/\/book\/by-date/);

    const byDateHeading = page.getByRole('heading', { name: 'Бронирование по дате' });
    const demoBlocked = page.getByText(/демо-режиме бронирование недоступно/i);
    await expect(byDateHeading.or(demoBlocked)).toBeVisible({ timeout: 60_000 });

    expect(remoteUrls.some((u) => isBookingsRemoteEntry(u))).toBeTruthy();
  });

  test('remote «meetings»: remoteEntry при переходе на /meetings', async ({ page }) => {
    const remoteUrls = watchRemoteEntry(page);
    await loginAsDemo(page);

    const meetingsEntry = page.waitForResponse(
      (r) => isMeetingsRemoteEntry(r.url()),
      { timeout: 60_000 }
    );
    await page.goto('/meetings', { waitUntil: 'domcontentloaded' });
    const res = await meetingsEntry;
    expect(res.ok(), `meetings remoteEntry HTTP ${res.status()}`).toBeTruthy();

    await waitForMainText(page, 'Мои встречи на 2 недели');

    expect(remoteUrls.some((u) => isMeetingsRemoteEntry(u))).toBeTruthy();
  });

  test('remote «admin»: /admin после входа админа, MF + API users', async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_PASSWORD, 'Задайте E2E_ADMIN_PASSWORD для этого теста');

    const email = process.env.E2E_ADMIN_EMAIL || 'admin@mail.ru';
    const password = process.env.E2E_ADMIN_PASSWORD!;

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(password);
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByRole('link', { name: 'Переговорные' })).toBeVisible({ timeout: 25_000 });

    const usersListGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes('/api/auth/users') &&
        !r.url().includes('/users/search'),
      { timeout: 60_000 }
    );

    await page.getByRole('link', { name: 'Админ' }).click();
    await expect(page).toHaveURL(/\/admin/);

    await usersListGet;

    await expect(page.getByRole('heading', { name: 'Пользователи' })).toBeVisible({ timeout: 15_000 });
  });
});
