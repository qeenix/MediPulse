import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  const [pong, setPong] = useState(null);

  useEffect(() => {
    axios.get('/api/ping').then(r => setPong(r.data));
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <h1>MediPulse — Clinic + Pharmacy Management System</h1>
      {pong && <pre>{JSON.stringify(pong, null, 2)}</pre>}
    </div>
  );
}
