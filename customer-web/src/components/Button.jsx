import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  size = 'lg', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  fullWidth = true,
  icon: Icon,
  className = '',
  id,
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none select-none shadow-lg';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs font-semibold',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/25 focus:ring-orange-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 shadow-slate-900/50',
    outline: 'bg-transparent border border-orange-500/50 hover:bg-orange-500/10 text-orange-400 focus:ring-orange-500 shadow-none',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-600/25',
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2 stroke-[2.2]" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
