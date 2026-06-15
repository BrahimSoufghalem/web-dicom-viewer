const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshot.png' });
  const html = await page.content();
  console.log("HTML CONTENT:", html.substring(0, 500));
  await browser.close();
})();
