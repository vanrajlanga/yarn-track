import React from 'react';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dyeing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dyeing_complete':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'conning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'conning_complete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'packing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'packed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span 
      className={`px-3 py-1 inline-flex text-sm font-medium rounded-full border ${getStatusColor(status)} ${className}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
};