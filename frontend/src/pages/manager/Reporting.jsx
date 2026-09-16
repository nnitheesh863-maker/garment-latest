import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  Paper,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GenerateIcon from "@mui/icons-material/AutoAwesome";
import { toast } from "react-toastify";
import PageHeader from "../../components/common/PageHeader";
import GradientButton from "../../components/common/GradientButton";
import GlassCard from "../../components/common/GlassCard";
import ProductionChart from "../../components/charts/ProductionChart";
import { REPORT_TYPES } from "../../utils/constants";
import { formatDate, downloadCSV } from "../../utils/helpers";

export default function Reporting() {
  const [reportType, setReportType] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([
    { id: 1, name: "Daily Production Summary", type: "daily", active: true },
    { id: 2, name: "Weekly Performance Report", type: "weekly", active: true },
    { id: 3, name: "Monthly Quality Analysis", type: "monthly", active: false },
  ]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      toast.success("Report generated successfully");
    }, 1200);
  };

  const handleDownloadPDF = () => {
    try {
      const { jsPDF } = require("jspdf");
      require("jspdf-autotable");
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Production Report", 14, 22);

      doc.setFontSize(11);
      doc.text(
        `Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
        14,
        32,
      );
      doc.text(`Period: ${dateFrom || "N/A"} to ${dateTo || "N/A"}`, 14, 38);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

      const tableData = [
        ["Date", "Orders", "Completed", "Quality", "Efficiency"],
        ["2026-06-01", "12", "10", "95%", "87%"],
        ["2026-06-02", "15", "13", "93%", "85%"],
        ["2026-06-03", "10", "9", "97%", "90%"],
      ];

      doc.autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [89, 23, 27] },
      });

      doc.save(`${reportType}-report-${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate PDF. Make sure jspdf is installed.");
    }
  };

  const handleDownloadCSV = () => {
    const data = [
      {
        Date: "2026-06-01",
        Orders: 12,
        Completed: 10,
        Quality: "95%",
        Efficiency: "87%",
      },
      {
        Date: "2026-06-02",
        Orders: 15,
        Completed: 13,
        Quality: "93%",
        Efficiency: "85%",
      },
      {
        Date: "2026-06-03",
        Orders: 10,
        Completed: 9,
        Quality: "97%",
        Efficiency: "90%",
      },
    ];
    downloadCSV(data, `${reportType}-report.csv`);
    toast.success("CSV downloaded");
  };

  const toggleScheduled = (id) => {
    setScheduledReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    );
    toast.success("Schedule updated");
  };

  const reportData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Production",
        data: [320, 450, 380, 520, 490, 350, 280],
        borderColor: "#59171B",
        backgroundColor: "rgba(89,23,27,0.08)",
      },
      {
        label: "Target",
        data: [400, 400, 400, 500, 500, 400, 300],
        borderColor: "#E8A06B",
        backgroundColor: "rgba(232,160,107,0.12)",
      },
    ],
  };

  return (
    <Box>
      <PageHeader
        title="Executive Reports & Telemetry"
        subtitle="Compile automated shift summaries, line throughput audits, and custom data exports."
        badge="Analytics Engine"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(89,23,27,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5} color="primary.main">
                Configure Report Parameters
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    size="small"
                    label="Report Type"
                    fullWidth
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {Object.values(REPORT_TYPES).map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <GradientButton
                icon={<GenerateIcon />}
                onClick={handleGenerate}
                loading={generating}
              >
                {generating ? "Generating..." : "Generate Report"}
              </GradientButton>

              {generated && (
                <Box mt={3}>
                  <Divider sx={{ mb: 2.5 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    Report Preview - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                  </Typography>
                  <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                    Report synthesized for period {dateFrom || "Start"} to {dateTo || "Today"}
                  </Alert>
                  <ProductionChart
                    data={reportData.datasets}
                    labels={reportData.labels}
                    height={250}
                  />
                  <Box mt={3} display="flex" gap={2}>
                    <GradientButton
                      icon={<PictureAsPdfIcon />}
                      onClick={handleDownloadPDF}
                      variant="primary"
                    >
                      Export PDF
                    </GradientButton>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadCSV}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Export CSV
                    </Button>
                  </Box>

                  <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, border: '1px solid rgba(89,23,27,0.08)' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(89,23,27,0.04)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Metric</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>vs Target</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          {
                            metric: "Total Production",
                            value: "2,790 units",
                            target: "2,800 units",
                            status: "success",
                          },
                          {
                            metric: "Quality Rate",
                            value: "94.5%",
                            target: "95%",
                            status: "warning",
                          },
                          {
                            metric: "Efficiency",
                            value: "88.2%",
                            target: "90%",
                            status: "warning",
                          },
                          {
                            metric: "On-Time Delivery",
                            value: "92%",
                            target: "95%",
                            status: "warning",
                          },
                        ].map((row) => (
                          <TableRow key={row.metric} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{row.metric}</TableCell>
                            <TableCell align="right">{row.value}</TableCell>
                            <TableCell align="right">{row.target}</TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={row.status}
                                color={row.status}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(89,23,27,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2.5} color="primary.main">
                Scheduled Automation
              </Typography>
              {scheduledReports.map((sr) => (
                <Box
                  key={sr.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                  p={2}
                  sx={{
                    bgcolor: "action.hover",
                    borderRadius: 2,
                    border: '1px solid rgba(89,23,27,0.05)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(89,23,27,0.08)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {sr.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recurrence: {sr.type}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sr.active}
                        onChange={() => toggleScheduled(sr.id)}
                        size="small"
                        color="primary"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
