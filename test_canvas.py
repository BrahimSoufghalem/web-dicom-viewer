from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    # Load 1 file
    dicom_dir = "/home/BArch/C121/Full_Dose"
    import os
    files = []
    for f in os.listdir(dicom_dir):
        if f.endswith('.dcm'):
            files.append(os.path.join(dicom_dir, f))
    files = files[:10]
    
    file_input = page.locator('input[type="file"]').first
    file_input.set_input_files(files)
    
    page.wait_for_timeout(5000)
    
    # Evaluate JS to get canvas sizes
    sizes = page.evaluate('''() => {
        const canvases = document.querySelectorAll('canvas');
        return Array.from(canvases).map(c => ({
            width: c.width,
            height: c.height,
            clientWidth: c.clientWidth,
            clientHeight: c.clientHeight,
            styleWidth: c.style.width,
            styleHeight: c.style.height
        }));
    }''')
    print("Canvas dimensions (2D mode):", sizes)

    # Click 2x2
    layout_btn = page.locator('button', has_text="2x2")
    if layout_btn.is_visible():
        layout_btn.click()
        page.wait_for_timeout(2000)
        sizes = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('canvas')).map(c => ({
                width: c.width, height: c.height
            }));
        }''')
        print("Canvas dimensions (2x2 mode):", sizes)

    # Click MPR
    mpr_btn = page.locator('button', has_text="MPR").first
    if mpr_btn.is_visible():
        mpr_btn.click()
        page.wait_for_timeout(5000)
        sizes = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('canvas')).map(c => ({
                width: c.width, height: c.height
            }));
        }''')
        print("Canvas dimensions (MPR mode):", sizes)

    browser.close()
