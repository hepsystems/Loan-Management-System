import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import SignatureCanvas from 'react-signature-canvas';
import { useGeolocated } from 'react-geolocated';
import { io } from 'socket.io-client';
import axios from 'axios';

const RealTimeVerification = ({ applicationId }) => {
  const [verificationStep, setVerificationStep] = useState(1);
  const [socket, setSocket] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({});
  const webcamRef = useRef(null);
  const signatureRef = useRef(null);
  
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    userDecisionTimeout: 5000,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Join application room
    newSocket.emit('join-application', applicationId);

    // Listen for verification updates
    newSocket.on('verification-status', setVerificationStatus);
    newSocket.on('photo-captured', handlePhotoCaptured);
    newSocket.on('location-verified', handleLocationVerified);
    newSocket.on('witness-verified', handleWitnessVerified);
    newSocket.on('id-verified', handleIDVerified);

    return () => {
      newSocket.disconnect();
    };
  }, [applicationId]);

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const location = coords ? {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy
    } : null;

    socket.emit('capture-photo', {
      applicationId,
      imageData: imageSrc,
      location
    });
  };

  const verifyLocation = () => {
    if (coords) {
      socket.emit('verify-location', {
        applicationId,
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      });
    }
  };

  const verifyWitness = () => {
    const witnessData = {
      name: document.getElementById('witnessName').value,
      idNumber: document.getElementById('witnessId').value,
      signature: signatureRef.current.toDataURL(),
      photo: webcamRef.current.getScreenshot()
    };

    socket.emit('verify-witness', {
      applicationId,
      witnessData
    });
  };

  const verifyID = async () => {
    const frontImage = document.getElementById('idFront').files[0];
    const backImage = document.getElementById('idBack').files[0];

    const convertToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    };

    try {
      const idImages = {
        front: await convertToBase64(frontImage),
        back: await convertToBase64(backImage)
      };

      socket.emit('verify-id', {
        applicationId,
        idImages,
        verificationMethod: 'automated'
      });
    } catch (error) {
      console.error('Error converting images:', error);
    }
  };

  const verifyMobileMoney = () => {
    const provider = document.getElementById('mobileProvider').value;
    const phoneNumber = document.getElementById('mobileNumber').value;

    socket.emit('verify-mobile-money', {
      applicationId,
      provider,
      phoneNumber
    });
  };

  const handlePhotoCaptured = (data) => {
    console.log('Photo captured:', data);
    // Update UI
  };

  const handleLocationVerified = (data) => {
    console.log('Location verified:', data);
    if (data.verified) {
      setVerificationStep(prev => prev + 1);
    }
  };

  const handleWitnessVerified = (data) => {
    console.log('Witness verified:', data);
    setVerificationStep(prev => prev + 1);
  };

  const handleIDVerified = (data) => {
    console.log('ID verified:', data);
    if (data.verified) {
      setVerificationStep(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Real-time Verification</h1>
      
      {/* Progress Indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`flex flex-col items-center ${step <= verificationStep ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step <= verificationStep ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step}
            </div>
            <span className="mt-2 text-sm">
              {step === 1 && 'Photo'}
              {step === 2 && 'Location'}
              {step === 3 && 'Witness'}
              {step === 4 && 'ID'}
              {step === 5 && 'Mobile Money'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Real-time Photo */}
      {verificationStep === 1 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Real-time Photo Capture</h2>
          <div className="mb-4">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </div>
          <button
            onClick={capturePhoto}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Capture Photo
          </button>
        </div>
      )}

      {/* Step 2: Location Verification */}
      {verificationStep === 2 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Step 2: Location Verification</h2>
          {isGeolocationAvailable && isGeolocationEnabled ? (
            <div>
              <p className="mb-4">
                Latitude: {coords?.latitude}<br />
                Longitude: {coords?.longitude}<br />
                Accuracy: {coords?.accuracy} meters
              </p>
              <button
                onClick={verifyLocation}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Verify Location
              </button>
            </div>
          ) : (
            <p className="text-red-600">Geolocation is not available or enabled.</p>
          )}
        </div>
      )}

      {/* Step 3: Witness Verification */}
      {verificationStep === 3 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Step 3: Witness Verification</h2>
          <div className="space-y-4">
            <input
              type="text"
              id="witnessName"
              placeholder="Witness Full Name"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              id="witnessId"
              placeholder="Witness ID Number"
              className="w-full p-2 border rounded"
            />
            <div className="border rounded p-4">
              <p className="mb-2">Witness Signature:</p>
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: "w-full h-48 border"
                }}
              />
            </div>
            <button
              onClick={verifyWitness}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Verify Witness
            </button>
          </div>
        </div>
      )}

      {/* Step 4: ID Verification */}
      {verificationStep === 4 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Step 4: ID Verification</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">ID Front Image:</label>
              <input
                type="file"
                id="idFront"
                accept="image/*"
                capture="environment"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">ID Back Image:</label>
              <input
                type="file"
                id="idBack"
                accept="image/*"
                capture="environment"
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={verifyID}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Verify ID
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Mobile Money Verification */}
      {verificationStep === 5 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Step 5: Mobile Money Verification</h2>
          <div className="space-y-4">
            <select
              id="mobileProvider"
              className="w-full p-2 border rounded"
            >
              <option value="">Select Provider</option>
              <option value="mpamba">MPamba</option>
              <option value="tnm">TNM Mpamba</option>
              <option value="airtel_money">Airtel Money</option>
            </select>
            <input
              type="tel"
              id="mobileNumber"
              placeholder="Mobile Money Number"
              className="w-full p-2 border rounded"
            />
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold">Important:</p>
              <p>The name on your National ID must match the name on your mobile money account.</p>
            </div>
            <button
              onClick={verifyMobileMoney}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Verify Mobile Money
            </button>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Verification Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(verificationStatus).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded shadow">
              <div className="flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className={`px-2 py-1 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {value ? '✓ Verified' : '✗ Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeVerification;
