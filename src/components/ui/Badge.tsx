// Reusable Badge component
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
    </span>
  );
};

// Confidence Badge component for predictions
interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  confidence, 
  className = '' 
}) => {
  const getVariant = (conf: number) => {
    if (conf >= 75) return 'success';
    if (conf >= 50) return 'warning';
    return 'danger';
  };

  const getLabel = (conf: number) => {
    if (conf >= 75) return 'High';
    if (conf >= 50) return 'Medium';
    return 'Low';
  };

  return (
    <Badge variant={getVariant(confidence)} className={className}>
      {getLabel(confidence)} ({confidence}%)
    </Badge>
  );
};

// Prediction Badge component
interface PredictionBadgeProps {
  prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  className?: string;
}

export const PredictionBadge: React.FC<PredictionBadgeProps> = ({ 
  prediction, 
  className = '' 
}) => {
  const getVariant = (pred: string) => {
    switch (pred) {
      case 'HOME_WIN': return 'success';
      case 'AWAY_WIN': return 'info';
      case 'DRAW': return 'warning';
      default: return 'default';
    }
  };

  const getLabel = (pred: string) => {
    switch (pred) {
      case 'HOME_WIN': return 'Home Win';
      case 'AWAY_WIN': return 'Away Win';
      case 'DRAW': return 'Draw';
      default: return pred;
    }
  };

  return (
    <Badge variant={getVariant(prediction)} className={className}>
      {getLabel(prediction)}
    </Badge>
  );
};