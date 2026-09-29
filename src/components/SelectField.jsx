import React, {useEffect, useMemo, useState} from 'react';

export default function SelectField({label,value,onChange,options,wide=false}){return <label className={wide?'wideField':''}>{label}<select value={value} onChange={e=>onChange(e.target.value)}><option value="">Select...</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>}
