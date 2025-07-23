import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        
        const handleResize = () => {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        };
        
        textarea.addEventListener('input', handleResize);
        handleResize(); // Initial resize
        
        return () => {
          textarea.removeEventListener('input', handleResize);
        };
      }
    }, [autoResize]);
    
    const combinedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        // Update internal ref (only if different)
        if (textareaRef.current !== node) {
          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
        
        // Handle forwarded ref
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && typeof ref === 'object') {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );
    
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation resize-none',
          // Mobile-specific improvements
          'text-base md:text-sm', // Prevent zoom on iOS
          'leading-relaxed',
          className
        )}
        ref={combinedRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };