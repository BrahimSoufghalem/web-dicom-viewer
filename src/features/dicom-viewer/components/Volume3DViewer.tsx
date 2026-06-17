import { useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../../store/useViewerStore';
import { buildVtkVolume, getMprIds } from '../utils/mprSetup';
import { Enums, getRenderingEngine, RenderingEngine } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

interface Volume3DViewerProps {
  panelId: string;
}

export function Volume3DViewer({ panelId }: Volume3DViewerProps) {
  const { seriesList, panels } = useViewerStore();
  const panel = panels.find(p => p.id === panelId);
  const seriesInstanceUid = panel?.seriesInstanceUid;
  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];

  const elementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const VIEWPORT_ID = `3D_VIEWPORT_${panelId}`;
    const ENGINE_ID = `engine-${panelId}`;
    const TOOL_GROUP_ID = `3D_TOOL_GROUP_${panelId}`;
    const { volumeId: VOLUME_ID } = getMprIds(panelId, seriesInstanceUid || "");

    let renderingEngine: RenderingEngine;

    const setup3D = async () => {
      if (!imageIds || imageIds.length === 0 || !elementRef.current) return;
      setIsLoading(true);

      try {
        await buildVtkVolume(imageIds, VOLUME_ID);
        if (!isMounted || !elementRef.current) return;

        renderingEngine = getRenderingEngine(ENGINE_ID) || new RenderingEngine(ENGINE_ID);
        
        
        renderingEngine.setViewports([
          {
            viewportId: VIEWPORT_ID,
            type: Enums.ViewportType.VOLUME_3D,
            element: elementRef.current,
            defaultOptions: {
              background: [0, 0, 0],
            },
          },
        ]);

        const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
        await viewport.setVolumes([{ volumeId: VOLUME_ID }]);
        
        // Apply a generic soft tissue/bone preset (Default CT)
        viewport.setProperties({
          preset: 'CT-Bone', // We will make this configurable later
        });

        renderingEngine.renderViewports([VIEWPORT_ID]);

        // Setup 3D Tools
        if (!cornerstoneTools.state.tools['TrackballRotate']) {
          cornerstoneTools.addTool(cornerstoneTools.TrackballRotateTool);
        }

        let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
        if (!toolGroup) {
          toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(TOOL_GROUP_ID);
        }
        
        toolGroup!.addViewport(VIEWPORT_ID, ENGINE_ID);
        toolGroup!.addTool(cornerstoneTools.TrackballRotateTool.toolName);
        toolGroup!.setToolActive(cornerstoneTools.TrackballRotateTool.toolName, {
          bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to setup 3D Volume", err);
      }
    };

    setup3D();

    return () => {
      isMounted = false;
      try {
        const tg = cornerstoneTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
        if (tg) tg.removeViewports(ENGINE_ID, VIEWPORT_ID);
        if (renderingEngine) {
          renderingEngine.disableElement(VIEWPORT_ID);
          renderingEngine.destroy();
        }
      } catch(e) {}
    };
  }, [imageIds, panelId, seriesInstanceUid]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 10, color: 'var(--accent-primary)' }}>
          Rendering 3D Volume...
        </div>
      )}
      <div 
        ref={elementRef} 
        style={{ width: '100%', height: '100%' }} 
        onContextMenu={(e) => e.preventDefault()} 
      />
    </div>
  );
}
