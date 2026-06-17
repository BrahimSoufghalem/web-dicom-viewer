import { create } from 'zustand';

export interface DicomSeries {
  seriesInstanceUid: string;
  seriesDescription: string;
  modality: string;
  instanceCount: number;
  files: File[];
  imageIds: string[];
  patientName?: string;
  patientId?: string;
  patientSex?: string;
  patientAge?: string;
  studyDate?: string;
  studyDescription?: string;
  manufacturer?: string;
  manufacturerModel?: string;
  institutionName?: string;
  sliceThickness?: string;
  pixelSpacing?: string;
  kvp?: string;
  exposure?: string;
}

export interface DicomStudy {
  studyInstanceUid: string;
  studyDate: string;
  studyDescription: string;
  series: DicomSeries[];
}

export interface DicomPatient {
  patientId: string;
  patientName: string;
  studies: DicomStudy[];
}

export interface ViewerPanel {
  id: string;
  seriesInstanceUid: string | null;
  isMprMode: boolean;
  is3DMode: boolean;
  currentImageIndex: number;
  isPlaying: boolean;
  mprIsLinked: boolean;
  mprActiveViewport: string;
}

export type GridLayout = '1x1' | '1x2' | '1+2' | '2x2';

interface ViewerState {
  patients: DicomPatient[];
  seriesList: DicomSeries[]; // Flat list for O(1) lookup
  
  layout: GridLayout;
  panels: ViewerPanel[];
  activePanelId: string;
  
