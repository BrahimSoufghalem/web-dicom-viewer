import { useState } from 'react';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import { useViewerStore } from '../../../store/useViewerStore';
import { useLanguageStore } from '../../../store/useLanguageStore';

export function useDicomUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguageStore();

  const handleFilesChange = async (fileList: FileList | File[], append: boolean = false) => {
    setError(null);
    setIsLoading(true);
    const filesArray = Array.from(fileList);
    
    const dicomFiles = filesArray.filter(file => 
      file.name.endsWith('.dcm') || file.name.endsWith('.DCM') || file.type === 'application/dicom' || (!file.name.includes('.') && file.size > 0)
    );
    
    if (dicomFiles.length === 0) {
      setError(t('upload.invalidDicom'));
      setIsLoading(false);
      return false;
    }

    try {
      const parsedFiles: any[] = [];
      for (let i = 0; i < dicomFiles.length; i++) {
        const file = dicomFiles[i];
        try {
          const arrayBuffer = await file.arrayBuffer();
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          
          const patientName = dataSet.string('x00100010') || 'Unknown Patient';
          const patientId = dataSet.string('x00100020') || 'UNKNOWN_PT';
          const patientSex = dataSet.string('x00100040') || '';
          const patientAge = dataSet.string('x00101010') || '';
          const studyDate = dataSet.string('x00080020') || 'Unknown Date';
          const studyDescription = dataSet.string('x00081030') || 'Unknown Study';
          const studyInstanceUid = dataSet.string('x0020000d') || 'UNKNOWN_STUDY_' + i;
          
          const instanceNumberStr = dataSet.string('x00200013');
          const instanceNumber = instanceNumberStr ? parseInt(instanceNumberStr, 10) : 0;
          
          const seriesInstanceUid = dataSet.string('x0020000e') || 'UNKNOWN_SERIES_' + i;
          const seriesDescription = dataSet.string('x0008103e') || 'Unknown Series';
          const modality = dataSet.string('x00080060') || 'OT';
          const manufacturer = dataSet.string('x00080070') || '';
          const manufacturerModel = dataSet.string('x00081090') || '';
          const institutionName = dataSet.string('x00080080') || '';
          const sliceThickness = dataSet.string('x00180050') || '';
          const pixelSpacing = dataSet.string('x00280030') || '';
          const kvp = dataSet.string('x00180060') || '';
          const exposure = dataSet.string('x00181152') || '';

          parsedFiles.push({ 
            file, instanceNumber, 
            patientId, patientName, patientSex, patientAge,
            studyInstanceUid, studyDate, studyDescription,
            seriesInstanceUid, seriesDescription, modality, manufacturer, manufacturerModel, institutionName, sliceThickness, pixelSpacing, kvp, exposure
          });
        } catch (e) {
          // Skip invalid
        }
      }

      if (parsedFiles.length === 0) {
        setError(t('upload.noValidFiles'));
        setIsLoading(false);
        return false;
      }

      const patientMap = new Map<string, any>();
      parsedFiles.forEach(pf => {
        if (!patientMap.has(pf.patientId)) patientMap.set(pf.patientId, { patientId: pf.patientId, patientName: pf.patientName, studies: new Map() });
        const patient = patientMap.get(pf.patientId);

        if (!patient.studies.has(pf.studyInstanceUid)) patient.studies.set(pf.studyInstanceUid, { studyInstanceUid: pf.studyInstanceUid, studyDate: pf.studyDate, studyDescription: pf.studyDescription, series: new Map() });
        const study = patient.studies.get(pf.studyInstanceUid);

        if (!study.series.has(pf.seriesInstanceUid)) study.series.set(pf.seriesInstanceUid, { seriesInstanceUid: pf.seriesInstanceUid, seriesDescription: pf.seriesDescription, modality: pf.modality, files: [] });
        study.series.get(pf.seriesInstanceUid).files.push(pf);
      });

      const finalPatients: any[] = [];
      const finalFlatSeries: any[] = [];

      patientMap.forEach(patient => {
        const finalStudies: any[] = [];
        patient.studies.forEach((study: any) => {
          const finalSeries: any[] = [];
          study.series.forEach((series: any) => {
            series.files.sort((a: any, b: any) => a.instanceNumber - b.instanceNumber);
            const sortedFiles = series.files.map((f: any) => f.file);
            const imageIds = sortedFiles.map((f: File) => cornerstoneDICOMImageLoader.wadouri.fileManager.add(f));
            
            const processedSeries = {
              seriesInstanceUid: series.seriesInstanceUid,
              seriesDescription: series.seriesDescription,
              modality: series.modality,
              instanceCount: sortedFiles.length,
              files: sortedFiles,
              imageIds,
              patientName: patient.patientName,
              patientId: patient.patientId,
              patientSex: series.files[0]?.patientSex,
              patientAge: series.files[0]?.patientAge,
              studyDate: study.studyDate,
              studyDescription: study.studyDescription,
              manufacturer: series.files[0]?.manufacturer,
              manufacturerModel: series.files[0]?.manufacturerModel,
              institutionName: series.files[0]?.institutionName,
              sliceThickness: series.files[0]?.sliceThickness,
              pixelSpacing: series.files[0]?.pixelSpacing,
              kvp: series.files[0]?.kvp,
              exposure: series.files[0]?.exposure
            };
            finalSeries.push(processedSeries);
            finalFlatSeries.push(processedSeries);
          });
          finalStudies.push({ ...study, series: finalSeries });
        });
        finalPatients.push({ ...patient, studies: finalStudies });
      });

      if (append) {
        useViewerStore.getState().addPatients(finalPatients, finalFlatSeries);
      } else {
        useViewerStore.getState().loadPatients(finalPatients, finalFlatSeries);
      }
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      setError(t('upload.parseError'));
      setIsLoading(false);
      return false;
    }
  };

  return { handleFilesChange, isLoading, error, setError };
}
