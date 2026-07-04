import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  IconButton,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import { orderApi, employeeApi, machineApi, taskApi } from '../../api/axios';

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string(),
  orderId: yup.string().required('Order is required'),
  quantityTarget: yup.number().positive().integer().required('Target quantity is required'),
  difficulty: yup.string().required('Difficulty is required'),
  priority: yup.string().required('Priority is required'),
  assignedTo: yup.string(),
  machineId: yup.string(),
  dueDate: yup.date().required('Due date is required'),
});

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export default function TaskForm({ open, onClose, onSubmit, initialValues, loading = false }) {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordRes, empRes, machRes, taskRes] = await Promise.all([
          orderApi.list({ limit: 200 }),
          employeeApi.list({ limit: 200 }),
          machineApi.list({ limit: 200 }),
          taskApi.list({ limit: 200 }),
        ]);
        setOrders(ordRes.data.orders || ordRes.data || []);
        setEmployees(empRes.data.employees || empRes.data || []);
        setMachines(machRes.data.machines || machRes.data || []);
        setExistingTasks(taskRes.data.tasks || taskRes.data || []);
      } catch {
        // silent
      }
    };
    if (open) loadData();
  }, [open]);

  const isEdit = !!initialValues;

  const defaultValues = {
    title: '',
    description: '',
    orderId: '',
    quantityTarget: '',
    difficulty: 'medium',
    priority: 'medium',
    assignedTo: '',
    machineId: '',
    dueDate: '',
    dependencies: [],
    ...initialValues,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{isEdit ? 'Edit Task' : 'Create Task'}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          setSubmitting(false);
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField full size="small" label="Task Title" name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={touched.title && !!errors.title} helperText={touched.title && errors.title} />
                </Grid>
                <Grid item xs={12}>
                  <TextField full size="small" label="Description" name="description" multiline rows={2} value={values.description} onChange={handleChange} onBlur={handleBlur} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Order" name="orderId" select value={values.orderId} onChange={handleChange} onBlur={handleBlur} error={touched.orderId && !!errors.orderId} helperText={touched.orderId && errors.orderId}>
                    {orders.map((o) => (
                      <MenuItem key={o._id || o.id} value={o._id || o.id}>
                        {o.orderNumber || o.customerName || o._id}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Target Quantity" name="quantityTarget" type="number" value={values.quantityTarget} onChange={handleChange} onBlur={handleBlur} error={touched.quantityTarget && !!errors.quantityTarget} helperText={touched.quantityTarget && errors.quantityTarget} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Difficulty" name="difficulty" select value={values.difficulty} onChange={handleChange} error={touched.difficulty && !!errors.difficulty} helperText={touched.difficulty && errors.difficulty}>
                    {difficulties.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Priority" name="priority" select value={values.priority} onChange={handleChange} error={touched.priority && !!errors.priority} helperText={touched.priority && errors.priority}>
                    {priorities.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Due Date" name="dueDate" type="date" value={values.dueDate} onChange={handleChange} onBlur={handleBlur} error={touched.dueDate && !!errors.dueDate} helperText={touched.dueDate && errors.dueDate} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Assign To" name="assignedTo" select value={values.assignedTo} onChange={handleChange}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {employees.map((e) => (
                      <MenuItem key={e._id || e.id} value={e._id || e.id}>
                        {e.firstName} {e.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Machine" name="machineId" select value={values.machineId} onChange={handleChange}>
                    <MenuItem value="">Not specified</MenuItem>
                    {machines.map((m) => (
                      <MenuItem key={m._id || m.id} value={m._id || m.id}>
                        {m.name || m.machineId}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={existingTasks.filter((t) => t._id !== initialValues?._id)}
                    getOptionLabel={(option) => option.title || option._id}
                    value={existingTasks.filter((t) => (values.dependencies || []).includes(t._id || t.id))}
                    onChange={(_, newVal) => setFieldValue('dependencies', newVal.map((v) => v._id || v.id))}
                    renderInput={(params) => <TextField {...params} size="small" label="Dependencies" />}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
