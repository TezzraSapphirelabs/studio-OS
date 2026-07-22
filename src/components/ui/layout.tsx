import React from 'react';

export function Container({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:px-12 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Grid({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function FlexRow({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function FlexCol({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  className = '' 
}: { 
  title: React.ReactNode; 
  description?: React.ReactNode; 
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 border-b border-ds-border/50 pb-8 ${className}`}>
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-ds-fg">{title}</h1>
        {description && <p className="mt-3 text-base text-ds-text-muted leading-relaxed">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-4 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
