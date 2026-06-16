import { useState, useEffect } from 'react';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import { X, Search } from 'lucide-react';

interface DicomTagsModalProps {
  imageId: string;
  onClose: () => void;
}

const COMMON_TAGS: Record<string, string> = {
  'x00080020': 'Study Date',
  'x00080030': 'Study Time',
  'x00080050': 'Accession Number',
  'x00080060': 'Modality',
  'x00080070': 'Manufacturer',
  'x00080080': 'Institution Name',
  'x00080090': 'Referring Physician',
  'x00081030': 'Study Description',
  'x0008103e': 'Series Description',
  'x00081090': 'Manufacturer Model',
  'x00100010': 'Patient Name',
  'x00100020': 'Patient ID',
  'x00100030': 'Patient Birth Date',
  'x00100040': 'Patient Sex',
  'x00101010': 'Patient Age',
  'x00101030': 'Patient Weight',
  'x00180015': 'Body Part Examined',
  'x00180050': 'Slice Thickness',
  'x00180060': 'KVP',
  'x00181150': 'Exposure Time',
  'x00181151': 'X-Ray Tube Current',
  'x00181152': 'Exposure',
  'x00185100': 'Patient Position',
  'x0020000d': 'Study Instance UID',
  'x0020000e': 'Series Instance UID',
  'x00200011': 'Series Number',
  'x00200013': 'Instance Number',
  'x00200032': 'Image Position (Patient)',
  'x00200037': 'Image Orientation (Patient)',
  'x00280010': 'Rows',
  'x00280011': 'Columns',
  'x00280030': 'Pixel Spacing',
  'x00280100': 'Bits Allocated',
  'x00280101': 'Bits Stored',
  'x00280102': 'High Bit',
  'x00280103': 'Pixel Representation',
  'x00281050': 'Window Center',
  'x00281051': 'Window Width',
  'x00281052': 'Rescale Intercept',
  'x00281053': 'Rescale Slope',
};

export function DicomTagsModal({ imageId, onClose }: DicomTagsModalProps) {
  const [tags, setTags] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        let dataSet: any = null;
        
        if (imageId.startsWith('dicomfile:')) {
          const fileId = parseInt(imageId.replace('dicomfile:', ''), 10);
          const file = cornerstoneDICOMImageLoader.wadouri.fileManager.get(fileId as any);
          if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer);
            dataSet = dicomParser.parseDicom(byteArray);
          }
        } else {
          dataSet = cornerstoneDICOMImageLoader.wadouri.dataSetCacheManager.get(imageId.replace('wadouri:', ''));
        }

        if (dataSet && dataSet.elements) {
          const extracted: any[] = [];
        
        Object.keys(dataSet.elements).forEach(key => {
          const element = dataSet.elements[key];
          // Skip large binary data (like pixel data)
          if (key === 'x7fe00010') return;
          
          let value = '';
          try {
            value = dataSet.string(key) || '';
            // If it's empty, try getting it as an array
            if (!value && element.length > 0) {
              const array = dataSet.floatString(key);
              if (array !== undefined) value = String(array);
            }
          } catch (e) {
            value = 'Binary Data';
          }

          // Format tag (x00100010 -> (0010,0010))
          const formattedTag = `(${key.substring(1, 5).toUpperCase()},${key.substring(5).toUpperCase()})`;
          const name = COMMON_TAGS[key] || 'Unknown';

          extracted.push({
            tag: formattedTag,
            name,
            vr: element.vr || 'UN',
            length: element.length,
            value: value.substring(0, 100) + (value.length > 100 ? '...' : '')
          });
        });

        // Sort by tag
        extracted.sort((a, b) => a.tag.localeCompare(b.tag));
        setTags(extracted);
      }
    } catch (err) {
      console.error('Error reading DICOM tags:', err);
    }
  };
  
  fetchTags();
}, [imageId]);

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.tag.toLowerCase().includes(search.toLowerCase()) ||
    t.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1a1d21', width: '800px', maxWidth: '95vw', height: '80vh',
        borderRadius: '12px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>DICOM Metadata Viewer</h2>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
              Image ID: {imageId.replace('wadouri:', '').split('/').pop()}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input 
              type="text" 
              placeholder="Search tags, names, or values..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px', background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff',
                fontSize: '0.9rem', outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 180px 60px 80px 1fr', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Tag</div>
            <div>Name</div>
            <div>VR</div>
            <div>Length</div>
            <div>Value</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No tags found matching "{search}"
              </div>
            ) : (
              filteredTags.map((t, idx) => (
                <div key={idx} style={{ 
                  display: 'grid', gridTemplateColumns: '120px 180px 60px 80px 1fr', 
                  padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', 
                  fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  <div style={{ color: '#6eb0f5', fontFamily: 'monospace' }}>{t.tag}</div>
                  <div style={{ color: t.name === 'Unknown' ? 'rgba(255,255,255,0.3)' : '#a89fea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '10px' }}>{t.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>{t.vr}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>{t.length}</div>
                  <div style={{ wordBreak: 'break-word', color: '#fff' }}>{t.value}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
