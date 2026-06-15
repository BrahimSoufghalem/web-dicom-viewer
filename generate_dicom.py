import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.uid import generate_uid
import numpy as np

# Create a minimal DICOM file
file_meta = Dataset()
file_meta.MediaStorageSOPClassUID = '1.2.840.10008.5.1.4.1.1.2' # CT Image Storage
file_meta.MediaStorageSOPInstanceUID = generate_uid()
file_meta.ImplementationClassUID = generate_uid()

ds = FileDataset("test.dcm", {}, file_meta=file_meta, preamble=b"\0" * 128)
ds.PatientName = "Test^Patient"
ds.PatientID = "123456"
ds.Modality = "CT"
ds.StudyDate = "20230101"
ds.StudyDescription = "Test Study"
ds.SeriesInstanceUID = generate_uid()
ds.StudyInstanceUID = generate_uid()
ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
ds.SOPClassUID = file_meta.MediaStorageSOPClassUID

ds.InstanceNumber = 1
ds.Rows = 256
ds.Columns = 256
ds.BitsAllocated = 16
ds.BitsStored = 16
ds.HighBit = 15
ds.PixelRepresentation = 1
ds.SamplesPerPixel = 1
ds.PhotometricInterpretation = "MONOCHROME2"
ds.PixelSpacing = [1.0, 1.0]
ds.ImagePositionPatient = [0.0, 0.0, 0.0]
ds.ImageOrientationPatient = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0]
ds.RescaleIntercept = -1024
ds.RescaleSlope = 1

# Generate pixel data (a simple gradient)
pixel_array = np.zeros((256, 256), dtype=np.int16)
for i in range(256):
    pixel_array[i, :] = i * 4 - 1024

ds.PixelData = pixel_array.tobytes()

ds.is_little_endian = True
ds.is_implicit_VR = True

ds.save_as("test.dcm")
print("test.dcm generated successfully.")
