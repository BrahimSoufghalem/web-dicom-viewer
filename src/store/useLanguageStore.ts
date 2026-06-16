import { create } from 'zustand';

type Language = 'en' | 'fr';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

const translations: Translations = {
  // App.tsx
  'app.loading': { en: 'Initializing Medical System...', fr: 'Initialisation du Système Médical...' },
  'app.singleWindow': { en: 'Single Window', fr: 'Fenêtre Simple' },
  'app.twoWindows': { en: 'Two Windows', fr: 'Deux Fenêtres' },
  'app.threeWindows': { en: 'Three Windows', fr: 'Trois Fenêtres' },
  'app.fourWindows': { en: 'Four Windows', fr: 'Quatre Fenêtres' },
  'app.closeFile': { en: 'Close File', fr: 'Fermer le Fichier' },
  'app.confirmCloseTitle': { en: 'Close All Files?', fr: 'Fermer tous les fichiers ?' },
  'app.confirmCloseDesc': { en: 'Are you sure you want to close all currently loaded files? Unsaved measurements will be lost.', fr: 'Êtes-vous sûr de vouloir fermer tous les fichiers actuellement chargés ? Les mesures non enregistrées seront perdues.' },
  'app.cancel': { en: 'Cancel', fr: 'Annuler' },
  'app.confirm': { en: 'Yes, Close', fr: 'Oui, Fermer' },

  // FileUploader.tsx
  'upload.invalidDicom': { en: 'Please select a valid DICOM file (.dcm)', fr: 'Veuillez sélectionner un fichier DICOM valide (.dcm)' },
  'upload.noValidFiles': { en: 'No valid DICOM files found in the folder.', fr: 'Aucun fichier DICOM valide trouvé dans le dossier.' },
  'upload.parseError': { en: 'An error occurred while parsing DICOM files. Please check file integrity.', fr: 'Une erreur s\'est produite lors de l\'analyse des fichiers DICOM. Veuillez vérifier l\'intégrité des fichiers.' },
  'upload.title': { en: 'Import DICOM Data', fr: 'Importer des Données DICOM' },
  'upload.desc': { en: 'Drag and drop folder here or choose from below', fr: 'Glissez et déposez le dossier ici ou choisissez ci-dessous' },
  'upload.processing': { en: 'Processing...', fr: 'Traitement en cours...' },
  'upload.filesBtn': { en: 'Files', fr: 'Fichiers' },
  'upload.folderBtn': { en: 'Folder', fr: 'Dossier' },
  'upload.localPrivacy': { en: 'Analysis is done locally. No data is uploaded to the internet.', fr: 'L\'analyse est effectuée localement. Aucune donnée n\'est téléchargée sur Internet.' },

  // ViewerGrid.tsx
  'grid.selectStudy': { en: 'Select a study from the sidebar', fr: 'Sélectionnez une étude dans la barre latérale' },

  // Viewer.tsx
  'viewer.loading': { en: 'Loading Images...', fr: 'Chargement des Images...' },
  'viewer.errorTitle': { en: 'Error Displaying Image', fr: 'Erreur d\'Affichage de l\'Image' },
  'viewer.slice': { en: 'Slice:', fr: 'Coupe :' },

  // MprViewer.tsx
  'mpr.loading': { en: 'Preparing 3D Volume...', fr: 'Préparation du Volume 3D...' },
  'mpr.sliceCount': { en: 'Slice Count:', fr: 'Nombre de coupes :' },
  'mpr.errorTitle': { en: 'Error Building MPR', fr: 'Erreur de Construction MPR' },
  'mpr.unlink': { en: 'Unlink Viewports', fr: 'Dissocier les fenêtres' },
  'mpr.link': { en: 'Link Viewports (Sync Zoom & Contrast)', fr: 'Lier les fenêtres (Zoom et Contraste synchronisés)' },
  
  'mpr.patientInfo': { en: 'Patient Information', fr: 'Informations sur le Patient' },
  'mpr.name': { en: 'Name:', fr: 'Nom :' },
  'mpr.id': { en: 'ID:', fr: 'ID :' },
  'mpr.sex': { en: 'Sex:', fr: 'Sexe :' },
  'mpr.age': { en: 'Age:', fr: 'Âge :' },
  
  'mpr.studyInfo': { en: 'Study Information', fr: 'Informations sur l\'Étude' },
  'mpr.desc': { en: 'Description:', fr: 'Description :' },
  'mpr.date': { en: 'Date:', fr: 'Date :' },
  'mpr.modality': { en: 'Modality:', fr: 'Modalité :' },
  'mpr.thickness': { en: 'Slice Thickness:', fr: 'Épaisseur de coupe :' },
  'mpr.institution': { en: 'Institution:', fr: 'Institution :' },

  // SeriesSidebar.tsx
  'sidebar.title': { en: 'Patient Files', fr: 'Dossiers Patients' },
  'sidebar.unknownSeries': { en: 'Unknown Series', fr: 'Série Inconnue' },
  'sidebar.images': { en: 'Images', fr: 'Images' },
  'sidebar.removePatient': { en: 'Remove Patient', fr: 'Supprimer le Patient' },

  // Toolbar.tsx
  'toolbar.contrast': { en: 'Contrast & Brightness', fr: 'Contraste et Luminosité' },
  'toolbar.zoom': { en: 'Zoom', fr: 'Zoom' },
  'toolbar.pan': { en: 'Pan', fr: 'Déplacer' },
  'toolbar.length': { en: 'Length Measurement', fr: 'Mesure de Longueur' },
  'toolbar.angle': { en: 'Angle Measurement', fr: 'Mesure d\'Angle' },
  'toolbar.rect': { en: 'Rectangle ROI', fr: 'ROI Rectangulaire' },
  'toolbar.ellipse': { en: 'Elliptical ROI', fr: 'ROI Elliptique' },
  'toolbar.freehand': { en: 'Freehand ROI', fr: 'ROI Main Libre' },
  'toolbar.probe': { en: 'Point Density (HU)', fr: 'Densité du Point (HU)' },
  'toolbar.eraser': { en: 'Eraser', fr: 'Gomme' },
  'toolbar.crosshairs': { en: 'MPR Crosshairs', fr: 'Réticules MPR' },
  'toolbar.invert': { en: 'Invert Colors', fr: 'Inverser les Couleurs' },
  'toolbar.reset': { en: 'Reset Image', fr: 'Réinitialiser l\'Image' },
  'toolbar.play': { en: 'Auto Play', fr: 'Lecture Automatique' },
  'toolbar.pause': { en: 'Pause Playback', fr: 'Mettre en Pause' },
  'toolbar.speed': { en: 'Speed:', fr: 'Vitesse :' },
  'toolbar.presets': { en: 'Window Presets', fr: 'Préréglages de Fenêtre' },

  // MeasurementsSidebar.tsx
  'measurements.title': { en: 'Measurements', fr: 'Mesures' },
  'measurements.empty': { en: 'No measurements yet. Use tools to measure length, angles, or ROI.', fr: 'Aucune mesure pour l\'instant. Utilisez les outils pour mesurer.' },
  'measurements.slice': { en: 'Slice', fr: 'Coupe' },
  'measurements.delete': { en: 'Delete Measurement', fr: 'Supprimer la mesure' },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  }
}));
