import { useEffect } from 'react';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { useViewerStore } from '../../../store/useViewerStore';

const {
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
  PanTool,
  StackScrollTool,
  LengthTool,
  AngleTool,
  RectangleROITool,
  CircleROITool,
  ProbeTool,
  PlanarFreehandROITool,
  EraserTool,
  CrosshairsTool,
  Enums: csToolsEnums,
} = cornerstoneTools;

const { MouseBindings } = csToolsEnums;

// Map legacy tool names to Cornerstone3D tool names
const TOOL_MAP: Record<string, string> = {
  Wwwc: WindowLevelTool.toolName,
  Zoom: ZoomTool.toolName,
  Pan: PanTool.toolName,
  Length: LengthTool.toolName,
  Angle: AngleTool.toolName,
  RectangleRoi: RectangleROITool.toolName,
  EllipticalRoi: CircleROITool.toolName,
  Probe: ProbeTool.toolName,
  FreehandRoi: PlanarFreehandROITool.toolName,
  Eraser: EraserTool.toolName,
  Crosshairs: CrosshairsTool.toolName,
};

export function useDicomTools(_elementRef: React.RefObject<HTMLDivElement | null>, toolGroupId: string, isMpr: boolean = false) {
  const { activeTool } = useViewerStore();

  useEffect(() => {
    let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

      // Add tools globally if not already added
      const toolsToRegister = [
        WindowLevelTool, ZoomTool, PanTool, LengthTool, AngleTool, 
        RectangleROITool, CircleROITool, ProbeTool, PlanarFreehandROITool, StackScrollTool, EraserTool, CrosshairsTool, cornerstoneTools.TrackballRotateTool
      ];
      
      toolsToRegister.forEach(tool => {
        try {
          cornerstoneTools.addTool(tool);
        } catch (e) {
          // Already added
        }
      });

      // Add tools to group
      Object.values(TOOL_MAP).forEach(toolName => {
        // Handle Crosshairs specifically for MPR
        if (toolName === CrosshairsTool.toolName) {
          if (isMpr) {
            toolGroup!.addTool(CrosshairsTool.toolName, {
              getReferenceLineColor: (viewportId: string) => {
                if (viewportId.includes('AXIAL')) return 'rgb(255, 0, 0)';
                if (viewportId.includes('CORONAL')) return 'rgb(0, 255, 0)';
                if (viewportId.includes('SAGITTAL')) return 'rgb(0, 0, 255)';
                return 'rgb(255, 255, 255)';
              },
              getReferenceLineControllable: () => true,
              getReferenceLineDraggableRotatable: () => true,
              getReferenceLineThickness: () => 1,
            });
          } else {
            toolGroup!.addTool(toolName);
          }
        } else {
          toolGroup!.addTool(toolName);
        }
        toolGroup!.setToolPassive(toolName);
      });

      // Configure ProbeTool specifically
      toolGroup!.setToolConfiguration('Probe', {
        getTextLines: (data: any, targetId: string) => {
          const cachedStats = data?.cachedStats?.[targetId];
          if (!cachedStats) return ['No Data'];
          
          let { value, modalityUnit, index } = cachedStats;
          
          if ((value === undefined || value === null) && index) {
            try {
              const imageId = targetId.startsWith('imageId:') ? targetId.replace('imageId:', '') : targetId;
              const image = cornerstone.cache.getImage(imageId);
              if (image && image.getPixelData) {
                const pixelData = image.getPixelData();
                const columns = image.columns || image.width;
                const x = Math.round(index[0]);
                const y = Math.round(index[1]);
                
                if (x >= 0 && y >= 0 && x < columns) {
                  const offset = y * columns + x;
                  let rawValue = pixelData[offset];
                  
                  const isPreScaled = (image as any).preScale?.scaled || (image as any).isPreScaled;
                  
                  if (!isPreScaled && image.intercept !== undefined && image.slope !== undefined) {
                    rawValue = rawValue * image.slope + image.intercept;
                  }
                  value = rawValue;
                  
                  if (!modalityUnit) {
                    modalityUnit = image.color ? 'RGB' : 'HU';
                  }
                }
              }
            } catch (err) {}
          }
          
          if (value === undefined || value === null) return ['N/A'];
          if (Array.isArray(value)) return [`RGB: ${value.join(',')}`];
          
          const roundedValue = Math.round(value * 100) / 100;
          return [`${roundedValue} ${modalityUnit || 'HU'}`];
        }
      });

      toolGroup!.addTool(StackScrollTool.toolName);
      toolGroup!.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: MouseBindings.Wheel }],
      });
    }

    // Update active tool based on state
    const mappedToolName = TOOL_MAP[activeTool];
    Object.values(TOOL_MAP).forEach(toolName => {
      if (toolName === mappedToolName) {
        toolGroup!.setToolActive(toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
      } else {
        if (toolName === CrosshairsTool.toolName) {
          toolGroup!.setToolDisabled(toolName);
        } else {
          toolGroup!.setToolPassive(toolName);
        }
      }
    });

  }, [activeTool, toolGroupId, isMpr]);
}
