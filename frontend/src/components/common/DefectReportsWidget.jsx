import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Skeleton,
  CircularProgress,
  Stack,
  useTheme,
  Fade,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { toast } from "react-toastify";
import { defectApi } from "../../api/axios";
import { useSocket } from "../../hooks/useSocket";
import { formatDate, formatDateTime, timeAgo, getMediaUrl } from "../../utils/helpers";
import GlassCard from "./GlassCard";
import EmptyState from "./EmptyState";

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "#DC2626",
    bg: "rgba(220, 38, 38, 0.12)",
    border: "rgba(220, 38, 38, 0.3)",
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
  },
  major: {
    label: "Major",
    color: "#EA580C",
    bg: "rgba(234, 88, 12, 0.12)",
    border: "rgba(234, 88, 12, 0.3)",
    icon: <ReportProblemOutlinedIcon sx={{ fontSize: 14 }} />,
  },
  minor: {
    label: "Minor",
    color: "#2C8C8C",
    bg: "rgba(44, 140, 140, 0.12)",
    border: "rgba(44, 140, 140, 0.3)",
    icon: <InfoOutlinedIcon sx={{ fontSize: 14 }} />,
  },
};

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.12)",
    border: "rgba(217, 119, 6, 0.3)",
  },
  reviewed: {
    label: "Reviewed",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.12)",
    border: "rgba(37, 99, 235, 0.3)",
  },
  resolved: {
    label: "Resolved",
    color: "#16A34A",
    bg: "rgba(22, 163, 74, 0.12)",
    border: "rgba(22, 163, 74, 0.3)",
  },
};

