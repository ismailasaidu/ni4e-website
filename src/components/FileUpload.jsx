import React, {useEffect, useMemo, useState} from 'react';
import {UploadCloud} from 'lucide-react';

export default function FileUpload({label,value,onChange,required=false}){return <label className="fileUpload"><span>{label}{required&&<em> *</em>}</span><div><UploadCloud size={18}/><b>{value?.name||'Choose a file'}</b><small>Click to upload</small></div><input type="file" onChange={e=>onChange(e.target.files?.[0]||null)}/></label>}
