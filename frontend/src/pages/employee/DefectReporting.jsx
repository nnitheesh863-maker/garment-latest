import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { defectApi } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { formatDate, formatDateTime, getStatusColor } from "../../utils/helpers";
import PageHeader from "../../components/common/PageHeader";
import GradientButton from "../../components/common/GradientButton";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/common/DataTable";

const GARMENT_TYPES = ["shirt", "t-shirt", "pant", "other"];

export default function DefectReporting() {
  const { user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    garmentType: "",
    description: "",
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dialogPhoto, setDialogPhoto] = useState(null);

  const loadDefects = useCallback(async () => {
    try {
      const res = await defectApi.getMy();
      setDefects(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load defect reports:", err);
      toast.error("Failed to load defect reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDefects();
  }, [loadDefects]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.garmentType) {
      toast.error("Please select a garment type");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please describe the defect");
      return;
    }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("garmentType", formData.garmentType);
      formPayload.append("description", formData.description);
      if (formData.photo) {
        formPayload.append("photo", formData.photo);
      }

      await defectApi.create(formPayload);

      setFormData({ garmentType: "", description: "", photo: null });
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      toast.success("Defect reported successfully");
      loadDefects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report defect");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoClick = (photoUrl) => {
    setDialogPhoto(photoUrl);
  };

  const columns = [
    {
      id: "garmentType",
      label: "Garment Type",
      render: (val) => (
        <Chip label={val || "N/A"} size="small" variant="outlined" />
      ),
    },
    {
      id: "description",
      label: "Description",
      render: (val) => (
        <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>
          {val || "-"}
        </Typography>
      ),
    },
    {
      id: "photo",
      label: "Photo",
      sortable: false,
      render: (val) =>
        val ? (
          <Avatar
            src={val}
            alt="Defect"
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              cursor: "pointer",
              border: "1px solid",
              borderColor: "divider",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePhotoClick(val);
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No photo
          </Typography>
        ),
    },
    {
      id: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val} size="small" />,
    },
    {
      id: "createdAt",
      label: "Date",
      render: (val) => (
        <Typography variant="body2">{formatDateTime(val)}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Defect Capture & Inspection Log"
        subtitle="Log sewing, fabric, or color defects encountered on the active production line."
        badge="Quality Gate"
      />

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                New Defect Report
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Garment Type"
                      value={formData.garmentType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          garmentType: e.target.value,
                        }))
                      }
                    >
                      {GARMENT_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the defect in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<CameraAltIcon />}
                      sx={{ textTransform: "none" }}
                    >
                      {formData.photo
                        ? formData.photo.name
                        : "Upload Photo (optional)"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </Button>
                  </Grid>
                  {photoPreview && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          position: "relative",
                          display: "inline-block",
                          width: "100%",
                        }}
                      >
                        <Box
                          component="img"
                          src={photoPreview}
                          alt="Preview"
                          sx={{
                            width: "100%",
                            maxHeight: 200,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={handleRemovePhoto}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            color: "#fff",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={<SendIcon />}
                      size="large"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Defect Report"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* History Section */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Defect History
              </Typography>
              <DataTable
                columns={columns}
                rows={defects}
                loading={loading}
                searchable
                searchPlaceholder="Search defects..."
                emptyMessage="No defect reports found"
                defaultSortBy="createdAt"
                defaultSortDir="desc"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Photo Preview Dialog */}
      <Dialog
        open={!!dialogPhoto}
        onClose={() => setDialogPhoto(null)}
        maxWidth="md"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
            Defect Photo
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setDialogPhoto(null)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {dialogPhoto && (
            <Box
              component="img"
              src={dialogPhoto}
              alt="Defect photo"
              sx={{
                maxWidth: "100%",
                maxHeight: "80vh",
                display: "block",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
