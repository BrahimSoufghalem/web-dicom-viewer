import { volumeLoader, Enums, RenderingEngine, imageLoader, getRenderingEngine, cache, setVolumesForViewports } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

export const getMprEngineId = (panelId: string) => `engine-${panelId}`;

export function getMprIds(panelId: string, seriesUid: string = "") {
  return {
    volumeId: `cornerstoneStreamingImageVolume:SHARED_VOLUME_${seriesUid}`,
    toolGroupId: `MPR_TOOL_GROUP_${panelId}`,
    voiSyncId: `MPR_VOI_SYNC_${panelId}`,
    zoomPanSyncId: `MPR_ZOOM_PAN_SYNC_${panelId}`,
    viewportIds: [`MPR_AXIAL_${panelId}`, `MPR_CORONAL_${panelId}`, `MPR_SAGITTAL_${panelId}`]
  };
}
const volumePromises = new Map<string, Promise<any>>();

export async function buildVtkVolume(imageIds: string[], volumeId: string) {
  if (!imageIds || imageIds.length === 0) return null;

  try {
    const existingVolume = cache.getVolume(volumeId);
    // Only return if it's fully loaded (no pending promise)
    if (existingVolume && !volumePromises.has(volumeId)) {
      return existingVolume;
    }

    if (volumePromises.has(volumeId)) {
      return await volumePromises.get(volumeId);
    }

    const loadVolumeTask = async () => {
      const loadPromises = imageIds.map(imageId => imageLoader.loadAndCacheImage(imageId));
      await Promise.all(loadPromises);

      const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });
      await volume.load();
      return volume;
    };

    const promise = loadVolumeTask();
    volumePromises.set(volumeId, promise);
    
    const volume = await promise;
    volumePromises.delete(volumeId);
    return volume;
  } catch (error) {
    volumePromises.delete(volumeId);
    console.error("Failed to build volume", error);
    throw error;
  }
}

export async function setupMprViewports(elements: HTMLDivElement[], panelId: string, seriesUid: string = "") {
  const engineId = getMprEngineId(panelId);
  const renderingEngine = getRenderingEngine(engineId) || new RenderingEngine(engineId);
  
  const { viewportIds, volumeId, toolGroupId } = getMprIds(panelId, seriesUid);

  const viewportInputArray = [
    {
      viewportId: viewportIds[0],
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: elements[0],
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
        background: [0, 0, 0] as [number, number, number],
      },
    },
    {
      viewportId: viewportIds[1],
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: elements[1],
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
        background: [0, 0, 0] as [number, number, number],
      },
    },
    {
      viewportId: viewportIds[2],
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: elements[2],
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
        background: [0, 0, 0] as [number, number, number],
      },
    },
  ];

  renderingEngine.setViewports(viewportInputArray);

  await setVolumesForViewports(renderingEngine, [{ volumeId }], viewportIds);

  renderingEngine.renderViewports(viewportIds);

  let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
  if (!toolGroup) {
    toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
  }

  viewportIds.forEach((viewportId) => {
    toolGroup!.addViewport(viewportId, engineId);
  });

  return { viewportIds, toolGroupId, renderingEngine };
}

export function cleanupMprViewports(panelId: string, renderingEngine: RenderingEngine) {
  const { toolGroupId, viewportIds, voiSyncId, zoomPanSyncId } = getMprIds(panelId);

  try {
    const voiSync = cornerstoneTools.SynchronizerManager.getSynchronizer(voiSyncId);
    if (voiSync) cornerstoneTools.SynchronizerManager.destroySynchronizer(voiSyncId);
    
    const zoomPanSync = cornerstoneTools.SynchronizerManager.getSynchronizer(zoomPanSyncId);
    if (zoomPanSync) cornerstoneTools.SynchronizerManager.destroySynchronizer(zoomPanSyncId);
  } catch (e) {
    console.warn("Failed to destroy synchronizers", e);
  }

  const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
  if (toolGroup) {
    viewportIds.forEach(id => {
      try { toolGroup.removeViewports(renderingEngine.id, id); } catch(e) {}
    });
  }

  viewportIds.forEach(id => {
    try { renderingEngine.disableElement(id); } catch(e) {}
  });

  try {
    renderingEngine.destroy();
  } catch(e) {}

  // Intentionally leaving the volume in the cache so it can be instantly reused
  // when switching layouts or toggling MPR mode off and on.
}

export function toggleMprSynchronizers(panelId: string, enable: boolean) {
  const engineId = getMprEngineId(panelId);
  const { voiSyncId, zoomPanSyncId, viewportIds } = getMprIds(panelId);
  
  let voiSync = cornerstoneTools.SynchronizerManager.getSynchronizer(voiSyncId);
  let zoomPanSync = cornerstoneTools.SynchronizerManager.getSynchronizer(zoomPanSyncId);

  if (enable) {
    if (!voiSync) {
      voiSync = cornerstoneTools.synchronizers.createVOISynchronizer(voiSyncId, { syncInvertState: false, syncColormap: false } as any);
    }
    if (!zoomPanSync) {
      zoomPanSync = cornerstoneTools.synchronizers.createZoomPanSynchronizer(zoomPanSyncId);
    }

    viewportIds.forEach(id => {
      if (voiSync) voiSync.add({ viewportId: id, renderingEngineId: engineId });
      if (zoomPanSync) zoomPanSync.add({ viewportId: id, renderingEngineId: engineId });
    });
  } else {
    if (voiSync) cornerstoneTools.SynchronizerManager.destroySynchronizer(voiSyncId);
    if (zoomPanSync) cornerstoneTools.SynchronizerManager.destroySynchronizer(zoomPanSyncId);
  }
}
