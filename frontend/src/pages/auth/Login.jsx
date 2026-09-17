import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  useTheme,
  Chip,
  Stack,
  Grid,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BadgeIcon from "@mui/icons-material/Badge";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import AuthShell, { authFieldSx } from "../../components/auth/AuthShell";
import GradientButton from "../../components/common/GradientButton";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@garment.com",
    password: "admin123",
    icon: AdminPanelSettingsIcon,
    color: "#59171B",
    badge: "Full Control",
  },
  {
    role: "Manager",
    email: "manager@garment.com",
    password: "manager123",
    icon: SupervisorAccountIcon,
    color: "#7A2328",
    badge: "Operations",
  },
  {
    role: "Employee",
    email: "employee@garment.com",
    password: "employee123",
    icon: BadgeIcon,
    color: "#A45A4A",
    badge: "Shop Floor",
  },
];

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const isPendingManager = queryParams.get("pending") === "manager";

  const handleQuickSelect = (acc) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
  };

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
      {/* Quick Demo Access Bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Box
          sx={{
            mb: 3,
            p: 1.8,
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(89,23,27,0.05) 0%, rgba(254,215,184,0.12) 100%)",
            border: "1px solid rgba(89,23,27,0.12)",
            boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.2}>
            <Box display="flex" alignItems="center" gap={0.8}>
              <AutoAwesomeIcon sx={{ fontSize: 15, color: "primary.main" }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "text.primary" }}>
                Quick Demo Sign-In
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Click to autofill
            </Typography>
          </Box>

          <Grid container spacing={1}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = selectedRole === acc.role;
              const Icon = acc.icon;
              return (
                <Grid item xs={4} key={acc.role}>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => handleQuickSelect(acc)}
                      sx={{
                        py: 0.8,
                        px: 0.5,
                        borderRadius: 2,
                        fontSize: 11.5,
                        fontWeight: 700,
                        textTransform: "none",
                        flexDirection: "column",
                        gap: 0.3,
                        color: isSelected ? "#FFF" : "text.primary",
                        bgcolor: isSelected ? "#59171B" : "background.paper",
                        border: `1px solid ${isSelected ? "#59171B" : "rgba(89,23,27,0.15)"}`,
                        boxShadow: isSelected ? "0 4px 12px rgba(89,23,27,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: isSelected ? "#7A2328" : "rgba(89,23,27,0.06)",
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 17, color: isSelected ? "#FED7B8" : "primary.main" }} />
                      <Typography sx={{ fontSize: 11, fontWeight: 750, lineHeight: 1.1 }}>
                        {acc.role}
                      </Typography>
                    </Button>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </motion.div>

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
          onChange={(e) => {
            setEmail(e.target.value);
            setSelectedRole(null);
          }}
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
          onChange={(e) => {
            setPassword(e.target.value);
            setSelectedRole(null);
          }}
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

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <GradientButton
            type="submit"
            fullWidth
            size="large"
            loading={loading}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2.5,
              fontSize: '0.98rem',
              fontWeight: 750,
              letterSpacing: "0.02em",
              boxShadow: "0 8px 24px rgba(89,23,27,0.28)",
            }}
          >
            {loading ? "Signing in..." : "Sign In to Workspace"}
          </GradientButton>
        </motion.div>

        <Typography variant="caption" component="div" align="center" color="text.secondary" sx={{ mt: 2.5, fontSize: 12 }}>
          Protected by enterprise security · Couture Intelligence
        </Typography>
      </Box>
    </AuthShell>
  );
}
