import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FABProps {
  onClick: () => void;
  completionPercentage: number;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({ 
  onClick, 
  completionPercentage, 
  className 
}) => {
  const strokeDasharray = 2 * Math.PI * 20; // Circumference of circle with radius 20
  const strokeDashoffset = strokeDasharray - (strokeDasharray * completionPercentage) / 100;

  return (
    <motion.div
      className={cn('mobile-fab', className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        delay: 0.2
      }}
    >
      <Button
        onClick={onClick}
        size="icon"
        className="w-full h-full rounded-full relative overflow-hidden shadow-xl"
      >
        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 44 44"
        >
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <motion.circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </svg>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {completionPercentage > 0 ? (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: completionPercentage > 75 ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp className="w-6 h-6" />
            </motion.div>
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </div>
        
        {/* Completion percentage text */}
        <div className="absolute bottom-0 left-0 right-0 text-xs font-bold text-white/90 text-center transform translate-y-1">
          {completionPercentage}%
        </div>
      </Button>
    </motion.div>
  );
};