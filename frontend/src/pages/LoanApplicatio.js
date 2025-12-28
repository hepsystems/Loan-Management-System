import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { loanService } from '../services/api';
import { LOAN_PURPOSES, LOAN_LIMITS } from '../utils/constants';
import { formatters } from '../utils/formatters';
import { validateForm } from '../utils/validators';

const LoanApplication = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    term: '12',
    employmentType: '',
    monthlyIncome: '',
    businessName: '',
    businessType: '',
    yearsInBusiness: '',
    collateralDescription: '',
    repaymentPlan: 'monthly',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  
  const [errors, setErrors] = useState({});
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  const validationRules = {
    amount: {
      required: true,
      type: 'number',
      min: LOAN_LIMITS.MIN_AMOUNT,
      max: LOAN_LIMITS.MAX_AMOUNT
    },
    purpose: { required: true },
    term: {
      required: true,
      type: 'number',
      min: LOAN_LIMITS.MIN_TERM,
      max: LOAN_LIMITS.MAX_TERM
    },
    monthlyIncome: {
      required: true,
      type: 'number',
      min: 0
    },
    emergencyContactName: { required: true },
    emergencyContactPhone: {
      required: true,
      type: 'phone'
    }
  };

  const calculateMonthlyPayment = () => {
    const amount = parseFloat(formData.amount) || 0;
    const term = parseInt(formData.term) || 12;
    
    if (amount <= 0) return 0;
    
    let interestRate;
    if (term <= 12) {
      interestRate = 0.15; // 15%
    } else if (term <= 24) {
      interestRate = 0.12; // 12%
    } else {
      interestRate = 0.10; // 10%
    }
    
    const monthlyRate = interestRate / 12;
    const totalAmount = amount * (1 + interestRate);
    const monthlyPayment = totalAmount / term;
    
    return Math.round(monthlyPayment);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, validationRules);
    setErrors(validation.errors);
    
    if (!validation.isValid) return;
    
    try {
      setLoading(true);
      
      const applicationData = {
        ...formData,
        amount: parseFloat(formData.amount),
        term: parseInt(formData.term),
        monthlyIncome: parseFloat(formData.monthlyIncome),
        userId: user.id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        calculatedPayment: calculateMonthlyPayment()
      };
      
      const response = await loanService.apply(applicationData);
      
      toast.success('Loan application submitted successfully!');
      navigate(`/verify/${response.loanId}`);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalRepayment = monthlyPayment * (parseInt(formData.term) || 12);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Apply for a Loan</h1>
          <p className="text-gray-600 mt-2">
            Complete the form below to apply for a loan. All fields marked with * are required.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Loan Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Loan Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount (MWK) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        min={LOAN_LIMITS.MIN_AMOUNT}
                        max={LOAN_LIMITS.MAX_AMOUNT}
                        className={`w-full px-4 py-3 border ${
                          errors.amount ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Enter amount"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-gray-500">MWK</span>
                      </div>
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Min: {formatters.currency(LOAN_LIMITS.MIN_AMOUNT)} | 
                      Max: {formatters.currency(LOAN_LIMITS.MAX_AMOUNT)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Purpose *
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${
                        errors.purpose ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">Select purpose</option>
                      {LOAN_PURPOSES.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                    {errors.purpose && (
                      <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Term (Months) *
                    </label>
                    <input
                      type="number"
                      name="term"
                      value={formData.term}
                      onChange={handleChange}
                      min={LOAN_LIMITS.MIN_TERM}
                      max={LOAN_LIMITS.MAX_TERM}
                      className={`w-full px-4 py-3 border ${
                        errors.term ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {errors.term && (
                      <p className="mt-1 text-sm text-red-600">{errors.term}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      {LOAN_LIMITS.MIN_TERM} to {LOAN_LIMITS.MAX_TERM} months
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repayment Plan
                    </label>
                    <select
                      name="repaymentPlan"
                      value={formData.repaymentPlan}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Financial Summary */}
                {formData.amount && (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      Financial Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Loan Amount</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatters.currency(parseFloat(formData.amount) || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Monthly Payment</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatters.currency(monthlyPayment)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700">Total Repayment</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatters.currency(totalRepayment)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Employment Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Employment Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="business-owner">Business Owner</option>
                      <option value="student">Student</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income (MWK) *
                    </label>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={formData.monthlyIncome}
                      onChange={handleChange}
                      min="0"
                      className={`w-full px-4 py-3 border ${
                        errors.monthlyIncome ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter monthly income"
                    />
                    {errors.monthlyIncome && (
                      <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome}</p>
                    )}
                  </div>

                  {formData.employmentType === 'self-employed' || 
                   formData.employmentType === 'business-owner' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years in Business
                        </label>
                        <input
                          type="number"
                          name="yearsInBusiness"
                          value={formData.yearsInBusiness}
                          onChange={handleChange}
                          min="0"
                          step="0.5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Emergency Contact
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${
                        errors.emergencyContactName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Enter full name"
                    />
                    {errors.emergencyContactName && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${
                        errors.emergencyContactPhone ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="+265 XXX XXX XXX"
                    />
                    {errors.emergencyContactPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </div>

              {/* Collateral Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
                  Collateral (Optional)
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Description
                  </label>
                  <textarea
                    name="collateralDescription"
                    value={formData.collateralDescription}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe any collateral you can provide (e.g., land title, vehicle, equipment)"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Providing collateral may increase your chances of approval and lower interest rates.
                  </p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms and Conditions
                      </a>{' '}
                      and confirm that all information provided is accurate.
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="privacy" className="text-sm text-gray-700">
                      I consent to the processing of my personal data in accordance with the{' '}
                      <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </a>.
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" color="white" />
                      <span className="ml-2">Processing...</span>
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                  By submitting, you'll proceed to the verification process.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoanApplication;
