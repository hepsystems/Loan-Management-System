import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Webcam from 'react-webcam';
import SignatureCanvas from 'react-signature-canvas';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSocket } from '../context/SocketContext';

const RealTimeVerification = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [verificationStep, setVerificationStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  
  const webcamRef = useRef(null);
  const signatureRef = useRef(null);
  
  const { socket, isConnected, emit, joinApplicationRoom, getVerificationStatus } = useSocket();
  
  const verificationStatus = getVerificationStatus(applicationId);

  useEffect(() => {
    if (applicationId && joinApplicationRoom) {
      joinApplicationRoom(applicationId);
    }
  }, [applicationId, joinApplicationRoom]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy
        });
        setLoading(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('Failed to get location.');
            break;
        }
        toast.error('Failed to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      emit('capture-photo', {
        applicationId,
        imageData: imageSrc,
        location
      });
      setVerificationStep(2);
    }
  };

  const verifyLocation = () => {
    if (location) {
      emit('verify-location', {
        applicationId,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
      setVerificationStep(3);
    } else {
      toast.error('Please capture location first');
    }
  };

  const verifyWitness = () => {
    const witnessName = document.getElementById('witnessName')?.value;
    const witnessId = document.getElementById('witnessId')?.value;
    
    if (!witnessName || !witnessId) {
      toast.error('Please fill in all witness details');
      return;
    }
    
    const witnessData = {
      name: witnessName,
      idNumber: witnessId,
      signature: signatureRef.current.toDataURL()
    };
    
    emit('verify-witness', {
      applicationId,
      witnessData
    });
    setVerificationStep(4);
  };

  const verifyID = () => {
    const frontImage = document.getElementById('idFront')?.files[0];
    const backImage = document.getElementById('idBack')?.files[0];
    
    if (!frontImage || !backImage) {
      toast.error('Please upload both front and back images');
      return;
    }
    
    const convertToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    };

    Promise.all([convertToBase64(frontImage), convertToBase64(backImage)])
      .then(([front, back]) => {
        emit('verify-id', {
          applicationId,
          idImages: { front, back }
        });
        setVerificationStep(5);
      })
      .catch(error => {
        toast.error('Error processing images');
        console.error(error);
      });
  };

  const verifyMobileMoney = () => {
    const provider = document.getElementById('mobileProvider')?.value;
    const phoneNumber = document.getElementById('mobileNumber')?.value;
    
    if (!provider || !phoneNumber) {
      toast.error('Please select provider and enter phone number');
      return;
    }
    
    emit('verify-mobile-money', {
      applicationId,
      provider,
      phoneNumber
    });
    
    // Simulate final verification
    setTimeout(() => {
      toast.success('✅ All verifications completed!');
      setTimeout(() => navigate(`/status/${applicationId}`), 2000);
    }, 1500);
  };

  const clearSignature = () => {
    signatureRef.current.clear();
  };

  const mobileMoneyProviders = [
    { id: 'mpamba', name: 'MPamba' },
    { id: 'tnm', name: 'TNM Mpamba' },
    { id: 'airtel_money', name: 'Airtel Money' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection Status */}
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          isConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className={isConnected ? 'text-green-700' : 'text-yellow-700'}>
            {isConnected ? 'Connected to verification system' : 'Connecting...'}
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Real-time Verification</h1>
          <p className="text-gray-600 mt-2">
            Application ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{applicationId}</span>
          </p>
          <p className="text-gray-600">
            Complete all verification steps to proceed with your loan application
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {['Photo', 'Location', 'Witness', 'ID', 'Mobile Money'].map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${verificationStep > index + 1 ? 'bg-green-100 text-green-600' : 
                    verificationStep === index + 1 ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
                    'bg-gray-100 text-gray-400'}`}>
                  {verificationStep > index + 1 ? '✓' : index + 1}
                </div>
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2"
              style={{ width: `${(verificationStep - 1) * 25}%` }}></div>
          </div>
        </div>

        {/* Step 1: Photo Capture */}
        {verificationStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Step 1: Take a Live Photo</h2>
            <p className="text-gray-600 mb-6">
              Please look directly at the camera and ensure good lighting
            </p>
            
            <div className="mb-6">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full max-w-md mx-auto rounded-lg border-4 border-white shadow-lg"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={capturePhoto}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                disabled={!isConnected}
              >
                {isConnected ? '📸 Capture Photo' : 'Connecting...'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location Verification */}
        {verificationStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Location Verification</h2>
            <p className="text-gray-600 mb-6">
              We need to verify your current location for security purposes
            </p>
            
            {locationError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{locationError}</p>
              </div>
            )}
            
            {location ? (
              <div className="mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">📍 Location Captured</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}</p>
                    <p><span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}</p>
                    <p><span className="font-medium">Accuracy:</span> {Math.round(location.accuracy)} meters</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">
                    Click the button below to allow location access. This helps us verify you're in an eligible area.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={getLocation}
                disabled={loading || location || !isConnected}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? <LoadingSpinner size="small" color="white" /> : 
                 location ? '📍 Location Captured' : 
                 isConnected ? 'Get My Location' : 'Connecting...'}
              </button>
              
              {location && (
                <button
                  onClick={verifyLocation}
                  disabled={!isConnected}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {isConnected ? 'Verify & Continue →' : 'Connecting...'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Witness Verification */}
        {verificationStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Step 3: Witness Verification</h2>
            <p className="text-gray-600 mb-6">
              Have a witness verify your identity and loan application
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Full Name *
                </label>
                <input
                  type="text"
                  id="witnessName"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter witness full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness ID Number *
                </label>
                <input
                  type="text"
                  id="witnessId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter witness ID number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Signature *
                </label>
                <div className="border-2 border-gray-300 rounded-lg p-2">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: "w-full h-40 bg-white rounded",
                      width: 500,
                      height: 200
                    }}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear signature
                </button>
              </div>
            </div>
            
            <button
              onClick={verifyWitness}
              disabled={!isConnected}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isConnected ? 'Submit Witness Verification' : 'Connecting...'}
            </button>
          </div>
        )}

        {/* Step 4: ID Verification */}
        {verificationStep === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Step 4: ID Document Verification</h2>
            <p className="text-gray-600 mb-6">
              Upload clear photos of your National ID or Passport
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="font-semibold mb-2">Front Side</h3>
                <p className="text-sm text-gray-600 mb-4">Take a photo of the front of your ID</p>
                <input
                  type="file"
                  id="idFront"
                  accept="image/*"
                  capture="environment"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="font-semibold mb-2">Back Side</h3>
                <p className="text-sm text-gray-600 mb-4">Take a photo of the back of your ID</p>
                <input
                  type="file"
                  id="idBack"
                  accept="image/*"
                  capture="environment"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <p className="text-yellow-800">
                <span className="font-semibold">Important:</span> Ensure the ID is valid, all details are clearly visible, and photos are not blurry.
              </p>
            </div>
            
            <button
              onClick={verifyID}
              disabled={!isConnected}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isConnected ? 'Submit ID Verification' : 'Connecting...'}
            </button>
          </div>
        )}

        {/* Step 5: Mobile Money Verification */}
        {verificationStep === 5 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Step 5: Mobile Money Verification</h2>
            <p className="text-gray-600 mb-6">
              Verify your mobile money account for loan disbursement
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Money Provider *
                </label>
                <select
                  id="mobileProvider"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select provider</option>
                  {mobileMoneyProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Money Number *
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +265 888 123 456"
                />
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  <span className="font-semibold">Note:</span> The name on your mobile money account must match your ID. Funds will be disbursed to this account.
                </p>
              </div>
            </div>
            
            <button
              onClick={verifyMobileMoney}
              disabled={!isConnected}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {isConnected ? 'Complete Verification' : 'Connecting...'}
            </button>
          </div>
        )}

        {/* Verification Status Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Verification Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(verificationStatus).map(([key, value]) => (
              <div key={key} className={`p-4 rounded-lg border ${value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {value ? '✓' : '...'}
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {value ? 'Verified' : 'Pending'}
                </p>
              </div>
            ))}
          </div>
          
          {Object.values(verificationStatus).every(v => v) && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎉</span>
                <div>
                  <h4 className="font-semibold text-green-800">All verifications completed!</h4>
                  <p className="text-green-700">Your loan application is now being processed.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RealTimeVerification;