export default function DefectReportsWidget({
  initialDefects = null,
  title = "Employee Defect Reports",
  subtitle = "Live garment defect logs & inspection photos reported from active workstations",
  limit = 8,
  role = "admin",
}) {
  const theme = useTheme();
  const { socket } = useSocket();
  const [defects, setDefects] = useState(initialDefects || []);
  const [loading, setLoading] = useState(!initialDefects || initialDefects.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Asynchronous defect reports fetcher (Non-blocking)
  const fetchDefects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await defectApi.getAll({ limit });
      const list = res.data?.data || res.data || [];
      setDefects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to load defect reports:", err);
      // Fall back gracefully if error occurs
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const handleNewDefect = (newReport) => {
      if (!newReport || !newReport._id) return;
      setDefects((prev) => {
        const exists = prev.some((d) => d._id === newReport._id);
        if (exists) return prev;
        return [newReport, ...prev];
      });
      toast.info(
        `New ${newReport.garmentType || "garment"} defect reported by ${
          newReport.employee?.profile?.firstName || "employee"
        }`
      );
    };

    const handleStatusUpdate = (updatedReport) => {
      if (!updatedReport || !updatedReport._id) return;
      setDefects((prev) =>
        prev.map((d) => (d._id === updatedReport._id ? { ...d, ...updatedReport } : d))
      );
      if (selectedDefect && selectedDefect._id === updatedReport._id) {
        setSelectedDefect((prev) => ({ ...prev, ...updatedReport }));
      }
    };

    socket.on("new_defect_report", handleNewDefect);
    socket.on("defect_status_updated", handleStatusUpdate);

    return () => {
      if (socket && typeof socket.off === "function") {
        socket.off("new_defect_report", handleNewDefect);
        socket.off("defect_status_updated", handleStatusUpdate);
      }
    };
  }, [socket, selectedDefect]);

  // Handle Status Update (Reviewed / Resolved)
  const handleUpdateStatus = async (defectId, nextStatus) => {
    setUpdatingId(defectId);
    try {
      await defectApi.updateStatus(defectId, { status: nextStatus });
      setDefects((prev) =>
        prev.map((d) => (d._id === defectId ? { ...d, status: nextStatus } : d))
      );
      if (selectedDefect && selectedDefect._id === defectId) {
        setSelectedDefect((prev) => ({ ...prev, status: nextStatus }));
      }
      toast.success(`Defect report marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update defect status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter defects
  const filteredDefects = defects.filter((d) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "open") return d.status === "open";
    if (activeFilter === "critical") return d.severity === "critical";
    if (activeFilter === "resolved") return d.status === "resolved";
    return true;
  });

  const openCount = defects.filter((d) => d.status !== "resolved").length;

  return (
    <GlassCard sx={{ border: "1px solid rgba(89,23,27,0.12)", p: { xs: 2, sm: 2.75 } }}>
      {/* Header Bar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={1.5}
        mb={2.5}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #59171B, #A45A4A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FED7B8",
              boxShadow: "0 4px 12px rgba(89,23,27,0.25)",
              flexShrink: 0,
            }}
          >
            <BugReportIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.01em", fontSize: "1.05rem" }}>
                {title}
              </Typography>
              {openCount > 0 && (
                <Chip
                  label={`${openCount} open`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10.5,
                    fontWeight: 700,
                    bgcolor: "rgba(220,38,38,0.12)",
                    color: "#DC2626",
                    border: "1px solid rgba(220,38,38,0.25)",
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {/* Filter Pills & Refresh */}
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Stack direction="row" spacing={0.6}>
            {[
              { id: "all", label: "All" },
              { id: "open", label: "Open" },
              { id: "critical", label: "Critical" },
              { id: "resolved", label: "Resolved" },
            ].map((tab) => (
              <Chip
                key={tab.id}
                label={tab.label}
                size="small"
                onClick={() => setActiveFilter(tab.id)}
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  bgcolor: activeFilter === tab.id ? "#59171B" : "rgba(89,23,27,0.06)",
                  color: activeFilter === tab.id ? "#FFF" : "text.secondary",
                  "&:hover": {
                    bgcolor: activeFilter === tab.id ? "#7A2328" : "rgba(89,23,27,0.12)",
                  },
                }}
              />
            ))}
          </Stack>

          <Tooltip title="Refresh Defect Logs">
            <IconButton
              size="small"
              onClick={() => fetchDefects(true)}
              disabled={refreshing}
              sx={{
                color: "#59171B",
                bgcolor: "rgba(89,23,27,0.06)",
                "&:hover": { bgcolor: "rgba(89,23,27,0.12)" },
              }}
            >
              <RefreshIcon sx={{ fontSize: 16, animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Box
                sx={{
                  border: "1px solid rgba(89,23,27,0.08)",
                  borderRadius: 2.5,
                  p: 1.5,
                  bgcolor: "rgba(255,255,255,0.4)",
                }}
              >
                <Skeleton variant="rounded" height={130} sx={{ mb: 1.5, borderRadius: 2 }} />
                <Skeleton width="60%" height={20} sx={{ mb: 0.5 }} />
                <Skeleton width="90%" height={16} sx={{ mb: 1 }} />
                <Skeleton width="40%" height={24} />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : filteredDefects.length === 0 ? (
        <EmptyState
          icon={<CheckCircleOutlineIcon sx={{ color: "#16A34A" }} />}
          title={activeFilter === "all" ? "No defect reports logged" : `No ${activeFilter} defect reports`}
          message="Quality inspection is clear. When atelier operators upload flaw pictures, they will stream live here."
        />
      ) : (
        <Grid container spacing={2}>
          {filteredDefects.map((defect) => {
            const sev = SEVERITY_CONFIG[defect.severity] || SEVERITY_CONFIG.minor;
            const stat = STATUS_CONFIG[defect.status] || STATUS_CONFIG.open;
            const photoUrl = defect.photo ? getMediaUrl(defect.photo) : null;
            const empName =
              `${defect.employee?.profile?.firstName || ""} ${defect.employee?.profile?.lastName || ""}`.trim() ||
              defect.employee?.email ||
              "Employee";
            const empDept = defect.employee?.profile?.department || "Sewing Line";

            return (
              <Grid item xs={12} sm={6} md={3} key={defect._id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "14px",
                    border: "1px solid rgba(89,23,27,0.12)",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(254,215,184,0.04)" : "#FFFFFF",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 24px rgba(89,23,27,0.12)",
                      borderColor: "rgba(89,23,27,0.3)",
                    },
                  }}
                >
                  {/* Photo Thumbnail Container */}
                  <Box
                    sx={{
                      position: "relative",
                      height: 135,
                      bgcolor: "rgba(89,23,27,0.04)",
                      overflow: "hidden",
                      cursor: photoUrl ? "pointer" : "default",
                    }}
                    onClick={() => photoUrl && setSelectedDefect(defect)}
                  >
                    {photoUrl ? (
                      <CardMedia
                        component="img"
                        height="135"
                        image={photoUrl}
                        alt="Defect photo"
                        sx={{
                          objectFit: "cover",
                          transition: "transform 0.4s ease",
                          "&:hover": { transform: "scale(1.06)" },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                          p: 2,
                          textAlign: "center",
                        }}
                      >
                        <ImageNotSupportedOutlinedIcon sx={{ fontSize: 32, opacity: 0.4, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.7 }}>
                          No Photo Uploaded
                        </Typography>
                      </Box>
                    )}

                    {/* Floating Status Badge (Top-Left) */}
                    <Chip
                      label={stat.label}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: stat.bg,
                        color: stat.color,
                        border: `1px solid ${stat.border}`,
                        backdropFilter: "blur(6px)",
                      }}
                    />

                    {/* Floating Severity Badge (Top-Right) */}
                    <Chip
                      icon={sev.icon}
                      label={sev.label}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: sev.bg,
                        color: sev.color,
                        border: `1px solid ${sev.border}`,
                        backdropFilter: "blur(6px)",
                        "& .MuiChip-icon": { color: sev.color, ml: 0.4 },
                      }}
                    />

                    {/* Photo Inspect Overlay Pill */}
                    {photoUrl && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          bgcolor: "rgba(0,0,0,0.65)",
                          color: "#FFF",
                          px: 0.9,
                          py: 0.3,
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        <ZoomInIcon sx={{ fontSize: 12 }} /> Zoom
                      </Box>
                    )}
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ p: 1.75, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    {/* Garment Type & Time */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={0.6}>
                        <CheckroomIcon sx={{ fontSize: 15, color: "#59171B" }} />
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize", fontSize: 12.5 }}>
                          {defect.garmentType}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: 10.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 11 }} />
                        {timeAgo(defect.createdAt)}
                      </Typography>
                    </Box>

                    {/* Description */}
                    <Tooltip title={defect.description}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: 12,
                          lineHeight: 1.45,
                          mb: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          flexGrow: 1,
                        }}
                      >
                        {defect.description}
                      </Typography>
                    </Tooltip>

                    {/* Reporter Info */}
                    <Box display="flex" alignItems="center" gap={1} mb={1.5} pt={1} sx={{ borderTop: "1px dashed rgba(89,23,27,0.08)" }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 10,
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #59171B, #A45A4A)",
                          color: "#FED7B8",
                        }}
                      >
                        {empName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box minWidth={0} flex={1}>
                        <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block", fontSize: 11 }}>
                          {empName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontSize: 9.5 }}>
                          {empDept}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Quick Action Buttons */}
                    <Box display="flex" gap={0.8} mt="auto">
                      {defect.status === "open" && (
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          disabled={updatingId === defect._id}
                          onClick={() => handleUpdateStatus(defect._id, "reviewed")}
                          startIcon={<FindInPageIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            fontSize: 10.5,
                            py: 0.4,
                            textTransform: "none",
                            fontWeight: 700,
                            borderColor: "rgba(37, 99, 235, 0.4)",
                            color: "#2563EB",
                            "&:hover": { borderColor: "#2563EB", bgcolor: "rgba(37, 99, 235, 0.06)" },
                          }}
                        >
                          Review
                        </Button>
                      )}

                      {defect.status !== "resolved" ? (
                        <Button
                          size="small"
                          variant="contained"
                          fullWidth
                          disabled={updatingId === defect._id}
                          onClick={() => handleUpdateStatus(defect._id, "resolved")}
                          startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            fontSize: 10.5,
                            py: 0.4,
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: "#16A34A",
                            color: "#FFF",
                            "&:hover": { bgcolor: "#15803D" },
                          }}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="text"
                          fullWidth
                          onClick={() => setSelectedDefect(defect)}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{ fontSize: 10.5, py: 0.4, textTransform: "none", color: "text.secondary" }}
                        >
                          View Details
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Enlarged Defect Inspection Modal / Lightbox */}
      <Dialog
        open={Boolean(selectedDefect)}
        onClose={() => setSelectedDefect(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "#1E1A1A" : "#FFF8F2"),
            p: 1,
            overflow: "hidden",
          },
        }}
      >
        {selectedDefect && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    bgcolor: "rgba(89,23,27,0.08)",
                    color: "#59171B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BugReportIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Defect Inspection #{selectedDefect._id?.slice(-6).toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Logged on {formatDateTime(selectedDefect.createdAt)}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setSelectedDefect(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2.5 }}>
              <Grid container spacing={3}>
                {/* Photo Column */}
                <Grid item xs={12} md={7}>
                  {selectedDefect.photo ? (
                    <Box
                      sx={{
                        width: "100%",
                        maxHeight: 380,
                        borderRadius: "12px",
                        overflow: "hidden",
                        bgcolor: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Box
                        component="img"
                        src={getMediaUrl(selectedDefect.photo)}
                        alt="Defect Inspection"
                        sx={{
                          width: "100%",
                          height: "100%",
                          maxHeight: 380,
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 260,
                        borderRadius: "12px",
                        bgcolor: "rgba(89,23,27,0.04)",
                        border: "1px dashed rgba(89,23,27,0.2)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                      }}
                    >
                      <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No photograph attached to this report
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Details Column */}
                <Grid item xs={12} md={5}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {/* Status & Severity */}
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={`Status: ${selectedDefect.status?.toUpperCase()}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: STATUS_CONFIG[selectedDefect.status]?.bg,
                          color: STATUS_CONFIG[selectedDefect.status]?.color,
                          border: `1px solid ${STATUS_CONFIG[selectedDefect.status]?.border}`,
                        }}
                      />
                      <Chip
                        icon={SEVERITY_CONFIG[selectedDefect.severity]?.icon}
                        label={`Severity: ${selectedDefect.severity?.toUpperCase()}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: SEVERITY_CONFIG[selectedDefect.severity]?.bg,
                          color: SEVERITY_CONFIG[selectedDefect.severity]?.color,
                          border: `1px solid ${SEVERITY_CONFIG[selectedDefect.severity]?.border}`,
                          "& .MuiChip-icon": { color: SEVERITY_CONFIG[selectedDefect.severity]?.color },
                        }}
                      />
                    </Box>

                    {/* Garment Type */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                        GARMENT TYPE
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ textTransform: "capitalize", color: "#59171B" }}>
                        {selectedDefect.garmentType}
                      </Typography>
                    </Box>

                    {/* Description */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                        DEFECT DESCRIPTION
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6, bgcolor: "rgba(0,0,0,0.02)", p: 1.5, borderRadius: "8px" }}>
                        {selectedDefect.description}
                      </Typography>
                    </Box>

                    {/* Reporter Details */}
                    <Box sx={{ pt: 1, borderTop: "1px solid rgba(89,23,27,0.08)" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.75 }}>
                        REPORTED BY
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1.2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            background: "linear-gradient(135deg, #59171B, #A45A4A)",
                            color: "#FED7B8",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {(selectedDefect.employee?.profile?.firstName?.[0] || "E").toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {`${selectedDefect.employee?.profile?.firstName || ""} ${
                              selectedDefect.employee?.profile?.lastName || ""
                            }`.trim() || selectedDefect.employee?.email || "Employee"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedDefect.employee?.profile?.department || "Sewing Line"} · ID:{" "}
                            {selectedDefect.employee?.profile?.employeeId || selectedDefect.employee?._id?.slice(-4)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
              <Button onClick={() => setSelectedDefect(null)} sx={{ textTransform: "none", color: "text.secondary" }}>
                Close
              </Button>
              <Box display="flex" gap={1}>
                {selectedDefect.status === "open" && (
                  <Button
                    variant="outlined"
                    onClick={() => handleUpdateStatus(selectedDefect._id, "reviewed")}
                    disabled={updatingId === selectedDefect._id}
                    startIcon={<FindInPageIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#2563EB", color: "#2563EB" }}
                  >
                    Mark Reviewed
                  </Button>
                )}
                {selectedDefect.status !== "resolved" && (
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateStatus(selectedDefect._id, "resolved")}
                    disabled={updatingId === selectedDefect._id}
                    startIcon={<CheckCircleOutlineIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#16A34A", color: "#FFF", "&:hover": { bgcolor: "#15803D" } }}
                  >
                    Mark Resolved
                  </Button>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </GlassCard>
  );
}
