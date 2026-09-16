import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fab,
  Slide,
  FormControlLabel,
  Switch,
  FormHelperText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import { toast } from "react-toastify";
import { learningVideoApi, employeeApi } from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import GradientButton from "../../components/common/GradientButton";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { formatDate } from "../../utils/helpers";

const extractVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const SlideTransition = React.forwardRef(function SlideTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function LearningVideos() {
  const [videos, setVideos] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    assignedTo: [],
    assignToAll: false,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await learningVideoApi.list({ limit: 100 });
      const data = res.data?.data || [];
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load videos:", err);
      toast.error("Failed to load learning videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await employeeApi.list({ limit: 100 });
      const data = res.data?.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadVideos();
    loadEmployees();
  }, [loadVideos, loadEmployees]);

  const handleOpenCreate = () => {
    setEditVideo(null);
    setFormData({ title: "", url: "", description: "", assignedTo: [], assignToAll: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (video) => {
    setEditVideo(video);
    setFormData({
      title: video.title || "",
      url: video.url || "",
      description: video.description || "",
      assignedTo: video.assignedTo || [],
      assignToAll: video.assignToAll === true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditVideo(null);
  };

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }

    const videoId = extractVideoId(formData.url);
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        url: formData.url.trim(),
        videoId,
        description: formData.description.trim(),
        assignedTo: formData.assignToAll ? [] : formData.assignedTo,
        assignToAll: formData.assignToAll,
      };

      if (editVideo) {
        await learningVideoApi.update(editVideo._id, payload);
        toast.success("Video updated successfully");
      } else {
        await learningVideoApi.create(payload);
        toast.success("Video created successfully");
      }
      handleCloseDialog();
      loadVideos();
    } catch (err) {
      console.error("Failed to save video:", err);
      toast.error(err.response?.data?.message || "Failed to save video");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (video) => {
    setDeleteTarget(video);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await learningVideoApi.delete(deleteTarget._id);
      toast.success("Video deleted successfully");
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      loadVideos();
    } catch (err) {
      console.error("Failed to delete video:", err);
      toast.error(err.response?.data?.message || "Failed to delete video");
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedEmployees = employees.filter((emp) =>
    formData.assignedTo.includes(emp._id)
  );

  const formVideoId = extractVideoId(formData.url);

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e._id === id);
    if (emp) {
      return emp.firstName && emp.lastName
        ? `${emp.firstName} ${emp.lastName}`
        : emp.name || emp.email || id;
    }
    return id;
  };

  const isAssignedToAll = (video) => {
    return video.assignToAll === true;
  };

  return (
    <Box>
      <PageHeader
        title="Training & SOP Academy"
        subtitle="Manage instructional videos, equipment operating procedures, and worker skill modules."
        badge="Knowledge Base"
        actions={
          <GradientButton icon={<AddIcon />} onClick={handleOpenCreate}>
            Add Training Video
          </GradientButton>
        }
      />

      {/* FAB for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleOpenCreate}
          sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 10 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Loading state */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={isMobile ? 180 : 200} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={28} />
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={<PlayCircleIcon sx={{ fontSize: 60, color: 'primary.main' }} />}
          title="No Learning Videos Yet"
          description="Build out your training curriculum by adding SOP walkthroughs and safety guidelines."
          actionText="Add First Video"
          onAction={handleOpenCreate}
        />
      ) : (
        /* Video grid */
        <Grid container spacing={2}>
          {videos.map((video) => {
            const videoId = extractVideoId(video.url || video.videoUrl);
            const assignedToAll = isAssignedToAll(video);
            return (
              <Grid item xs={12} sm={6} md={4} key={video._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: (t) => t.shadows[8] },
                  }}
                >
                  {/* Embedded YouTube Player */}
                  {videoId ? (
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "56.25%",
                        bgcolor: "#000",
                      }}
                    >
                      <iframe
                        title={video.title}
                        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        paddingTop: "56.25%",
                        bgcolor: "grey.900",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                      >
                        Invalid URL
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", pb: 0, px: { xs: 1.5, sm: 2 } }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap fontSize={{ xs: "0.95rem", sm: "1rem" }}>
                      {video.title}
                    </Typography>
                    {video.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        {video.description}
                      </Typography>
                    )}
                    <Box display="flex" alignItems="center" gap={1} mt="auto" flexWrap="wrap">
                      {assignedToAll ? (
                        <Chip
                          icon={<GroupsIcon sx={{ fontSize: 14 }} />}
                          label="All Employees"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: { xs: 20, sm: 22 }, "& .MuiChip-label": { fontSize: { xs: 10, sm: 11 }, px: 0.6 } }}
                        />
                      ) : video.assignedTo && video.assignedTo.length > 0 ? (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                            To:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.3}>
                            {video.assignedTo.slice(0, 3).map((id) => (
                              <Chip
                                key={id}
                                label={getEmployeeName(id)}
                                size="small"
                                variant="outlined"
                                sx={{ height: { xs: 20, sm: 22 }, "& .MuiChip-label": { fontSize: { xs: 10, sm: 11 }, px: 0.6 } }}
                              />
                            ))}
                            {video.assignedTo.length > 3 && (
                              <Chip
                                label={`+${video.assignedTo.length - 3}`}
                                size="small"
                                sx={{ height: { xs: 20, sm: 22 }, "& .MuiChip-label": { fontSize: { xs: 10, sm: 11 }, px: 0.6 } }}
                              />
                            )}
                          </Box>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                          No assignments
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1.5 }, pt: 0.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <Chip
                        label={formatDate(video.createdAt)}
                        size="small"
                        variant="outlined"
                        sx={{ height: { xs: 20, sm: 22 }, "& .MuiChip-label": { fontSize: { xs: 10, sm: 11 } } }}
                      />
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(video)} sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: 18, sm: 20 } } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(video)}
                            color="error"
                            sx={{ "& .MuiSvgIcon-root": { fontSize: { xs: 18, sm: 20 } } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create / Edit Dialog - fullscreen on mobile */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? SlideTransition : undefined}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PlayCircleIcon color="primary" />
            {editVideo ? "Edit Video" : "Add Video"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={handleFormChange("title")}
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              label="YouTube URL"
              fullWidth
              required
              value={formData.url}
              onChange={handleFormChange("url")}
              placeholder="https://www.youtube.com/watch?v=..."
              size={isMobile ? "small" : "medium"}
            />

            {/* Live embed preview */}
            {formVideoId && (
              <Card variant="outlined" sx={{ overflow: "hidden" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "56.25%",
                    bgcolor: "#000",
                  }}
                >
                  <iframe
                    title="Preview"
                    src={`https://www.youtube.com/embed/${formVideoId}?rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                </Box>
              </Card>
            )}

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={isMobile ? 2 : 3}
              value={formData.description}
              onChange={handleFormChange("description")}
              size={isMobile ? "small" : "medium"}
            />

            {/* Assign to All Employees Toggle */}
            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: formData.assignToAll ? "primary.main" : "divider",
                transition: "border-color 0.2s",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.assignToAll}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignToAll: e.target.checked,
                        assignedTo: e.target.checked ? [] : prev.assignedTo,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Assign to All Employees
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When enabled, every employee can see this video
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Individual employee selection - disabled when "Assign to All" is checked */}
            {!formData.assignToAll && (
              <Autocomplete
                multiple
                options={employees}
                value={selectedEmployees}
                getOptionLabel={(option) =>
                  option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : option.name || option.email || option._id
                }
                isOptionEqualToValue={(option, value) => option._id === value._id}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: newValue.map((emp) => emp._id),
                  }));
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox checked={selected} sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2">
                        {option.firstName && option.lastName
                          ? `${option.firstName} ${option.lastName}`
                          : option.name || option.email || option._id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email || ""}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      label={
                        option.firstName && option.lastName
                          ? `${option.firstName} ${option.lastName}`
                          : option.name || option.email || option._id
                      }
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign to Individual Employees"
                    placeholder="Search employees..."
                    size={isMobile ? "small" : "medium"}
                    helperText={selectedEmployees.length > 0 ? `${selectedEmployees.length} employee(s) selected` : ""}
                  />
                )}
              />
            )}

            {formData.assignToAll && (
              <FormHelperText sx={{ textAlign: "center", color: "primary.main", fontWeight: 500 }}>
                ✓ This video will be visible to all employees
              </FormHelperText>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 1 } }}>
          <Button onClick={handleCloseDialog} disabled={formSubmitting} size={isMobile ? "small" : "medium"}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={formSubmitting}
            size={isMobile ? "small" : "medium"}
          >
            {formSubmitting
              ? "Saving..."
              : editVideo
                ? "Update"
                : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Video"
        message={`Are you sure you want to delete "${deleteTarget?.title || "this video"}"?`}
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
}
