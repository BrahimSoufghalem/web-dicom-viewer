import { useViewerStore } from './store/useViewerStore';
import { useLanguageStore } from './store/useLanguageStore';
import { FileUploader } from './features/file-upload/components/FileUploader';
import { ViewerGrid } from './features/dicom-viewer/components/ViewerGrid';
import { Toolbar } from './features/dicom-viewer/components/Toolbar';
import { SeriesSidebar } from './features/dicom-viewer/components/SeriesSidebar';
import { LogOut, Loader, LayoutGrid, LayoutTemplate, Square, Columns, Globe, PanelLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initCornerstone } from './features/dicom-viewer/utils/initCornerstone';

export default function App() {
  const { patients, resetStore, setLayout, layout } = useViewerStore();
  const { t, language, setLanguage } = useLanguageStore();
  const [isInit, setIsInit] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  useEffect(() => {
    initCornerstone().then(() => {
      setIsInit(true);
    });
  }, []);

  if (!isInit) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader className="animate-spin" size={48} color="#6366f1" />
        <h2 style={{ color: '#e2e8f0', marginTop: '1rem' }}>{t('app.loading')}</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {patients.length === 0 ? (
        <FileUploader />
      ) : (
        <>
          <div className={`sidebar-edge-trigger ${isSidebarOpen ? 'open' : 'closed'}`}></div>
          <button 
            className={`sidebar-toggle-btn ${isSidebarOpen ? 'open' : 'closed'}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Patient Files"
          >
            <PanelLeft size={18} />
          </button>

          {isSidebarOpen && <SeriesSidebar />}
          <main className="main-content">
            <ViewerGrid />
            
            <div className="toolbar-container">
              <Toolbar />
              
              <div className="tool-separator"></div>
              
              <div className="tool-group">
                <button
                  className={`tool-btn ${layout === '1x1' ? 'active' : ''}`}
                  onClick={() => setLayout('1x1')}
                >
                  <Square size={20} />
                  <span className="tooltip">{t('app.singleWindow')}</span>
                </button>
                <button
                  className={`tool-btn ${layout === '1x2' ? 'active' : ''}`}
                  onClick={() => setLayout('1x2')}
                >
                  <Columns size={20} />
                  <span className="tooltip">{t('app.twoWindows')}</span>
                </button>
                <button
                  className={`tool-btn ${layout === '1+2' ? 'active' : ''}`}
                  onClick={() => setLayout('1+2')}
                >
                  <LayoutTemplate size={20} style={{ transform: 'rotate(90deg)' }} />
                  <span className="tooltip">{t('app.threeWindows')}</span>
                </button>
                <button
                  className={`tool-btn ${layout === '2x2' ? 'active' : ''}`}
                  onClick={() => setLayout('2x2')}
                >
                  <LayoutGrid size={20} />
                  <span className="tooltip">{t('app.fourWindows')}</span>
                </button>
              </div>

              <div className="tool-separator"></div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <div className="tool-group" style={{ position: 'relative' }}>
                  <button
                    className="tool-btn"
                    onClick={() => setShowLangMenu(!showLangMenu)}
                  >
                    <Globe size={20} />
                    <span className="tooltip">{language === 'en' ? 'English' : 'Français'}</span>
                  </button>
                  {showLangMenu && (
                    <div className="preset-menu" style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-panel)', padding: '0.25rem', borderRadius: '4px', zIndex: 9999, display: 'flex', flexDirection: 'column', minWidth: '100px', boxShadow: '0 -4px 6px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                      <button style={{ padding: '0.5rem', textAlign: 'center', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { setLanguage('en'); setShowLangMenu(false); }}>English</button>
                      <button style={{ padding: '0.5rem', textAlign: 'center', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '2px', fontSize: '0.85rem' }} onClick={() => { setLanguage('fr'); setShowLangMenu(false); }}>Français</button>
                    </div>
                  )}
                </div>

                <div className="tool-separator"></div>

                <div className="tool-group">
                  <button
                    className="tool-btn danger"
                    onClick={() => setShowConfirmClose(true)}
                    style={{ position: 'relative' }}
                  >
                    <LogOut size={20} />
                    <span className="tooltip">{t('app.closeFile')}</span>
                  </button>
                </div>
              </div>
            </div>
          </main>

          {showConfirmClose && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2rem', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>{t('app.confirmCloseTitle')}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
                  {t('app.confirmCloseDesc')}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                    onClick={() => setShowConfirmClose(false)}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
                  >
                    {t('app.cancel')}
                  </button>
                  <button 
                    style={{ flex: 1, padding: '0.6rem 1rem', background: 'var(--accent-red)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                    onClick={() => {
                      setShowConfirmClose(false);
                      resetStore();
                    }}
                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                  >
                    {t('app.confirm')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
