import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

const ApplicationStatus = () => {
  const { applicationId } = useParams();
  
  // Mock data
  const mockApplication = {
    id: applicationId || 'APP-123456',
    amount: 50000,
    purpose: 'Business Capital',
    term: '12 months',
    status: 'under_verification',
    appliedDate: '2023-10-15',
    verificationSteps: [
      { step: 'Photo Verification', status: 'completed', date: '2023-10-15 10:30' },
      { step: 'Location Verification', status: 'completed', date: '2023-10-15 10:35' },
      { step: 'Witness Verification', status: 'in_progress', date: null },
      { step: 'ID Verification', status: 'pending', date: null },
      { step: 'Mobile Money Verification', status: 'pending', date: null }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Status</h1>
          <p className="text-gray-600 mt-2">Track the progress of your loan application</p>
        </div>

        {/* Application Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Application Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Application ID:</span>
                  <span className="font-medium">{mockApplication.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-medium">{mockApplication.amount.toLocaleString()} MWK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">{mockApplication.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Term:</span>
                  <span className="font-medium">{mockApplication.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Applied Date:</span>
                  <span className="font-medium">{mockApplication.appliedDate}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="flex items-center justify-center h-full">
                <div className={`px-6 py-4 rounded-lg ${
                  mockApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                  mockApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  <div className="text-4xl mb-2">
                    {mockApplication.status === 'approved' ? '✅' :
                     mockApplication.status === 'rejected' ? '❌' : '⏳'}
                  </div>
                  <p className="text-xl font-semibold">
                    {mockApplication.status === 'approved' ? 'Approved' :
                     mockApplication.status === 'rejected' ? 'Rejected' :
                     'Under Verification'}
                  </p>
                  <p className="text-sm mt-2">
                    {mockApplication.status === 'approved' ? 'Your loan has been approved!' :
                     mockApplication.status === 'rejected' ? 'Please contact support for details' :
                     'Verification in progress'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Verification Progress</h2>
          
          <div className="space-y-6">
            {mockApplication.verificationSteps.map((step, index) => (
              <div key={step.step} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                      'bg-gray-100 text-gray-400'}`}>
                    {step.status === 'completed' ? '✓' : index + 1}
                  </div>
                  {index < mockApplication.verificationSteps.length - 1 && (
                    <div className={`h-8 w-0.5 mx-auto ${
                      step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{step.step}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.status === 'completed' ? 'Completed' :
                         step.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {step.date || '--'}
                    </div>
                  </div>
                  
                  {step.status === 'in_progress' && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
                      </div>
                      <p className="text-sm text-blue-600 mt-2">Processing...</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                Download Application
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationStatus;
