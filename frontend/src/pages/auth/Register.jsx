import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  MenuItem,
  Link,
  InputAdornment,
  IconButton,
  useTheme,
  LinearProgress,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AuthShell, { authFieldSx } from "../../components/auth/AuthShell";
import GradientButton from "../../components/common/GradientButton";

const validationSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "At least 6 characters").required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: yup.string().required("Role is required"),
  adminSecurityCode: yup.string().when("role", {
    is: ROLES.ADMIN,
    then: (schema) => schema.required("Admin Security Code is required for Administrator role"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const ROLE_OPTIONS = [
  {
    value: ROLES.EMPLOYEE,
    label: "Employee",
    subtitle: "Direct Shop Floor Access",
    icon: BadgeIcon,
    color: "#A45A4A",
  },
  {
    value: ROLES.MANAGER,
    label: "Manager",
    subtitle: "Requires Admin Approval",
    icon: SupervisorAccountIcon,
    color: "#7A2328",
  },
  {
    value: ROLES.ADMIN,
    label: "Admin",
    subtitle: "Requires Passcode",
    icon: AdminPanelSettingsIcon,
    color: "#59171B",
  },
];

function calculatePasswordStrength(pass) {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 6) score += 25;
  if (pass.length >= 8) score += 25;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25;
  return score;
}

export default function Register() {
  const { register } = useAuth();
  const theme = useTheme();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showAdminCode, setShowAdminCode] = React.useState(false);
  const navigate = useNavigate();
  const fieldSx = authFieldSx(theme);

  const handleSubmit = async (values) => {
    setError(null);
    setLoading(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        role: values.role,
        adminSecurityCode: values.role === ROLES.ADMIN ? values.adminSecurityCode : undefined,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          employeeId: `EMP-${Date.now().toString().slice(-6)}`,
        },
      });

      if (values.role === ROLES.MANAGER) {
        toast.info("Manager registration submitted! Your account is pending Administrator approval before sign in.");
        navigate("/login?pending=manager");
      } else {
        toast.success("Account created successfully. Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to join the Smart Factory workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link
            component="button"
            onClick={() => navigate("/login")}
            underline="hover"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Formik
        initialValues={{
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: ROLES.EMPLOYEE,
          adminSecurityCode: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
          const strength = calculatePasswordStrength(values.password);
          const strengthColor =
            strength <= 25 ? "#F44336" : strength <= 50 ? "#FF9800" : strength <= 75 ? "#2196F3" : "#4CAF50";

          return (
            <Form>
              {/* Animated Role Selector Cards */}
              <Box mb={2.5}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "text.secondary" }}>
                  Select Account Role
                </Typography>
                <Grid container spacing={1}>
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = values.role === opt.value;
                    const Icon = opt.icon;
                    return (
                      <Grid item xs={4} key={opt.value}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Box
                            onClick={() => setFieldValue("role", opt.value)}
                            sx={{
                              p: 1.2,
                              borderRadius: 2.5,
                              cursor: "pointer",
                              textAlign: "center",
                              bgcolor: isSelected ? "rgba(89,23,27,0.08)" : "background.paper",
                              border: `2px solid ${isSelected ? "#59171B" : "rgba(89,23,27,0.12)"}`,
                              boxShadow: isSelected ? "0 6px 16px rgba(89,23,27,0.18)" : "0 2px 6px rgba(0,0,0,0.03)",
                              transition: "all 0.25s ease",
                              position: "relative",
                            }}
                          >
                            {isSelected && (
                              <CheckCircleIcon
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  fontSize: 14,
                                  color: "primary.main",
                                }}
                              />
                            )}
                            <Icon sx={{ fontSize: 22, color: isSelected ? "primary.main" : "text.secondary" }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 750, color: isSelected ? "primary.main" : "text.primary", mt: 0.3 }}>
                              {opt.label}
                            </Typography>
                            <Typography sx={{ fontSize: 9.5, color: "text.secondary", lineHeight: 1.2, mt: 0.2 }}>
                              {opt.subtitle}
                            </Typography>
                          </Box>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName && !!errors.firstName}
                    helperText={touched.firstName && errors.firstName}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Last Name"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName && !!errors.lastName}
                    helperText={touched.lastName && errors.lastName}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                    sx={fieldSx}
                  />
                </Grid>

                {/* Admin Secret Passcode Field */}
                <AnimatePresence>
                  {values.role === ROLES.ADMIN && (
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          sx={{
                            p: 1.6,
                            borderRadius: 2.5,
                            bgcolor: "rgba(89,23,27,0.06)",
                            border: "1.5px dashed #59171B",
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <AdminPanelSettingsIcon sx={{ color: "primary.main", fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight={750} color="primary.main">
                              Admin Secret Passcode Required
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            size="small"
                            label="Admin Security Code"
                            name="adminSecurityCode"
                            type={showAdminCode ? "text" : "password"}
                            value={values.adminSecurityCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Enter secret code (ADMIN2026)"
                            error={touched.adminSecurityCode && !!errors.adminSecurityCode}
                            helperText={
                              (touched.adminSecurityCode && errors.adminSecurityCode) ||
                              "Default passcode: ADMIN2026"
                            }
                            sx={fieldSx}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <VpnKeyIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowAdminCode(!showAdminCode)} edge="end" size="small">
                                    {showAdminCode ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                      </motion.div>
                    </Grid>
                  )}
                </AnimatePresence>

                {/* Manager Approval Notice */}
                <AnimatePresence>
                  {values.role === ROLES.MANAGER && (
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Alert
                          severity="info"
                          icon={<SupervisorAccountIcon fontSize="inherit" />}
                          sx={{ borderRadius: 2, bgcolor: "rgba(8,145,178,0.08)", color: "#0e7490", border: "1px solid rgba(8,145,178,0.2)" }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                            Manager Account Approval Notice:
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: 11.5 }}>
                            Manager accounts require Administrator authorization before signing in.
                          </Typography>
                        </Alert>
                      </motion.div>
                    </Grid>
                  )}
                </AnimatePresence>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                    sx={fieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword && !!errors.confirmPassword}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                    sx={fieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Password Strength Indicator */}
                {values.password && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 0.5 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Password Strength</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: strengthColor }}>
                          {strength <= 25 ? "Weak" : strength <= 50 ? "Fair" : strength <= 75 ? "Good" : "Strong"}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={strength}
                        sx={{
                          height: 5,
                          borderRadius: 2,
                          bgcolor: "rgba(0,0,0,0.06)",
                          "& .MuiLinearProgress-bar": { bgcolor: strengthColor },
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>

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
                  {loading ? "Creating account..." : "Complete Registration"}
                </GradientButton>
              </motion.div>
            </Form>
          );
        }}
      </Formik>
    </AuthShell>
  );
}
