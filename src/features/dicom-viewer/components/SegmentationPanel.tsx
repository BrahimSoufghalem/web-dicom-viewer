import { useEffect } from 'react';
import { useSegmentationStore } from '../../../store/useSegmentationStore';
import { useViewerStore } from '../../../store/useViewerStore';
import { useShallow } from 'zustand/react/shallow';
import { Eye, EyeOff, Plus, Trash2, Brush, Scissors, CircleDashed, PaintBucket, Eraser } from 'lucide-react';
import { segmentation } from '@cornerstonejs/tools';
import { getSegmentationId } from '../utils/segmentationSetup';
import { useLanguageStore } from '../../../store/useLanguageStore';

// Helper to convert hex to rgb array
const hexToRgb = (hex: string): [number, number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255
  ] : [255, 0, 0, 255];
};

// Helper to convert rgb array to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
};

const SEGMENTATION_TOOLS = [
  { id: 'Brush', icon: Brush, label: 'Brush' },
  { id: 'RectangleScissors', icon: Scissors, label: 'Rect Scissors' },
  { id: 'CircleScissors', icon: CircleDashed, label: 'Circle Scissors' },
  { id: 'PaintFill', icon: PaintBucket, label: 'Paint Fill' },
  { id: 'Eraser', icon: Eraser, label: 'Eraser' },
] as const;

export function SegmentationPanel() {
  const { segments, activeSegmentIndex, setActiveSegmentIndex, updateSegment, removeSegment, addSegment } = useSegmentationStore(useShallow(state => ({
    segments: state.segments,
    activeSegmentIndex: state.activeSegmentIndex,
    setActiveSegmentIndex: state.setActiveSegmentIndex,
    updateSegment: state.updateSegment,
    removeSegment: state.removeSegment,
    addSegment: state.addSegment
  })));
  
  const { activePanelId, panels, activeTool, setActiveTool, brushSize, setBrushSize } = useViewerStore(useShallow(state => ({
    activePanelId: state.activePanelId,
    panels: state.panels,
    activeTool: state.activeTool,
    setActiveTool: state.setActiveTool,
    brushSize: state.brushSize,
    setBrushSize: state.setBrushSize
  })));
  const { t } = useLanguageStore();

  const activePanel = panels.find(p => p.id === activePanelId);
  const seriesInstanceUid = activePanel?.seriesInstanceUid;
  const segmentationId = seriesInstanceUid ? getSegmentationId(seriesInstanceUid) : null;

  // Sync active segment with cornerstone
  useEffect(() => {
    if (segmentationId) {
      const existing = segmentation.state.getSegmentation(segmentationId);
      if (existing) {
        try {
          segmentation.segmentIndex.setActiveSegmentIndex(segmentationId, activeSegmentIndex);
        } catch (e) {
          console.warn('Could not set active segment index', e);
        }
      }
    }
  }, [activeSegmentIndex, segmentationId]);

  // Brush size is synced to cornerstone via useDicomTools hook (reads from Zustand store)

  const handleAddSegment = () => {
    const name = prompt(t('segmentation.promptName') || "Enter segment name:", `Segment ${segments.length + 1}`);
    if (!name) return;
    
    const newIndex = Math.max(...segments.map(s => s.segmentIndex), 0) + 1;
    
    // Try to read color from Cornerstone's built-in color LUT first
    let colorArray: [number, number, number, number] = [
      Math.floor(Math.random() * 200) + 55,
      Math.floor(Math.random() * 200) + 55,
      Math.floor(Math.random() * 200) + 55,
      255,
    ];

    if (segmentationId) {
      try {
        // Read the color Cornerstone already assigned for this index
        const viewports = ['MPR_AXIAL', 'MPR_SAGITTAL', 'MPR_CORONAL', 'STACK_VIEWPORT'].map(prefix => `${prefix}_${activePanelId}`);
        for (const vpId of viewports) {
          const csColor = segmentation.config.color.getSegmentIndexColor(vpId, segmentationId, newIndex);
          if (csColor && (csColor[0] !== 0 || csColor[1] !== 0 || csColor[2] !== 0 || csColor[3] !== 0)) {
            colorArray = [csColor[0], csColor[1], csColor[2], csColor[3]] as [number, number, number, number];
            break;
          }
        }
        // If no color found (all zeros), set our random color into Cornerstone
        if (colorArray[3] === 255) {
          viewports.forEach(vpId => {
            try {
              segmentation.config.color.setSegmentIndexColor(vpId, segmentationId, newIndex, colorArray);
            } catch(e) {}
          });
        }
      } catch(e) {}
    }
    
    addSegment(name, colorArray);
  };

  const handleColorChange = (index: number, hex: string) => {
    const rgba = hexToRgb(hex);
    updateSegment(index, { color: rgba });
    
    if (segmentationId) {
      try {
        const viewports = ['MPR_AXIAL', 'MPR_SAGITTAL', 'MPR_CORONAL', 'STACK_VIEWPORT'].map(prefix => `${prefix}_${activePanelId}`);
        viewports.forEach(vpId => {
          segmentation.config.color.setSegmentIndexColor(vpId, segmentationId, index, rgba);
        });
      } catch(e) {
        console.warn('Could not update segmentation color in cornerstone', e);
      }
    }
  };

  const handleVisibilityToggle = (index: number, currentVisibility: boolean) => {
    updateSegment(index, { visible: !currentVisibility });
  };

  const isBrushTool = activeTool === 'Brush' || activeTool === 'Eraser';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-sidebar)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}>
          {t('segmentation.title') || 'Segmentation'}
        </span>
        <button 
          onClick={handleAddSegment}
          style={{ 
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: 500,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--border-color)';
            e.currentTarget.style.borderColor = 'var(--text-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <Plus size={12} /> {t('segmentation.add') || 'Add'}
        </button>
      </div>

      {/* Tools Row */}
      <div style={{
        padding: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '2px',
        flexShrink: 0,
      }}>
        {SEGMENTATION_TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          const isEraser = tool.id === 'Eraser';
          const Icon = tool.icon;
          return (
            <button 
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              style={{
                flex: 1,
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
                background: isActive
                  ? (isEraser ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-hover)')
                  : 'transparent',
                color: isActive
                  ? (isEraser ? 'var(--accent-red)' : 'var(--accent-primary)')
                  : 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>

      {/* Brush Size Slider */}
      {isBrushTool && (
        <div style={{
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('segmentation.brushSize') || 'Size'}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              background: 'var(--bg-deep)',
              padding: '1px 6px',
              borderRadius: '2px',
              border: '1px solid var(--border-color)',
            }}>
              {brushSize}
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ 
              width: '100%',
              height: '4px',
              accentColor: activeTool === 'Eraser' ? 'var(--accent-red)' : 'var(--accent-primary)',
              cursor: 'pointer',
            }}
          />
        </div>
      )}

      {/* Segments List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {segments.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}>
            No segments yet. Click "Add" to create one.
          </div>
        )}

        {segments.map((seg) => {
          const isActive = activeSegmentIndex === seg.segmentIndex;
          const segColor = `rgb(${seg.color[0]}, ${seg.color[1]}, ${seg.color[2]})`;
          
          return (
            <div 
              key={seg.segmentIndex}
              onClick={() => setActiveSegmentIndex(seg.segmentIndex)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '6px 8px',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                borderLeft: `3px solid ${segColor}`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Color Swatch */}
              <div style={{ position: 'relative', width: '16px', height: '16px', flexShrink: 0 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: segColor,
                  border: '1px solid rgba(255,255,255,0.15)',
                }} />
                <input 
                  type="color"
                  value={rgbToHex(seg.color[0], seg.color[1], seg.color[2])}
                  onChange={(e) => handleColorChange(seg.segmentIndex, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '16px',
                    height: '16px',
                    opacity: 0,
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0,
                  }}
                />
              </div>

              {/* Label */}
              <span style={{
                flex: 1,
                fontSize: '0.8rem',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {seg.label}
              </span>
              
              {/* Visibility */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(seg.segmentIndex, seg.visible); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: seg.visible ? 'var(--text-muted)' : 'var(--border-color)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '2px',
                  transition: 'color 0.1s',
                }}
                title="Toggle Visibility"
              >
                {seg.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>

              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (segmentationId) {
                    try {
                      segmentation.removeSegment(segmentationId, seg.segmentIndex);
                      
                      const viewports = ['MPR_AXIAL', 'MPR_SAGITTAL', 'MPR_CORONAL', 'STACK_VIEWPORT'].map(prefix => `${prefix}_${activePanelId}`);
                      viewports.forEach(vpId => {
                        segmentation.config.color.setSegmentIndexColor(vpId, segmentationId, seg.segmentIndex, [0, 0, 0, 0]);
                      });
                    } catch(err) {
                      console.warn('Failed to remove segment from cornerstone:', err);
                    }
                  }
                  removeSegment(seg.segmentIndex); 
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '2px',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Delete Segment"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
