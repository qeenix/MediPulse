import React, { useState } from 'react';
import api from '../api'; 
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Person,
  PhoneIphone,
  Scale,
  PersonAdd
} from '@mui/icons-material';

// passing an optional 'onSuccess' prop to handle what happens after registration
const RegisterPatientForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    currentWeightKg: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const dataToSend = {
      ...formData,
      currentWeightKg: formData.currentWeightKg
        ? parseFloat(formData.currentWeightKg)
        : undefined, 
    };

    try {
      const response = await api.post('/patients', dataToSend);
      
      setMessage(`Successfully registered Patient: ${response.data.name}`);
      setFormData({ name: '', mobileNumber: '', currentWeightKg: '' });

      // If the parent component provided a callback, call it after a short delay
      if (onSuccess) {
          setTimeout(() => {
              onSuccess(response.data);
          }, 2000);
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Patient registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        borderRadius: '16px',
        maxWidth: 600,
        mx: 'auto', // Center horizontally
        mt: 2
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ color: 'primary.main', mx: 'auto', mb: 1 }}>
          <PersonAdd sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Register New Patient
        </Typography>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          fullWidth
          label="Mobile Number (Unique ID)"
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          required
          variant="outlined"
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIphone color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        <TextField
          fullWidth
          label="Current Weight (Kg)"
          type="number"
          inputProps={{ step: '0.1' }}
          name="currentWeightKg"
          value={formData.currentWeightKg}
          onChange={handleChange}
          variant="outlined"
          sx={{ mb: 4 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">Kg</InputAdornment>,
            startAdornment: (
              <InputAdornment position="start">
                <Scale color="action" />
              </InputAdornment>
            )
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
          sx={{ py: 1.5, borderRadius: '10px' }}
        >
          {loading ? 'Registering...' : 'Register Patient'}
        </Button>
      </form>
    </Paper>
  );
};

export default RegisterPatientForm;