// frontend/src/api.js
// (මේක ඔයා කලින් response එකේදි හැදුවා, ඒක update කරන්න)

import axios from 'axios';

// baseURL එක ඔයාගෙ Login.jsx එකේ තිබ්බ API_URL එකට සෙට් කරන්න
const api = axios.create({
    baseURL: 'http://localhost:3001/api' 
});

api.interceptors.request.use(
    (config) => {
        // මෙතන 'token' කියන නම එහෙම්ම තියන්න
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;