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
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <div className="relative rounded-2xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
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
            w-full rounded-2xl border bg-white text-slate-900 placeholder-slate-400 text-sm font-medium outline-none transition duration-200
            ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3.5
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 hover:border-slate-300'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
          `}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
