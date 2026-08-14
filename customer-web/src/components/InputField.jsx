import React from 'react';

export function InputField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon,
  helperText,
  disabled = false,
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
          {label} {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm font-medium rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2
            ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-3
            ${error 
              ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-slate-800 focus:border-orange-500 focus:ring-orange-500/20 hover:border-slate-700'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-950' : ''}
          `}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
