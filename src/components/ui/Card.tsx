import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export const Card = ({ className = '', ...props }: CardProps) => (
  <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`} {...props} />
);

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardHeader = ({ className = '', ...props }: CardHeaderProps) => (
  <div className={`mb-4 px-5 pt-5 ${className}`} {...props} />
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = ({ className = '', ...props }: CardTitleProps) => (
  <h3 className={`text-lg font-semibold leading-snug ${className}`} {...props} />
);

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardContent = ({ className = '', ...props }: CardContentProps) => (
  <div className={`px-5 pb-5 ${className}`} {...props} />
);
