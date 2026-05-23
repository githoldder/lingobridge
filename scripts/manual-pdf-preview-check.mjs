import { chromium } from 'playwright';
import path from 'node:path';

const root = '/Users/caolei/Desktop/LingoBridge';
const screenshotPath = '/private/tmp/lingobridge-pdf-preview.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });

const messages = [];
const network = [];
page.on('console', (msg) => messages.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => messages.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (request) => {
  network.push(`[failed] ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
});
page.on('response', (response) => {
  const url = response.url();
  if (url.includes('/api/v1/coursewares') || url.includes('/uploads/') || url.includes('pdf.worker')) {
    network.push(`[${response.status()}] ${url} ${response.headers()['content-type'] || ''}`);
  }
});

await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
if (!(await page.getByText('My Courses').isVisible().catch(() => false))) {
  await page.getByRole('button', { name: 'Login' }).first().click();
  await page.waitForSelector('input', { timeout: 10000 });
  const inputs = await page.locator('input').all();
  if (inputs.length < 2) {
    throw new Error(`Login form did not expose two inputs. Current text: ${await page.locator('body').innerText()}`);
  }
  await inputs[0].fill('teacher@test.com');
  await inputs[1].fill('Test@123456');
  await page.getByRole('button', { name: /^Login/ }).click();
}
await page.waitForSelector('text=My Courses', { timeout: 15000 }).catch(async () => {
  await page.getByRole('button', { name: 'Courses' }).nth(1).click();
});
await page.waitForSelector('text=Enter Class', { timeout: 15000 });
await page.getByRole('button', { name: 'Enter Class' }).first().click();
await page.waitForSelector('#classroom-view', { timeout: 15000 });

await page.locator('[data-testid="btn-settings"]').click();
await page.locator('input[type="file"]').setInputFiles(path.join(root, 'samples/test_courseware.pdf'));
await page.waitForResponse((response) => response.url().includes('/api/v1/coursewares') && response.request().method() === 'POST', { timeout: 30000 });
await page.waitForSelector('[data-testid="pdf-page-canvas"]', { timeout: 30000 });
await page.waitForFunction(() => {
  const canvas = document.querySelector('[data-testid="pdf-page-canvas"]');
  return canvas && canvas.width > 300 && canvas.height > 150;
}, { timeout: 20000 }).catch(() => undefined);
await page.waitForTimeout(4000);

const state = await page.evaluate(() => {
  const canvas = document.querySelector('[data-testid="pdf-page-canvas"]');
  const error = document.querySelector('[data-testid="pdf-error"]');
  const reload = [...document.querySelectorAll('button')].some((button) => button.textContent?.includes('重新加载'));
  const indicator = document.querySelector('[data-testid="page-indicator"]')?.textContent || '';
  if (!canvas) return { hasCanvas: false, hasError: Boolean(error), reload, indicator };

  const ctx = canvas.getContext('2d');
  let nonWhitePixels = 0;
  if (ctx && canvas.width > 0 && canvas.height > 0) {
    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 900), Math.min(canvas.height, 700)).data;
    for (let i = 0; i < imageData.length; i += 4) {
      if (
        imageData[i + 3] > 0 &&
        (imageData[i] < 245 || imageData[i + 1] < 245 || imageData[i + 2] < 245)
      ) {
        nonWhitePixels += 1;
      }
    }
  }

  return {
    hasCanvas: true,
    width: canvas.width,
    height: canvas.height,
    cssWidth: canvas.getBoundingClientRect().width,
    cssHeight: canvas.getBoundingClientRect().height,
    nonWhitePixels,
    hasError: Boolean(error),
    reload,
    indicator
  };
});

await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

console.log(JSON.stringify({ screenshotPath, state, network: network.slice(-30), messages: messages.slice(-30) }, null, 2));

if (!state.hasCanvas || state.hasError || state.reload || state.width <= 300 || state.height <= 150 || state.nonWhitePixels <= 0) {
  process.exitCode = 1;
}
