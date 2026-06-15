import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1000)

        # Let's get files from the Full_Dose directory
        dicom_dir = "/home/BArch/C121/Full_Dose"
        files = []
        for f in os.listdir(dicom_dir):
            if f.endswith('.dcm'):
                files.append(os.path.join(dicom_dir, f))
        
        # Take the first 5 slices to avoid overwhelming the script
        files = files[:5]
        print(f"Uploading {len(files)} files...")

        # We need to simulate folder upload or file upload. 
        # Playwright supports set_input_files with multiple files.
        await page.locator("input[type='file']").first.set_input_files(files)

        await page.wait_for_timeout(3000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
