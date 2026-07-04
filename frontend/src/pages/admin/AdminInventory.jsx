import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Skeleton,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { inventoryApi } from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { formatDate } from "../../utils/helpers";
import { INVENTORY_CATEGORIES } from "../../utils/constants";

const emptyForm = {
  name: "",
  category: "fabric",
  currentStock: 0,
  minStock: 0,
  maxStock: 0,
  reorderPoint: 0,
  unit: "pcs",
  supplier: "",
};

const emptyStockForm = { quantity: 0, type: "add", reason: "" };

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryTab, setCategoryTab] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [stockForm, setStockForm] = useState(emptyStockForm);
  const [stockSaving, setStockSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.list();
      const d = res.data;
      setItems(d?.data || d?.inventory || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = (items || []).filter((item) => {
    if (categoryTab !== "all" && item.category !== categoryTab) return false;
    if (
      showLowStock &&
      item.currentStock > (item.reorderPoint || item.minStock)
    )
      return false;
    return true;
  });

  const getStockColor = (item) => {
    if (item.currentStock <= (item.reorderPoint || 0)) return "error";
    if (item.currentStock <= (item.minStock || 0)) return "warning";
    return "success";
  };

  const getStockLevel = (item) => {
    if (item.currentStock <= (item.reorderPoint || 0)) return "Low";
    if (item.currentStock <= (item.minStock || 0)) return "Below Min";
    return "OK";
  };

  const handleOpenCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || "",
      category: item.category || "fabric",
      currentStock: item.currentStock || 0,
      minStock: item.minStock || 0,
      maxStock: item.maxStock || 0,
      reorderPoint: item.reorderPoint || 0,
      unit: item.unit || "pcs",
      supplier: item.supplier || "",
    });
    setFormOpen(true);
  };

  const handleFormChange = (field) => (e) => {
    const val = [
      "currentStock",
      "minStock",
      "maxStock",
      "reorderPoint",
    ].includes(field)
      ? Number(e.target.value)
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await inventoryApi.update(editItem._id, form);
        toast.success("Item updated");
      } else {
        await inventoryApi.create(form);
        toast.success("Item created");
      }
      setFormOpen(false);
      loadItems();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleOpenStock = (item) => {
    setStockItem(item);
    setStockForm(emptyStockForm);
    setStockOpen(true);
  };

  const handleStockChange = (field) => (e) => {
    const val = field === "quantity" ? Number(e.target.value) : e.target.value;
    setStockForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleStockSubmit = async () => {
    if (!stockForm.quantity || stockForm.quantity <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setStockSaving(true);
    try {
      const payload = {
        quantity:
          stockForm.type === "subtract"
            ? -stockForm.quantity
            : stockForm.quantity,
        reason: stockForm.reason,
      };
      await inventoryApi.updateStock(stockItem._id, payload);
      toast.success("Stock updated");
      setStockOpen(false);
      loadItems();
    } catch {
    } finally {
      setStockSaving(false);
    }
  };

  const handleViewDetail = async (item) => {
    try {
      const res = await inventoryApi.get(item._id);
      setDetailData(res.data?.data || res.data?.inventory || res.data);
    } catch {
      setDetailData(item);
    }
    setDetailOpen(true);
  };

  const columns = [
    { id: "name", label: "Name", sortable: true },
    {
      id: "category",
      label: "Category",
      render: (val) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: "currentStock",
      label: "Stock",
      sortable: true,
      render: (val, row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: `${getStockColor(row)}.main`,
            }}
          />
          <Typography variant="body2">
            {val} {row.unit || ""}
          </Typography>
          <Chip
            label={getStockLevel(row)}
            size="small"
            color={getStockColor(row)}
            sx={{ ml: 0.5 }}
          />
        </Box>
      ),
    },
    { id: "minStock", label: "Min" },
    { id: "maxStock", label: "Max" },
    { id: "reorderPoint", label: "Reorder" },
    {
      id: "actions",
      label: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Update Stock">
            <IconButton size="small" onClick={() => handleOpenStock(row)}>
              <InventoryIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditIcon fontSize="small" />
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
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Create Item
        </Button>
      </Box>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Tabs value={categoryTab} onChange={(_, v) => setCategoryTab(v)}>
          <Tab label="All" value="all" />
          {INVENTORY_CATEGORIES.map((cat) => (
            <Tab
              key={cat}
              label={cat.charAt(0).toUpperCase() + cat.slice(1)}
              value={cat}
            />
          ))}
        </Tabs>
        <FormControlLabel
          control={
            <Switch
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
          }
          label="Low Stock Only"
        />
      </Box>

      <DataTable
        columns={columns}
        rows={filteredItems}
        loading={loading}
        onRowClick={handleViewDetail}
        searchPlaceholder="Search inventory..."
      />

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editItem ? "Edit Item" : "Create Inventory Item"}
          <IconButton
            onClick={() => setFormOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={form.name}
                onChange={handleFormChange("name")}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Category"
                value={form.category}
                onChange={handleFormChange("category")}
              >
                {INVENTORY_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Current Stock"
                type="number"
                value={form.currentStock}
                onChange={handleFormChange("currentStock")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Min Stock"
                type="number"
                value={form.minStock}
                onChange={handleFormChange("minStock")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Max Stock"
                type="number"
                value={form.maxStock}
                onChange={handleFormChange("maxStock")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Reorder Point"
                type="number"
                value={form.reorderPoint}
                onChange={handleFormChange("reorderPoint")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Unit"
                value={form.unit}
                onChange={handleFormChange("unit")}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Supplier"
                value={form.supplier}
                onChange={handleFormChange("supplier")}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Update Stock - {stockItem?.name}
          <IconButton
            onClick={() => setStockOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Current stock:{" "}
                <strong>
                  {stockItem?.currentStock} {stockItem?.unit}
                </strong>
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                full
                size="small"
                label="Type"
                value={stockForm.type}
                onChange={handleStockChange("type")}
              >
                <MenuItem value="add">Add Stock</MenuItem>
                <MenuItem value="subtract">Subtract Stock</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                full
                size="small"
                label="Quantity"
                type="number"
                value={stockForm.quantity}
                onChange={handleStockChange("quantity")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                full
                size="small"
                label="Reason"
                value={stockForm.reason}
                onChange={handleStockChange("reason")}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockOpen(false)} disabled={stockSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleStockSubmit}
            variant="contained"
            disabled={stockSaving}
          >
            {stockSaving ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Item Details
          <IconButton
            onClick={() => setDetailOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 16, top: 16 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailData ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">{detailData.name}</Typography>
                <Chip
                  label={detailData.category}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Current Stock
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {detailData.currentStock} {detailData.unit}
                  </Typography>
                  <Chip
                    label={getStockLevel(detailData)}
                    size="small"
                    color={getStockColor(detailData)}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Min / Max
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.minStock} / {detailData.maxStock}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Reorder Point
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.reorderPoint || "-"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {detailData.supplier || "-"}
                </Typography>
              </Grid>
              {detailData.lastRestocked && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Last Restocked
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(detailData.lastRestocked)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Typography color="text.secondary">No details available</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
