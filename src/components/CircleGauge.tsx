import React from 'react';
import { motion } from 'motion/react';

export const CircleGauge = ({ value }: { value: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          className="text-white/5 stroke-current" 
          strokeWidth="6" 
          cx="50" cy="50" r={radius} fill="transparent" 
        />
        <motion.circle 
          className="text-primary stroke-current" 
          strokeWidth="6" 
          cx="50" cy="50" r={radius} fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-white">{Math.round(value)}</span>
      </div>
    </div>
  );
};
