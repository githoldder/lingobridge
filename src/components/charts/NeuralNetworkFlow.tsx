import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NeuralNetworkFlow: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const layers = [
    { name: 'Input x_t', nodes: 3 },
    { name: 'Embedding', nodes: 5 },
    { name: 'LSTM (64)', nodes: 4 },
    { name: 'Output y_t', nodes: 2 },
  ];

  return (
    <div className="w-full h-64 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>

      <div className="flex justify-between items-center w-full h-full relative z-10">
        {layers.map((layer, layerIdx) => (
          <div key={layerIdx} className="flex flex-col justify-center gap-4 h-full relative">
            <div className="absolute -top-4 w-full text-center text-[10px] font-mono text-slate-400 font-bold whitespace-nowrap -translate-x-1/2 left-1/2">
              {layer.name}
            </div>
            {Array.from({ length: layer.nodes }).map((_, nodeIdx) => {
              const isActive = activeLayer === layerIdx;
              const isPast = activeLayer > layerIdx;

              return (
                <motion.div
                  key={`${layerIdx}-${nodeIdx}`}
                  className={`w-6 h-6 rounded-full border-2 ${
                    isActive ? 'border-cyan-400 bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]' :
                    isPast ? 'border-blue-500/50 bg-blue-500/20' :
                    'border-slate-700 bg-slate-800'
                  }`}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none flex justify-between px-10">
         {/* Simplified connection lines representation */}
         <svg className="w-full h-full opacity-30">
            <line x1="10%" y1="50%" x2="40%" y2="50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="40%" y1="50%" x2="70%" y2="50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="70%" y1="50%" x2="90%" y2="50%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
         </svg>
      </div>

      <div className="absolute bottom-3 right-3 text-xs font-mono text-cyan-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
        <span>Forward Pass Active</span>
      </div>
    </div>
  );
};

export default NeuralNetworkFlow;
