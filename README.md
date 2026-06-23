# Web DICOM Viewer
## Overview
A high-performance, fully client-side medical imaging platform built with React 19, Vite, and Cornerstone3D. Processes hundreds of CT/MRI images directly in the browser with zero server uploads, keeping patient data strictly private.
A high-performance, fully client-side Medical DICOM Viewer built with React 19, Vite, and Cornerstone3D. The application is designed to process hundreds of medical images (CT/MRI) directly in the browser, ensuring strict patient data privacy by eliminating the need for server uploads. It features a modern dark glassmorphism interface, precise diagnostic tools, advanced 3D Multi-Planar Reconstruction (MPR), 3D Volume Rendering, and interactive Segmentation capabilities.
---
## Key Features
## Screenshot
### Local File Management & Privacy
- **Client-Side Processing:** Complete parsing and rendering of DICOM files within the browser environment. Zero server uploads guarantee absolute data privacy.
- **Bulk Upload:** Support for drag-and-drop of entire directories containing multiple patient studies or complex file hierarchies.
- **Smart Data Categorization:** Automatic extraction and grouping of DICOM headers to categorize patients, studies, and series seamlessly, alongside safe memory clearance protocols.
![Web DICOM Viewer — full viewer interface with CT scans, MPR planes, 3D volume rendering, measurements, and segmentation](docs/screenshot.png)
### Diagnostic Tools & Annotations
- **Navigation & Display:** Precision Zoom, Pan, Cine (Auto-Play) playback, Color Inversion, and instantaneous Window/Level adjustments with predefined presets (Soft Tissue, Lung, Bone, Brain).
- **Advanced Measurements:** Bidirectional tracking, Length, Angle, Rectangle ROI, Elliptical ROI, and Freehand ROI. Includes an interactive Measurement Sidebar to jump directly to specific slice locations and edit tracking labels.
- **Analytical Probe:** A custom-engineered Hounsfield Unit (HU) probe tool designed to bypass standard 2D voxel limitations for precise density readings on both 2D slices and 3D constructed volumes.
- **DICOM Tags Viewer:** Comprehensive modal to inspect detailed DICOM metadata directly from the viewer interface.
---
### 3D Reconstruction & Rendering
- **Multi-Planar Reconstruction (MPR):** Reconstructs stacked 2D images into robust 3D volumes to display Axial, Sagittal, and Coronal planes simultaneously.
- **Synchronized Navigation:** Exact 3D spatial localization across all intersecting planes using synchronizer crosshairs and linked camera states.
- **3D Volume Rendering:** True 3D volume rendering with configurable rendering presets (CT-Bone, CT-Cardiac, MIP, etc.) and interactive rotation, zoom, and clipping capabilities.
## Core Principles
### Medical Segmentation
- **Labelmap Management:** Creation and management of distinct anatomical segments with customizable color palettes.
- **Interactive Tools:** High-performance Brush, Eraser, Circle Scissors, and custom Fill tools designed for localized, plane-specific modifications without artifact bleeding.
- **Performance Optimized:** Employs targeted state management (Zustand shallow tracking) and native rendering engine hooks to eliminate UI freezes during intense segmentation rendering.
- **Privacy by design** — all processing happens locally in the browser. No file ever leaves the machine.
- **Performance first** — Zustand shallow-tracking, Web Workers for decoding, and hardware-accelerated WebGL rendering keep the interface responsive even under heavy datasets.
- **Clinical grade UI** — a dark glassmorphism interface designed to reduce eye strain in low-light reading environments.
### Modern Interface & Accessibility
- **Dark Glassmorphism Theme:** A sleek, dark interface optimized for medical environments to reduce eye strain, featuring hardware-accelerated micro-animations and a responsive layout.
- **Flexible Grid Layouts:** Dynamic viewport configurations including Single View (1x1), Dual View (1x2), Triple View (1+2), and Quad View (2x2), with drag-and-drop series loading.
- **Bilingual Support (i18n):** Full localization for English and French, offering instantaneous switching without page reloads.
---
## Features
### File Management
|
 Capability 
|
 Detail 
|
|
---
|
---
|
|
 Local-only processing 
|
 DICOM files are parsed and rendered entirely in the browser 
|
|
 Bulk drag-and-drop 
|
 Accepts entire directories, single files, or mixed studies 
|
|
 Automatic organization 
|
 Extracts DICOM headers to group files by patient, study, and series automatically 
|
|
 Safe deletion 
|
 Clears series from memory with a confirmation step to prevent accidental loss 
