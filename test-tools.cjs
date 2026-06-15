const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Simulate calling useDicomTools programmatically to see if there are errors
  await page.evaluate(async () => {
    try {
      const cornerstone = window.cornerstone;
      const cornerstoneTools = (await import('/node_modules/cornerstone-tools/dist/cornerstoneTools.js')).default;
      console.log('Tools available:', cornerstoneTools.store.state.tools);
    } catch(e) {
      console.error('Crash in checking tools:', e.message);
    }
  });

  await browser.close();
})();
