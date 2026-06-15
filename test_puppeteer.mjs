import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('input[webkitdirectory="true"]');
  console.log("App loaded. Uploading files...");
  
  // Get input and upload files
  const fileInput = await page.$('input[webkitdirectory="true"]');
  // Need to upload a test DICOM file. Let's just create a dummy file.
  // Actually, wait, without a real DICOM, FileUploader will show "invalid DICOM".
  // But if there is a React crash on render, it might show BEFORE the DICOM parsing!
  // No, Viewer only renders WHEN imageIds > 0, which means DICOM MUST BE VALID.
  // We need a sample DICOM.
  await browser.close();
})();
