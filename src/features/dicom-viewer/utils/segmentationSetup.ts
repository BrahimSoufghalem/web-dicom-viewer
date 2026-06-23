import { segmentation, Enums as csToolsEnums } from '@cornerstonejs/tools';
import { volumeLoader } from '@cornerstonejs/core';

export const getSegmentationId = (seriesUid: string) => `SEGMENTATION_${seriesUid}`;

export async function initSegmentationForVolume(referencedVolumeId: string, seriesUid: string) {
  const segmentationId = getSegmentationId(seriesUid);
  
  // Check if segmentation already exists
  const existingSeg = segmentation.state.getSegmentation(segmentationId);
  if (existingSeg) {
    return segmentationId;
  }

  // Create derived volume for segmentation
  await volumeLoader.createAndCacheDerivedLabelmapVolume(referencedVolumeId, {
    volumeId: segmentationId,
  });

  // Add segmentation to state
  segmentation.addSegmentations([
    {
      segmentationId,
      representation: {
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        data: {
          volumeId: segmentationId,
        },
      },
    },
  ]);

  return segmentationId;
}

export async function addSegmentationToViewport(viewportId: string, segmentationId: string) {
  await segmentation.addSegmentationRepresentations(viewportId, [
    {
      segmentationId,
      type: csToolsEnums.SegmentationRepresentations.Labelmap,
    },
  ]);
}
