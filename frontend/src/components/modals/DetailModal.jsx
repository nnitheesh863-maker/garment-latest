import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function DetailModal({
  open,
  onClose,
  title,
  sections = [],
  actions,
  maxWidth = 'md',
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>{title}</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent dividers>
        {sections.map((section, idx) => (
          <Box key={idx} mb={section.mb !== false ? 3 : 0}>
            {section.title && (
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                {section.title}
              </Typography>
            )}
            {section.description && (
              <Typography variant="body2" color="text.secondary" mb={1}>
                {section.description}
              </Typography>
            )}
            {section.fields && (
              <Grid container spacing={2}>
                {section.fields.map((field, fIdx) => (
                  <Grid item xs={12} sm={field.sm || 6} key={fIdx}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {field.label}
                    </Typography>
                    {field.type === 'chip' ? (
                      <Chip
                        label={field.value || '-'}
                        size="small"
                        color={field.chipColor || 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    ) : field.type === 'color' ? (
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: field.value }} />
                        <Typography variant="body2">{field.value}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" fontWeight={500}>
                        {field.value ?? '-'}
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            )}
            {section.custom}
            {idx < sections.length - 1 && <Divider sx={{ my: 2 }} />}
          </Box>
        ))}
      </DialogContent>
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
