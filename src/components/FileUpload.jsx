import React, { useEffect, useState } from 'react';
import { FileImage, FileText, UploadCloud, X } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png'];

export default function FileUpload({ label, value, onChange, required = false, accept = 'image/jpeg,image/png,application/pdf', maxSize = MAX_FILE_SIZE }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (!value || !IMAGE_TYPES.includes(value.type)) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const selectFile = (event) => {
    const file = event.target.files?.[0] || null;
    setValidationMessage('');
    if (!file) {
      onChange(null);
      return;
    }
    if (file.size > maxSize) {
      setValidationMessage(`${file.name} is larger than the ${Math.round(maxSize / 1024 / 1024)} MB limit.`);
      event.target.value = '';
      onChange(null);
      return;
    }
    const accepted = accept.split(',').map(type => type.trim());
    if (accepted.length && !accepted.includes(file.type) && !accepted.includes('*/*')) {
      setValidationMessage('Choose a supported file type.');
      event.target.value = '';
      onChange(null);
      return;
    }
    onChange(file);
  };

  return (
    <div className="fileUpload">
      <label className="fileUploadLabel">
        <span>{label}{required && <em> *</em>}</span>
        <div className={`fileUploadDrop ${value ? 'hasFile' : ''}`}>
          {previewUrl ? <img className="fileUploadPreview" src={previewUrl} alt={`${label} preview`} /> : value ? <FileText size={25} /> : <UploadCloud size={22} />}
          <b>{value?.name || 'No file selected'}</b>
          <small>{value ? `${(value.size / 1024 / 1024).toFixed(2)} MB · Click to change` : `Choose a file · Up to ${Math.round(maxSize / 1024 / 1024)} MB`}</small>
          <input type="file" accept={accept} required={required} onChange={selectFile} aria-label={label} />
        </div>
      </label>
      {value && <button type="button" className="fileUploadRemove" onClick={() => { onChange(null); setValidationMessage(''); }}><X size={14}/> Remove file</button>}
      {validationMessage && <p className="fileUploadError" role="alert">{validationMessage}</p>}
      {value && IMAGE_TYPES.includes(value.type) && !previewUrl && <span className="fileUploadHint"><FileImage size={14}/> Image selected</span>}
    </div>
  );
}
