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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "react-toastify";
import DataTable from "../../components/common/DataTable";
import UserForm from "../../components/forms/UserForm";
import ConfirmModal from "../../components/modals/ConfirmModal";
import api, { authApi } from "../../api/axios";
import { ROLES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/users");
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
  }, [loadUsers]);

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
      if (editUser) {
        await api.put(`/api/employees/${editUser._id}`, values);
        toast.success("User updated successfully");
      } else {
        await authApi.register(values);
        toast.success("User created successfully");
      }
      setFormOpen(false);
      loadUsers();
    } catch {
      // handled by api interceptor
    }
  };

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    try {
      const newStatus =
        selectedUser.status === "active" ? "inactive" : "active";
      await api.put(`/api/employees/${selectedUser._id}`, {
        status: newStatus,
      });
      toast.success(
        `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
      setConfirmOpen(false);
      loadUsers();
    } catch {
      // handled by api interceptor
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  });

  const columns = [
    {
      id: "name",
            label: "Name",
            render: (_, row) => {
              const first = row.firstName || row.profile?.firstName || "";
              const last = row.lastName || row.profile?.lastName || "";
              return `${first} ${last}`.trim() || row.email;
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
        />
      ),
    },
    {
      id: "department",
            label: "Department",
            render: (val, row) => val || row.profile?.department || "-",
    },
    {
      id: "status",
      label: "Status",
      render: (val) => (
        <Chip
          label={val || "active"}
          size="small"
          color={(val || "active") === "active" ? "success" : "default"}
        />
      ),
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
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.status === "active" ? "Deactivate" : "Activate"}>
            <IconButton size="small" onClick={() => handleToggleStatus(row)}>
              {row.status !== "inactive" ? (
                <BlockIcon fontSize="small" color="error" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={700}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            label="Status"
            fullWidth
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={filteredUsers}
        loading={loading}
        searchPlaceholder="Search users..."
      />

      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialValues={editUser}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmToggleStatus}
        title={
          selectedUser?.status === "active"
            ? "Deactivate User"
            : "Activate User"
        }
        message={`Are you sure you want to ${
                  selectedUser?.status === "active" ? "deactivate" : "activate"
                } ${selectedUser?.firstName || selectedUser?.profile?.firstName || ""} ${selectedUser?.lastName || selectedUser?.profile?.lastName || ""}?`}
                        confirmColor={selectedUser?.status === "active" ? "error" : "success"}
        confirmText={
          selectedUser?.status === "active" ? "Deactivate" : "Activate"
        }
      />
    </Box>
  );
}
