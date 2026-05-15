import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    indexedDB.deleteDatabase('ShiftMgrDB');
  });
  await page.reload({ waitUntil: 'networkidle' });
});

test('トップ画面から新規シフト作成へ遷移できる', async ({ page }) => {
  await page.goto('/home');
  await page.locator('main').getByRole('button', { name: '新規シフト作成' }).click();
  await expect(page).toHaveURL(/\/shift\/create$/);
});

test('新規シフト作成からシフト結果へ遷移できる', async ({ page }) => {
  await page.goto('/shift/create');
  await page.locator('main').getByRole('button', { name: 'シフト作成', exact: true }).click();
  await expect(page.getByText('シフトを作成しています...')).toBeVisible();
  await expect(page).toHaveURL(/\/shift\/result$/, { timeout: 8000 });
});

test('作業内容設定をポップアップで開閉できる', async ({ page }) => {
  await page.goto('/shift/create');
  await page.locator('main').getByRole('button', { name: '作業内容を追加する' }).click();
  await expect(page.getByTestId('set-task-dialog')).toBeVisible();
  await page.getByTestId('set-task-cancel').click();
  await expect(page.getByTestId('set-task-dialog')).toBeHidden();
});
