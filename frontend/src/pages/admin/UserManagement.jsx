import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import CloseIcon from "@mui/icons-material/Close";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { toast } from "react-toastify";
import DataTable from "../../components/common/DataTable";
import PageHeader from "../../components/common/PageHeader";
import GradientButton from "../../components/common/GradientButton";
import UserForm from "../../components/forms/UserForm";
import ConfirmModal from "../../components/modals/ConfirmModal";
import EmployeeDetailModal from "../../components/modals/EmployeeDetailModal";
import api, { authApi } from "../../api/axios";
import { ROLES } from "../../utils/constants";
import { formatDate, getInitials } from "../../utils/helpers";

const isUserActive = (user) => {
  if (!user) return false;
  if (user.active === false) return false;
  if (user.status === "inactive" || user.status === "disabled") return false;
  return true;
};

const getUserName = (user) => {
  if (!user) return "User";
  const first = user.firstName || user.profile?.firstName || "";
  const last = user.lastName || user.profile?.lastName || "";
  return `${first} ${last}`.trim() || user.email || "User";
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterApproval, setFilterApproval] = useState("");

  const loadPendingApprovals = useCallback(async () => {
    try {
      const res = await authApi.getPendingApprovals();
      const data = res.data?.data || res.data || [];
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load pending approvals:", err);
      setPendingApprovals([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/users?limit=500");
      const data = res.data?.data || res.data?.users || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPendingApprovals();
  }, [loadUsers, loadPendingApprovals]);

  const handleApproveManager = async (id, name) => {
    setApprovingId(id);
    try {
      await authApi.approveManager(id);
      toast.success(`Manager ${name || "account"} approved successfully!`);
      loadPendingApprovals();
      loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve manager");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectManager = async (id, name) => {
    setApprovingId(id);
    try {
      await authApi.rejectManager(id);
      toast.info(`Manager ${name || "account"} registration declined.`);
      loadPendingApprovals();
      loadUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject manager");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        email: values.email,
        password: values.password,
        role: values.role || "employee",
        firstName: values.firstName,
        lastName: values.lastName,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          department: values.department || "",
          position: values.position || "",
          employeeId: values.employeeId || `EMP-${Date.now().toString().slice(-6)}`,
          phone: values.contactNumber || "",
          joiningDate: values.joiningDate || new Date().toISOString().split("T")[0],
        },
      };

      if (editUser) {
        await api.put(`/api/employees/${editUser._id}`, payload);
        toast.success("User updated successfully");
      } else {
        await authApi.register(payload);
        toast.success("User created successfully");
      }
      setFormOpen(false);
      loadUsers();
      loadPendingApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save user account");
    }
  };

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;
    const currentlyActive = isUserActive(selectedUser);
    const newStatus = currentlyActive ? "inactive" : "active";
    try {
      await api.put(`/api/employees/${selectedUser._id}`, {
        status: newStatus,
        active: !currentlyActive,
      });
      toast.success(
        `User ${currentlyActive ? "disabled / deactivated" : "enabled / activated"} successfully`
      );
      setConfirmOpen(false);
      setSelectedUser(null);
      loadUsers();
      loadPendingApprovals();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete?._id) return;
    try {
      await api.delete(`/api/employees/${userToDelete._id}`);
      toast.success(`User "${getUserName(userToDelete)}" entirely deleted successfully`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      if (detailUser?._id === userToDelete._id) {
        setDetailOpen(false);
        setDetailUser(null);
      }
      loadUsers();
      loadPendingApprovals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus) {
      const active = isUserActive(u);
      if (filterStatus === "active" && !active) return false;
      if (filterStatus === "inactive" && active) return false;
    }
    if (filterApproval) {
      const status = u.approvalStatus || (u.isApproved !== false ? "approved" : "pending");
      if (filterApproval === "pending" && status !== "pending") return false;
      if (filterApproval === "approved" && status !== "approved") return false;
      if (filterApproval === "rejected" && status !== "rejected") return false;
    }
    return true;
  });

  const columns = [
    {
      id: "name",
      label: "Name",
      render: (_, row) => {
        const name = getUserName(row);
        const img = row.profile?.profileImage || row.profileImage;
        return (
          <Box display="flex" alignItems="center" gap={1.25}>
            <Avatar
              src={img || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#59171B",
                color: "#FED7B8",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getInitials(name)}
            </Avatar>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {name}
            </Typography>
          </Box>
        );
      },
      sortable: true,
    },
    { id: "email", label: "Email", sortable: true },
    {
      id: "role",
      label: "Role",
      render: (val) => (
        <Chip
          label={val}
          size="small"
          color={
            val === "admin"
              ? "error"
              : val === "manager"
                ? "primary"
                : "default"
          }
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: "department",
      label: "Department",
      render: (val, row) => val || row.profile?.department || "-",
    },
    {
      id: "approvalStatus",
      label: "Approval",
      render: (_, row) => {
        const approval = row.approvalStatus || (row.isApproved !== false ? "approved" : "pending");
        if (row.role !== "manager" && approval === "approved") {
          return (
            <Chip
              label="Verified"
              size="small"
              color="default"
              variant="outlined"
              icon={<VerifiedUserIcon sx={{ fontSize: "13px !important" }} />}
              sx={{ fontWeight: 600, fontSize: 11 }}
            />
          );
        }
        if (approval === "pending") {
          return (
            <Chip
              label="Pending Approval"
              size="small"
              color="warning"
              variant="filled"
              icon={<HourglassTopIcon sx={{ fontSize: "13px !important" }} />}
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
          );
        }
        if (approval === "rejected") {
          return (
            <Chip
              label="Declined"
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: 11 }}
            />
          );
        }
        return (
          <Chip
            label="Approved"
            size="small"
            color="success"
            variant="outlined"
            icon={<CheckCircleIcon sx={{ fontSize: "13px !important" }} />}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        );
      },
    },
    {
      id: "status",
      label: "Status",
      render: (_, row) => {
        const active = isUserActive(row);
        return (
          <Chip
            label={active ? "Active" : "Deactivated"}
            size="small"
            color={active ? "success" : "error"}
            variant={active ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              ...(active
                ? {}
                : {
                    bgcolor: "rgba(220,38,38,0.08)",
                    color: "#dc2626",
                    borderColor: "rgba(220,38,38,0.3)",
                  }),
            }}
          />
        );
      },
    },
    {
      id: "createdAt",
      label: "Joined",
      render: (val) => formatDate(val),
    },
    {
      id: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => {
        const active = isUserActive(row);
        const isPending = row.approvalStatus === "pending" || (row.role === "manager" && row.isApproved === false && row.approvalStatus !== "rejected");
        const rowName = getUserName(row);
        const isActioning = approvingId === row._id;

        return (
          <Box
            onClick={(e) => e.stopPropagation()}
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            gap={0.5}
          >
            {isPending && (
              <>
                <Tooltip title="Approve Manager Registration">
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      disabled={isActioning}
                      onClick={() => handleApproveManager(row._id, rowName)}
                      sx={{ bgcolor: "rgba(22,163,74,0.1)", "&:hover": { bgcolor: "rgba(22,163,74,0.2)" } }}
                    >
                      {isActioning ? <CircularProgress size={16} color="inherit" /> : <HowToRegIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Decline Manager Registration">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isActioning}
                      onClick={() => handleRejectManager(row._id, rowName)}
                      sx={{ bgcolor: "rgba(220,38,38,0.1)", "&:hover": { bgcolor: "rgba(220,38,38,0.2)" } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailUser(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit User">
              <IconButton size="small" onClick={() => handleEdit(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={active ? "Deactivate / Suspend Account" : "Reactivate / Enable Account"}>
              <IconButton
                size="small"
                onClick={() => handleToggleStatus(row)}
                sx={
                  !active
                    ? {
                        color: "success.main",
                        bgcolor: "rgba(22,163,74,0.1)",
                        "&:hover": { bgcolor: "rgba(22,163,74,0.2)" },
                      }
                    : {
                        color: "warning.main",
                      }
                }
              >
                {active ? (
                  <BlockIcon fontSize="small" color="warning" />
                ) : (
                  <CheckCircleIcon fontSize="small" color="success" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Entirely">
              <IconButton
                size="small"
                onClick={() => handleDelete(row)}
                sx={{ color: "error.main", "&:hover": { bgcolor: "rgba(220,38,38,0.08)" } }}
              >
                <DeleteForeverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Workforce & Access Control"
        subtitle="Manage user credentials, role permissions, and manager registration authorizations."
        badge="Enterprise RBAC"
        actions={
          <GradientButton icon={<AddIcon />} onClick={handleCreate}>
            Add User
          </GradientButton>
        }
      />

      {/* Pending Manager Approvals Section */}
      {pendingApprovals.length > 0 && (
        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, rgba(254,215,184,0.45) 0%, rgba(255,248,242,0.92) 100%)",
            border: "1.5px solid #F1D5C0",
            borderRadius: 3,
            boxShadow: "0 8px 26px rgba(89,23,27,0.08)",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    bgcolor: "#ea580c",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(234,88,12,0.35)",
                  }}
                >
                  <SupervisorAccountIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#2C1A1A">
                    Pending Manager Approvals
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pendingApprovals.length} manager registration{pendingApprovals.length > 1 ? "s" : ""} awaiting Administrator authorization
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${pendingApprovals.length} Pending`}
                color="warning"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>

            <Grid container spacing={2}>
              {pendingApprovals.map((m) => {
                const mName = getUserName(m);
                const isActioning = approvingId === m._id;
                return (
                  <Grid item xs={12} md={6} lg={4} key={m._id}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#fff",
                        borderRadius: 2.5,
                        border: "1px solid #F1D5C0",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          src={m.profile?.profileImage || m.profileImage || undefined}
                          sx={{ width: 44, height: 44, bgcolor: "#59171B", color: "#FED7B8", fontWeight: 700 }}
                        >
                          {getInitials(mName)}
                        </Avatar>
                        <Box minWidth={0} flex={1}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {mName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                            {m.email}
                          </Typography>
                          <Typography variant="caption" color="primary.main" fontWeight={600}>
                            {m.profile?.department || "Management"} &bull; Registered {formatDate(m.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" gap={1} pt={1} sx={{ borderTop: "1px dashed #F1D5C0" }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={isActioning}
                          startIcon={isActioning ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                          onClick={() => handleApproveManager(m._id, mName)}
                          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                        >
                          Approve Manager
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={isActioning}
                          startIcon={<CloseIcon />}
                          onClick={() => handleRejectManager(m._id, mName)}
                          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, minWidth: 90 }}
                        >
                          Decline
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            label="Role"
            fullWidth
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <MenuItem value="">All Roles</MenuItem>
            {Object.values(ROLES).map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            label="Status"
            fullWidth
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="inactive">Disabled / Inactive</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            label="Approval Status"
            fullWidth
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
          >
            <MenuItem value="">All Approvals</MenuItem>
            <MenuItem value="approved">Approved / Verified</MenuItem>
            <MenuItem value="pending">Pending Approval</MenuItem>
            <MenuItem value="rejected">Declined</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={filteredUsers}
        loading={loading}
        searchPlaceholder="Search users by name, email, department..."
        onRowClick={(row) => {
          setDetailUser(row);
          setDetailOpen(true);
        }}
      />

      <EmployeeDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        user={detailUser}
        onEdit={(u) => {
          setDetailOpen(false);
          handleEdit(u);
        }}
        onDelete={(u) => {
          handleDelete(u);
        }}
        onToggleStatus={(u) => {
          handleToggleStatus(u);
        }}
      />

      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialValues={editUser}
      />

      {/* Disable / Enable Modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmToggleStatus}
        title={
          isUserActive(selectedUser)
            ? "Disable User Account"
            : "Enable User Account"
        }
        message={`Are you sure you want to ${
          isUserActive(selectedUser)
            ? "DISABLE"
            : "ENABLE"
        } the account for ${getUserName(selectedUser)}? ${
          isUserActive(selectedUser)
            ? "They will be blocked from logging into the system until re-enabled."
            : "They will be granted normal access to log in and work."
        }`}
        confirmColor={isUserActive(selectedUser) ? "warning" : "success"}
        confirmText={
          isUserActive(selectedUser) ? "Disable Account" : "Enable Account"
        }
      />

      {/* Permanent Delete Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Permanently Delete User"
        message={`Are you sure you want to ENTIRELY DELETE ${getUserName(
          userToDelete
        )} (${userToDelete?.email || ""})? All their attendance records, task assignments, and login credentials will be permanently erased from the system. THIS ACTION CANNOT BE UNDONE.`}
        confirmColor="error"
        confirmText="Delete Entirely"
      />
    </Box>
  );
}
