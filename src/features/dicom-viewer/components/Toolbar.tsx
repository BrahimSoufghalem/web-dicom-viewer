import { getRenderingEngine } from '@cornerstonejs/core';
import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { SunMedium, ArrowRightLeft, Square, CircleDashed, Droplet, Hexagon, Eraser, Play, Pause, Contrast, ScanSearch, Hand, Compass, Crosshair, SunMoon, Undo2, Gauge, Palette, ChevronDown } from 'lucide-react';
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
        <button 
          className={`tool-btn ${activeTool === 'Wwwc' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Wwwc')}
          style={activeTool === 'Wwwc' ? { color: '#06b6d4', background: 'rgba(6,182,212,0.15)' } : {}}
        >
          <SunMedium size={18} />
          <span className="tooltip">{t('toolbar.contrast')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'Zoom' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Zoom')}
          style={activeTool === 'Zoom' ? { color: '#06b6d4', background: 'rgba(6,182,212,0.15)' } : {}}
        >
          <ScanSearch size={18} />
          <span className="tooltip">{t('toolbar.zoom')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'Pan' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Pan')}
          style={activeTool === 'Pan' ? { color: '#06b6d4', background: 'rgba(6,182,212,0.15)' } : {}}
        >
          <Hand size={18} />
          <span className="tooltip">{t('toolbar.pan')}</span>
        </button>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button 
          className={`tool-btn ${activeTool === 'Length' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Length')}
          style={activeTool === 'Length' ? { color: '#6eb0f5', background: 'rgba(55,138,221,0.15)' } : {}}
        >
          <ArrowRightLeft size={18} />
          <span className="tooltip">{t('toolbar.length')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'Angle' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Angle')}
          style={activeTool === 'Angle' ? { color: '#f4b94e', background: 'rgba(239,159,39,0.15)' } : {}}
        >
          <Compass size={18} />
          <span className="tooltip">{t('toolbar.angle')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'RectangleRoi' ? 'active' : ''}`} 
          onClick={() => handleToolClick('RectangleRoi')}
          style={activeTool === 'RectangleRoi' ? { color: '#3ecf9b', background: 'rgba(29,158,117,0.15)' } : {}}
        >
          <Square size={18} />
          <span className="tooltip">{t('toolbar.rect')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'EllipticalRoi' ? 'active' : ''}`} 
          onClick={() => handleToolClick('EllipticalRoi')}
          style={activeTool === 'EllipticalRoi' ? { color: '#3ecf9b', background: 'rgba(29,158,117,0.15)' } : {}}
        >
          <CircleDashed size={18} />
          <span className="tooltip">{t('toolbar.ellipse')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'FreehandRoi' ? 'active' : ''}`} 
          onClick={() => handleToolClick('FreehandRoi')}
          style={activeTool === 'FreehandRoi' ? { color: '#3ecf9b', background: 'rgba(29,158,117,0.15)' } : {}}
        >
          <Hexagon size={18} />
          <span className="tooltip">{t('toolbar.freehand')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'Probe' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Probe')}
          style={activeTool === 'Probe' ? { color: '#a89fea', background: 'rgba(127,119,221,0.15)' } : {}}
        >
          <Droplet size={18} />
          <span className="tooltip">{t('toolbar.probe')}</span>
        </button>
        <button 
          className={`tool-btn ${activeTool === 'Eraser' ? 'active' : ''}`} 
          onClick={() => handleToolClick('Eraser')}
          style={activeTool === 'Eraser' ? { color: '#ef4444', background: 'rgba(239,68,68,0.15)' } : {}}
        >
          <Eraser size={18} />
          <span className="tooltip">{t('toolbar.eraser')}</span>
        </button>
      </div>

      {isMprMode && (
        <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
          <button 
            className={`tool-btn ${activeTool === 'Crosshairs' ? 'active' : ''}`} 
            onClick={() => handleToolClick('Crosshairs')}
            style={activeTool === 'Crosshairs' ? { color: '#a89fea', background: 'rgba(127,119,221,0.15)' } : {}}
          >
            <Crosshair size={18} />
            <span className="tooltip">{t('toolbar.crosshairs')}</span>
          </button>
        </div>
      )}

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button 
          className={`tool-btn ${isInverted ? 'active' : ''}`} 
          onClick={handleInvert}
          style={isInverted ? { color: '#ffffff', background: 'rgba(255,255,255,0.15)' } : {}}
        >
          <SunMoon size={18} />
          <span className="tooltip">{t('toolbar.invert')}</span>
        </button>
        <button className="tool-btn" onClick={handleReset}>
          <Undo2 size={18} />
          <span className="tooltip">{t('toolbar.reset')}</span>
        </button>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button 
          className={`tool-btn ${isPlaying ? 'active' : ''}`} 
          onClick={togglePlayback}
          style={isPlaying ? { color: '#22c55e', background: 'rgba(34,197,94,0.15)' } : {}}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span className="tooltip">{isPlaying ? t('toolbar.pause') : t('toolbar.play')}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Gauge size={16} />
          <input 
            type="range" 
            min="5" 
            max="60" 
            value={playbackSpeed} 
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{ width: '60px', accentColor: '#22c55e', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <div style={{ position: 'relative' }}>
          <button 
            className={`tool-btn ${showPresets ? 'active' : ''}`} 
            onClick={() => setShowPresets(!showPresets)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', ...(showPresets ? { color: '#f4b94e', background: 'rgba(239,159,39,0.15)' } : {}) }}
          >
            <Palette size={18} />
            <ChevronDown size={14} style={{ opacity: 0.5 }} />
            <span className="tooltip">{t('toolbar.presets')}</span>
          </button>
          {showPresets && (
            <div className="preset-menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#111418', padding: '0.4rem', borderRadius: '8px', zIndex: 9999, display: 'flex', flexDirection: 'column', minWidth: '130px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('400,40'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Soft Tissue</button>
              <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('1500,-600'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Lung</button>
              <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('1500,300'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Bone</button>
              <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('80,40'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Brain</button>
              <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('350,50'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Mediastinum</button>
            </div>
          )}
        </div>
        
        {imageIds.length >= 10 && (
          <div className="mpr-toggle" style={{ marginLeft: '0.5rem', display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', gap: '2px' }}>
            <button
              onClick={() => activePanelId && setPanelMprMode(activePanelId, false)}
              style={{
                background: !isMprMode ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: !isMprMode ? '#ffffff' : 'rgba(255,255,255,0.4)',
                border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none'
              }}
            >
              2D
            </button>
            <button
              onClick={() => activePanelId && setPanelMprMode(activePanelId, true)}
              style={{
                background: isMprMode ? 'rgba(168,159,234,0.2)' : 'transparent',
                color: isMprMode ? '#a89fea' : 'rgba(255,255,255,0.4)',
                border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none'
              }}
            >
              MPR
            </button>
          </div>
        )}
      </div>
    </>
  );
}
