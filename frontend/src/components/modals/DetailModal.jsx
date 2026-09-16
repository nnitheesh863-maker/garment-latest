import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
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
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'rgba(89,23,27,0.08)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        {sections.map((section, idx) => (
          <Box key={idx} mb={section.mb !== false ? 3 : 0}>
            {section.title && (
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="primary.main"
                gutterBottom
                sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.8rem' }}
              >
                {section.title}
              </Typography>
            )}
            {section.description && (
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                {section.description}
              </Typography>
            )}
            {section.fields && (
              <Grid container spacing={2}>
                {section.fields.map((field, fIdx) => (
                  <Grid item xs={12} sm={field.sm || 6} key={fIdx}>
                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={500}>
                      {field.label}
                    </Typography>
                    {field.type === 'chip' ? (
                      <Chip
                        label={field.value || '-'}
                        size="small"
                        color={field.chipColor || 'default'}
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      />
                    ) : field.type === 'color' ? (
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: field.value, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <Typography variant="body2" fontWeight={600}>{field.value}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" fontWeight={600} color="text.primary" mt={0.25}>
                        {field.value ?? '-'}
                      </Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            )}
            {section.custom}
            {idx < sections.length - 1 && <Divider sx={{ my: 2.5 }} />}
          </Box>
        ))}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
