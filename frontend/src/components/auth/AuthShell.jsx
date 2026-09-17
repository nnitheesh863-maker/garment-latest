import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import FactoryIcon from "@mui/icons-material/Factory";
import RadarIcon from "@mui/icons-material/Radar";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InsightsIcon from "@mui/icons-material/Insights";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SensorsIcon from "@mui/icons-material/Sensors";

const BRAND_FEATURES = [
  {
    icon: RadarIcon,
    title: "Real-time Production Tracking",
    desc: "Live shop-floor visibility across every line, machine and operator.",
    metric: "99.8% Live Sync",
  },
  {
    icon: InsightsIcon,
    title: "AI Predictions & Alerts",
    desc: "Forecast delays, quality drift and maintenance needs before they happen.",
    metric: "Tier-1 ML Active",
  },
  {
    icon: SpeedIcon,
    title: "Smarter Workforce",
    desc: "Task allocation, attendance and performance analytics in one place.",
    metric: "40% Higher OEE",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const floatingBadge = {
  initial: { y: 0 },
  animate: {
    y: [-6, 6, -6],
    transition: {
      duration: 4.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function authFieldSx(theme) {
  const isLight = theme.palette.mode === "light";
  const inputColor = isLight ? "#2C1A1A" : "#F7E8DE";
  const labelColor = isLight ? "#7A6A63" : "#C4B0A4";
  const bg = isLight ? "#FFFFFF" : "#301D23";
  const border = isLight ? "#E8CFBB" : "#4A3038";
  const focusBorder = isLight ? "#7A2328" : "#E09A8C";
  const focusRing = isLight ? "rgba(122,35,40,0.14)" : "rgba(224,154,140,0.16)";
  return {
    "& .MuiOutlinedInput-root": {
      color: inputColor,
      borderRadius: 2.5,
      fontSize: 14.5,
      backgroundColor: bg,
      transition: "all 260ms cubic-bezier(0.4, 0, 0.2, 1)",
      "& fieldset": { borderColor: border },
      "&:hover fieldset": { borderColor: isLight ? "#C9A68C" : "#6A404E" },
      "&.Mui-focused fieldset": {
        borderColor: focusBorder,
        borderWidth: 2,
        boxShadow: `0 0 0 4px ${focusRing}`,
      },
      "&.Mui-focused": { boxShadow: `0 8px 24px ${isLight ? "rgba(89,23,27,0.12)" : "rgba(0,0,0,0.4)"}` },
      "& input": { "::placeholder": { color: isLight ? "#A8968D" : "#8A7268", opacity: 1 } },
    },
    "& .MuiInputLabel-root": { color: labelColor, fontSize: 14.5, transition: "color 0.2s ease" },
    "& .MuiInputLabel-root.Mui-focused": { color: focusBorder },
    "& .MuiSelect-icon": { color: labelColor },
    "& .MuiFormHelperText-root": { color: isLight ? "#C0392B" : "#F06464" },
    "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: labelColor },
  };
}

export default function AuthShell({ title, subtitle, footer, children }) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
        overflowX: "hidden",
      }}
    >
      {/* Brand panel */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flex: "1 1 46%",
          maxWidth: "46%",
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(160deg, #320B0E 0%, #59171B 35%, #7A2328 70%, #A45A4A 100%)",
          color: "#FFF8F2",
          '&::before': {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${new URL("../../images/garment1.jpg", import.meta.url).href})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.18,
            mixBlendMode: "luminosity",
          },
          '&::after': {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 600px at 75% -10%, rgba(254,215,184,0.22), transparent 60%)",
            pointerEvents: "none",
          },
        }}
      >
        {/* Ambient Glowing Orbs */}
        <Box sx={{
          position: "absolute", width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(254,215,184,0.2) 0%, transparent 70%)",
          top: -100, left: -140, animation: "authOrb 10s ease-in-out infinite alternate", pointerEvents: "none"
        }} />
        <Box sx={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(164,90,74,0.28) 0%, transparent 70%)",
          bottom: -80, right: -100, animation: "authOrb 14s ease-in-out infinite alternate-reverse", pointerEvents: "none"
        }} />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 2, padding: "52px 56px 28px" }}
        >
          <motion.div variants={item}>
            <Box
              component={Link}
              to="/"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                mb: 4.5,
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateX(-3px) scale(1.02)",
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #FED7B8 0%, #E8A888 50%, #A45A4A 100%)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <FactoryIcon sx={{ fontSize: 26, color: "#3D0F12" }} />
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ fontWeight: 850, fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                    Couture Intelligence
                  </Typography>
                  <Box
                    sx={{
                      px: 0.9,
                      py: 0.2,
                      borderRadius: "6px",
                      bgcolor: "rgba(254,215,184,0.2)",
                      border: "1px solid rgba(254,215,184,0.4)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#FED7B8",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                    }}
                  >
                    <SensorsIcon sx={{ fontSize: 11 }} /> LIVE
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 11.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(254,215,184,0.85)", mt: 0.3 }}>
                  Industry 4.0 MES + ERP
                </Typography>
              </Box>
            </Box>

            <Typography variant="h3" fontWeight={850} sx={{ fontSize: { md: 32, xl: 36 }, lineHeight: 1.16, letterSpacing: "-0.025em" }}>
              Autonomous Garment Optimization Engine.
            </Typography>
            <Typography sx={{ mt: 2.2, mb: 4.5, color: "rgba(254,215,184,0.9)", fontSize: 15, lineHeight: 1.7, maxWidth: 480 }}>
              Seamlessly orchestrate natural language orders, AI production planning, IoT shopfloor telemetry, and closed-loop quality control.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {BRAND_FEATURES.map(({ icon: Icon, title: t, desc, metric }) => (
                <motion.div
                  key={t}
                  variants={item}
                  whileHover={{ x: 6, transition: { duration: 0.2 } }}
                >
                  <Box
                    display="flex"
                    gap={2.2}
                    alignItems="flex-start"
                    sx={{
                      p: 1.6,
                      borderRadius: "16px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(254, 215, 184, 0.15)",
                      backdropFilter: "blur(12px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(254, 215, 184, 0.35)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "13px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(254,215,184,0.18)",
                        border: "1px solid rgba(254,215,184,0.3)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Icon sx={{ fontSize: 22, color: "#FED7B8" }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: 750, fontSize: 15 }}>{t}</Typography>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#FED7B8", bgcolor: "rgba(254,215,184,0.15)", px: 0.8, py: 0.2, borderRadius: 1 }}>
                          {metric}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: "rgba(254,215,184,0.78)", lineHeight: 1.55, mt: 0.4 }}>
                        {desc}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </motion.div>

        {/* Bottom Floating Stats Pill */}
        <Box sx={{ position: "relative", zIndex: 2, px: "56px", pb: "32px" }}>
          <motion.div
            variants={floatingBadge}
            initial="initial"
            animate="animate"
          >
            <Box
              sx={{
                p: 1.4,
                borderRadius: "14px",
                background: "rgba(61, 15, 18, 0.65)",
                border: "1px solid rgba(254, 215, 184, 0.25)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: "#FED7B8" }} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#FFF" }}>
                  AI Engine Ready: Groq Llama-3 + Local ML
                </Typography>
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4CAF50", boxShadow: "0 0 10px #4CAF50" }} />
            </Box>
          </motion.div>

          <Box display="flex" alignItems="center" gap={1}>
            <VerifiedUserIcon sx={{ fontSize: 15, color: "rgba(254,215,184,0.75)" }} />
            <Typography sx={{ fontSize: 12, color: "rgba(254,215,184,0.75)" }}>
              Enterprise-grade security · Industry 4.0 ISO Standard
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, color: "rgba(254,215,184,0.5)", mt: 0.5 }}>
            © 2026 Couture Intelligence · Production Optimization ERP
          </Typography>
        </Box>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flex: "1 1 54%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 5, md: 6 },
          px: 2,
          position: "relative",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{
          position: "absolute", width: 440, height: 440, borderRadius: "50%",
          background: isLight ? "radial-gradient(circle, rgba(254,215,184,0.4) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(122,35,40,0.22) 0%, transparent 70%)",
          top: -140, right: -120, pointerEvents: "none"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 460 }}
        >
          {/* Back to Landing Page Button */}
          <Box mb={2.5}>
            <Button
              component={Link}
              to="/"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 2.5,
                fontSize: 12.5,
                fontWeight: 650,
                textTransform: "none",
                letterSpacing: "0.02em",
                color: isLight ? "#7A2328" : "#FED7B8",
                bgcolor: isLight ? "rgba(89,23,27,0.06)" : "rgba(254,215,184,0.08)",
                border: `1px solid ${isLight ? "rgba(89,23,27,0.14)" : "rgba(254,215,184,0.18)"}`,
                transition: "all 0.25s ease",
                "&:hover": {
                  bgcolor: isLight ? "rgba(89,23,27,0.12)" : "rgba(254,215,184,0.16)",
                  borderColor: isLight ? "#59171B" : "#FED7B8",
                  transform: "translateX(-3px)",
                },
              }}
            >
              Back to Landing Page
            </Button>
          </Box>

          <Box mb={3.5}>
            <Box
              sx={{
                display: { lg: "none" },
                alignItems: "center",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #59171B, #A45A4A)",
                }}
              >
                <FactoryIcon sx={{ fontSize: 22, color: "#FED7B8" }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 19 }} color="text.primary">
                Couture Intelligence
              </Typography>
            </Box>

            <Typography variant="h4" fontWeight={850} color="text.primary" sx={{ letterSpacing: "-0.025em" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, fontSize: 14.5 }}>
              {subtitle}
            </Typography>
          </Box>

          {children}

          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13.5 }}>
              {footer}
            </Typography>
          </Box>
        </motion.div>
      </Box>

      <style>{`
        @keyframes authOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(28px, -24px) scale(1.18); }
        }
      `}</style>
    </Box>
  );
}
