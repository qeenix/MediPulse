import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 

// Pages
import Login from './pages/Login'; 
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard'; 
import TestPage from './pages/TestPage'; 

// 1. Helper to get initial user state
const getInitialUser = () => {
    const userDataString = localStorage.getItem('userData');
    const token = localStorage.getItem('token'); 
    
    if (userDataString && token) {
        const userData = JSON.parse(userDataString);
        return { ...userData, isLoggedIn: true }; 
    }
    return null;
};

// 3. Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles, user }) => { 
    if (!user || !user.isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default function App() {
    const [user, setUser] = useState(getInitialUser);

    useEffect(() => {
        if (user && user.isLoggedIn) {
            localStorage.setItem('userData', JSON.stringify({ 
                role: user.role, 
                name: user.name, 
                username: user.username,
                id: user.id 
            }));
        } else {
            localStorage.removeItem('userData');
            localStorage.removeItem('token'); 
        }
    }, [user]);

    const setLoggedInUser = (userData) => {
        const { id, username, name, role } = userData.user;
        setUser({ id, username, name, role, isLoggedIn: true });
    };

    const handleLogout = () => {
        setUser(null);
    };
    
    const getDashboardComponent = (user) => {
        switch (user?.role) {
            case 'DOCTOR':
                return <DoctorDashboard onLogout={handleLogout} user={user} />;
            case 'PHARMACIST':
                return <PharmacyDashboard onLogout={handleLogout} user={user} />;
            case 'ADMIN':
                return <AdminDashboard onLogout={handleLogout} user={user} />;
            default:
                return <Navigate to="/login" replace />;
        }
    };

    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    {/* --- A. PUBLIC ROUTES (Accessible by anyone) --- */}
                    <Route 
                        path="/login" 
                        element={<Login setLoggedInUser={setLoggedInUser} />} 
                    />
                    
                    {/* ✅ FIX: Moved Register here so it is NOT protected */}
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/test" element={<TestPage />} /> 

                    {/* --- B. PROTECTED ROUTES (Login required) --- */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute user={user}>
                                {getDashboardComponent(user)}
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/patients"
                        element={
                            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} user={user}>
                                <TestPage userRole={user?.role} componentName="Patient List"/>
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Catch all - redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </Router>
    );
}