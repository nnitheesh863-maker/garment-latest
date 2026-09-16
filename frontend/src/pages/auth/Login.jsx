import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, Link, useTheme } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import AuthShell, { authFieldSx } from "../../components/auth/AuthShell";
import GradientButton from "../../components/common/GradientButton";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isPendingManager = queryParams.get("pending") === "manager";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    try {
      await login(email.trim(), password);
    } catch {
      // error handled in context
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Smart Factory workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            component="button"
            onClick={() => navigate("/register")}
            underline="hover"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            Create an account
          </Link>
        </>
      }
    >
      {isPendingManager && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Your Manager registration has been submitted and is pending Administrator approval. Once approved, you can sign in here.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          margin="normal"
          size="small"
          autoFocus
          sx={authFieldSx(theme)}
        />
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          margin="normal"
          size="small"
          sx={authFieldSx(theme)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" aria-label="Toggle password visibility">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <GradientButton
          type="submit"
          fullWidth
          size="large"
          loading={loading}
          sx={{
            mt: 3,
            py: 1.5,
            borderRadius: 2,
            fontSize: '0.95rem',
            fontWeight: 700,
          }}
        >
          {loading ? "Signing in..." : "Sign In to Workspace"}
        </GradientButton>

        <Typography variant="caption" component="div" align="center" color="text.secondary" sx={{ mt: 2.5, fontSize: 12 }}>
          Protected by enterprise security · GarmentOS
        </Typography>
      </Box>
    </AuthShell>
  );
}
