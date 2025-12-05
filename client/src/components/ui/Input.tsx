import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  rightElement, 
  className = '', 
  id,
  ...props 
}) => {
  const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-600 transition-colors duration-200">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-md
            focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 
            block py-2.5 transition-all duration-200 ease-in-out
            placeholder:text-slate-400
            ${icon ? 'pl-10' : 'pl-3'} 
            ${rightElement ? 'pr-10' : 'pr-3'}
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 animate-fadeIn">{error}</p>}
    </div>
  );
};
