import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    'under-review': { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
    verified: { color: 'bg-green-100 text-green-800', label: 'Verified' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    disbursed: { color: 'bg-purple-100 text-purple-800', label: 'Disbursed' },
    defaulted: { color: 'bg-red-100 text-red-800', label: 'Defaulted' },
    completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
