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
        
        # Wait 5 seconds for it to be black
        page.wait_for_timeout(5000)
        page.screenshot(path="before_force_render.png")
        print("Screenshot before force render saved.")
        
        # Now use page.evaluate to force a resize and render on the window!
        # Cornerstone3D attaches the engine to the window? No, but we can resize the window to trigger the internal ResizeObserver!
        print("Resizing browser window to force Cornerstone internal resize event...")
        page.set_viewport_size({"width": 1200, "height": 800})
        page.wait_for_timeout(2000)
        
        page.screenshot(path="after_window_resize.png")
        print("Screenshot after window resize saved.")

    browser.close()
