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
} from "@mui/material";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

const roles = [
  { value: ROLES.ADMIN, label: "Administrator (Requires Passcode)" },
  { value: ROLES.MANAGER, label: "Manager (Requires Admin Approval)" },
  { value: ROLES.EMPLOYEE, label: "Employee (Direct Access)" },
];

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
      const res = await register({
        email: values.email,
        password: values.password,
        role: values.role,
        adminSecurityCode: values.role === ROLES.ADMIN ? values.adminSecurityCode : undefined,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          employeeId: `EMP-${Date.now()}`,
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
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <Grid container spacing={2}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Account Role"
                  name="role"
                  select
                  value={values.role}
                  onChange={handleChange}
                  error={touched.role && !!errors.role}
                  helperText={touched.role && errors.role}
                  sx={fieldSx}
                >
                  {roles.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Admin Secret Passcode Field */}
              {values.role === ROLES.ADMIN && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: "rgba(89,23,27,0.06)",
                      border: "1.5px dashed #59171B",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AdminPanelSettingsIcon sx={{ color: "primary.main", fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        Admin Secret Passcode Required
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Admin Secret Security Code"
                      name="adminSecurityCode"
                      type={showAdminCode ? "text" : "password"}
                      value={values.adminSecurityCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter secret code (ADMIN2026)"
                      error={touched.adminSecurityCode && !!errors.adminSecurityCode}
                      helperText={
                        (touched.adminSecurityCode && errors.adminSecurityCode) ||
                        "Secret authorization code required to register Administrator accounts"
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
                </Grid>
              )}

              {/* Manager Approval Notice */}
              {values.role === ROLES.MANAGER && (
                <Grid item xs={12}>
                  <Alert
                    severity="info"
                    icon={<SupervisorAccountIcon fontSize="inherit" />}
                    sx={{ borderRadius: 2, bgcolor: "rgba(8,145,178,0.08)", color: "#0e7490", border: "1px solid rgba(8,145,178,0.2)" }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                      Manager Account Approval Notice:
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 11.5 }}>
                      Manager accounts require Administrator authorization. After registering, your account will be placed in <strong>Pending Approval</strong> until an Admin activates your profile.
                    </Typography>
                  </Alert>
                </Grid>
              )}

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
            </Grid>

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
              {loading ? "Creating account..." : "Complete Registration"}
            </GradientButton>
          </Form>
        )}
      </Formik>
    </AuthShell>
  );
}
