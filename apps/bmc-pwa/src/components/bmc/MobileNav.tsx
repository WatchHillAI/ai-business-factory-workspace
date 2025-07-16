import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BMCBoxType } from '@/types';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBox: BMCBoxType | null;
  onBoxSelect: (boxType: BMCBoxType) => void;
  boxes: Array<{
    type: BMCBoxType;
    title: string;
    description: string;
    icon: string;
    color: string;
  }>;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  selectedBox,
  onBoxSelect,
  boxes
}) => {
  const handleBoxClick = (boxType: BMCBoxType) => {
    onBoxSelect(boxType);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Navigation panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Canvas Sections
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Box list */}
            <div className="p-4 space-y-3">
              {boxes.map((box) => (
                <motion.div
                  key={box.type}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                    selectedBox === box.type
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  )}
                  onClick={() => handleBoxClick(box.type)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
                        {box.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {box.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            0%
                          </Badge>
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {box.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          0 words
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          0 suggestions
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Footer actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="space-y-2">
                <Button className="w-full" size="touch">
                  Export Canvas
                </Button>
                <Button variant="outline" className="w-full" size="touch">
                  Save as Template
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};