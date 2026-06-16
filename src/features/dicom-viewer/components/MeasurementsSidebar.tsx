import React, { useState } from 'react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { useViewerStore } from '../../../store/useViewerStore';
import { Trash2, Ruler, Square, Circle, PenTool, Activity, Crosshair, Target, Type, Edit2, LayoutList, Download, Hexagon, CircleDashed, Compass, Droplet, ArrowRightLeft } from 'lucide-react';
import type { Measurement } from '../hooks/useMeasurements';

const getToolStyleClass = (toolName: string) => {
  const name = (toolName || '').toLowerCase();
  if (name.includes('length')) return 'len';
  if (name.includes('probe') || name.includes('crosshair')) return 'hu';
  if (name.includes('angle')) return 'angle';
  return 'area';
};

const ToolIcon = ({ toolName }: { toolName: string }) => {
  const name = (toolName || '').toLowerCase();
  if (name.includes('length')) return <ArrowRightLeft size={16} strokeWidth={2} />;
  if (name.includes('probe')) return <Droplet size={16} strokeWidth={2} />;
  if (name.includes('rectangle')) return <Square size={16} strokeWidth={2} />;
  if (name.includes('planar') || name.includes('freehand')) return <Hexagon size={16} strokeWidth={2} />;
  if (name.includes('circle') || name.includes('elliptical') || name.includes('ellipse')) return <CircleDashed size={16} strokeWidth={2} />;
  if (name.includes('angle')) return <Compass size={16} strokeWidth={2} />;
  if (name.includes('arrow')) return <Type size={16} strokeWidth={2} />;
  if (name.includes('crosshair')) return <Target size={16} strokeWidth={2} />;
  return <Activity size={16} strokeWidth={2} />;
};

const formatMeasurementText = (text: string) => {
  let val = text;
  let avg = '';
  if (text.includes('(Avg:')) {
     const parts = text.split('(Avg:');
     val = parts[0].trim();
     avg = 'avg ' + parts[1].replace(')', '').trim();
  } else if (text.includes('Avg:')) {
     const parts = text.split('Avg:');
     val = parts[0].trim();
     avg = 'avg ' + parts[1].replace(')', '').trim();
  }
  return { val, avg };
};

const getViewTag = (mode: string) => {
  const upper = mode.toUpperCase();
  if (upper.includes('AXIAL')) return { class: 'tag ax', text: 'AXL' };
  if (upper.includes('CORONAL')) return { class: 'tag cor', text: 'COR' };
  if (upper.includes('SAGITTAL')) return { class: 'tag sag', text: 'SAG' };
  if (upper === '2D') return { class: 'tag d2', text: '2D' };
  return { class: 'tag d2', text: upper };
};

const css = `
  .sb-container { font-family: var(--font-sans, system-ui, sans-serif); background: #111418; width: 280px; height: 100%; display: flex; flex-direction: column; border-left: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); box-sizing: border-box; }
  .sb-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 0.5px solid rgba(255,255,255,0.07); flex-shrink: 0; }
  .sb-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-left: 8px; }
  .sb-badge { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 500; border-radius: 20px; padding: 2px 8px; margin-left: 6px; }
  .sb-actions { display: flex; gap: 4px; }
  .sb-actions button { background: none; border: none; cursor: pointer; padding: 4px; color: rgba(255,255,255,0.3); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .sb-actions button:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
  .items-scroll { padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; flex: 1; }
  .mitem { border-radius: 8px; padding: 8px 10px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer; border: 0.5px solid transparent; transition: background 0.1s; }
  .mitem:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.06); }
  .micon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .micon.area { background: rgba(29,158,117,0.15); color: #3ecf9b; }
  .micon.angle { background: rgba(239,159,39,0.15); color: #f4b94e; }
  .micon.hu { background: rgba(127,119,221,0.15); color: #a89fea; }
  .micon.len { background: rgba(55,138,221,0.15); color: #6eb0f5; }
  .mbody { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .mrow { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
  .mval { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); word-break: break-word; }
  .mavg { font-size: 12px; color: rgba(255,255,255,0.35); margin-left: 6px; font-weight: 400; }
  .mname { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mtags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; align-items: center; }
  .tag { font-size: 10px; font-weight: 500; border-radius: 4px; padding: 2px 6px; letter-spacing: 0.02em; }
  .tag.slice { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }
  .tag.ser { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }
  .tag.sag { background: rgba(55,138,221,0.15); color: #6eb0f5; }
  .tag.cor { background: rgba(29,158,117,0.15); color: #3ecf9b; }
  .tag.ax { background: rgba(220,75,74,0.15); color: #f08080; }
  .tag.d2 { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.35); }
  .mbtns { display: flex; gap: 2px; opacity: 0; transition: opacity 0.1s; }
  .mitem:hover .mbtns { opacity: 1; }
  .mbtn { background: none; border: none; cursor: pointer; padding: 4px; color: rgba(255,255,255,0.3); border-radius: 5px; display: flex; align-items: center; justify-content: center; }
  .mbtn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
  .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 8px; }
  .section-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.2); padding: 8px 10px 2px; letter-spacing: 0.06em; text-transform: uppercase; }
`;

