from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    dicom_dir = "/home/BArch/C121/Full_Dose"
    files = []
    for root, dirs, filenames in os.walk(dicom_dir):
        for f in filenames:
            if f.endswith('.dcm') or '.' not in f:
                files.append(os.path.join(root, f))
    
    # Load all files in Full_Dose
    files = files[:391]

    if files:
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(files)
        
        # Wait for rendering
        page.wait_for_timeout(10000)
        
        page.screenshot(path="full_dir_2d.png")
        print("Screenshot saved for 2D mode with 391 files.")
        
        mpr_btn = page.locator('button', has_text="MPR").first
        if mpr_btn.is_visible():
            mpr_btn.click()
            page.wait_for_timeout(10000)
            page.screenshot(path="full_dir_mpr.png")
            print("Screenshot saved for MPR mode with 391 files.")

    browser.close()
