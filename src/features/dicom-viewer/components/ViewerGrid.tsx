import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { Viewer } from './Viewer';
import { MprViewer } from './MprViewer';
import { Volume3DViewer } from './Volume3DViewer';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

const ResizeHandle = ({ orientation = "horizontal" }) => (
  <PanelResizeHandle 
    className={`resize-handle ${orientation}`}
    style={{
      flex: '0 0 8px',
      backgroundColor: 'transparent',
      transition: 'background-color 0.2s ease',
      cursor: orientation === 'horizontal' ? 'col-resize' : 'row-resize',
      margin: orientation === 'horizontal' ? '0 2px' : '2px 0',
      borderRadius: '4px',
    }}
  />
);

export function ViewerGrid() {
  const { panels, activePanelId, layout, setActivePanelId } = useViewerStore();
  const { t } = useLanguageStore();

  const renderPanel = (index: number) => {
    const panel = panels[index];
    if (!panel) return null;
    const isActive = panel.id === activePanelId;

    return (
      <div 
        key={panel.id} 
        onClick={() => setActivePanelId(panel.id)}
        className={isActive ? 'active' : ''}
        style={{ 
          position: 'relative',
          width: '100%', 
          height: '100%', 
          border: isActive ? '2px solid #FFFFFF' : '1px solid var(--border-color)',
          boxShadow: isActive ? '0 0 0 1px rgba(255, 255, 255, 0.5)' : 'none',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-deep)'
        }}
      >
        {panel.seriesInstanceUid ? (
          panel.is3DMode ? (
            <Volume3DViewer panelId={panel.id} />
          ) : !panel.isMprMode ? (
            <Viewer panelId={panel.id} />
          ) : (
            <MprViewer panelId={panel.id} />
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-secondary)', fontSize: '1.2rem', textAlign: 'center', padding: '1rem' }}>
            {t('grid.selectStudy')}
          </div>
        )}
      </div>
    );
  };

  const renderLayout = () => {
    if (layout === '1x1') {
      return renderPanel(0);
    }
    
    if (layout === '1x2') {
      return (
        <PanelGroup orientation="horizontal">
          <Panel minSize={40}>{renderPanel(0)}</Panel>
          <ResizeHandle orientation="horizontal" />
          <Panel minSize={40}>{renderPanel(1)}</Panel>
        </PanelGroup>
      );
    }
    
    if (layout === '1+2') {
      return (
        <PanelGroup orientation="horizontal">
          <Panel minSize={40}>{renderPanel(0)}</Panel>
          <ResizeHandle orientation="horizontal" />
          <Panel minSize={40}>
            <PanelGroup orientation="vertical">
              <Panel minSize={40}>{renderPanel(1)}</Panel>
              <ResizeHandle orientation="vertical" />
              <Panel minSize={40}>{renderPanel(2)}</Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      );
    }
    
    if (layout === '2x2') {
      return (
        <PanelGroup orientation="horizontal">
          <Panel minSize={40}>
            <PanelGroup orientation="vertical">
              <Panel minSize={40}>{renderPanel(0)}</Panel>
              <ResizeHandle orientation="vertical" />
              <Panel minSize={40}>{renderPanel(2)}</Panel>
            </PanelGroup>
          </Panel>
          <ResizeHandle orientation="horizontal" />
          <Panel minSize={40}>
            <PanelGroup orientation="vertical">
              <Panel minSize={40}>{renderPanel(1)}</Panel>
              <ResizeHandle orientation="vertical" />
              <Panel minSize={40}>{renderPanel(3)}</Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      );
    }
    
    return null;
  };

  return (
    <div 
      className="viewer-grid" 
      style={{ 
        flex: 1,
        minHeight: 0,
        width: '100%', 
        height: '100%', 
      }}
    >
      {renderLayout()}
    </div>
  );
}
