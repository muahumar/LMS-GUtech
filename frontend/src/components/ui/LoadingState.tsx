import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading content...',
  className = '',
  minHeight = 'min-h-[200px]',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60 ${minHeight} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
        <Loader2 className="w-6 h-6 text-brand-600 absolute inset-0 m-auto animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
