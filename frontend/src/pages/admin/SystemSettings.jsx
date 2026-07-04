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
import { toast } from 'react-toastify';

export default function SystemSettings() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    factoryName: 'Garment Manufacturing Co.',
    address: '123 Industrial Area, Textile City',
    timezone: 'Asia/Kolkata',
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
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    toast.success('Settings saved successfully');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>System Settings</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Factory Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Factory Name" value={settings.factoryName} onChange={handleSettingChange('factoryName')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField full size="small" label="Timezone" value={settings.timezone} onChange={handleSettingChange('timezone')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField full size="small" label="Address" multiline rows={2} value={settings.address} onChange={handleSettingChange('address')} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Shift Timings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Morning Shift Start" type="time" value={settings.shiftMorningStart} onChange={handleSettingChange('shiftMorningStart')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Morning Shift End" type="time" value={settings.shiftMorningEnd} onChange={handleSettingChange('shiftMorningEnd')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Evening Shift Start" type="time" value={settings.shiftEveningStart} onChange={handleSettingChange('shiftEveningStart')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Evening Shift End" type="time" value={settings.shiftEveningEnd} onChange={handleSettingChange('shiftEveningEnd')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Night Shift Start" type="time" value={settings.shiftNightStart} onChange={handleSettingChange('shiftNightStart')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField full size="small" label="Night Shift End" type="time" value={settings.shiftNightEnd} onChange={handleSettingChange('shiftNightEnd')} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Holiday Calendar</Typography>
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>AI Model Configuration</Typography>
              <FormControlLabel control={<Switch checked={aiConfig.autoPrediction} onChange={(e) => setAiConfig((p) => ({ ...p, autoPrediction: e.target.checked }))} />} label="Auto Prediction" />
              <FormControlLabel control={<Switch checked={aiConfig.anomalyDetection} onChange={(e) => setAiConfig((p) => ({ ...p, anomalyDetection: e.target.checked }))} />} label="Anomaly Detection" />
              <FormControlLabel control={<Switch checked={aiConfig.predictiveMaintenance} onChange={(e) => setAiConfig((p) => ({ ...p, predictiveMaintenance: e.target.checked }))} />} label="Predictive Maintenance" />
              <FormControlLabel control={<Switch checked={aiConfig.qualityPrediction} onChange={(e) => setAiConfig((p) => ({ ...p, qualityPrediction: e.target.checked }))} />} label="Quality Prediction" />
              <Box mt={2}>
                <TextField full size="small" label="Retrain Interval (days)" type="number" value={aiConfig.retrainInterval} onChange={(e) => setAiConfig((p) => ({ ...p, retrainInterval: e.target.value }))} />
              </Box>
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                <Chip label="Model: Production-v2.1" variant="outlined" color="primary" size="small" />
                <Chip label="Accuracy: 94.2%" variant="outlined" color="success" size="small" />
                <Chip label="Last trained: 2 days ago" variant="outlined" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
