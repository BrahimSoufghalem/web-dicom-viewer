import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  // Click the 1x2 button (the second button in the toolbar layout group usually)
  // Or just click by title/tooltip "نافذتين"
  const buttons = await page.$$('button.tool-btn');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('نافذتين')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_1x2.png' });
  await browser.close();
})();
