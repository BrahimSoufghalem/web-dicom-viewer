import { useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../../store/useViewerStore';
import { Maximize2, Box } from 'lucide-react';
import { setupVolume3DViewport, cleanupVolume3DViewport, getVolume3DIds } from '../utils/volume3dSetup';
import { buildVtkVolume } from '../utils/mprSetup';

interface Volume3DViewerProps {
  panelId: string;
}

export function Volume3DViewer({ panelId }: Volume3DViewerProps) {
  const { seriesList, panels, activePanelId } = useViewerStore();
  
  const panel = panels.find(p => p.id === panelId);
  const seriesInstanceUid = panel?.seriesInstanceUid;
  const isActive = activePanelId === panelId;
  
  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let localCleanup: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const init3D = async () => {
      if (!imageIds || imageIds.length === 0) return;
      if (!elementRef.current) return;

      setIsLoading(true);
      setErrorMsg(null);
      
      try {
        const { volumeId } = getVolume3DIds(panelId, seriesInstanceUid || "");
        
        // We reuse the same volume builder as MPR
        const volume = await buildVtkVolume(imageIds, volumeId);
        
        if (!isMounted) return;

        if (volume) {
          const { renderingEngine } = await setupVolume3DViewport(
            elementRef.current,
            panelId,
            seriesInstanceUid || ""
          );

          if (!isMounted) {
            cleanupVolume3DViewport(panelId, renderingEngine);
            return;
          }

          resizeObserver = new ResizeObserver(() => {
            try {
              renderingEngine.resize(true);
            } catch (err) {
              console.warn("Resize error in 3D:", err);
            }
          });
          resizeObserver.observe(elementRef.current);

          localCleanup = () => {
            if (resizeObserver && elementRef.current) {
              resizeObserver.unobserve(elementRef.current);
            }
            cleanupVolume3DViewport(panelId, renderingEngine);
          };
          
          setIsLoading(false);
        } else {
          setErrorMsg("Could not create 3D volume.");
          setIsLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setErrorMsg("Error initializing 3D volume.");
          setIsLoading(false);
        }
      }
    };

    setTimeout(() => {
      init3D();
    }, 100);

    return () => {
      isMounted = false;
      if (localCleanup) localCleanup();
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [panelId, seriesInstanceUid, imageIds.length]);

  const color = isActive ? 'var(--accent-primary)' : 'var(--border-color)';
  const bg = isActive ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0, 0, 0, 0.4)';
  const title = `3D Rendering - ${series?.seriesDescription || 'Volume'}`;

  return (
    <div 
      style={{ 
        position: 'relative', background: '#000', overflow: 'hidden',
        width: '100%', height: '100%',
        border: isActive ? `2px solid ${color}` : '1px solid var(--border-glass)',
        transition: 'border 0.2s ease', cursor: 'pointer'
      }}
    >
      <div className="viewer-overlay-card" style={{ top: '10px', left: '10px', color: color, borderColor: isActive ? color : 'var(--border-color)' }}>
        <span style={{ background: bg, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Box size={14} /> {title}
        </span>
      </div>

      <div className="viewer-overlay-card overlay-bottom-left" style={{ bottom: '10px', left: '10px', flexDirection: 'column', alignItems: 'flex-start', color: color, borderColor: 'transparent' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
          <Maximize2 size={12} /> Left Click: Rotate | Right Click: Zoom | Middle: Pan
        </span>
      </div>

      <div ref={elementRef} style={{ width: '100%', height: '100%', position: 'relative' }} onContextMenu={(e) => e.preventDefault()} />
      
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 10, color: '#fff', flexDirection: 'column', gap: '10px' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div>Loading 3D Volume...</div>
        </div>
      )}

      {errorMsg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 10, color: '#ef4444' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
