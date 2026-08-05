import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, Link, useTheme } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AuthShell, { authFieldSx } from "../../components/auth/AuthShell";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.4,
            borderRadius: 2,
            fontSize: 14.5,
            fontWeight: 700,
            letterSpacing: "0.02em",
            background: "linear-gradient(135deg, #59171B, #7A2328, #A45A4A)",
            backgroundSize: "160% auto",
            boxShadow: "0 14px 34px rgba(122,35,40,0.35)",
            transition: "all 260ms ease",
            "&:hover": {
              backgroundPosition: "right center",
              boxShadow: "0 18px 42px rgba(122,35,40,0.45)",
            },
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <Typography variant="caption" component="div" align="center" color="text.secondary" sx={{ mt: 2.5, fontSize: 12 }}>
          Protected by secure authentication · GarmentOS
        </Typography>
      </Box>
    </AuthShell>
  );
}
