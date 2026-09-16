import React from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import GradientButton from '../common/GradientButton';

const validationSchema = yup.object({
  customerName: yup.string().required('Customer name is required'),
  company: yup.string().required('Company is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  garmentType: yup.string().required('Garment type is required'),
  description: yup.string(),
  quantity: yup.number().positive('Must be positive').integer().required('Quantity is required'),
  priority: yup.string().required('Priority is required'),
  requiredDate: yup.date().required('Required date is required'),
});

const garmentTypes = ['T-Shirt', 'Shirt', 'Pant', 'Jacket', 'Dress', 'Skirt', 'Uniform', 'Other'];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const colors = ['White', 'Black', 'Blue', 'Red', 'Green', 'Yellow', 'Grey', 'Navy', 'Maroon', 'Beige'];

export default function OrderForm({ open, onClose, onSubmit, initialValues, loading = false }) {
  const isEdit = !!initialValues;

  const defaultValues = {
    customerName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    garmentType: '',
    description: '',
    quantity: '',
    sizes: [],
    colors: [],
    priority: 'medium',
    requiredDate: '',
    materialSpecs: '',
    ...initialValues,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          border: '1px solid rgba(89,23,27,0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
          background: 'linear-gradient(135deg, rgba(89,23,27,0.04), rgba(254,215,184,0.06))',
        }}
      >
        <Typography variant="h6" fontWeight={800} color="primary.main">
          {isEdit ? 'Edit Production Order' : 'Create New Production Order'}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'rgba(89,23,27,0.08)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
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
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.8rem' }}>
                Customer Information
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Customer Name" name="customerName" value={values.customerName} onChange={handleChange} onBlur={handleBlur} error={touched.customerName && !!errors.customerName} helperText={touched.customerName && errors.customerName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Company" name="company" value={values.company} onChange={handleChange} onBlur={handleBlur} error={touched.company && !!errors.company} helperText={touched.company && errors.company} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Email" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Phone" name="phone" value={values.phone} onChange={handleChange} onBlur={handleBlur} error={touched.phone && !!errors.phone} helperText={touched.phone && errors.phone} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Address" name="address" multiline rows={2} value={values.address} onChange={handleChange} onBlur={handleBlur} error={touched.address && !!errors.address} helperText={touched.address && errors.address} />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.8rem' }}>
                Order Details & Specifications
              </Typography>
              <Grid container spacing={2} mb={1}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Garment Type" name="garmentType" select value={values.garmentType} onChange={handleChange} onBlur={handleBlur} error={touched.garmentType && !!errors.garmentType} helperText={touched.garmentType && errors.garmentType}>
                    {garmentTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Quantity (Units)" name="quantity" type="number" value={values.quantity} onChange={handleChange} onBlur={handleBlur} error={touched.quantity && !!errors.quantity} helperText={touched.quantity && errors.quantity} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Priority" name="priority" select value={values.priority} onChange={handleChange} onBlur={handleBlur} error={touched.priority && !!errors.priority} helperText={touched.priority && errors.priority}>
                    {priorities.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Required Delivery Date" name="requiredDate" type="date" value={values.requiredDate} onChange={handleChange} onBlur={handleBlur} error={touched.requiredDate && !!errors.requiredDate} helperText={touched.requiredDate && errors.requiredDate} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Sizes" name="sizes" select SelectProps={{ multiple: true }} value={values.sizes || []} onChange={(e) => setFieldValue('sizes', e.target.value)}>
                    {sizes.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Colors" name="colors" select SelectProps={{ multiple: true }} value={values.colors || []} onChange={(e) => setFieldValue('colors', e.target.value)}>
                    {colors.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Description / Special Instructions" name="description" multiline rows={2} value={values.description} onChange={handleChange} onBlur={handleBlur} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Material Specifications" name="materialSpecs" multiline rows={2} value={values.materialSpecs} onChange={handleChange} onBlur={handleBlur} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'action.hover', gap: 1 }}>
              <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}>Cancel</Button>
              <GradientButton type="submit" loading={loading}>
                {isEdit ? 'Update Order' : 'Create Order'}
              </GradientButton>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
