/**
 * SystemSettings Page
 * System configuration, backup management, AI inference thresholds, and company preferences.
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import GradientButton from '../../components/common/GradientButton';

export default function SystemSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    factoryName: 'Garment Manufacturing Co. Atelier',
    address: '123 Industrial Area, Textile City, Milan',
    timezone: 'Asia/Kolkata',
    adminOverrideMode: true, // Simple direct admin work without AI blocking
    autoApproveManagers: true,
    shiftMorningStart: '06:00',
    shiftMorningEnd: '14:00',
    shiftEveningStart: '14:00',
    shiftEveningEnd: '22:00',
    shiftNightStart: '22:00',
    shiftNightEnd: '06:00',
  });
  const [holidays, setHolidays] = useState([
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-08-15', name: 'Independence Day' },
  ]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [aiConfig, setAiConfig] = useState({
    autoPrediction: true,
    anomalyDetection: true,
    predictiveMaintenance: true,
    qualityPrediction: true,
    retrainInterval: '7',
  });

  const handleSettingChange = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    toast.success('System settings updated successfully');
  };

  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) return;
    setHolidays((prev) => [...prev, { ...newHoliday }]);
    setNewHoliday({ date: '', name: '' });
  };

  const handleRemoveHoliday = (index) => {
    setHolidays((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <PageHeader
        title="Admin Control & Factory Settings"
        subtitle="Manage simple direct admin operation modes, shift boundaries, and AI autonomy rules."
        badge="Admin Configuration"
        actions={
          <GradientButton
            icon={<SaveIcon />}
            onClick={handleSave}
            loading={saving}
          >
            Save Changes
          </GradientButton>
        }
      />

      {saved && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px' }}>Settings saved successfully</Alert>}

      <Grid container spacing={3}>
        {/* DIRECT ADMIN OVERRIDE CONTROLS */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#FFFDF9', border: '1.5px solid #E8A06B', borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                <Box sx={{ p: 1, bgcolor: '#59171B', color: '#FED7B8', borderRadius: '8px' }}>
                  <FlashOnIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#231F20">
                    Direct Admin Work & Simple Management Mode
                  </Typography>
                  <Typography variant="caption" color="#6E6966">
                    Enables direct 1-click execution for all Admin tasks (Order Dispatch, Machine Toggles, Manager Approvals) bypassing AI latency.
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.adminOverrideMode}
                        onChange={(e) => {
                          setSettings({ ...settings, adminOverrideMode: e.target.checked });
                          setSaved(false);
                        }}
                        color="warning"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={700}>⚡ Direct Admin Quick Dispatch Mode (Active)</Typography>}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoApproveManagers}
                        onChange={(e) => {
                          setSettings({ ...settings, autoApproveManagers: e.target.checked });
                          setSaved(false);
                        }}
                        color="success"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={700}>⚡ Instant Manager Auto-Approval</Typography>}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* FACTORY SETTINGS */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Factory Metadata</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Factory Name" value={settings.factoryName} onChange={handleSettingChange('factoryName')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Timezone" value={settings.timezone} onChange={handleSettingChange('timezone')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Factory Address" multiline rows={2} value={settings.address} onChange={handleSettingChange('address')} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* AI MODEL CONFIGURATION */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>AI Copilot Rules (Optional)</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <FormControlLabel control={<Switch checked={aiConfig.autoPrediction} onChange={(e) => setAiConfig((p) => ({ ...p, autoPrediction: e.target.checked }))} />} label="Auto Delay Prediction" />
                <FormControlLabel control={<Switch checked={aiConfig.anomalyDetection} onChange={(e) => setAiConfig((p) => ({ ...p, anomalyDetection: e.target.checked }))} />} label="Defect Anomaly Detection" />
                <FormControlLabel control={<Switch checked={aiConfig.predictiveMaintenance} onChange={(e) => setAiConfig((p) => ({ ...p, predictiveMaintenance: e.target.checked }))} />} label="Predictive Machine Maintenance" />
              </Box>
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                <Chip label="Provider: Local Fast Fallback" variant="outlined" color="primary" size="small" />
                <Chip label="Status: Active & Resilient" variant="outlined" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* SHIFT TIMINGS */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Factory Shift Timings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Morning Start" type="time" value={settings.shiftMorningStart} onChange={handleSettingChange('shiftMorningStart')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Morning End" type="time" value={settings.shiftMorningEnd} onChange={handleSettingChange('shiftMorningEnd')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Evening Start" type="time" value={settings.shiftEveningStart} onChange={handleSettingChange('shiftEveningStart')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Evening End" type="time" value={settings.shiftEveningEnd} onChange={handleSettingChange('shiftEveningEnd')} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* HOLIDAY CALENDAR */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Holiday Calendar</Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField size="small" label="Date" type="date" value={newHoliday.date} onChange={(e) => setNewHoliday((p) => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Holiday Name" value={newHoliday.name} onChange={(e) => setNewHoliday((p) => ({ ...p, name: e.target.value }))} />
                <Button variant="outlined" onClick={handleAddHoliday} startIcon={<AddIcon />}>Add</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Holiday</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holidays.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>{h.date}</TableCell>
                        <TableCell>{h.name}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleRemoveHoliday(i)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
