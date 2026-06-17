import { Enums, RenderingEngine, getRenderingEngine } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

export const getVolume3DEngineId = (panelId: string) => `engine-3d-${panelId}`;

export function getVolume3DIds(panelId: string, seriesUid: string = "") {
  return {
    volumeId: `cornerstoneStreamingImageVolume:MY_VOLUME_${panelId}_${seriesUid}`,
    toolGroupId: `VOLUME_3D_TOOL_GROUP_${panelId}`,
    viewportId: `VOLUME_3D_${panelId}`
  };
}

export async function setupVolume3DViewport(element: HTMLDivElement, panelId: string, seriesUid: string = "") {
  const engineId = getVolume3DEngineId(panelId);
  const renderingEngine = getRenderingEngine(engineId) || new RenderingEngine(engineId);
  
  const { viewportId, volumeId, toolGroupId } = getVolume3DIds(panelId, seriesUid);

  const viewportInput = {
    viewportId: viewportId,
    type: Enums.ViewportType.VOLUME_3D,
    element: element,
    defaultOptions: {
      background: [0, 0, 0] as [number, number, number],
    },
  };

  renderingEngine.enableElement(viewportInput);
  
  const viewport = renderingEngine.getViewport(viewportId);
  // Volume must already be loaded (using mprSetup's buildVtkVolume)
  await (viewport as any).setVolumes([{ volumeId }]);
  
  renderingEngine.renderViewport(viewportId);

  let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
  if (!toolGroup) {
    toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
    
    // Add default tools for 3D navigation
    if (!cornerstoneTools.TrackballRotateTool) {
      console.warn('TrackballRotateTool is missing');
    }
    toolGroup!.addTool(cornerstoneTools.TrackballRotateTool.toolName);
    toolGroup!.addTool(cornerstoneTools.ZoomTool.toolName);
    toolGroup!.addTool(cornerstoneTools.PanTool.toolName);
    
    toolGroup!.setToolActive(cornerstoneTools.TrackballRotateTool.toolName, {
      bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
    });
    toolGroup!.setToolActive(cornerstoneTools.ZoomTool.toolName, {
      bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }],
    });
    toolGroup!.setToolActive(cornerstoneTools.PanTool.toolName, {
      bindings: [
        { mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary },
        { mouseButton: cornerstoneTools.Enums.MouseBindings.Primary, modifierKey: cornerstoneTools.Enums.KeyboardBindings.Shift }
      ],
    });
  }

  toolGroup!.addViewport(viewportId, engineId);

  return { viewportId, toolGroupId, renderingEngine };
}

export function cleanupVolume3DViewport(panelId: string, renderingEngine: RenderingEngine) {
  const { toolGroupId, viewportId } = getVolume3DIds(panelId);

  const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
  if (toolGroup) {
    try { toolGroup.removeViewports(renderingEngine.id, viewportId); } catch(e) {}
  }
  try { renderingEngine.disableElement(viewportId); } catch(e) {}
}
