// frontend/src/pages/Register.jsx

import React, { useState } from 'react';
import api from '../api'; // <-- FIX: api import කලා
import { useNavigate } from 'react-router-dom'; // <-- FIX: useNavigate import කලා
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Link as MuiLink
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  Badge,
  HowToReg,
  ArrowBack // <-- FIX: ArrowBack icon එක import කලා
} from '@mui/icons-material';
import AuthLayout from '../components/AuthLayout'; 

// const API_URL = 'http://localhost:3001/api'; // <-- FIX: අයින් කලා

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'DOCTOR',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate(); // <-- FIX: navigate hook එක ගත්තා

  const roles = ['DOCTOR', 'PHARMACIST', 'ADMIN'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/register', formData); // <-- FIX: axios.post -> api.post සහ URL එක හැදුවා
      setMessage(`Successfully registered ${response.data.user.name} as a ${response.data.user.role}.`);
      setFormData({ name: '', username: '', password: '', role: 'DOCTOR' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Account"
      subtitle="Register healthcare professionals to the system"
      icon={<HowToReg sx={{ fontSize: 48 }} />}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
          User Registration Portal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fill in the details for the new user
        </Typography>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <TextField
          fullWidth
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Username */}
        <TextField
          fullWidth
          label="Username (Unique ID)"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Badge color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Password */}
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Role Selection */}
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel id="role-label">User Role</InputLabel>
          <Select
            labelId="role-label"
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="User Role"
            startAdornment={
              <InputAdornment position="start">
                <HowToReg color="action" />
              </InputAdornment>
            }
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: role === 'ADMIN' ? 'error.main' : role === 'DOCTOR' ? 'info.main' : 'success.main'
                    }}
                  />
                  {role}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HowToReg />}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '1rem',
            background: 'linear-gradient(to right, #4F46E5, #7C3AED)',
            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(to right, #4338CA, #6D28D9)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
            },
          }}
        >
          {loading ? 'Processing...' : 'Register User'}
        </Button>
      </form>

      {/* Back to Dashboard Link */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <MuiLink
          component="button"
          onClick={() => navigate('/dashboard')} // <-- FIX: navigate(-1) වෙනුවට /dashboard එකට යැව්වා
          underline="hover"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto'
          }}
        >
          <ArrowBack sx={{ mr: 0.5, fontSize: 16 }} />
          Back to Login
        </MuiLink>
      </Box>
    </AuthLayout>
  );
};

export default Register;