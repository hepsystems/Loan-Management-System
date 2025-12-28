import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [verificationUpdates, setVerificationUpdates] = useState({});

  useEffect(() => {
    // Mock WebSocket connection since we don't have a real backend
    // In a real app, you would connect to your backend URL
    const mockSocket = {
      id: 'mock-socket-id-' + Date.now(),
      connected: true,
      emit: (event, data) => {
        console.log('Mock socket emit:', event, data);
        
        // Simulate server responses
        switch(event) {
          case 'capture-photo':
            setTimeout(() => {
              toast.success('Photo verified successfully!');
              if (data.applicationId) {
                setVerificationUpdates(prev => ({
                  ...prev,
                  [data.applicationId]: {
                    ...prev[data.applicationId],
                    photo: true
                  }
                }));
              }
            }, 1000);
            break;
            
          case 'verify-location':
            setTimeout(() => {
              toast.success('Location verified!');
              if (data.applicationId) {
                setVerificationUpdates(prev => ({
                  ...prev,
                  [data.applicationId]: {
                    ...prev[data.applicationId],
                    location: true
                  }
                }));
              }
            }, 1000);
            break;
            
          case 'verify-witness':
            setTimeout(() => {
              toast.success('Witness verification submitted!');
              if (data.applicationId) {
                setVerificationUpdates(prev => ({
                  ...prev,
                  [data.applicationId]: {
                    ...prev[data.applicationId],
                    witness: true
                  }
                }));
              }
            }, 1000);
            break;
            
          case 'verify-id':
            setTimeout(() => {
              toast.success('ID verification submitted!');
              if (data.applicationId) {
                setVerificationUpdates(prev => ({
                  ...prev,
                  [data.applicationId]: {
                    ...prev[data.applicationId],
                    id: true
                  }
                }));
              }
            }, 1500);
            break;
            
          case 'verify-mobile-money':
            setTimeout(() => {
              toast.success('Mobile money verification completed!');
              if (data.applicationId) {
                setVerificationUpdates(prev => ({
                  ...prev,
                  [data.applicationId]: {
                    ...prev[data.applicationId],
                    mobileMoney: true
                  }
                }));
              }
            }, 1000);
            break;
            
          case 'join-application':
            console.log('Joined application room:', data);
            break;
        }
      },
      on: (event, callback) => {
        console.log('Mock socket listener added:', event);
        
        // Handle specific events
        if (event === 'verification-status') {
          // Simulate verification status updates
          setTimeout(() => {
            callback({
              photo: false,
              location: false,
              witness: false,
              id: false,
              mobileMoney: false
            });
          }, 500);
        }
      },
      disconnect: () => {
        console.log('Mock socket disconnected');
      }
    };

    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
      toast.success('Connected to verification system');
    }, 500);

    setSocket(mockSocket);

    return () => {
      // Cleanup
      if (mockSocket.disconnect) {
        mockSocket.disconnect();
      }
    };
  }, []);

  const joinApplicationRoom = (applicationId) => {
    if (socket) {
      socket.emit('join-application', applicationId);
      
      // Initialize verification updates for this application
      setVerificationUpdates(prev => ({
        ...prev,
        [applicationId]: {
          photo: false,
          location: false,
          witness: false,
          id: false,
          mobileMoney: false
        }
      }));
    }
  };

  const leaveApplicationRoom = (applicationId) => {
    console.log('Leaving application room:', applicationId);
  };

  const getVerificationStatus = (applicationId) => {
    return verificationUpdates[applicationId] || {
      photo: false,
      location: false,
      witness: false,
      id: false,
      mobileMoney: false
    };
  };

  const value = {
    socket,
    isConnected,
    emit: (event, data) => {
      if (socket && socket.emit) {
        socket.emit(event, data);
      }
    },
    joinApplicationRoom,
    leaveApplicationRoom,
    getVerificationStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
