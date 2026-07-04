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
import { ROLES } from '../../utils/constants';

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().required('Role is required'),
  department: yup.string(),
  position: yup.string(),
  employeeId: yup.string(),
  contactNumber: yup.string(),
  password: yup.string().when('isCreate', {
    is: true,
    then: (schema) => schema.min(6, 'Min 6 characters').required('Password is required'),
  }),
});

const roles = [
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.EMPLOYEE, label: 'Employee' },
];

const departments = ['Production', 'Quality', 'Maintenance', 'Warehouse', 'Administration', 'Design'];

export default function UserForm({ open, onClose, onSubmit, initialValues, loading = false }) {
  const isCreate = !initialValues;

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    role: ROLES.EMPLOYEE,
    department: '',
    position: '',
    employeeId: '',
    contactNumber: '',
    joiningDate: '',
    password: '',
    isCreate,
    ...initialValues,
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{isCreate ? 'Create User' : 'Edit User'}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          const { isCreate, ...data } = values;
          if (!isCreate) delete data.password;
          onSubmit(data);
          setSubmitting(false);
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="First Name" name="firstName" value={values.firstName} onChange={handleChange} onBlur={handleBlur} error={touched.firstName && !!errors.firstName} helperText={touched.firstName && errors.firstName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Last Name" name="lastName" value={values.lastName} onChange={handleChange} onBlur={handleBlur} error={touched.lastName && !!errors.lastName} helperText={touched.lastName && errors.lastName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Email" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Role" name="role" select value={values.role} onChange={handleChange} error={touched.role && !!errors.role} helperText={touched.role && errors.role}>
                    {roles.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Department" name="department" select value={values.department} onChange={handleChange}>
                    <MenuItem value="">None</MenuItem>
                    {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Position" name="position" value={values.position} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Employee ID" name="employeeId" value={values.employeeId} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Contact Number" name="contactNumber" value={values.contactNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Joining Date" name="joiningDate" type="date" value={values.joiningDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                </Grid>
                {isCreate && (
                  <Grid item xs={12} sm={6}>
                    <TextField full size="small" label="Password" name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : isCreate ? 'Create User' : 'Update User'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
