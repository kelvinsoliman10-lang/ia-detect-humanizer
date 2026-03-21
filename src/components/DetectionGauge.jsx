import React from 'react';
import { motion } from 'framer-motion';

const DetectionGauge = ({ score }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="gauge-panel" style={{ padding: '1rem 0' }}>
      <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="2"
          />
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="transparent"
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '4.5rem', fontWeight: '400', fontStyle: 'italic' }}>
            {Math.round(score)}
          </span>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#444', marginTop: '-1rem' }}>
            Authenticity Index
          </span>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', fontStyle: 'italic', weight: '400' }}>
          {score < 20 ? "Organic Essence" : score < 50 ? "Pattern Drift" : "Synthetic Trace"}
        </h3>
      </div>
    </div>
  );
};

export default DetectionGauge;
