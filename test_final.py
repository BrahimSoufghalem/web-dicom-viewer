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
    files = files[:10]

    if files:
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(files)
        
        # Wait 5 seconds to let Cornerstone decode the image
        page.wait_for_timeout(5000)
        
        # Take screenshot of the 1-window 2D viewport
        page.screenshot(path="final_2d.png")
        print("Screenshot final saved for 2D mode.")
        
        # Now click MPR
        mpr_btn = page.locator('button', has_text="MPR").first
        if mpr_btn.is_visible():
            mpr_btn.click()
            page.wait_for_timeout(5000)
            page.screenshot(path="final_mpr.png")
            print("Screenshot final saved for MPR mode.")

    browser.close()
