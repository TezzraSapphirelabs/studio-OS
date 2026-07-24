import React from 'react';
import Link from 'next/link';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', hover = false, padding = 'md', href, onClick, ...props }, ref) => {
    // For clickable cards, the glass-panel goes on the outer motion.div 
    // and the padding goes on the inner Link/button to maximize hit area.
    const containerClasses = cn(
      "glass-panel rounded-[24px] group transition-all duration-300",
      hover && "hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5",
      className
    );

    const innerClasses = cn("block w-full h-full text-left", paddingMap[padding]);

    if (href) {
      return (
        <motion.div ref={ref} className={containerClasses} {...props}>
          <Link href={href} className={innerClasses}>
            {children}
          </Link>
        </motion.div>
      );
    }

    if (onClick) {
      return (
        <motion.div ref={ref} className={containerClasses} {...props}>
          <button type="button" onClick={onClick} className={innerClasses}>
            {children}
          </button>
        </motion.div>
      );
    }

    // Default static card
    return (
      <motion.div 
        ref={ref} 
        className={cn(containerClasses, paddingMap[padding])} 
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
