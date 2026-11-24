import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LazyMotion } from 'framer-motion';
import App from './App';
import './index.css';

const loadMotionFeatures = () =>
  import('./utils/motionFeatures').then((mod) => mod.default);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <App />
    </LazyMotion>
  </StrictMode>
);