|
---
### 2D Diagnostic Tools
**Navigation**
- Zoom, Pan, and Window/Level adjustment via mouse drag
- Cine (auto-play) playback with adjustable frame rate
- Color inversion for negative display
**Window Presets**
- One-click presets: Soft Tissue, Lung, Bone, Brain
- Manually adjustable WW/WC values shown live in the viewport
**Measurements & Annotations**
- Length, Angle, Rectangle ROI, Elliptical ROI, Freehand ROI
- Bidirectional measurement tracking with labeled markers
- Measurements persist across slices and are listed in a dedicated sidebar
- Click any measurement in the sidebar to jump directly to its slice
**HU Probe Tool**
- Custom-engineered Hounsfield Unit probe that bypasses standard 2D voxel limitations
- Delivers accurate density readings on both 2D slices and reconstructed 3D volumes
**DICOM Metadata**
- Full DICOM tag browser accessible per-viewport
- Displays patient info, acquisition parameters, institution data
---
### 3D Multi-Planar Reconstruction (MPR)
- Reconstructs a full 3D volume from stacked 2D slices
- Simultaneous display of Axial, Sagittal, and Coronal planes in a synchronized layout
- Crosshair tool provides exact spatial localization: moving in one plane updates the cursor position in all others
- Camera zoom and contrast level can be linked across all MPR viewports with a single toggle
---
### 3D Volume Rendering
- Full volumetric rendering directly in the browser via WebGL
- Built-in rendering presets: CT-Bone, CT-Cardiac, MIP, and more
- Interactive rotation, zoom, and clipping in real time
- Supports simultaneous display alongside 2D viewports in the same layout
---
### Segmentation
- Create and manage multiple labeled segments per study, each with a distinct color
- **Brush tool** — freehand painting constrained to the active 2D slice (no cross-slice bleed)
- **Eraser** — pixel-level removal within the active plane
- **Circle and Rectangle Scissors** — geometric region selection and fill
- Segments are stored as Cornerstone3D labelmaps and rendered as colored overlays on the image
- Deleting a segment removes its labelmap data from the volume, not just from the list
---
### Layout & Viewport Management
|
 Layout 
|
 Description 
|
|
---
|
---
|
|
 Single (1×1) 
|
 Full-screen view of one series 
|
|
 Dual (1×2) 
|
 Side-by-side comparison of two series 
|
|
 Triple (1+2) 
|
 One large main viewport plus two secondary panels 
|
|
 Quad (2×2) 
|
 Four independent viewports simultaneously 
|
Each viewport is independent: it can display a different series, a different mode (2D, MPR, 3D), and has its own tool state.
---
### Localization (i18n)
- Full English and French support
- Instantaneous language switching without page reload
- All UI labels, tooltips, and error messages are localized
---
## System Architecture
The system is built upon a strictly separated architecture to ensure uncompromised performance and stability:
```mermaid
flowchart TD
    subgraph Input
        User([User])
        DragDrop["Drag & Drop\nFiles / Folder"]
    end
- **Framework:** React 19 with Vite for rapid bundling and optimal execution.
- **Medical Rendering Engine:** Cornerstone3D utilizing WebGL for hardware-accelerated image processing.
- **State Management:** Zustand, providing a centralized data store to manage patient metadata, segmentation boundaries, measurement tracking, and viewport states while preventing excessive React re-renders.
- **Data Processing:** `dicom-parser` and Cornerstone Web Workers for efficient metadata extraction and background pixel decoding without blocking the main thread.
    subgraph Parsing ["Data Layer"]
        Parser["DICOM Parser\n(dicom-parser)"]
        Workers["Web Workers\n(Pixel Decoding)"]
    end
## Installation and Setup
    subgraph State ["State Management"]
        Zustand[("Zustand Store\nPatients · Series · Viewports\nMeasurements · Segments")]
    end
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
    subgraph UI ["UI Layer"]
        Sidebar["Series Sidebar\n(Patient / Study / Series tree)"]
        LayoutMgr["Layout Manager\n(1×1 · 1×2 · 1+2 · 2×2)"]
        Toolbar["Toolbar\n(Tool selection · Presets · Playback)"]
        SegPanel["Segmentation Panel\n(Segments · Brush · Eraser)"]
        MeasSidebar["Measurements Sidebar\n(Annotations · Slice jump)"]
    end
    subgraph Rendering ["Rendering Engine"]
        CS3D{"Cornerstone3D\nEngine"}
        Viewer2D["2D Viewports\n(Stack Images)"]
        ViewerMPR["MPR Viewports\n(Volume · Axial · Sagittal · Coronal)"]
        Viewer3D["3D Volume Renderer\n(WebGL · VTK)"]
        WebGL[("WebGL Canvas")]
    end
    User --> DragDrop --> Parser
    Parser --> Workers --> CS3D
    Parser --> Zustand
    Zustand --> Sidebar
    Zustand --> LayoutMgr
    Zustand --> Toolbar
    Zustand --> SegPanel
    Zustand --> MeasSidebar
    LayoutMgr --> Viewer2D
    LayoutMgr --> ViewerMPR
    LayoutMgr --> Viewer3D
    Viewer2D --> CS3D
    ViewerMPR --> CS3D
    Viewer3D --> CS3D
    CS3D --> WebGL
```
---
## Tech Stack
|
 Layer 
|
 Technology 
|
|
---
|
---
|
|
 Framework 
|
 React 19 + Vite 
|
|
 Rendering engine 
|
 Cornerstone3D (WebGL) 
|
|
 State management 
|
 Zustand with shallow selectors 
|
|
 DICOM parsing 
|
 dicom-parser 
|
|
 Background decoding 
|
 Cornerstone Web Workers 
|
|
 Styling 
|
 Vanilla CSS with CSS custom properties 
|
|
 Localization 
|
 Custom i18n store 
|
---
## Installation
```bash
# Install dependencies
npm install
# Start development server
npm run dev
# Build for production
npm run build
```
---
*Note on Authorship and Collaboration:*
The codebase for this project was developed with the assistance of Artificial Intelligence. However, the overarching system architecture, component methodologies, and critical execution workflows were meticulously planned, directed, and authored by the human developer. Furthermore, direct human intervention and custom code authoring were required to resolve deep technical challenges—such as bypassing the 2D Probe Tool limitations and engineering polling systems to mitigate rendering engine race conditions—ensuring the application meets the highest standards of performance and reliability. The AI served as a highly capable pair-programmer, efficiently translating this complex engineering vision into reality.
