import React, {useEffect, useMemo, useState} from 'react';

export default function Field({label,value,onChange,placeholder,wide=false}){return <label className={wide?'wideField':''}>{label}<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>}
