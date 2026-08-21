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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition duration-200 focus:outline-none focus:ring-4 focus:ring-orange-100 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm';
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3.5 text-base',
  };

  const variantStyles = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-200',
    secondary: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 focus:ring-orange-100',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-100 shadow-none',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-100',
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
