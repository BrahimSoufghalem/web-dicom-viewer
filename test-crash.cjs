const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  fs.writeFileSync('dummy.dcm', 'not-a-real-dicom');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  const input = await page.$('input[type="file"]');
  await input.setInputFiles('dummy.dcm');
  
  // wait a bit
  await page.waitForTimeout(2000);
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  if (rootHtml.length < 100) {
    console.log("ROOT HTML IS EMPTY! REACT CRASHED!");
  } else {
    console.log("React did not crash.");
  }
  
  await browser.close();
})();
