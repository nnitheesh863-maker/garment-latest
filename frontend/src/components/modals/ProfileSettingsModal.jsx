import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Chip,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SaveIcon from "@mui/icons-material/Save";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../api/axios";
import { toast } from "react-toastify";
import { getInitials } from "../../utils/helpers";
import GradientButton from "../common/GradientButton";

const MAROON = "#59171B";
const CREAM_BG = "#FFF8F2";
const BORDER = "#F1D5C0";

const DEPARTMENTS = [
  "Sewing",
  "Cutting",
  "Quality Assurance",
  "Finishing",
  "Packaging",
  "Maintenance",
  "Management",
  "Warehouse",
  "Design & Sampling",
];

const POSITIONS = [
  "Sewing Operator",
  "Senior Operator",
  "Line Supervisor",
  "Quality Inspector",
  "Cutting Master",
  "Finishing Specialist",
  "Maintenance Technician",
  "Production Lead",
  "Operator",
];

// Helper to compress image before sending to prevent huge payloads
function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function ProfileSettingsModal({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Profile fields state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      const prof = user.profile || {};
      setFirstName(prof.firstName || user.firstName || "");
      setLastName(prof.lastName || user.lastName || "");
      setContactNumber(prof.contactNumber || user.contactNumber || user.phone || "");
      setDepartment(prof.department || user.department || "");
      setPosition(prof.position || user.position || user.designation || "");
      setEmployeeId(prof.employeeId || user.employeeId || "");
      setProfileImage(prof.profileImage || user.profileImage || "");
      setTabIndex(0);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, user]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setProfileImage(compressedBase64);
      toast.info("Photo selected! Click 'Save Profile' to apply changes.");
    } catch (err) {
      console.error("Error reading image:", err);
      toast.error("Failed to process selected image.");
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Photo removed! Click 'Save Profile' to apply changes.");
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        contactNumber: contactNumber.trim(),
        department: department.trim(),
        position: position.trim(),
        employeeId: employeeId.trim(),
        profileImage: profileImage || null,
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactNumber: contactNumber.trim(),
          department: department.trim(),
          position: position.trim(),
          employeeId: employeeId.trim(),
          profileImage: profileImage || null,
        },
      };

      const res = await authApi.updateProfile(payload);
      const updatedUser = res.data?.data || res.data;

      if (updatedUser) {
        updateUser(updatedUser);
      }
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault?.();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPass(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPass(false);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim() || user?.email || "Employee";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(89,23,27,0.2)",
          border: `1px solid ${BORDER}`,
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #59171B 0%, #7A2328 60%, #A45A4A 100%)",
          color: "#fff",
          p: 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            color: "rgba(255,255,255,0.85)",
            "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box display="flex" alignItems="center" gap={2.5}>
          {/* Profile Picture with Upload Overlay */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profileImage || undefined}
              alt={fullName}
              sx={{
                width: 78,
                height: 78,
                bgcolor: "rgba(254,215,184,0.3)",
                color: "#FED7B8",
                fontSize: 28,
                fontWeight: 800,
                border: "3px solid #FED7B8",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              {getInitials(fullName)}
            </Avatar>
            <Tooltip title="Upload new photo">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "#59171B",
                  color: "#FED7B8",
                  border: "2px solid #FED7B8",
                  p: 0.6,
                  "&:hover": { bgcolor: "#7A2328", transform: "scale(1.1)" },
                  transition: "all 0.2s",
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700} noWrap>
                {fullName}
              </Typography>
              <Chip
                label={(user?.role || "employee").toUpperCase()}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.4 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75, display: "block" }}>
              {position ? `${position} \u2022 ` : ""}{department ? `${department} Dept` : "Production Team"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: "none" }}
      />

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: `1px solid ${BORDER}`, px: 2, bgcolor: CREAM_BG }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: 13.5,
              textTransform: "none",
              minHeight: 48,
              color: "#7A6A63",
              "&.Mui-selected": { color: MAROON },
            },
            "& .MuiTabs-indicator": { bgcolor: MAROON, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Profile Information" />
          <Tab icon={<LockResetIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Security & Password" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#fff" }}>
        {tabIndex === 0 && (
          <Box component="form" onSubmit={handleSaveProfile}>
            {/* Photo Action Row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: CREAM_BG,
                p: 1.75,
                borderRadius: 2.5,
                border: `1px solid ${BORDER}`,
                mb: 3,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  src={profileImage || undefined}
                  sx={{ width: 42, height: 42, bgcolor: MAROON, color: "#FED7B8", fontWeight: 700 }}
                >
                  {getInitials(fullName)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    Profile Picture
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG or WEBP (Max 5MB)
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderColor: MAROON,
                    color: MAROON,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    "&:hover": { borderColor: MAROON, bgcolor: "rgba(89,23,27,0.06)" },
                  }}
                >
                  Change
                </Button>
                {profileImage && (
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={handleRemovePhoto}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  size="small"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={user?.email || ""}
                  disabled
                  size="small"
                  helperText="Email is managed by administrator"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                  {department && !DEPARTMENTS.includes(department) && (
                    <MenuItem value={department}>{department}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Position / Role"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                >
                  {POSITIONS.map((pos) => (
                    <MenuItem key={pos} value={pos}>
                      {pos}
                    </MenuItem>
                  ))}
                  {position && !POSITIONS.includes(position) && (
                    <MenuItem value={position}>{position}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employee ID / Badge Number"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  size="small"
                  placeholder="e.g. EMP-1042"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box component="form" onSubmit={handleChangePassword}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Update your account password. Choose a strong password with at least 6 characters.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  size="small"
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          edge="end"
                        >
                          {showCurrentPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="small"
                  required
                  helperText="Minimum 6 characters"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowNewPass(!showNewPass)}
                          edge="end"
                        >
                          {showNewPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="small"
                  required
                  error={Boolean(confirmPassword && newPassword !== confirmPassword)}
                  helperText={
                    confirmPassword && newPassword !== confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          edge="end"
                        >
                          {showConfirmPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: CREAM_BG, borderTop: `1px solid ${BORDER}` }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
          Cancel
        </Button>
        {tabIndex === 0 ? (
          <GradientButton
            variant="maroon"
            onClick={handleSaveProfile}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ px: 3, py: 0.9 }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </GradientButton>
        ) : (
          <GradientButton
            variant="maroon"
            onClick={handleChangePassword}
            disabled={changingPass}
            startIcon={changingPass ? <CircularProgress size={16} color="inherit" /> : <LockResetIcon />}
            sx={{ px: 3, py: 0.9 }}
          >
            {changingPass ? "Updating..." : "Update Password"}
          </GradientButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
