import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCanvas } from '@/hooks/useCanvas';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BMCBox } from './BMCBox';
import { CanvasHeader } from './CanvasHeader';
import { MobileNav } from './MobileNav';
import { FAB } from './FAB';
import { BMCBoxType } from '@/types';

const BMC_BOXES: Array<{
  type: BMCBoxType;
  title: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    type: 'keyPartners',
    title: 'Key Partners',
    description: 'Who are our key partners and suppliers? What key resources do we acquire from partners?',
    icon: '🤝',
    color: 'bg-blue-100 border-blue-300'
  },
  {
    type: 'keyActivities',
    title: 'Key Activities',
    description: 'What key activities does our value proposition require?',
    icon: '⚡',
    color: 'bg-purple-100 border-purple-300'
  },
  {
    type: 'valuePropositions',
    title: 'Value Propositions',
    description: 'What value do we deliver to the customer? What problems are we solving?',
    icon: '🎁',
    color: 'bg-green-100 border-green-300'
  },
  {
    type: 'customerRelationships',
    title: 'Customer Relationships',
    description: 'What type of relationship does each customer segment expect?',
    icon: '💝',
    color: 'bg-pink-100 border-pink-300'
  },
  {
    type: 'customerSegments',
    title: 'Customer Segments',
    description: 'For whom are we creating value? Who are our most important customers?',
    icon: '👥',
    color: 'bg-yellow-100 border-yellow-300'
  },
  {
    type: 'keyResources',
    title: 'Key Resources',
    description: 'What key resources does our value proposition require?',
    icon: '🔧',
    color: 'bg-indigo-100 border-indigo-300'
  },
  {
    type: 'channels',
    title: 'Channels',
    description: 'Through which channels do we reach our customers?',
    icon: '📢',
    color: 'bg-orange-100 border-orange-300'
  },
  {
    type: 'costStructure',
    title: 'Cost Structure',
    description: 'What are the most important costs inherent in our business model?',
    icon: '💰',
    color: 'bg-red-100 border-red-300'
  },
  {
    type: 'revenueStreams',
    title: 'Revenue Streams',
    description: 'For what value are our customers willing to pay?',
    icon: '💵',
    color: 'bg-teal-100 border-teal-300'
  }
];

const DESKTOP_GRID_AREAS = {
  keyPartners: 'partners',
  keyActivities: 'activities',
  valuePropositions: 'value',
  customerRelationships: 'relationships',
  customerSegments: 'customers',
  keyResources: 'resources',
  channels: 'channels',
  costStructure: 'costs',
  revenueStreams: 'revenue'
};

export const BMCCanvas: React.FC = () => {
  const { 
    canvas, 
    updateBox, 
    isLoading, 
    requestAISuggestions, 
    applySuggestion, 
    addTodo, 
    toggleTodo, 
    deleteTodo 
  } = useCanvas();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [selectedBox, setSelectedBox] = useState<BMCBoxType | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Mobile-first responsive layout
  // const getLayoutClass = () => {
  //   if (isDesktop) return 'bmc-grid-desktop';
  //   if (isTablet) return 'bmc-grid-tablet';
  //   return 'bmc-grid-mobile';
  // };

  const handleBoxClick = (boxType: BMCBoxType) => {
    setSelectedBox(boxType);
    if (isMobile) {
      // On mobile, open box in modal/fullscreen
      setShowMobileNav(true);
    }
  };

  const handleBoxUpdate = (boxType: BMCBoxType, content: string) => {
    updateBox(boxType, content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CanvasHeader 
        canvas={canvas} 
        onMenuClick={() => setShowMobileNav(!showMobileNav)}
      />
      
      <main className="safe-area-inset safe-area-bottom">
        {/* Mobile: Single column stack */}
        {isMobile && (
          <div className="space-y-4 p-4 pb-20">
            {BMC_BOXES.map((boxConfig) => (
              <motion.div
                key={boxConfig.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <BMCBox
                  config={boxConfig}
                  data={canvas.boxes[boxConfig.type]}
                  onUpdate={handleBoxUpdate}
                  onClick={() => handleBoxClick(boxConfig.type)}
                  isMobile={true}
                  isSelected={selectedBox === boxConfig.type}
                  onRequestAISuggestions={requestAISuggestions}
                  onApplySuggestion={applySuggestion}
                  onAddTodo={addTodo}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Tablet: 2-column grid */}
        {isTablet && (
          <div className="grid grid-cols-2 gap-4 p-4 pb-20">
            {BMC_BOXES.map((boxConfig) => (
              <motion.div
                key={boxConfig.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <BMCBox
                  config={boxConfig}
                  data={canvas.boxes[boxConfig.type]}
                  onUpdate={handleBoxUpdate}
                  onClick={() => handleBoxClick(boxConfig.type)}
                  isMobile={false}
                  isSelected={selectedBox === boxConfig.type}
                  onRequestAISuggestions={requestAISuggestions}
                  onApplySuggestion={applySuggestion}
                  onAddTodo={addTodo}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Desktop: Traditional BMC layout */}
        {isDesktop && (
          <div className="bmc-grid-desktop p-6">
            {BMC_BOXES.map((boxConfig) => (
              <motion.div
                key={boxConfig.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`bmc-${DESKTOP_GRID_AREAS[boxConfig.type]}`}
              >
                <BMCBox
                  config={boxConfig}
                  data={canvas.boxes[boxConfig.type]}
                  onUpdate={handleBoxUpdate}
                  onClick={() => handleBoxClick(boxConfig.type)}
                  isMobile={false}
                  isSelected={selectedBox === boxConfig.type}
                  onRequestAISuggestions={requestAISuggestions}
                  onApplySuggestion={applySuggestion}
                  onAddTodo={addTodo}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav 
          isOpen={showMobileNav}
          onClose={() => setShowMobileNav(false)}
          selectedBox={selectedBox}
          onBoxSelect={setSelectedBox}
          boxes={BMC_BOXES}
        />
      )}

      {/* Floating Action Button */}
      {isMobile && (
        <FAB 
          onClick={() => setShowMobileNav(true)}
          completionPercentage={canvas.overallCompletion}
        />
      )}
    </div>
  );
};