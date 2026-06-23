import { useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../../store/useViewerStore';
import { useShallow } from 'zustand/react/shallow';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { utilities, imageLoader } from '@cornerstonejs/core';
import { ChevronDown, ChevronRight, User, Folder, Plus, Loader, Trash2 } from 'lucide-react';
import { useDicomUpload } from '../../file-upload/hooks/useDicomUpload';
import { SegmentationPanel } from './SegmentationPanel';

interface ThumbnailProps {
  imageId: string;
  isActive: boolean;
  onClick: () => void;
  description: string;
  count: number;
  modality: string;
}

function Thumbnail({ imageId, isActive, onClick, description, count, modality }: ThumbnailProps) {
  const { t } = useLanguageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageId) return;

    let isMounted = true;
    
    imageLoader.loadAndCacheImage(imageId).then((image) => {
      if (!isMounted || !canvasRef.current) return;
      
      // Set the internal canvas resolution to the image's original resolution
      canvas.width = image.width;
      canvas.height = image.height;

      utilities.loadImageToCanvas({
        canvas,
        imageId,
        thumbnail: true,
      }).catch((err) => {
        if (isMounted) console.error("Thumbnail load error", err);
      });
    }).catch((err) => {
      if (isMounted) console.error("Thumbnail fetch error", err);
    });

    return () => {
      isMounted = false;
    };
  }, [imageId]);

  return (
    <div 
      className="series-item"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '6px',
        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
    >
      <div 
        className="series-thumb" 
        style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          width: '44px', height: '44px', flexShrink: 0, 
          background: '#000', borderRadius: '4px', overflow: 'hidden',
          border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`
        }}
      >
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <div className="series-info" style={{ marginLeft: '12px', flex: 1, overflow: 'hidden' }}>
        <div 
          className="series-desc" 
          title={description || t('sidebar.unknownSeries')}
          style={{ 
            fontSize: '13px', 
            fontWeight: isActive ? 600 : 500, 
            color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            marginBottom: '4px'
          }}
        >
          {description || t('sidebar.unknownSeries')}
        </div>
        <div 
          className="series-count"
          style={{ 
            fontSize: '11px', 
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'rgba(255,255,255,0.8)' }}>{modality}</span>
          <span>{count} {t('sidebar.images')}</span>
        </div>
      </div>
    </div>
  );
}

export function SeriesSidebar() {
  const { patients, removePatient, activePanelId, panels, setPanelSeries, isSegmentationPanelOpen } = useViewerStore(useShallow(state => ({
    patients: state.patients,
    removePatient: state.removePatient,
    activePanelId: state.activePanelId,
    panels: state.panels,
    setPanelSeries: state.setPanelSeries,
    isSegmentationPanelOpen: state.isSegmentationPanelOpen
  })));
  const { t } = useLanguageStore();
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});
  const [expandedStudies, setExpandedStudies] = useState<Record<string, boolean>>({});
  
  const { handleFilesChange, isLoading } = useDicomUpload();
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Get the active series UID for the current panel to highlight it
  const currentPanel = panels.find(p => p.id === activePanelId);
  const activeSeriesUid = currentPanel?.seriesInstanceUid;

  // Auto-expand first patient and study on load
  useEffect(() => {
    if (patients.length > 0) {
      const firstPatient = patients[0];
      setExpandedPatients(prev => ({ ...prev, [firstPatient.patientId]: true }));
      if (firstPatient.studies.length > 0) {
        setExpandedStudies(prev => ({ ...prev, [firstPatient.studies[0].studyInstanceUid]: true }));
      }
    }
  }, [patients]);

  const togglePatient = (id: string) => {
    setExpandedPatients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStudy = (id: string) => {
    setExpandedStudies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onSeriesClick = (seriesUid: string) => {
    if (activePanelId) {
      setPanelSeries(activePanelId, seriesUid);
    }
  };

  if (patients.length === 0) return null;

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ 
        flex: isSegmentationPanelOpen ? '1' : '1 1 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '32px' }}>
          <h3 className="sidebar-title" style={{ margin: 0 }}>{t('sidebar.title')}</h3>
        </div>
        <button 
          onClick={() => folderInputRef.current?.click()}
          disabled={isLoading}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title={t('upload.folderBtn')}
        >
          {isLoading ? <Loader size={18} className="spin" /> : <Plus size={18} />}
        </button>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is a non-standard standard feature
        webkitdirectory="true"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesChange(e.target.files, true);
          }
          e.target.value = ''; // Reset to allow same folder selection
        }}
      />

      <div className="series-list" style={{ padding: '0.5rem', gap: '0.25rem', overflowY: 'auto', flex: 1 }}>
        
        {patients.map(patient => {
          const isPatientExpanded = expandedPatients[patient.patientId];
          return (
            <div key={patient.patientId} className="accordion-patient">
              <div 
                className="accordion-header patient-header"
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '10px 12px', cursor: 'pointer', 
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px', marginBottom: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onClick={() => togglePatient(patient.patientId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {isPatientExpanded ? <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.5)' }} /> : <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />}
                  <User size={16} style={{ color: '#a89fea' }} />
                  <span style={{ fontWeight: '600', fontSize: '13px', color: 'rgba(255,255,255,0.95)' }}>{patient.patientName}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removePatient(patient.patientId); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px', transition: 'color 0.2s' }}
                  title={t('sidebar.removePatient')}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {isPatientExpanded && (
                <div className="accordion-content studies-list" style={{ paddingRight: '1rem' }}>
                  {patient.studies.map(study => {
                    const isStudyExpanded = expandedStudies[study.studyInstanceUid];
                    return (
                      <div key={study.studyInstanceUid} className="accordion-study" style={{ marginTop: '4px' }}>
                        <div 
                          className="accordion-header study-header"
                          onClick={() => toggleStudy(study.studyInstanceUid)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '6px 8px', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)',
                            marginBottom: '6px',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                        >
                          {isStudyExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <Folder size={14} style={{ color: '#f4b94e' }} />
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{study.studyDescription || study.studyDate}</span>
                        </div>
                        
                        {isStudyExpanded && (
                          <div className="accordion-content series-grid" style={{ paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {study.series.map(series => (
                              <Thumbnail
                                key={series.seriesInstanceUid}
                                imageId={series.imageIds[0]}
                                isActive={activeSeriesUid === series.seriesInstanceUid}
                                onClick={() => onSeriesClick(series.seriesInstanceUid)}
                                description={series.seriesDescription}
                                count={series.imageIds.length}
                                modality={series.modality}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
      </div>
      </div>

      {isSegmentationPanelOpen && activeSeriesUid && (
        <div style={{ 
          flex: '1', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <SegmentationPanel />
        </div>
      )}
    </aside>
  );
}
