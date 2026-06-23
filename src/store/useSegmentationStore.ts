import { create } from 'zustand';

export interface SegmentInfo {
  segmentIndex: number;
  label: string;
  color: [number, number, number, number]; // RGBA
  visible: boolean;
  opacity: number;
}

interface SegmentationState {
  segments: SegmentInfo[];
  activeSegmentIndex: number;
  
  addSegment: (label: string, color: [number, number, number, number]) => void;
  updateSegment: (segmentIndex: number, updates: Partial<SegmentInfo>) => void;
  removeSegment: (segmentIndex: number) => void;
  setActiveSegmentIndex: (index: number) => void;
}

// Default segments — colors match Cornerstone3D's built-in COLOR_LUT
const defaultSegments: SegmentInfo[] = [
  { segmentIndex: 1, label: 'Tumor', color: [221, 84, 84, 255], visible: true, opacity: 1 },
  { segmentIndex: 2, label: 'Liver', color: [77, 228, 121, 255], visible: true, opacity: 1 },
  { segmentIndex: 3, label: 'Bones', color: [166, 70, 235, 255], visible: true, opacity: 1 },
];

export const useSegmentationStore = create<SegmentationState>((set) => ({
  segments: defaultSegments,
  activeSegmentIndex: 1,
  
  addSegment: (label, color) => set((state) => {
    const newIndex = Math.max(...state.segments.map(s => s.segmentIndex), 0) + 1;
    return {
      segments: [...state.segments, {
        segmentIndex: newIndex,
        label,
        color,
        visible: true,
        opacity: 1
      }],
      activeSegmentIndex: newIndex
    };
  }),
  
  updateSegment: (segmentIndex, updates) => set((state) => ({
    segments: state.segments.map(s => 
      s.segmentIndex === segmentIndex ? { ...s, ...updates } : s
    )
  })),
  
  removeSegment: (segmentIndex) => set((state) => ({
    segments: state.segments.filter(s => s.segmentIndex !== segmentIndex),
    activeSegmentIndex: state.activeSegmentIndex === segmentIndex 
      ? state.segments.find(s => s.segmentIndex !== segmentIndex)?.segmentIndex || 1
      : state.activeSegmentIndex
  })),
  
  setActiveSegmentIndex: (index) => set({ activeSegmentIndex: index })
}));
