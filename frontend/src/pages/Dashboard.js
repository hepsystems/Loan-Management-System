import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import LoanCard from '../components/LoanCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { loanService } from '../services/api';
import { formatters } from '../utils/formatters';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalBorrowed: 0,
    pendingApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [loansData, statsData] = await Promise.all([
        loanService.getUserLoans(),
        loanService.getUserLoans() // In real app, this would be a separate stats endpoint
      ]);

      setLoans(loansData);
      
      // Calculate stats from loans data
      const calculatedStats = {
        totalLoans: loansData.length,
        activeLoans: loansData.filter(loan => 
          ['approved', 'disbursed'].includes(loan.status)
        ).length,
        totalBorrowed: loansData
          .filter(loan => loan.status === 'disbursed')
          .reduce((sum, loan) => sum + loan.amount, 0),
        pendingApplications: loansData.filter(loan => 
          ['pending', 'under-review'].includes(loan.status)
        ).length
      };
      
      setStats(calculatedStats);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your loan application overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-2xl">📄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Loans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalLoans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-2xl">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeLoans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-2xl">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatters.currency(stats.totalBorrowed)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-2xl">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600 mt-1">Apply for a new loan or check your status</p>
            </div>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link
                to="/apply"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium"
              >
                Apply for Loan
              </Link>
              <Link
                to="/status"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium"
              >
                Check Status
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Loans */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Loan Applications</h2>
            {loans.length > 0 && (
              <Link
                to="/loans"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            )}
          </div>

          {loans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans yet</h3>
              <p className="text-gray-600 mb-6">Apply for your first loan to get started</p>
              <Link
                to="/apply"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium"
              >
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.slice(0, 3).map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>

        {/* Verification Reminder */}
        {loans.some(loan => loan.status === 'pending') && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-yellow-600 text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-yellow-800">
                  Verification Required
                </h3>
                <p className="text-yellow-700 mt-1">
                  You have pending loan applications that require verification. 
                  Complete the verification process to expedite approval.
                </p>
                <div className="mt-4">
                  {loans
                    .filter(loan => loan.status === 'pending')
                    .map(loan => (
                      <div key={loan.id} className="flex items-center justify-between mt-2">
                        <span className="text-yellow-800">
                          Loan #{loan.id.slice(-8)}
                        </span>
                        <Link
                          to={`/verify/${loan.id}`}
                          className="text-yellow-600 hover:text-yellow-800 font-medium"
                        >
                          Verify Now →
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
