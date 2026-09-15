import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  type = 'text',
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';

  const actualType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-group">
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className={`input-wrapper ${Icon ? 'has-icon' : ''}`}>
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          id={inputId}
          type={actualType}
          className={`input-field ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ position: 'absolute', right: '4px', padding: '6px', color: 'var(--text-dim)' }}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};
