from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    dicom_dir = "/home/BArch/C121/Full_Dose"
    files = []
    for f in os.listdir(dicom_dir):
        if f.endswith('.dcm'):
            files.append(os.path.join(dicom_dir, f))
    files = files[:10]

    if files:
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(files)
        
        page.wait_for_timeout(5000)
        
        # Check Cornerstone state
        state = page.evaluate('''() => {
            const cs = window.cornerstone || window.cornerstoneCore;
            if (!cs) return "No cornerstone window object";
            
            const engines = cs.getRenderingEngines();
            if (engines.length === 0) return "No engines";
            
            const engine = engines[0];
            const viewports = engine.getViewports();
            
            return viewports.map(vp => {
                const isStack = vp.type === 'stack';
                const hasImage = isStack ? vp.hasImageURI() : vp.hasVolumeId();
                const element = vp.element;
                const canvas = element.querySelector('canvas');
                return {
                    id: vp.id,
                    type: vp.type,
                    hasImage: hasImage,
                    canvasValid: !!canvas,
                    canvasWidth: canvas ? canvas.width : 0,
                    canvasHeight: canvas ? canvas.height : 0
                };
            });
        }''')
        print("Engine state:", state)

    browser.close()
