import React, {useEffect, useMemo, useState} from 'react';
import logo from '../assets/ni4e-logo.png';

export default function PageLoader(){return <div className="pageLoader"><div className="loaderMark"><img src={logo}/><span/></div><p>Loading NI4E</p></div>}
