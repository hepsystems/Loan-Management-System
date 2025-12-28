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

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    const socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection error. Please refresh the page.');
    });

    // Application events
    socketInstance.on('application-updated', (data) => {
      toast.info(`Application #${data.id.slice(-8)} updated: ${data.status}`);
    });

    socketInstance.on('verification-completed', (data) => {
      toast.success(`Verification completed for application #${data.applicationId.slice(-8)}`);
    });

    socketInstance.on('loan-approved', (data) => {
      toast.success(`🎉 Loan approved! Amount: ${new Intl.NumberFormat('en-MW', {
        style: 'currency',
        currency: 'MWK'
      }).format(data.amount)}`);
    });

    socketInstance.on('notification', (notification) => {
      toast.info(notification.message, {
        autoClose: 8000,
      });
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.error('Socket not connected');
        toast.error('Connection lost. Please refresh the page.');
      }
    },
    joinApplicationRoom: (applicationId) => {
      if (socket && isConnected) {
        socket.emit('join-application', applicationId);
      }
    },
    leaveApplicationRoom: (applicationId) => {
      if (socket && isConnected) {
        socket.emit('leave-application', applicationId);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
