// frontend/src/pages/Login.jsx

import React, { useState } from "react";
// import axios from 'axios'; // <-- FIX 1: axios වෙනුවට api import කරන්න
import api from "../api"; // <-- FIX 1: (path එක හරිද බලන්න. 'src/api.js' සහ 'src/pages/Login.jsx' නම් මේක හරි)
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Link as MuiLink,
  Divider,
  Chip,
} from "@mui/material";
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  LocalHospital,
  Login as LoginIcon,
} from "@mui/icons-material";
import AuthLayout from "../components/AuthLayout";

// const API_URL = 'http://localhost:3001/api'; // <-- FIX 2: මේක දැන් ඕන නෑ. api.js එකේ තියෙනවා.

const Login = ({ setLoggedInUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // const response = await axios.post(`${API_URL}/login`, { // <-- FIX 3: axios.post වෙනුවට api.post
      const response = await api.post("/login", {
        // <-- FIX 3: URL එකේ /login විතරයි
        username,
        password,
      });

      const { token, user } = response.data;

      // localStorage.setItem('jwtToken', token); // <-- FIX 4: මෙන්න වැදගත්ම තැන
      localStorage.setItem("token", token); // <-- FIX 4: 'token' නමින් save කරන්න

      // localStorage.setItem('userData', JSON.stringify(user)); // (මේක තියන්නත් පුළුවන්, නැතත් කමක් නෑ)

      setLoggedInUser({ token, user });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  // (ඉතුරු JSX code එක එහෙම්ම තියන්න. ඒකෙ වෙනසක් නෑ)
  return (
    <AuthLayout
      title="MEDIPULSE"
      subtitle="Clinic & Pharmacy Management System"
      icon={<LocalHospital sx={{ fontSize: 48 }} />}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to access your dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          variant="outlined"
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <LoginIcon />
            )
          }
          sx={{
            py: 1.5,
            borderRadius: "12px",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1rem",
            background: "linear-gradient(to right, #4F46E5, #7C3AED)",
            boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.4)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(to right, #4338CA, #6D28D9)",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(79, 70, 229, 0.4)",
            },
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <Divider sx={{ my: 3 }}>
        <Chip
          label="OR"
          size="small"
          sx={{
            bgcolor: "primary.light",
            color: "primary.dark",
            fontWeight: 600,
          }}
        />
      </Divider>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Need an account? Contact Admin to{" "}
          <MuiLink
            component="button" // 1. Change this to 'button' to act like a React element
            onClick={() => navigate("/register")} // 2. Use navigate hook for smooth routing
            underline="hover"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontFamily: "inherit", // Ensures font matches
              fontSize: "inherit", // Ensures size matches
            }}
          >
            Register a User
          </MuiLink>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default Login;
