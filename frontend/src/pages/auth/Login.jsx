import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // error handled in context
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#0a0a1a',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${new URL('../../images/garment1.jpg', import.meta.url).href})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4) saturate(1.2)',
          transform: 'scale(1.1)',
          animation: 'slowZoom 20s ease-in-out infinite alternate',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(10,10,30,0.85) 0%, rgba(30,20,60,0.6) 50%, rgba(10,10,30,0.85) 100%)',
          zIndex: 1,
        },
      }}
    >
      {/* Animated floating orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
          animation: 'driftOrb 8s ease-in-out infinite alternate',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          bottom: '15%',
          right: '8%',
          animation: 'driftOrb 10s ease-in-out infinite alternate-reverse',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          top: '50%',
          left: '60%',
          animation: 'driftOrb 12s ease-in-out infinite alternate',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes driftOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -30px) scale(1.2); }
        }
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.2); }
        }
      `}</style>

      {/* Glowing card */}
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          mx: 2,
          position: 'relative',
          zIndex: 3,
          bgcolor: 'rgba(18, 18, 40, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          animation: 'glowPulse 4s ease-in-out infinite',
          '&:hover': {
            border: '1px solid rgba(99, 102, 241, 0.4)',
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 0 30px rgba(99,102,241,0.3)',
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#fff">G</Typography>
            </Box>
            <Typography variant="h5" fontWeight={700} color="#fff">
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Sign in to Garment Production System
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(211,47,47,0.15)', color: '#ef5350', border: '1px solid rgba(211,47,47,0.3)' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
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
              sx={{
                mt: 3,
                mb: 2,
                py: 1.2,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Box textAlign="center">
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Don't have an account?{' '}
                <Link
                  component="button"
                  onClick={() => navigate('/register')}
                  underline="hover"
                  sx={{ color: '#8b5cf6', '&:hover': { color: '#a78bfa' } }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
