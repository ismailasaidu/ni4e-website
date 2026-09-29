import React, {useEffect, useMemo, useState} from 'react';
import {X, Check} from 'lucide-react';

export default function Toast({toast}){if(!toast)return null;return <div className="toast"><span className="toastIcon"><Check size={16}/></span><div><b>{toast.title}</b><small>{toast.text}</small></div><button onClick={toast.close}><X size={15}/></button></div>}
