import React, { useEffect, useState } from 'react';
import axios from 'axios';

// API Base URL එක
const API_BASE_URL = 'http://localhost:3001';

export default function TestPage({ userRole, componentName }) {
    const [pingStatus, setPingStatus] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Unprotected Ping Call
        axios.get(`${API_BASE_URL}/api/ping`)
            .then(r => setPingStatus(r.data))
            .catch(err => console.error("Ping failed:", err));

        // Protected Patient Call (Header එකේ Token එක යනවා)
        // මේක fail වෙන්නේ, Token එක නැත්නම් (Access Denied) හෝ role එක patients බලන්න බැරි නම්.
        axios.get(`${API_BASE_URL}/patients`)
            .then(r => {
                setPatientData(r.data);
                setError(null);
            })
            .catch(err => {
                // Backend එකෙන් එන error message එක display කරනවා
                setError(err.response?.data?.error || "Failed to fetch protected data. Check if your role is allowed.");
                setPatientData(null);
            });
            
    }, [userRole]); // userRole වෙනස් වන විට නැවත call කරන්න

    return (
        <div className="p-8 bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">MediPulse — {componentName || "System Test"}</h1>
            
            <p className="text-gray-600 mb-6">Logged in as: <b className='text-blue-600'>{userRole || "Public User"}</b></p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className='p-4 bg-white rounded-lg shadow border border-green-200'>
                    <h2 className="text-xl font-semibold text-green-700 mb-3">✅ API Status (Unprotected Ping)</h2>
                    {pingStatus ? (
                        <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                            {JSON.stringify(pingStatus, null, 2)}
                        </pre>
                    ) : <p className='text-gray-500'>Loading...</p>}
                </div>

                <div className='p-4 bg-white rounded-lg shadow border border-red-200'>
                    <h2 className="text-xl font-semibold text-red-700 mb-3">🔒 Protected Data Test (/patients)</h2>
                    
                    {error && (
                        <div className="bg-red-100 p-3 rounded text-red-700 text-sm mb-3">
                            <b>ERROR:</b> {error}
                            <p className='mt-1 text-xs'>
                                (Only **DOCTOR** and **ADMIN** roles can access this.)
                            </p>
                        </div>
                    )}

                    {patientData && patientData.length > 0 && (
                        <p className='text-sm text-gray-700 mb-2'>Successfully fetched {patientData.length} patient records (as {userRole}).</p>
                    )}
                    
                    {patientData && (
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto h-40">
                            {JSON.stringify(patientData.slice(0, 2), null, 2)}
                            {patientData.length > 2 && "\n// ... more patients"}
                        </pre>
                    )}
                </div>
            </div>

        </div>
    );
}