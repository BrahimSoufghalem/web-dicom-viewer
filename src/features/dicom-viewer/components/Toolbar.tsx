import { getRenderingEngine } from '@cornerstonejs/core';
import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Sun, Ruler, Square, Circle, Crosshair, PenTool, Eraser, Play, Pause, Contrast, ZoomIn, Move, Activity, Target, RotateCcw, Settings, ChevronDown } from 'lucide-react';
import { getMprIds } from '../utils/mprSetup';
import { useState } from 'react';

export function Toolbar() {
  const { 
    activeTool, setActiveTool, 
    panels, activePanelId,
    setPanelPlaying,
    setPanelMprMode,
    seriesList,
    playbackSpeed,
    setPlaybackSpeed,
    isInverted,
    setIsInverted
  } = useViewerStore();
  
  const { t } = useLanguageStore();
  const [showPresets, setShowPresets] = useState(false);

  const activePanel = panels.find(p => p.id === activePanelId);
  const isPlaying = activePanel?.isPlaying || false;
  const isMprMode = activePanel?.isMprMode || false;
  const mprIsLinked = activePanel?.mprIsLinked || false;
  const mprActiveViewport = activePanel?.mprActiveViewport || '';
  const seriesInstanceUid = activePanel?.seriesInstanceUid;
  
  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];

  const handleToolClick = (toolId: string) => setActiveTool(toolId);

  const engineId = `engine-${activePanelId}`;

  const handleReset = () => {
    if (!activePanelId) return;
    const renderingEngine = getRenderingEngine(engineId);
    if (!renderingEngine) return;
    
    if (isMprMode) {
      const { viewportIds } = getMprIds(activePanelId);
      if (mprIsLinked) {
        viewportIds.forEach(id => {
           const vp = renderingEngine.getViewport(id) as any;
           if (vp) { vp.resetCamera(); vp.resetProperties(); vp.render(); }
        });
      } else {
         const vp = renderingEngine.getViewport(mprActiveViewport) as any;
         if (vp) { vp.resetCamera(); vp.resetProperties(); vp.render(); }
      }
    } else {
      const VIEWPORT_ID = `STACK_VIEWPORT_${activePanelId}`;
      const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
      if (viewport) {
        viewport.resetCamera();
        viewport.resetProperties();
        viewport.render();
      }
    }
    setIsInverted(false);
  };

  const handleInvert = () => {
    if (!activePanelId) return;
    const renderingEngine = getRenderingEngine(engineId);
    if (!renderingEngine) return;
    
    let newInvertState = !isInverted;
    if (isMprMode) {
      const { viewportIds } = getMprIds(activePanelId);
      if (mprIsLinked) {
        viewportIds.forEach(id => {
           const vp = renderingEngine.getViewport(id) as any;
           if (vp) {
              const properties = vp.getProperties() || {};
              newInvertState = !properties.invert;
              vp.setProperties({ invert: newInvertState });
              vp.render();
           }
        });
      } else {
         const vp = renderingEngine.getViewport(mprActiveViewport) as any;
         if (vp) {
            const properties = vp.getProperties() || {};
            newInvertState = !properties.invert;
            vp.setProperties({ invert: newInvertState });
            vp.render();
         }
      }
    } else {
      const VIEWPORT_ID = `STACK_VIEWPORT_${activePanelId}`;
      const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
      if (viewport) {
        const properties = viewport.getProperties() || {};
        newInvertState = !properties.invert;
        viewport.setProperties({ invert: newInvertState });
        viewport.render();
      }
    }
    setIsInverted(newInvertState);
  };

  const togglePlayback = () => {
    if (activePanelId) setPanelPlaying(activePanelId, !isPlaying);
  };

  const applyWindowPreset = (value: string) => {
    if (!activePanelId || !value) return;
    const [ww, wc] = value.split(',').map(Number);
    const lower = wc - ww / 2;
    const upper = wc + ww / 2;

    const renderingEngine = getRenderingEngine(engineId);
    if (!renderingEngine) return;

    if (isMprMode) {
      const { viewportIds } = getMprIds(activePanelId);
      if (mprIsLinked) {
        viewportIds.forEach(id => {
           const vp = renderingEngine.getViewport(id) as any;
           if (vp) { vp.setProperties({ voiRange: { lower, upper } }); vp.render(); }
        });
      } else {
         const vp = renderingEngine.getViewport(mprActiveViewport) as any;
         if (vp) { vp.setProperties({ voiRange: { lower, upper } }); vp.render(); }
      }
    } else {
      const VIEWPORT_ID = `STACK_VIEWPORT_${activePanelId}`;
      const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
      if (viewport) {
        viewport.setProperties({ voiRange: { lower, upper } });
        viewport.render();
      }
    }
  };

  return (
    <>
      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button className={`tool-btn ${activeTool === 'Wwwc' ? 'active' : ''}`} onClick={() => handleToolClick('Wwwc')}>
          <Sun size={18} />
          <span className="tooltip">{t('toolbar.contrast')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'Zoom' ? 'active' : ''}`} onClick={() => handleToolClick('Zoom')}>
          <ZoomIn size={18} />
          <span className="tooltip">{t('toolbar.zoom')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'Pan' ? 'active' : ''}`} onClick={() => handleToolClick('Pan')}>
          <Move size={18} />
          <span className="tooltip">{t('toolbar.pan')}</span>
        </button>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button className={`tool-btn ${activeTool === 'Length' ? 'active' : ''}`} onClick={() => handleToolClick('Length')}>
          <Ruler size={18} />
          <span className="tooltip">{t('toolbar.length')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'Angle' ? 'active' : ''}`} onClick={() => handleToolClick('Angle')}>
          <Activity size={18} />
          <span className="tooltip">{t('toolbar.angle')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'RectangleRoi' ? 'active' : ''}`} onClick={() => handleToolClick('RectangleRoi')}>
          <Square size={18} />
          <span className="tooltip">{t('toolbar.rect')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'EllipticalRoi' ? 'active' : ''}`} onClick={() => handleToolClick('EllipticalRoi')}>
          <Circle size={18} />
          <span className="tooltip">{t('toolbar.ellipse')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'FreehandRoi' ? 'active' : ''}`} onClick={() => handleToolClick('FreehandRoi')}>
          <PenTool size={18} />
          <span className="tooltip">{t('toolbar.freehand')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'Probe' ? 'active' : ''}`} onClick={() => handleToolClick('Probe')}>
          <Crosshair size={18} />
          <span className="tooltip">{t('toolbar.probe')}</span>
        </button>
        <button className={`tool-btn ${activeTool === 'Eraser' ? 'active' : ''}`} onClick={() => handleToolClick('Eraser')}>
          <Eraser size={18} />
          <span className="tooltip">{t('toolbar.eraser')}</span>
        </button>
      </div>

      {isMprMode && (
        <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
          <button className={`tool-btn ${activeTool === 'Crosshairs' ? 'active' : ''}`} onClick={() => handleToolClick('Crosshairs')}>
            <Target size={18} />
            <span className="tooltip">{t('toolbar.crosshairs')}</span>
          </button>
        </div>
      )}

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button className={`tool-btn ${isInverted ? 'active' : ''}`} onClick={handleInvert}>
          <Contrast size={18} />
          <span className="tooltip">{t('toolbar.invert')}</span>
        </button>
        <button className="tool-btn" onClick={handleReset}>
          <RotateCcw size={18} />
          <span className="tooltip">{t('toolbar.reset')}</span>
        </button>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button className={`tool-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlayback}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span className="tooltip">{isPlaying ? t('toolbar.pause') : t('toolbar.play')}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <span>{t('toolbar.speed')}</span>
          <input 
            type="range" 
            min="5" 
            max="60" 
            value={playbackSpeed} 
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--accent-primary)' }}
          />
        </div>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <div style={{ position: 'relative' }}>
          <button className="tool-btn" onClick={() => setShowPresets(!showPresets)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} />
            <span style={{ fontSize: '0.85rem' }}>{t('toolbar.presets')}</span>
            <ChevronDown size={14} />
          </button>
          {showPresets && (
            <div className="preset-menu" style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, background: 'var(--bg-panel)', padding: '0.25rem', borderRadius: '4px', zIndex: 9999, display: 'flex', flexDirection: 'column', minWidth: '120px', boxShadow: '0 -4px 6px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
              <button style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { applyWindowPreset('400,40'); setShowPresets(false); }}>Soft Tissue</button>
              <button style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { applyWindowPreset('1500,-600'); setShowPresets(false); }}>Lung</button>
              <button style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { applyWindowPreset('1500,300'); setShowPresets(false); }}>Bone</button>
              <button style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { applyWindowPreset('80,40'); setShowPresets(false); }}>Brain</button>
              <button style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { applyWindowPreset('350,50'); setShowPresets(false); }}>Mediastinum</button>
            </div>
          )}
        </div>
        
        {imageIds.length >= 10 && (
          <div className="mpr-toggle" style={{ marginLeft: '0.5rem' }}>
            <button
              onClick={() => activePanelId && setPanelMprMode(activePanelId, false)}
              className={!isMprMode ? 'active' : ''}
            >
              2D
            </button>
            <button
              onClick={() => activePanelId && setPanelMprMode(activePanelId, true)}
              className={isMprMode ? 'active' : ''}
            >
              3D MPR
            </button>
          </div>
        )}
      </div>
    </>
  );
}
