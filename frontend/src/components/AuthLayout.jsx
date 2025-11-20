import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';

// This is the "wrapper" for both your Login and Register pages.
const AuthLayout = ({ title, subtitle, icon, children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        // Use MUI's sx prop for gradients
        background: 'linear-gradient(to br, #f0f7ff, #f3f0ff)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={16}
          sx={{
            borderRadius: '24px', // Use consistent, theme-friendly values
            overflow: 'hidden',
            background: 'linear-gradient(to bottom, #ffffff, #fafbff)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              color: 'white',
              background: 'linear-gradient(to right, #4F46E5, #7C3AED)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: '50%',
                  p: 2,
                  boxShadow: 3,
                  color: '#4F46E5',
                }}
              >
                {icon}
              </Box>
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Form Section (The children go here) */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {children}
          </Box>
          
          {/* Footer */}
          <Box sx={{ bgcolor: 'grey.50', py: 2, px: 4, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              © 2024 MediPulse Healthcare. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;