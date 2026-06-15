import { useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { utilities, imageLoader } from '@cornerstonejs/core';
import { ChevronDown, ChevronRight, User, Folder, Plus, Loader, Trash2 } from 'lucide-react';
import { useDicomUpload } from '../../file-upload/hooks/useDicomUpload';

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
      className={`series-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="series-thumb" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', flexShrink: 0 }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <div className="series-info">
        <div className="series-desc" title={description || t('sidebar.unknownSeries')}>
          {description || t('sidebar.unknownSeries')}
        </div>
        <div className="series-count">
          {count} {t('sidebar.images')} • {modality}
        </div>
      </div>
    </div>
  );
}

export function SeriesSidebar() {
  const { patients, activePanelId, panels, setPanelSeries, removePatient } = useViewerStore();
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
    <aside className="sidebar" style={{ overflowY: 'auto' }}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <div className="series-list" style={{ padding: '0.5rem', gap: '0.25rem' }}>
        
        {patients.map(patient => {
          const isPatientExpanded = expandedPatients[patient.patientId];
          return (
            <div key={patient.patientId} className="accordion-patient">
              <div 
                className="accordion-header patient-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', cursor: 'default', background: 'var(--bg-panel)', borderRadius: '4px', marginBottom: '4px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }} onClick={() => togglePatient(patient.patientId)}>
                  {isPatientExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <User size={16} style={{ color: 'var(--text-primary)' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{patient.patientName}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removePatient(patient.patientId); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
                  title={t('sidebar.removePatient')}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
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
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', opacity: 0.9 }}
                        >
                          {isStudyExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '0.85rem' }}>{study.studyDescription || study.studyDate}</span>
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
    </aside>
  );
}
