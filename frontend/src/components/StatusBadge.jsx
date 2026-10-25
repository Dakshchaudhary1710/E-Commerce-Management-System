import React from 'react';

export default function StatusBadge({ status, type = 'order' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();
  let badgeClass = 'badge-neutral';

  switch (normalized) {
    case 'DELIVERED':
    case 'COMPLETED':
    case 'IN_STOCK':
    case 'ACTIVE':
      badgeClass = 'badge-success';
      break;

    case 'PENDING':
    case 'PROCESSING':
    case 'LOW_STOCK':
    case 'DISPATCHED':
      badgeClass = 'badge-warning';
      break;

    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
    case 'SHIPPED':
      badgeClass = 'badge-info';
      break;

    case 'CANCELLED':
    case 'FAILED':
    case 'OUT_OF_STOCK':
    case 'REFUNDED':
      badgeClass = 'badge-danger';
      break;

    default:
      badgeClass = 'badge-neutral';
  }

  const label = normalized.replace(/_/g, ' ');

  return (
    <span className={`badge ${badgeClass}`}>
      {label}
    </span>
  );
}
