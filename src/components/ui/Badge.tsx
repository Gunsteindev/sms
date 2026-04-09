import * as React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

const styles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error:   'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