  activeTool: string;
  playbackSpeed: number;
  isInverted: boolean; // Applies to active panel or linked mpr
  
  
  // Actions
  setActiveTool: (toolName: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  setIsInverted: (inverted: boolean) => void;
  // Panel Actions
  setLayout: (layout: GridLayout) => void;
  setActivePanelId: (panelId: string) => void;
  setPanelSeries: (panelId: string, seriesInstanceUid: string) => void;
  setPanelMprMode: (panelId: string, isMprMode: boolean) => void;
  setPanel3DMode: (panelId: string, is3DMode: boolean) => void;
  setPanelImageIndex: (panelId: string, index: number) => void;
  setPanelPlaying: (panelId: string, isPlaying: boolean) => void;
  setPanelMprLinked: (panelId: string, isLinked: boolean) => void;
  setPanelMprActiveViewport: (panelId: string, viewport: string) => void;
  
  // Data Actions
  loadPatients: (patients: DicomPatient[], flatSeries: DicomSeries[]) => void;
  addPatients: (patients: DicomPatient[], flatSeries: DicomSeries[]) => void;
  removePatient: (patientId: string) => void;
  resetStore: () => void;
}

const getInitialPanels = (layout: GridLayout): ViewerPanel[] => {
  const count = layout === '1x1' ? 1 : layout === '1x2' ? 2 : layout === '1+2' ? 3 : 4;
  return Array.from({ length: count }, (_, i) => ({
    id: `panel-${i + 1}`,
    seriesInstanceUid: null,
    isMprMode: false,
    is3DMode: false,
    currentImageIndex: 0,
    isPlaying: false,
    mprIsLinked: true,
    mprActiveViewport: `MPR_AXIAL_panel-${i + 1}`
  }));
};

export const useViewerStore = create<ViewerState>((set) => ({
  patients: [],
  seriesList: [],
  
  layout: '1x1',
  panels: [{ id: 'panel-1', seriesInstanceUid: null, isMprMode: false, is3DMode: false, currentImageIndex: 0, isPlaying: false, mprIsLinked: false, mprActiveViewport: 'MPR_AXIAL_panel-1' }],
  activePanelId: 'panel-1',
  
  activeTool: 'Wwwc',
  playbackSpeed: 15,
  isInverted: false,
  
  setActiveTool: (tool) => set({ activeTool: tool }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setIsInverted: (inverted) => set({ isInverted: inverted }),
  
  setLayout: (layout) => set((state) => {
    // Keep existing panels if they exist, pad with new ones
    const newPanels = getInitialPanels(layout);
    for (let i = 0; i < Math.min(state.panels.length, newPanels.length); i++) {
      newPanels[i] = { ...state.panels[i] };
    }
    // ensure activePanelId is valid
    const activeExists = newPanels.find(p => p.id === state.activePanelId);
    return { 
      layout, 
      panels: newPanels,
      activePanelId: activeExists ? state.activePanelId : newPanels[0].id
    };
  }),
  
  setActivePanelId: (panelId) => set({ activePanelId: panelId }),
  
  setPanelSeries: (panelId, seriesInstanceUid) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, seriesInstanceUid, currentImageIndex: 0, isPlaying: false } : p)
  })),
  
  setPanelMprMode: (panelId, isMprMode) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, isMprMode, is3DMode: isMprMode ? false : p.is3DMode } : p)
  })),
  
  setPanel3DMode: (panelId, is3DMode) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, is3DMode, isMprMode: is3DMode ? false : p.isMprMode } : p)
  })),
  
  setPanelImageIndex: (panelId, index) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, currentImageIndex: index } : p)
  })),
  
  setPanelPlaying: (panelId, isPlaying) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, isPlaying } : p)
  })),
  
  setPanelMprLinked: (panelId, mprIsLinked) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, mprIsLinked } : p)
  })),
  
  setPanelMprActiveViewport: (panelId, mprActiveViewport) => set((state) => ({
    panels: state.panels.map(p => p.id === panelId ? { ...p, mprActiveViewport } : p)
  })),
  
  loadPatients: (patients, flatSeries) => set({  
    patients, 
    seriesList: flatSeries,
    layout: '1x1',
    panels: [{ id: 'panel-1', seriesInstanceUid: flatSeries.length > 0 ? flatSeries[0].seriesInstanceUid : null, isMprMode: false, is3DMode: false, currentImageIndex: 0, isPlaying: false, mprIsLinked: false, mprActiveViewport: 'MPR_AXIAL_panel-1' }],
    activePanelId: 'panel-1'
  }),
  
  addPatients: (newPatients, newFlatSeries) => set((state) => {
    const mergedPatients = [...state.patients];
    
    newPatients.forEach(np => {
      const existingPatient = mergedPatients.find(p => p.patientId === np.patientId);
      if (existingPatient) {
        np.studies.forEach(ns => {
          const existingStudy = existingPatient.studies.find(s => s.studyInstanceUid === ns.studyInstanceUid);
          if (existingStudy) {
            ns.series.forEach(nSer => {
              const existingSeries = existingStudy.series.find(ser => ser.seriesInstanceUid === nSer.seriesInstanceUid);
              if (!existingSeries) {
                existingStudy.series.push(nSer);
              }
            });
          } else {
            existingPatient.studies.push(ns);
          }
        });
      } else {
        mergedPatients.push(np);
      }
    });

    const existingSeriesUids = new Set(state.seriesList.map(s => s.seriesInstanceUid));
    const uniqueNewSeries = newFlatSeries.filter(s => !existingSeriesUids.has(s.seriesInstanceUid));

    return {
      patients: mergedPatients,
      seriesList: [...state.seriesList, ...uniqueNewSeries]
    };
  }),

  removePatient: (patientId) => set((state) => {
    const newPatients = state.patients.filter(p => p.patientId !== patientId);
    // Find all series UIDs that belonged to the removed patient
    const removedSeriesUids = new Set<string>();
    state.patients.find(p => p.patientId === patientId)?.studies.forEach(study => {
      study.series.forEach(series => removedSeriesUids.add(series.seriesInstanceUid));
    });

    const newSeriesList = state.seriesList.filter(s => !removedSeriesUids.has(s.seriesInstanceUid));
    
    // Clear panels that are showing removed series
    const newPanels = state.panels.map(p => {
      if (p.seriesInstanceUid && removedSeriesUids.has(p.seriesInstanceUid)) {
        return { ...p, seriesInstanceUid: null, isMprMode: false, is3DMode: false, currentImageIndex: 0, isPlaying: false };
      }
      return p;
    });

    return {
      patients: newPatients,
      seriesList: newSeriesList,
      panels: newPanels
    };
  }),
  
  resetStore: () => set({ 
    patients: [],
    seriesList: [],
    layout: '1x1',
    panels: [{ id: 'panel-1', seriesInstanceUid: null, isMprMode: false, is3DMode: false, currentImageIndex: 0, isPlaying: false, mprIsLinked: false, mprActiveViewport: 'MPR_AXIAL_panel-1' }],
    activePanelId: 'panel-1',
    activeTool: 'Wwwc', 
    isInverted: false
  }),
}));

if (typeof window !== 'undefined') {
  (window as any).__store = useViewerStore;
}
