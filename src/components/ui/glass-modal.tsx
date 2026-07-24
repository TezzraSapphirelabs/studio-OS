import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  className,
  hideCloseButton = false,
}: GlassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Overlay to catch clicks */}
      <div 
        ref={overlayRef}
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={contentRef}
        className={cn(
          "glass-panel relative w-full max-w-lg rounded-2xl p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200",
          className
        )}
      >
        {(title || !hideCloseButton) && (
          <div className="mb-6 flex items-center justify-between">
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {!hideCloseButton && (
              <button 
                onClick={onClose} 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white ml-auto"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}