interface MeasurementsSidebarProps {
  measurements: Measurement[];
  removeMeasurement: (uid: string) => void;
  jumpToMeasurement: (uid: string) => void;
  updateMeasurementLabel: (uid: string, label: string) => void;
}

export function MeasurementsSidebar({ measurements, removeMeasurement, jumpToMeasurement, updateMeasurementLabel }: MeasurementsSidebarProps) {
  const { t } = useLanguageStore();
  const seriesList = useViewerStore(state => state.seriesList);
  const activePanelId = useViewerStore(state => state.activePanelId);
  const panels = useViewerStore(state => state.panels);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isGroupedByType, setIsGroupedByType] = useState(false);

  const handleEditStart = (e: React.MouseEvent, m: Measurement) => {
    e.stopPropagation();
    setEditingId(m.annotationUID);
    setEditValue(m.customLabel || '');
  };

  const handleEditSave = (uid: string) => {
    updateMeasurementLabel(uid, editValue);
    setEditingId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, uid: string) => {
    if (e.key === 'Enter') handleEditSave(uid);
    if (e.key === 'Escape') setEditingId(null);
  };

  const renderItems = () => {
    let currentGroup = '';
    const items: JSX.Element[] = [];

    const sortedMeasurements = [...measurements].sort((a, b) => {
      if (isGroupedByType) {
        if (a.toolName !== b.toolName) return (a.toolName || '').localeCompare(b.toolName || '');
      }

      if (a.panelId !== b.panelId) return (a.panelId || '').localeCompare(b.panelId || '');
      
      const aIs2D = a.viewMode.toUpperCase() === '2D';
      const bIs2D = b.viewMode.toUpperCase() === '2D';
      if (aIs2D !== bIs2D) return aIs2D ? 1 : -1;
      
      if (!aIs2D && !bIs2D) return a.viewMode.localeCompare(b.viewMode);

      const aSeries = seriesList.find(s => s.imageIds.includes(a.referencedImageId));
      const aIndex = aSeries ? aSeries.imageIds.indexOf(a.referencedImageId) : -1;
      const bSeries = seriesList.find(s => s.imageIds.includes(b.referencedImageId));
      const bIndex = bSeries ? bSeries.imageIds.indexOf(b.referencedImageId) : -1;
      return aIndex - bIndex;
    });

    sortedMeasurements.forEach((m, idx) => {
      const series = seriesList.find(s => s.imageIds.includes(m.referencedImageId));
      const imageIdsForMeasurement = series ? series.imageIds : [];
      const trueIndex = imageIdsForMeasurement.indexOf(m.referencedImageId);
      const sliceBadge = trueIndex !== -1 ? (trueIndex + 1).toString() : '?';
      const panelNumber = m.panelId ? m.panelId.replace('panel-', '') : '1';

      const is2D = m.viewMode.toUpperCase() === '2D';
      let groupLabel = is2D ? `Series ${panelNumber} — Slice ${sliceBadge}` : `Series ${panelNumber} — MPR`;
      
      if (isGroupedByType) {
        groupLabel = `${m.toolName || 'Measurement'} Tools`;
      }

      if (groupLabel !== currentGroup) {
        if (currentGroup !== '') {
          items.push(<div className="divider" key={`div-${m.annotationUID}-${idx}`} />);
        }
        items.push(<div className="section-label" key={`lbl-${m.annotationUID}-${idx}`}>{groupLabel}</div>);
        currentGroup = groupLabel;
      }

      const { val, avg } = formatMeasurementText(m.text || '');
      const viewTag = getViewTag(m.viewMode);
      const iconClass = getToolStyleClass(m.toolName);

      items.push(
        <div 
          key={m.annotationUID}
          className="mitem"
          onClick={() => jumpToMeasurement(m.annotationUID)}
        >
          <div className={`micon ${iconClass}`}>
            <ToolIcon toolName={m.toolName} />
          </div>
          
          <div className="mbody">
            <div className="mrow">
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === m.annotationUID ? (
                  <input
                    type="text"
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(m.annotationUID)}
                    onKeyDown={e => handleEditKeyDown(e, m.annotationUID)}
                    onClick={e => e.stopPropagation()}
                    placeholder="Enter name..."
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', outline: 'none', width: '100%' }}
                  />
                ) : (
                  <>
                    {m.customLabel ? (
                      <>
                        <div className="mval">{m.customLabel}</div>
                        <div className="mname">{val} {avg && `· ${avg}`}</div>
                      </>
                    ) : (
                      <div className="mval">{val}{avg && <span className="mavg">{avg}</span>}</div>
                    )}
                  </>
                )}
              </div>
              
              <div className="mbtns">
                <button 
                  className="mbtn"
                  onClick={(e) => handleEditStart(e, m)}
                  title={t('measurements.edit') || 'Rename'}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="mbtn"
                  onClick={(e) => { e.stopPropagation(); removeMeasurement(m.annotationUID); }} 
                  title={t('measurements.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="mtags">
              {m.referencedImageId && (
                 <span className="tag slice">Sl {sliceBadge}</span>
              )}
              {panels.length > 1 && (
                <span className="tag ser">S{panelNumber}</span>
              )}
              <span className={viewTag.class}>{viewTag.text}</span>
            </div>
          </div>
        </div>
      );
    });
    return items;
  };

  return (
    <>
      <style>{css}</style>
      <div className="sb-container">
        <div className="sb-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Ruler size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="sb-title">{t('measurements.title')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="sb-actions">
              <button 
                title={isGroupedByType ? "Group by slice" : "Group by type"}
                onClick={() => setIsGroupedByType(!isGroupedByType)}
                style={{ color: isGroupedByType ? 'var(--accent-primary, #3b82f6)' : 'rgba(255,255,255,0.3)', background: isGroupedByType ? 'rgba(59,130,246,0.1)' : 'none' }}
              >
                <LayoutList size={16} />
              </button>
            </div>
            <span className="sb-badge">{measurements.length}</span>
          </div>
        </div>

        <div className="items-scroll">
          {measurements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {t('measurements.empty')}
            </div>
          ) : (
            renderItems()
          )}
        </div>
      </div>
    </>
  );
}

// Wrap in ErrorBoundary in case of render failures
export class MeasurementsSidebarWrapper extends React.Component<MeasurementsSidebarProps, { hasError: boolean, errorMsg: string }> {
  constructor(props: MeasurementsSidebarProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, errorMsg: error?.message || String(error) }; }
  componentDidCatch(error: any, info: any) { console.error("MeasurementsSidebar Error:", error, info); }
  render() {
    if (this.state.hasError) return <div style={{ width: 280, background: '#111', color: 'red', padding: 20 }}>Error: {this.state.errorMsg}</div>;
    return <MeasurementsSidebar {...this.props} />;
  }
}
