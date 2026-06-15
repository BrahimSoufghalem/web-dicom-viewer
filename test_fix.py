from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))
    
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    dicom_dir = "/home/BArch/C121/Full_Dose"
    files = []
    for root, dirs, filenames in os.walk(dicom_dir):
        for f in filenames:
            if f.endswith('.dcm') or '.' not in f:
                files.append(os.path.join(root, f))
    
    files = files[:391]

    if files:
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(files)
        
        # Wait for rendering
        page.wait_for_timeout(5000)
        page.screenshot(path="fix_2d.png")
        print("Screenshot saved for 2D mode.")

        # Click MPR
        mpr_button = page.locator('button', has_text='3D MPR').first
        mpr_button.click()
        page.wait_for_timeout(8000)
        page.screenshot(path="fix_mpr.png")
        print("Screenshot saved for MPR mode.")

    browser.close()
