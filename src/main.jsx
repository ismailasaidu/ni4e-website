import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import { AuthProvider } from './firebase/auth';

createRoot(document.getElementById('root')).render(<AuthProvider><App /></AuthProvider>);
