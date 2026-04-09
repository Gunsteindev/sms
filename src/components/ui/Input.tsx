import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${className}`.trim()}
      {...props}
    />
  )
);

Input.displayName = 'Input';
