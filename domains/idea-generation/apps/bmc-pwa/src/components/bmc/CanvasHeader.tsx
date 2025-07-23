import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Wifi, WifiOff, Share2, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessModelCanvas } from '@/types';
import { cn } from '@/lib/utils';

interface CanvasHeaderProps {
  canvas: BusinessModelCanvas;
  onMenuClick: () => void;
  className?: string;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  canvas,
  onMenuClick,
  className
}) => {
  const getSyncStatusIcon = () => {
    switch (canvas.syncStatus) {
      case 'synced':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <WifiOff className="w-4 h-4 text-yellow-600" />;
      case 'conflict':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = () => {
    switch (canvas.syncStatus) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Pending';
      case 'conflict':
        return 'Conflict';
      default:
        return 'Offline';
    }
  };

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 safe-area-top',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Title and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {canvas.metadata.title}
            </h1>
            <Badge 
              variant={canvas.overallCompletion > 50 ? 'success' : 'warning'}
              className="text-xs"
            >
              {canvas.overallCompletion}%
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              {getSyncStatusIcon()}
              <span className="text-xs">{getSyncStatusText()}</span>
            </div>
            
            {canvas.metadata.industry && (
              <Badge variant="outline" className="text-xs">
                {canvas.metadata.industry}
              </Badge>
            )}
            
            <span className="text-xs">
              Updated {new Date(canvas.metadata.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => console.log('Share canvas')}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => console.log('Export canvas')}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => console.log('Settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${canvas.overallCompletion}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </div>
    </motion.header>
  );
};