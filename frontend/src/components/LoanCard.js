import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const LoanCard = ({ loan }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = () => {
    navigate(`/status/${loan.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan #{loan.id.slice(-8)}</h3>
          <p className="text-sm text-gray-500">Applied on {formatDate(loan.createdAt)}</p>
        </div>
        <StatusBadge status={loan.status} />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{formatCurrency(loan.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Purpose:</span>
          <span className="text-right">{loan.purpose}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Term:</span>
          <span>{loan.term} months</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Interest Rate:</span>
          <span>{loan.interestRate}%</span>
        </div>
        {loan.monthlyPayment && (
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Payment:</span>
            <span className="font-semibold">{formatCurrency(loan.monthlyPayment)}</span>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleViewDetails}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          View Details
        </button>
        {loan.status === 'pending' && (
          <button
            onClick={() => navigate(`/verify/${loan.id}`)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            Verify
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanCard;
