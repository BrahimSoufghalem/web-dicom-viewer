import React, { useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Box, AlertTriangle, Link, Unlink, Maximize2 } from 'lucide-react';
import { buildVtkVolume, setupMprViewports, cleanupMprViewports, toggleMprSynchronizers, getMprIds, getMprEngineId } from '../utils/mprSetup';
import { useDicomTools } from '../hooks/useDicomTools';
import { Enums, getRenderingEngine, utilities as coreUtils } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

function MprViewportPanel({ 
  id, title, color, bg, elementRef, isActive, onClick, isLinked, onToggleLink, panelId
}: any) {
  const zoomRef = useRef<HTMLSpanElement>(null);
  const wwWcRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateOverlay = () => {
      const renderingEngine = getRenderingEngine(getMprEngineId(panelId));
      if (!renderingEngine) return;
      const viewport = renderingEngine.getViewport(id) as any;
      if (!viewport) return;

      const zoom = viewport.getZoom ? (viewport.getZoom() * 100).toFixed(0) : '100';
      if (zoomRef.current) zoomRef.current.innerText = `Zoom: ${zoom}%`;

      const properties = viewport.getProperties();
      const voiRange = properties?.voiRange;
      if (voiRange) {
        const ww = (voiRange.upper - voiRange.lower).toFixed(0);
        const wc = ((voiRange.upper + voiRange.lower) / 2).toFixed(0);
        if (wwWcRef.current) wwWcRef.current.innerText = `WW: ${ww} / WC: ${wc}`;
      }
    };

    element.addEventListener(Enums.Events.IMAGE_RENDERED, updateOverlay);
    element.addEventListener(Enums.Events.CAMERA_MODIFIED, updateOverlay);
    element.addEventListener(Enums.Events.VOI_MODIFIED, updateOverlay);
    
    setTimeout(updateOverlay, 500); // Initial update

    return () => {
      element.removeEventListener(Enums.Events.IMAGE_RENDERED, updateOverlay);
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, updateOverlay);
      element.removeEventListener(Enums.Events.VOI_MODIFIED, updateOverlay);
    };
  }, [id, elementRef]);

  return (
    <div 
      onClick={onClick}
      style={{ 
        position: 'relative', background: '#000', overflow: 'hidden',
        width: '100%', height: '100%',
        border: isActive ? `2px solid ${color}` : '1px solid var(--border-glass)',
        transition: 'border 0.2s ease', cursor: 'pointer'
      }}
    >
      <div className="viewer-overlay-card" style={{ top: '10px', left: '10px', color: color, borderColor: isActive ? color : 'var(--border-color)' }}>
        <span style={{ background: bg }}>{title}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLink(); }} 
          style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isLinked ? 'var(--bg-hover)' : 'var(--bg-panel)', color: isLinked ? 'var(--accent-primary)' : 'var(--text-secondary)', border: '1px solid', borderColor: isLinked ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '2px', padding: '4px', cursor: 'pointer', transition: 'background 0.1s ease' }}
          title={isLinked ? useLanguageStore.getState().t('mpr.unlink') : useLanguageStore.getState().t('mpr.link')}
        >
          {isLinked ? <Link size={14} /> : <Unlink size={14} />}
        </button>
      </div>

      <div className="viewer-overlay-card overlay-bottom-left" style={{ bottom: '10px', left: '10px', flexDirection: 'column', alignItems: 'flex-start', color: color, borderColor: 'transparent' }}>
        <span ref={zoomRef} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
          <Maximize2 size={12} /> Zoom: -
        </span>
      </div>

      <div className="viewer-overlay-card overlay-bottom-right" style={{ bottom: '10px', right: '10px', color: color, borderColor: 'transparent' }}>
        <span ref={wwWcRef} style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>WW: - / WC: -</span>
      </div>

      <div ref={elementRef} style={{ width: '100%', height: '100%', position: 'relative' }} onContextMenu={(e) => e.preventDefault()} />
    </div>
  );
}

interface MprViewerProps {
  panelId: string;
}

