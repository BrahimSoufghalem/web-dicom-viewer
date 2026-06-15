import { init as coreInit, metaData, imageLoader } from '@cornerstonejs/core';
import cornerstoneDICOMImageLoader, { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import * as cornerstoneTools from '@cornerstonejs/tools';

let isInitialized = false;

export async function initCornerstone() {
  if (isInitialized) return;

  try {
    // 1. Initialize Cornerstone Core
    await coreInit();

    // 2. Initialize Cornerstone Tools
    await cornerstoneTools.init();

    // 3. Initialize DICOM Image Loader
    dicomImageLoaderInit({
      maxWebWorkers: navigator.hardwareConcurrency ? Math.max(navigator.hardwareConcurrency - 1, 1) : 1,
    });
    
    // OVERRIDE: Register the legacy `loadImage` function for `dicomfile` scheme to fix "no pixel data in NATURALIZED" error for uncompressed local files
    imageLoader.registerImageLoader('dicomfile', cornerstoneDICOMImageLoader.wadouri.loadImage);

    // 4. Register the metadata provider for DICOM Image Loader
    // This is REQUIRED so Cornerstone3D can get pixel spacing, orientation, VOI LUT, etc.
    metaData.addProvider((type, imageId) => {
      // Use the internal wadouri metadata provider
      return cornerstoneDICOMImageLoader.wadouri.metaData.metaDataProvider(type, imageId);
    }, 10000);

    // Also register the pt scaling metadata provider if needed, but wadouri might be enough.
    // pt scaling is usually for PET/SUV, we can add it if needed.

    isInitialized = true;
    console.log('Cornerstone3D successfully initialized.');
  } catch (error) {
    console.error('Failed to initialize Cornerstone3D:', error);
  }
}
