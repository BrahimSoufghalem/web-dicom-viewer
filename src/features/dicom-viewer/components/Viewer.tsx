import { useRef, useEffect } from 'react';
import { useCornerstone } from '../hooks/useCornerstone';
import { useDicomTools } from '../hooks/useDicomTools';
import { useViewerStore } from '../../../store/useViewerStore';
import { useShallow } from 'zustand/react/shallow';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Maximize2, ShieldAlert } from 'lucide-react';
import { Enums, getRenderingEngine } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

const TOOL_GROUP_ID = 'VIEWER_TOOL_GROUP';

interface ViewerProps {
  panelId: string;
}

export function Viewer({ panelId }: ViewerProps) {
  const VIEWPORT_ID = `STACK_VIEWPORT_${panelId}`;
  const ENGINE_ID = `engine-${panelId}`;

  const { 
    seriesList,
    panels,
    setPanelImageIndex,
    playbackSpeed,
    activePanelId
  } = useViewerStore(useShallow(state => ({
    seriesList: state.seriesList,
    panels: state.panels,
    setPanelImageIndex: state.setPanelImageIndex,
    playbackSpeed: state.playbackSpeed,
    activePanelId: state.activePanelId
  })));
  const { t } = useLanguageStore();
  
  const panel = panels.find(p => p.id === panelId);
  const seriesInstanceUid = panel?.seriesInstanceUid;
  const currentImageIndex = panel?.currentImageIndex || 0;
  const isPlaying = panel?.isPlaying || false;
  const isActive = panelId === activePanelId;
  
  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];
  const metadata = series;

  const { elementRef, errorMsg, isLoading } = useCornerstone(imageIds, currentImageIndex, VIEWPORT_ID, ENGINE_ID);
  
  useDicomTools(elementRef, TOOL_GROUP_ID);



  const zoomRef = useRef<HTMLSpanElement>(null);
  const wwWcRef = useRef<HTMLSpanElement>(null);
  const sliceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elementRef.current || imageIds.length === 0) return;

    const connectViewportToToolGroup = () => {
      const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
      const engine = getRenderingEngine(ENGINE_ID);
      
      if (toolGroup && engine) {
        try {
          toolGroup.addViewport(VIEWPORT_ID, ENGINE_ID);
        } catch (e) {
          console.warn('Failed to add viewport to toolGroup', e);
        }
      } else {
        setTimeout(connectViewportToToolGroup, 50); // wait until engine is created
      }
    };
    connectViewportToToolGroup();

    const element = elementRef.current;

    const updateOverlay = () => {
      const renderingEngine = getRenderingEngine(ENGINE_ID);
      if (!renderingEngine) return;
      const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
      if (!viewport) return;

      const zoom = viewport.getZoom ? (viewport.getZoom() * 100).toFixed(0) : '100';
      if (zoomRef.current) zoomRef.current.innerText = `Zoom: ${zoom}%`;

      const properties = viewport.getProperties();
      const voiRange = properties.voiRange;
      if (voiRange) {
        const ww = (voiRange.upper - voiRange.lower).toFixed(0);
        const wc = ((voiRange.upper + voiRange.lower) / 2).toFixed(0);
        if (wwWcRef.current) wwWcRef.current.innerText = `WW: ${ww} / WC: ${wc}`;
      }
    };

    const handleInteraction = (e: any) => {
      if (e.detail.viewportId === VIEWPORT_ID) {
        updateOverlay();
      }
    };

    const handleStackNewImage = (e: any) => {
      if (e.detail.viewportId === VIEWPORT_ID) {
        if (sliceRef.current) {
          sliceRef.current.innerText = `${t('viewer.slice')} ${e.detail.imageIdIndex + 1} / ${imageIds.length}`;
        }
        updateOverlay(); // Update WW/WC/Zoom on new image too

        // Debounce Zustand update to avoid lag while scrolling
        clearTimeout((window as any).sliceTimeout);
        (window as any).sliceTimeout = setTimeout(() => {
          setPanelImageIndex(panelId, e.detail.imageIdIndex);
        }, 200);
      }
    };

    element.addEventListener(Enums.Events.IMAGE_RENDERED, handleInteraction);
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, handleInteraction);
    element.addEventListener(Enums.Events.VOI_MODIFIED, handleInteraction);
    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
    
    // Initial update after slight delay
    setTimeout(updateOverlay, 100);

    return () => {
      element.removeEventListener(Enums.Events.IMAGE_RENDERED, handleInteraction);
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, handleInteraction);
      element.removeEventListener(Enums.Events.VOI_MODIFIED, handleInteraction);
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackNewImage);
      const tg = cornerstoneTools.ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
      if (tg) {
        try { tg.removeViewports(ENGINE_ID, VIEWPORT_ID); } catch(e){}
      }
    };
  }, [imageIds, elementRef]);

  // Handle Cine Playback
  useEffect(() => {
    if (!elementRef.current || imageIds.length === 0) return;
    if (isPlaying) {
      cornerstoneTools.utilities.cine.playClip(elementRef.current, { framesPerSecond: playbackSpeed });
    } else {
      cornerstoneTools.utilities.cine.stopClip(elementRef.current);
    }
    return () => {
      if (elementRef.current) {
         cornerstoneTools.utilities.cine.stopClip(elementRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, imageIds, elementRef]);

  // Handle Keyboard Navigation
  useEffect(() => {
    if (!isActive || !elementRef.current || imageIds.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const renderingEngine = getRenderingEngine(ENGINE_ID);
        if (!renderingEngine) return;
        const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
        if (!viewport) return;

        const currentIndex = viewport.getCurrentImageIdIndex();
        const newIndex = Math.max(0, Math.min(imageIds.length - 1, currentIndex + delta));
        if (newIndex !== currentIndex) {
          (viewport as any).setImageIdIndex(newIndex);
          (viewport as any).render();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, elementRef, imageIds, ENGINE_ID, VIEWPORT_ID]);

  return (
    <div className="viewer-container" style={{ width: '100%', height: '100%', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isLoading && !errorMsg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-deep)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-primary)' }}>
          <div style={{ marginBottom: '1rem', width: '32px', height: '32px', border: '2px solid', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '1rem' }}>{t('viewer.loading')}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-deep)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--accent-red)', padding: '2rem', textAlign: 'left', overflowY: 'auto' }}>
          <ShieldAlert size={48} style={{ marginBottom: '1rem', alignSelf: 'center' }} />
          <h3 style={{ marginBottom: '0.5rem', alignSelf: 'center' }}>{t('viewer.errorTitle')}</h3>
          <pre style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', maxWidth: '80%', border: '1px solid var(--accent-red)' }}>{errorMsg}</pre>
        </div>
      )}

      <div
        id="dicom-element"
        ref={elementRef}
        className="dicom-canvas-element"
        onContextMenu={(e) => e.preventDefault()}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />

      <div className="viewer-overlay-card" style={{ top: '1.5rem', left: '1.5rem', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{metadata?.patientName || 'N/A'}</span>
        <span style={{ color: 'var(--text-secondary)' }}>ID: {metadata?.patientId || 'N/A'}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {[metadata?.patientSex ? `Sex: ${metadata.patientSex}` : null, metadata?.patientAge ? `Age: ${metadata.patientAge}` : null].filter(Boolean).join(' | ')}
        </span>
      </div>

      <div className="viewer-overlay-card" style={{ top: '1.5rem', right: '1.5rem', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', textAlign: 'right' }}>
        <span style={{ fontWeight: 600 }}>{metadata?.studyDescription || 'N/A'}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{metadata?.studyDate || 'N/A'}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {[metadata?.modality ? `Modality: ${metadata.modality}` : null, metadata?.sliceThickness ? `Th: ${metadata.sliceThickness}mm` : null].filter(Boolean).join(' | ')}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7 }}>
          {metadata?.institutionName || metadata?.manufacturer || ''}
        </span>
      </div>

      <div className="viewer-overlay-card overlay-bottom-left" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <span ref={zoomRef} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Maximize2 size={14} /> Zoom: 100%
        </span>
        {imageIds.length > 1 && (
          <span ref={sliceRef} style={{ color: 'var(--text-primary)' }}>
            {t('viewer.slice')} {currentImageIndex + 1} / {imageIds.length}
          </span>
        )}
      </div>

      <div className="viewer-overlay-card overlay-bottom-right">
        <span ref={wwWcRef}>WW: 256 / WC: 128</span>
      </div>
    </div>
  );
}
