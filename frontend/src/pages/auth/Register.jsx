import React from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  MenuItem,
  Link,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const validationSchema = yup.object({
  firstName: yup.string().required("Required"),
  lastName: yup.string().required("Required"),
  email: yup.string().email("Invalid email").required("Required"),
  password: yup.string().min(6, "Min 6 characters").required("Required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Required"),
  role: yup.string().required("Required"),
});

const roles = [
  { value: ROLES.ADMIN, label: "Admin" },
  { value: ROLES.MANAGER, label: "Manager" },
  { value: ROLES.EMPLOYEE, label: "Employee" },
];

export default function Register() {
  const { register } = useAuth();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setError(null);
    setLoading(true);
    try {
      const result = await register({
        email: values.email,
        password: values.password,
        role: values.role,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          employeeId: `EMP-${Date.now()}`,
        },
      });
      toast.success("User registered successfully. Please login.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "#0a0a1a",
        py: 4,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${new URL('../../images/garment4.webp', import.meta.url).href})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.35) saturate(1.1)",
          transform: "scale(1.05)",
          animation: "slowPan 25s ease-in-out infinite alternate",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(10,10,30,0.9) 0%, rgba(20,15,50,0.55) 50%, rgba(10,10,30,0.9) 100%)",
          zIndex: 1,
        },
      }}
    >
      {/* Animated gradient orbs */}
      <Box
        sx={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          top: "5%",
          right: "10%",
          animation: "drift 10s ease-in-out infinite alternate",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          bottom: "10%",
          left: "5%",
          animation: "drift 12s ease-in-out infinite alternate-reverse",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          animation: "drift 8s ease-in-out infinite alternate",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <style>{`
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.3); }
        }
        @keyframes slowPan {
          0% { transform: scale(1) translateX(0); }
          100% { transform: scale(1.1) translateX(-2%); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.1); }
          50% { box-shadow: 0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(139,92,246,0.2); }
        }
      `}</style>

      <Card
        sx={{
          maxWidth: 560,
          width: "100%",
          mx: 2,
          position: "relative",
          zIndex: 3,
          bgcolor: "rgba(18, 18, 40, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          animation: "glowPulse 4s ease-in-out infinite",
          "&:hover": {
            border: "1px solid rgba(139, 92, 246, 0.4)",
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
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                boxShadow: "0 0 30px rgba(139,92,246,0.3)",
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#fff">
                G
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={700} color="#fff">
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Register a new user account
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor: "rgba(211,47,47,0.15)",
                color: "#ef5350",
                border: "1px solid rgba(211,47,47,0.3)",
              }}
            >
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Role"
                      name="role"
                      select
                      value={values.role}
                      onChange={handleChange}
                      error={touched.role && !!errors.role}
                      helperText={touched.role && errors.role}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
                    >
                      {roles.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Password"
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.password && !!errors.password}
                      helperText={touched.password && errors.password}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.confirmPassword && !!errors.confirmPassword
                      }
                      helperText={
                        touched.confirmPassword && errors.confirmPassword
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#fff",
                          "& fieldset": { borderColor: "rgba(139,92,246,0.3)" },
                          "&:hover fieldset": {
                            borderColor: "rgba(139,92,246,0.5)",
                          },
                          "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                        },
                        "& .MuiInputLabel-root": {
                          color: "rgba(255,255,255,0.5)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: "#8b5cf6",
                        },
                        "& .MuiFormHelperText-root": { color: "#ef5350" },
                      }}
                    />
                  </Grid>
                </Grid>
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
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    boxShadow: "0 0 20px rgba(139,92,246,0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #7c3aed, #db2777)",
                      boxShadow: "0 0 30px rgba(139,92,246,0.5)",
                    },
                  }}
                >
                  {loading ? "Creating..." : "Register"}
                </Button>
                <Box textAlign="center">
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    Already have an account?{" "}
                    <Link
                      component="button"
                      onClick={() => navigate("/login")}
                      underline="hover"
                      sx={{ color: "#8b5cf6", "&:hover": { color: "#a78bfa" } }}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
}
