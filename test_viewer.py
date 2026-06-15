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
    
    files = files[:100]

    if len(files) == 0:
        print("No DICOM files found in Full_Dose!")
    else:
        print(f"Uploading {len(files)} files...")
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(files)
        
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        
        # Wait 10 seconds for loading
        page.wait_for_timeout(10000)
        
        page.screenshot(path="debug_viewer_1.png")
        print("Screenshot saved to debug_viewer_1.png")
        
        # Click 1x1 to explicitly test 1-window
        layout_btn = page.locator('button', has_text="1x1")
        if layout_btn.is_visible():
            layout_btn.click()
            page.wait_for_timeout(2000)
        
        page.screenshot(path="debug_viewer_1x1.png")
        print("Screenshot saved to debug_viewer_1x1.png")

        # Click MPR
        try:
            mpr_btn = page.locator('button', has_text="MPR").first
            if mpr_btn.is_visible():
                mpr_btn.click()
                print("Clicked MPR button")
                page.wait_for_timeout(15000)
                page.screenshot(path="debug_viewer_mpr.png")
                print("Screenshot saved to debug_viewer_mpr.png")
        except Exception as e:
            print("Could not click MPR:", e)

    browser.close()
