import { getRenderingEngine, utilities, CONSTANTS } from '@cornerstonejs/core';
import { useViewerStore } from '../../../store/useViewerStore';
import { useShallow } from 'zustand/react/shallow';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { SunMedium, ArrowRightLeft, Square, CircleDashed, Droplet, Hexagon, Play, Pause, ScanSearch, Hand, Compass, Crosshair, SunMoon, Undo2, Gauge, Palette, ChevronDown, Info, Brush } from 'lucide-react';
import { getMprIds } from '../utils/mprSetup';
import { useState } from 'react';
import { DicomTagsModal } from './DicomTagsModal';

export function Toolbar() {
  const { 
    activeTool, setActiveTool, 
    panels, activePanelId,
    setPanelPlaying,
    setPanelMprMode,
    setPanel3DMode,
    seriesList,
    playbackSpeed,
    setPlaybackSpeed,
    isInverted,
    setIsInverted,
    isSegmentationPanelOpen,
    setIsSegmentationPanelOpen
  } = useViewerStore(useShallow(state => ({
    activeTool: state.activeTool,
    setActiveTool: state.setActiveTool,
    panels: state.panels,
    activePanelId: state.activePanelId,
    setPanelPlaying: state.setPanelPlaying,
    setPanelMprMode: state.setPanelMprMode,
    setPanel3DMode: state.setPanel3DMode,
    seriesList: state.seriesList,
    playbackSpeed: state.playbackSpeed,
    setPlaybackSpeed: state.setPlaybackSpeed,
    isInverted: state.isInverted,
    setIsInverted: state.setIsInverted,
    isSegmentationPanelOpen: state.isSegmentationPanelOpen,
    setIsSegmentationPanelOpen: state.setIsSegmentationPanelOpen
  })));
  
  const { t } = useLanguageStore();
  const [showPresets, setShowPresets] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  const activePanel = panels.find(p => p.id === activePanelId);
  const isPlaying = activePanel?.isPlaying || false;
  const isMprMode = activePanel?.isMprMode || false;
  const is3DMode = activePanel?.is3DMode || false;
  const mprIsLinked = activePanel?.mprIsLinked || false;
  const mprActiveViewport = activePanel?.mprActiveViewport || '';
  const seriesInstanceUid = activePanel?.seriesInstanceUid;
  
  const series = seriesList.find(s => s.seriesInstanceUid === seriesInstanceUid);
  const imageIds = series ? series.imageIds : [];

  const handleToolClick = (toolId: string) => setActiveTool(toolId);

  const engineId = `engine-${activePanelId}`;

  const forEachActiveViewport = (action: (viewport: any) => void, include3D: boolean = false) => {
    if (!activePanelId) return;
    const renderingEngine = getRenderingEngine(engineId);
    if (!renderingEngine && !is3DMode) return;

    if (is3DMode && include3D) {
      const engine3d = getRenderingEngine(`engine-${activePanelId}`);
      if (engine3d) {
        const vp = engine3d.getViewport(`VOLUME_3D_${activePanelId}`) as any;
        if (vp) action(vp);
      }
    } else if (isMprMode) {
      const { viewportIds } = getMprIds(activePanelId);
      if (mprIsLinked && renderingEngine) {
        viewportIds.forEach(id => {
           const vp = renderingEngine.getViewport(id) as any;
           if (vp) action(vp);
        });
      } else if (renderingEngine) {
         const vp = renderingEngine.getViewport(mprActiveViewport) as any;
         if (vp) action(vp);
      }
    } else if (renderingEngine) {
      const VIEWPORT_ID = `STACK_VIEWPORT_${activePanelId}`;
      const viewport = renderingEngine.getViewport(VIEWPORT_ID) as any;
      if (viewport) action(viewport);
    }
  };

  const handleReset = () => {
    forEachActiveViewport((vp) => {
      vp.resetCamera();
      vp.resetProperties();
      vp.render();
    }, true);
    setIsInverted(false);
  };

  const handleInvert = () => {
    let newInvertState = !isInverted;
    forEachActiveViewport((vp) => {
      const properties = vp.getProperties() || {};
      newInvertState = !properties.invert;
      vp.setProperties({ invert: newInvertState });
      vp.render();
    });
    setIsInverted(newInvertState);
  };

  const togglePlayback = () => {
    if (activePanelId) setPanelPlaying(activePanelId, !isPlaying);
  };

  const applyWindowPreset = (value: string) => {
    if (!value) return;
    const [ww, wc] = value.split(',').map(Number);
    const lower = wc - ww / 2;
    const upper = wc + ww / 2;

    forEachActiveViewport((vp) => {
      vp.setProperties({ voiRange: { lower, upper } });
      vp.render();
    });
  };

  const apply3DPreset = (presetName: string) => {
    if (!activePanelId) return;
    const engine3d = getRenderingEngine(`engine-${activePanelId}`);
    if (!engine3d) return;
    const viewport = engine3d.getViewport(`VOLUME_3D_${activePanelId}`) as any;
    if (viewport && viewport.getDefaultActor) {
      const volumeActor = viewport.getDefaultActor()?.actor;
      if (volumeActor) {
        const preset = CONSTANTS.VIEWPORT_PRESETS.find(p => p.name === presetName);
        if (preset) {
          utilities.applyPreset(volumeActor, preset);
          viewport.render();
        }
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
      </div>

      <div className="tool-group" style={{ opacity: activePanelId ? 1 : 0.5, pointerEvents: activePanelId ? 'auto' : 'none' }}>
        <button 
          className={`tool-btn ${isSegmentationPanelOpen ? 'active' : ''}`} 
          onClick={() => setIsSegmentationPanelOpen(!isSegmentationPanelOpen)}
          style={isSegmentationPanelOpen ? { color: '#ec4899', background: 'rgba(236,72,153,0.15)' } : {}}
        >
          <Brush size={18} />
          <span className="tooltip">Segmentation</span>
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
        <button 
          className={`tool-btn ${showTagsModal ? 'active' : ''}`} 
          onClick={() => setShowTagsModal(true)}
          style={showTagsModal ? { color: '#ffffff', background: 'rgba(255,255,255,0.15)' } : {}}
        >
          <Info size={18} />
          <span className="tooltip">DICOM Tags</span>
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
              {is3DMode ? (
                <>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { apply3DPreset('CT-Bone'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Bone</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { apply3DPreset('CT-MIP'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>MIP</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { apply3DPreset('CT-Soft-Tissue'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Soft Tissue</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { apply3DPreset('CT-Coronary-Arteries'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Angio</button>
                </>
              ) : (
                <>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('400,40'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Soft Tissue</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('1500,-600'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Lung</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('1500,300'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Bone</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('80,40'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Brain</button>
                  <button style={{ padding: '0.5rem 0.75rem', textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', transition: 'background 0.1s' }} onClick={() => { applyWindowPreset('350,50'); setShowPresets(false); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Mediastinum</button>
                </>
              )}
            </div>
          )}
        </div>
        
        {imageIds.length >= 10 && (
          <div className="mpr-toggle" style={{ marginLeft: '0.5rem', display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', gap: '2px' }}>
            <button
              onClick={() => {
                if (activePanelId) {
                  setPanelMprMode(activePanelId, false);
                  setPanel3DMode(activePanelId, false);
                }
              }}
              style={{
                background: (!isMprMode && !is3DMode) ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: (!isMprMode && !is3DMode) ? '#ffffff' : 'rgba(255,255,255,0.4)',
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
            <button
              onClick={() => activePanelId && setPanel3DMode(activePanelId, true)}
              style={{
                background: is3DMode ? 'rgba(239,159,39,0.2)' : 'transparent',
                color: is3DMode ? '#f4b94e' : 'rgba(255,255,255,0.4)',
                border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none'
              }}
            >
              3D
            </button>
          </div>
        )}
      </div>

      {showTagsModal && imageIds.length > 0 && (
        <DicomTagsModal 
          imageId={imageIds[activePanel?.currentImageIndex || 0]} 
          onClose={() => setShowTagsModal(false)} 
        />
      )}
    </>
  );
}
