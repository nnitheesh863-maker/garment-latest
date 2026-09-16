import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import GradientButton from '../common/GradientButton';

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
}) {
  const isDanger = confirmColor === 'error' || confirmColor === 'danger';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          border: isDanger ? '1px solid rgba(220,38,38,0.2)' : '1px solid rgba(89,23,27,0.12)',
          boxShadow: isDanger ? '0 20px 48px rgba(220,38,38,0.18)' : '0 20px 48px rgba(89,23,27,0.18)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isDanger && (
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(220,38,38,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
        )}
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1.5 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.925rem', lineHeight: 1.6 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
        >
          {cancelText}
        </Button>
        <GradientButton
          onClick={onConfirm}
          variant={isDanger ? 'danger' : 'primary'}
          loading={loading}
          size="small"
        >
          {confirmText}
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
}
