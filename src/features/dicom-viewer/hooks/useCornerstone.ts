import { useEffect, useRef, useState } from 'react';
import { RenderingEngine, Enums, getRenderingEngine } from '@cornerstonejs/core';

export function useCornerstone(imageIds: string[], currentImageIndex: number, viewportId: string) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const GLOBAL_ENGINE_ID = 'DICOM_GLOBAL_ENGINE';
    let engine = getRenderingEngine(GLOBAL_ENGINE_ID);
    
    if (!engine) {
      engine = new RenderingEngine(GLOBAL_ENGINE_ID);
    }

    let resizeObserver: ResizeObserver | null = null;

    const setup = async () => {
      const element = elementRef.current;
      if (!element || imageIds.length === 0) return;

      const viewportInput = {
        viewportId,
        type: Enums.ViewportType.STACK,
        element,
        defaultOptions: {
          background: [0, 0, 0] as [number, number, number],
        },
      };

      try {
        engine!.enableElement(viewportInput);
      } catch (e) {
        console.warn("Element already enabled or error enabling", e);
      }
      
      engine!.getViewport(viewportId) as any;

      try {
        if (!isMounted) return;
        setErrorMsg(null);
        setIsLoading(true);

        // Rely entirely on viewport.setStack to load and cache the image
        
        // RE-FETCH the viewport! It might have been destroyed and re-enabled during the async load!
        const currentViewport = engine!.getViewport(viewportId) as any;
        if (!currentViewport) return;

        await currentViewport.setStack(imageIds, currentImageIndex);

        if (!isMounted) return;
        
        currentViewport.resetCamera();
        currentViewport.resetProperties();
        
        currentViewport.render();

        try {
           if (element) {
              const cornerstoneTools = await import('@cornerstonejs/tools');
              cornerstoneTools.utilities.stackPrefetch.enable(element);
           }
        } catch(e) {
           console.warn("Failed to enable stack prefetch", e);
        }

        // Hack for React 18 / WebGL race conditions: Force a resize and re-render 
        // shortly after the stack is set to ensure the canvas didn't miss a layout shift.
        setTimeout(() => {
          if (isMounted && engine) {
            engine.resize(true);
            currentViewport.render();
          }
        }, 150);
        
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load or render DICOM image:", err);
          setErrorMsg(err.message || String(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }; // Close setup function

    // Safely wait for DOM layout using ResizeObserver
    const element = elementRef.current;
    let isInitializing = false;

    
    if (element) {
      resizeObserver = new ResizeObserver((entries) => {
        let hasSize = false;
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            hasSize = true;
          }
        }
        
        if (hasSize && isMounted) {
          if (!engine?.getViewport(viewportId)) {
            // First time it gets a valid size, initialize setup
            if (!isInitializing) {
              isInitializing = true;
              setup().finally(() => {
                isInitializing = false;
              });
            }
          } else {
            // Instant resize using requestAnimationFrame for optimal sync with DOM
            requestAnimationFrame(() => {
              if (isMounted && engine) {
                engine.resize(true);
                const currentViewport = engine.getViewport(viewportId);
                if (currentViewport) currentViewport.render();
              }
            });
          }
        }
      });
      resizeObserver.observe(element);
    }

    return () => {
      isMounted = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (engine) {
        try { engine.disableElement(viewportId); } catch(e){}
      }
    };
  }, [imageIds, viewportId]); // Re-run when imageIds or viewportId changes

  return { elementRef, errorMsg, isLoading };
}
