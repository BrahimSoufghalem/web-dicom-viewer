import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.error('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Check if we can find the file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('File input found. Uploading test.dcm...');
      const filePath = path.resolve('./test.dcm');
      await fileInput.uploadFile(filePath);
      
      console.log('File uploaded. Waiting 3 seconds for rendering...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if Viewer is present
      const viewer = await page.$('.viewer-wrapper');
      console.log('Viewer present?', !!viewer);

      // Now click on MPR button
      const mprBtn = await page.$('button[title="عرض ثلاثي الأبعاد (MPR)"]');
      if (mprBtn) {
        console.log('Clicking MPR button...');
        await mprBtn.click();
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('MPR button not found!');
        
        // Try finding by text or alternative if title is different
        const buttons = await page.$$('button');
        console.log('Total buttons:', buttons.length);
      }
    } else {
      console.log('Could not find file input');
    }
    
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    await browser.close();
  }
})();
