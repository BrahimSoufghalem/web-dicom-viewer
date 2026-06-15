const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Expose initCornerstone to window so we can call it
  await page.evaluate(async () => {
    try {
      // Simulate calling initCornerstone
      const module = await import('/src/features/dicom-viewer/utils/initCornerstone.ts');
      module.initCornerstone();
      console.log('initCornerstone called successfully');
    } catch(e) {
      console.error('Crash in initCornerstone:', e.message);
    }
  });

  await browser.close();
})();
