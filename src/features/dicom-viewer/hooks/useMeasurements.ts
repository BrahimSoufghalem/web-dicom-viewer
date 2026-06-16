import { useEffect, useState } from 'react';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { getRenderingEngines, eventTarget, utilities as coreUtilities, cache, getEnabledElement } from '@cornerstonejs/core';
import { useViewerStore } from '../../../store/useViewerStore';

export interface Measurement {
  annotationUID: string;
  toolName: string;
  referencedImageId: string;
  text: string;
  viewMode: string;
  panelId: string;
  customLabel?: string;
}

export function useMeasurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    const { Enums } = cornerstoneTools;

    const extractText = (annotation: any): string => {
      const cachedStats = annotation.data?.cachedStats;
      if (!cachedStats) return 'No data';
      
      const keys = Object.keys(cachedStats);
      if (keys.length === 0) return 'No data';
      
      // Find the first targetId that actually has a value, mean, area, or length
      const stats = Object.values(cachedStats).find((s: any) => 
        s.value !== undefined || s.mean !== undefined || s.area !== undefined || s.length !== undefined
      ) || cachedStats[keys[0]];
      
      const getVal = (v: any) => Array.isArray(v) ? v[0] : v;

      if (annotation.metadata?.toolName === 'Probe') {
        let val;
        if (stats.value !== undefined) val = stats.value;
        else if (stats.mean !== undefined) val = stats.mean;
        else {
          // Manual fallback if value is missing (e.g. voxelManager undefined in some stack viewports)
          try {
            const imageId = annotation.metadata?.referencedImageId;
            if (cache && imageId) {
              const cachedImage = cache.getImage(imageId);
              if (cachedImage) {
                 const ijk = stats.index;
                 if (ijk && ijk.length >= 2) {
                   const x = Math.round(ijk[0]);
                   const y = Math.round(ijk[1]);
                   const columns = cachedImage.columns;
                   const pixelData = cachedImage.getPixelData();
                   const pixelIndex = y * columns + x;
                   const rawValue = pixelData[pixelIndex];
                   const slope = cachedImage.slope || 1;
                   const intercept = cachedImage.intercept || 0;
                   val = rawValue * slope + intercept;
                 }
              }
            }
          } catch (e) {
            console.warn("Manual fallback failed", e);
          }
        }
        
        if (val === undefined) {
           val = JSON.stringify(stats).substring(0, 25);
        }
        
        const numericVal = typeof val === 'number' || (Array.isArray(val) && typeof val[0] === 'number') ? Math.round(getVal(val)) : val;
        return `${numericVal} ${stats.modalityUnit || 'HU'}`;
      }
      
      const len = getVal(stats.length);
      if (len !== undefined && typeof len === 'number') return `${len.toFixed(1)} mm`;
      
      const area = getVal(stats.area);
      const mean = getVal(stats.mean);
      if (area !== undefined && typeof area === 'number') return `${area.toFixed(1)} mm² (Avg: ${Math.round(mean || 0)})`;
      
      const angle = getVal(stats.angle);
      if (angle !== undefined && typeof angle === 'number') return `${angle.toFixed(1)}°`;

      return 'Measurement';
    };

    const handleAnnotationAdded = (evt: any) => {
      const ann = evt.detail.annotation;
      const element = evt.detail.element;
      const viewportId = evt.detail.viewportId;
      const renderingEngineId = evt.detail.renderingEngineId;
      
      let viewMode = '2D';
      if (!ann.metadata) ann.metadata = {};
      
      const store = useViewerStore.getState();
      const currentPanelId = store.activePanelId || 'panel-1';

      try {
        let viewport: any = null;
        if (element) {
           try {
             const enabledElement = getEnabledElement(element);
             if (enabledElement) viewport = enabledElement.viewport;
           } catch(e) {}
        } 
        
        if (!viewport && viewportId && renderingEngineId) {
           try {
             const renderingEngines = getRenderingEngines();
             const engine = renderingEngines?.find(e => e.id === renderingEngineId);
             if (engine) viewport = engine.getViewport(viewportId);
           } catch(e) {}
        }

        let panelIdFromViewport = currentPanelId;

        if (viewport) {
           const vpId = viewport.id.toLowerCase();
           const originalVpId = viewport.id;
           const match = originalVpId.match(/panel-\d+/);
           if (match) {
             panelIdFromViewport = match[0];
           }

           if (viewport.type === 'orthographic') {
               if (vpId.includes('axial')) viewMode = 'MPR Axial';
               else if (vpId.includes('coronal')) viewMode = 'MPR Coronal';
               else if (vpId.includes('sagittal')) viewMode = 'MPR Sagittal';
               else viewMode = 'MPR';
           } else {
               viewMode = '2D';
           }
        } else {
           // Fallback to React state
           const activePanel = store.panels.find((p: any) => p.id === currentPanelId);
           if (activePanel?.isMprMode) {
               const vpId = activePanel.mprActiveViewport?.toLowerCase() || '';
               if (vpId.includes('axial')) viewMode = 'MPR Axial';
               else if (vpId.includes('coronal')) viewMode = 'MPR Coronal';
               else if (vpId.includes('sagittal')) viewMode = 'MPR Sagittal';
               else viewMode = 'MPR';
           }
        }

        (ann.metadata as any).viewMode = viewMode;
        if (!(ann.metadata as any).panelId) {
           (ann.metadata as any).panelId = panelIdFromViewport;
        }

      } catch(e) {
        console.warn('Failed to detect viewport type for annotation', e);
        (ann.metadata as any).viewMode = viewMode;
        if (!(ann.metadata as any).panelId) {
           (ann.metadata as any).panelId = currentPanelId;
        }
      }

      setMeasurements(prev => {
        if (prev.find(m => m.annotationUID === ann.annotationUID)) return prev;
        return [...prev, {
          annotationUID: ann.annotationUID,
          toolName: ann.metadata?.toolName || 'Unknown',
          referencedImageId: ann.metadata?.referencedImageId || '',
          text: extractText(ann),
          viewMode: viewMode,
          panelId: (ann.metadata as any).panelId,
          customLabel: (ann.metadata as any).customLabel
        }];
      });
    };

    const handleAnnotationModified = (evt: any) => {
      const ann = evt.detail.annotation;
      setMeasurements(prev => prev.map(m => 
        m.annotationUID === ann.annotationUID 
          ? { ...m, text: extractText(ann), customLabel: (ann.metadata as any).customLabel } 
          : m
      ));
    };

    const handleAnnotationRemoved = (evt: any) => {
      const ann = evt.detail.annotation;
      setMeasurements(prev => prev.filter(m => m.annotationUID !== ann.annotationUID));
    };

    eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
    eventTarget.addEventListener(Enums.Events.ANNOTATION_MODIFIED, handleAnnotationModified);
    eventTarget.addEventListener(Enums.Events.ANNOTATION_REMOVED, handleAnnotationRemoved);

    return () => {
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_MODIFIED, handleAnnotationModified);
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_REMOVED, handleAnnotationRemoved);
    };
  }, []);

  const removeMeasurement = (annotationUID: string) => {
    cornerstoneTools.annotation.state.removeAnnotation(annotationUID);
    // Manually force re-render across all viewports to clear it instantly
    const renderingEngines = getRenderingEngines();
    renderingEngines?.forEach(engine => {
       engine.getViewports().forEach(vp => vp.render());
    });
    // State update is handled by the ANNOTATION_REMOVED listener automatically
  };

  const jumpToMeasurement = (annotationUID: string) => {
    if (!annotationUID) return;
    
    try {
      const annotation = cornerstoneTools.annotation.state.getAnnotation(annotationUID);
      if (!annotation) return;
      
      const pt = annotation.data?.handles?.points?.[0]; // world coordinate
      const referencedImageId = annotation.metadata?.referencedImageId;
      
      // Auto-switch MPR/2D mode
      let modeSwitched = false;
      const store = useViewerStore.getState();
      const activePanelId = store.activePanelId;
      const targetPanelId = (annotation.metadata as any)?.panelId || activePanelId;
      const isVolumeMeasurement = (annotation.metadata as any)?.viewMode?.startsWith('MPR');
      
      if (targetPanelId) {
        if (activePanelId !== targetPanelId) {
           store.setActivePanelId(targetPanelId);
        }

        const targetPanel = store.panels.find((p: any) => p.id === targetPanelId);
        if (targetPanel) {
          if (isVolumeMeasurement && !targetPanel.isMprMode) {
            store.setPanelMprMode(targetPanelId, true);
            modeSwitched = true;
          } else if (!isVolumeMeasurement && targetPanel.isMprMode) {
            store.setPanelMprMode(targetPanelId, false);
            modeSwitched = true;
          }
        }
      }

      const applyJump = () => {
        let jumped = false;
        const targetPanelId = (annotation.metadata as any)?.panelId || activePanelId;

        const renderingEngines = getRenderingEngines();
        renderingEngines?.forEach((engine: any) => {
           engine.getViewports().forEach((vp: any) => {
              if (targetPanelId && !vp.id.includes(targetPanelId)) return;

              if (vp.type === 'stack') {
                 const imageIds = vp.getImageIds();
                 let index = referencedImageId ? imageIds.indexOf(referencedImageId) : -1;
                 
                 if (index !== -1) {
                    vp.setImageIdIndex(index);
                    vp.render();
                    jumped = true;
                 } else if (pt && coreUtilities.getClosestStackImageIndexForPoint) {
                    const closestIndex = coreUtilities.getClosestStackImageIndexForPoint(pt, vp);
                    if (typeof closestIndex === 'number' && closestIndex !== -1) {
                       vp.setImageIdIndex(closestIndex);
                       vp.render();
                       jumped = true;
                    }
                 }
              } else if (vp.type === 'orthographic' && pt) {
                 const camera = vp.getCamera();
                 const { viewPlaneNormal, focalPoint, position } = camera;
                 
                 const dir = [pt[0] - focalPoint[0], pt[1] - focalPoint[1], pt[2] - focalPoint[2]];
                 const dot = dir[0] * viewPlaneNormal[0] + dir[1] * viewPlaneNormal[1] + dir[2] * viewPlaneNormal[2];
                 
                 const newFocalPoint = [
                    focalPoint[0] + viewPlaneNormal[0] * dot,
                    focalPoint[1] + viewPlaneNormal[1] * dot,
                    focalPoint[2] + viewPlaneNormal[2] * dot
                 ];
                 
                 const newPosition = [
                    position[0] + viewPlaneNormal[0] * dot,
                    position[1] + viewPlaneNormal[1] * dot,
                    position[2] + viewPlaneNormal[2] * dot
                 ];
                 
                 vp.setCamera({ focalPoint: newFocalPoint, position: newPosition });
                 vp.render();
                 jumped = true;
              }
           });
        });
        return jumped;
      };

      if (modeSwitched) {
        // Poll to wait for new viewports to initialize
        let attempts = 0;
        const checkAndJump = () => {
          attempts++;
          if (attempts > 50) return; // timeout after ~5 seconds
          
          let ready = false;
          getRenderingEngines()?.forEach((e: any) => {
            e.getViewports().forEach((vp: any) => {
               // Check if target viewport type is now present and has data
               if (isVolumeMeasurement && vp.type === 'orthographic' && vp.hasVolumeId && vp.hasVolumeId(referencedImageId)) ready = true;
               if (isVolumeMeasurement && vp.type === 'orthographic' && pt) ready = true; // PT fallback
               if (!isVolumeMeasurement && vp.type === 'stack' && vp.getImageIds().length > 0) ready = true;
            });
          });
          
          if (ready) {
             // Delay slightly to ensure viewport setCamera defaults have finished
             setTimeout(() => {
               applyJump();
               // Try again after 500ms just in case volume was still loading
               setTimeout(applyJump, 500); 
             }, 100);
          } else {
             setTimeout(checkAndJump, 100);
          }
        };
        setTimeout(checkAndJump, 100);
      } else {
        applyJump();
      }
    } catch(e) {
      console.warn('Failed to jump to measurement', e);
    }
  };

  const updateMeasurementLabel = (annotationUID: string, label: string) => {
    const annotation = cornerstoneTools.annotation.state.getAnnotation(annotationUID);
    if (annotation) {
      if (!annotation.metadata) (annotation as any).metadata = {};
      (annotation.metadata as any).customLabel = label;
      
      setMeasurements(prev => prev.map(m => 
        m.annotationUID === annotationUID ? { ...m, customLabel: label } : m
      ));
    }
  };

  return { measurements, removeMeasurement, jumpToMeasurement, updateMeasurementLabel };
}