export function MprViewer({ panelId }: MprViewerProps) {
  const { 
    seriesList,
    setPanelMprLinked,
    setPanelMprActiveViewport,
    panels, playbackSpeed, activePanelId
  } = useViewerStore();
  const { t } = useLanguageStore();
  
  const panel = panels.find(p => p.id === panelId);
  const seriesInstanceUid = panel?.seriesInstanceUid;
  const isPlaying = panel?.isPlaying || false;
  
  const { toolGroupId, viewportIds, volumeId } = getMprIds(panelId, seriesInstanceUid || "");
  const mprIsLinked = panel?.mprIsLinked || false;
  const mprActiveViewport = panel?.mprActiveViewport || viewportIds[0];

  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const axialRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);


  useDicomTools(axialRef, toolGroupId, true);

  useEffect(() => {
    let isMounted = true;
    let localCleanup: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const initMpr = async () => {
      if (!imageIds || imageIds.length === 0) return;
      if (!axialRef.current || !coronalRef.current || !sagittalRef.current) return;

      setIsLoading(true);
      setErrorMsg(null);
      
      try {
        const volume = await buildVtkVolume(imageIds, volumeId);
        
        if (!isMounted) return;

        if (volume) {
          const { renderingEngine } = await setupMprViewports(
            [axialRef.current, coronalRef.current, sagittalRef.current],
            panelId,
            seriesInstanceUid || ""
          );

          if (!isMounted) {
            cleanupMprViewports(panelId, renderingEngine);
            return;
          }

          toggleMprSynchronizers(panelId, mprIsLinked);

          localCleanup = () => {
            cleanupMprViewports(panelId, renderingEngine);
          };

          // Hack for WebGL/React race conditions: Force a resize and re-render
          setTimeout(() => {
            if (isMounted && renderingEngine) {
              renderingEngine.resize(true);
              renderingEngine.renderViewports(viewportIds);
            }
          }, 150);
        }
      } catch (e: any) {
        if (isMounted) {
          console.error("Cornerstone3D Volume Initialization failed", e);
          setErrorMsg((e.message || String(e)) + '\n\n' + (e.stack || ''));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const checkDomAndInit = () => {
      const e = axialRef.current;
      let isInitializing = false;
      let resizeTimer: any;
      
      if (e) {
        resizeObserver = new ResizeObserver((entries) => {
          let hasSize = false;
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              hasSize = true;
            }
          }
          
          if (hasSize && isMounted) {
            const renderingEngine = getRenderingEngine(getMprEngineId(panelId));
            
            // If the viewport doesn't exist yet, it means it hasn't initialized
            if (!renderingEngine || !renderingEngine.getViewport(viewportIds[0])) {
               if (!isInitializing) {
                 isInitializing = true;
                 initMpr().finally(() => {
                   isInitializing = false;
                 });
               }
            } else {
               // Instant resize using requestAnimationFrame for optimal sync with DOM
               requestAnimationFrame(() => {
                 if (isMounted && renderingEngine) {
                   renderingEngine.resize(true);
                   renderingEngine.renderViewports(viewportIds);
                 }
               });
            }
          }
        });
        resizeObserver.observe(e);
        
        // Also observe the other viewports to ensure accurate resizing
        if (coronalRef.current) resizeObserver.observe(coronalRef.current);
        if (sagittalRef.current) resizeObserver.observe(sagittalRef.current);
      }
    };

    checkDomAndInit();

    return () => {
      isMounted = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (localCleanup) localCleanup();
    };
  }, [imageIds, panelId]);

  useEffect(() => {
    if (!isLoading && !errorMsg) {
      toggleMprSynchronizers(panelId, mprIsLinked);
    }
  }, [mprIsLinked, isLoading, errorMsg, panelId]);

  // Handle Cine playback
  useEffect(() => {
    let activeRef = axialRef;
    if (mprActiveViewport === viewportIds[1]) activeRef = coronalRef;
    else if (mprActiveViewport === viewportIds[2]) activeRef = sagittalRef;

    const safeStop = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current) {
        try { cornerstoneTools.utilities.cine.stopClip(ref.current); } catch (e) {}
      }
    };

    if (isPlaying && activeRef.current) {
      try {
        cornerstoneTools.utilities.cine.playClip(activeRef.current, { framesPerSecond: playbackSpeed });
      } catch (e) {
        console.warn("Cine playback might not be fully supported for VolumeViewport natively without stack synchronizer.", e);
      }
    } else if (!isPlaying) {
      safeStop(axialRef);
      safeStop(coronalRef);
      safeStop(sagittalRef);
    }

    return () => {
      safeStop(axialRef);
      safeStop(coronalRef);
      safeStop(sagittalRef);
    };
  }, [isPlaying, playbackSpeed, mprActiveViewport, viewportIds]);

  // Handle Keyboard Navigation for MPR Viewports
  useEffect(() => {
    if (panelId !== activePanelId || !imageIds || imageIds.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const renderingEngine = getRenderingEngine(getMprEngineId(panelId));
        if (!renderingEngine) return;
        
        const viewport = renderingEngine.getViewport(mprActiveViewport);
        if (!viewport) return;

        coreUtils.scroll(viewport, { delta });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panelId, activePanelId, mprActiveViewport, imageIds]);

  return (
    <div className="viewer-container" style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2px', backgroundColor: 'var(--border-color)', borderRadius: '0px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      
      {isLoading && !errorMsg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-deep)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-primary)' }}>
          <Box className="animate-pulse" size={48} style={{ marginBottom: '1rem' }} />
          <span style={{ fontSize: '1rem' }}>{t('mpr.loading')}</span>
          <span style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{t('mpr.sliceCount')} {imageIds.length}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-deep)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--accent-red)', padding: '2rem', textAlign: 'left', overflowY: 'auto' }}>
          <AlertTriangle size={48} style={{ marginBottom: '1rem', alignSelf: 'center' }} />
          <h3 style={{ marginBottom: '0.5rem', alignSelf: 'center' }}>{t('mpr.errorTitle')}</h3>
          <pre style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-panel)', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', maxWidth: '80%', border: '1px solid var(--accent-red)' }}>{errorMsg}</pre>
        </div>
      )}

      <MprViewportPanel
        id={viewportIds[0]} title="Axial" color="var(--accent-red)" bg="rgba(239, 68, 68, 0.1)"
        elementRef={axialRef} isActive={mprActiveViewport === viewportIds[0]}
        onClick={() => setPanelMprActiveViewport(panelId, viewportIds[0])}
        isLinked={mprIsLinked} onToggleLink={() => setPanelMprLinked(panelId, !mprIsLinked)}
        panelId={panelId}
      />

      <MprViewportPanel
        id={viewportIds[1]} title="Coronal" color="var(--accent-emerald)" bg="rgba(16, 185, 129, 0.1)"
        elementRef={coronalRef} isActive={mprActiveViewport === viewportIds[1]}
        onClick={() => setPanelMprActiveViewport(panelId, viewportIds[1])}
        isLinked={mprIsLinked} onToggleLink={() => setPanelMprLinked(panelId, !mprIsLinked)}
        panelId={panelId}
      />

      <MprViewportPanel
        id={viewportIds[2]} title="Sagittal" color="#3b82f6" bg="rgba(59, 130, 246, 0.1)"
        elementRef={sagittalRef} isActive={mprActiveViewport === viewportIds[2]}
        onClick={() => setPanelMprActiveViewport(panelId, viewportIds[2])}
        isLinked={mprIsLinked} onToggleLink={() => setPanelMprLinked(panelId, !mprIsLinked)}
        panelId={panelId}
      />

      {/* 4th Cell: Patient Info */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-deep)', border: 'none', margin: '0', overflowY: 'auto' }}>
        
        {/* Patient Block */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '16px', background: '#a89fea', borderRadius: '2px' }}></div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{t('mpr.patientInfo')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.name')}</span>
              <span style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{series?.patientName || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.id')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{series?.patientId || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.sex')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.patientSex || '-'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.age')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.patientAge || '-'}</span>
            </div>
          </div>
        </div>

        {/* Study Block */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '16px', background: '#06b6d4', borderRadius: '2px' }}></div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>{t('mpr.studyInfo')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.desc')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.studyDescription || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.date')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.studyDate || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Modality</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.modality || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.institution')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                {[series?.institutionName, series?.manufacturer, series?.manufacturerModel].filter(Boolean).join(' - ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Series Block */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '16px', background: '#f4b94e', borderRadius: '2px' }}></div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Series Information</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Description</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.seriesDescription || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Images</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.instanceCount || imageIds.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('mpr.thickness')}</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series?.sliceThickness ? `${series.sliceThickness} mm` : 'N/A'}</span>
            </div>
            {series?.pixelSpacing && (
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pixel Spacing</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series.pixelSpacing} mm</span>
              </div>
            )}
            {series?.kvp && (
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>kVp</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series.kvp} kVp</span>
              </div>
            )}
            {series?.exposure && (
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>mAs</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>{series.exposure} mAs</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
