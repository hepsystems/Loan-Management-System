import React from 'react';
import { Navigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwt_decode(token);
    const userRole = decodedToken.role;
    
    // Check if token is expired
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
