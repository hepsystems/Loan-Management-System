import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // CHANGED HERE
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoanApplication from './pages/LoanApplication';
import RealTimeVerification from './pages/RealTimeVerification';
import ApplicationStatus from './pages/ApplicationStatus';
import AdminDashboard from './pages/AdminDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import SocketProvider from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/apply" element={
              <ProtectedRoute>
                <LoanApplication />
              </ProtectedRoute>
            } />
            <Route path="/verify/:applicationId" element={
              <ProtectedRoute>
                <RealTimeVerification />
              </ProtectedRoute>
            } />
            <Route path="/status/:applicationId" element={
              <ProtectedRoute>
                <ApplicationStatus />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'officer']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
