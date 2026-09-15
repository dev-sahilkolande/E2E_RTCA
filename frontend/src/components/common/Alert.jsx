import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const Alert = ({ message, type = 'error', className = '' }) => {
  if (!message) return null;

  const icons = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  };

  const IconComponent = icons[type] || Info;

  return (
    <div className={`alert-banner alert-${type} ${className}`} role="alert">
      <IconComponent size={18} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
};
