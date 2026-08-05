import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import FactoryIcon from "@mui/icons-material/Factory";
import RadarIcon from "@mui/icons-material/Radar";
import SpeedIcon from "@mui/icons-material/Speed";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InsightsIcon from "@mui/icons-material/Insights";

const BRAND_FEATURES = [
  {
    icon: RadarIcon,
    title: "Real-time Production Tracking",
    desc: "Live shop-floor visibility across every line, machine and operator.",
  },
  {
    icon: InsightsIcon,
    title: "AI Predictions & Alerts",
    desc: "Forecast delays, quality drift and maintenance needs before they happen.",
  },
  {
    icon: SpeedIcon,
    title: "Smarter Workforce",
    desc: "Task allocation, attendance and performance analytics in one place.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
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
      borderRadius: 2,
      fontSize: 14.5,
      backgroundColor: bg,
      transition: "all 220ms ease",
      "& fieldset": { borderColor: border },
      "&:hover fieldset": { borderColor: isLight ? "#C9A68C" : "#5A3A44" },
      "&.Mui-focused fieldset": {
        borderColor: focusBorder,
        borderWidth: 2,
        boxShadow: `0 0 0 4px ${focusRing}`,
      },
      "&.Mui-focused": { boxShadow: `0 6px 22px ${isLight ? "rgba(89,23,27,0.09)" : "rgba(0,0,0,0.35)"}` },
      "& input": { "::placeholder": { color: isLight ? "#A8968D" : "#8A7268", opacity: 1 } },
    },
    "& .MuiInputLabel-root": { color: labelColor, fontSize: 14.5 },
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
            "linear-gradient(160deg, #3D0F12 0%, #59171B 38%, #7A2328 72%, #A45A4A 100%)",
          color: "#FFF8F2",
          '&::before': {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${new URL("../../images/garment1.jpg", import.meta.url).href})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.16,
            mixBlendMode: "luminosity",
          },
          '&::after': {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 500px at 80% -10%, rgba(254,215,184,0.16), transparent 60%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "absolute", width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(254,215,184,0.16) 0%, transparent 70%)",
          top: -80, left: -120, animation: "authOrb 10s ease-in-out infinite alternate", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(164,90,74,0.24) 0%, transparent 70%)",
          bottom: -60, right: -100, animation: "authOrb 13s ease-in-out infinite alternate-reverse", pointerEvents: "none" }} />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 2, padding: "52px 56px 28px" }}
        >
          <motion.div variants={item}>
            <Box display="flex" alignItems="center" gap={1.5} mb={5}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #FED7B8, #A45A4A)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                }}
              >
                <FactoryIcon sx={{ fontSize: 24, color: "#3D0F12" }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                  GarmentOS
                </Typography>
                <Typography sx={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(254,215,184,0.75)" }}>
                  Smart Factory ERP
                </Typography>
              </Box>
            </Box>

            <Typography variant="h3" fontWeight={800} sx={{ fontSize: { md: 30, xl: 34 }, lineHeight: 1.18, letterSpacing: "-0.02em" }}>
              Run your garment factory with the power of AI.
            </Typography>
            <Typography sx={{ mt: 2.5, mb: 5, color: "rgba(254,215,184,0.85)", fontSize: 15, lineHeight: 1.7, maxWidth: 460 }}>
              One connected platform for production planning, live tracking, quality control and workforce analytics.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {BRAND_FEATURES.map(({ icon: Icon, title: t, desc }) => (
                <motion.div key={t} variants={item}>
                  <Box display="flex" gap={2.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(254,215,184,0.14)",
                        border: "1px solid rgba(254,215,184,0.25)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <Icon sx={{ fontSize: 21, color: "#FED7B8" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{t}</Typography>
                      <Typography sx={{ fontSize: 13, color: "rgba(254,215,184,0.7)", lineHeight: 1.55, mt: 0.5 }}>
                        {desc}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </motion.div>

        <Box sx={{ position: "relative", zIndex: 2, px: "56px", pb: "28px" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <VerifiedUserIcon sx={{ fontSize: 15, color: "rgba(254,215,184,0.7)" }} />
            <Typography sx={{ fontSize: 12, color: "rgba(254,215,184,0.7)" }}>
              Enterprise-grade security · Industry 4.0 ready
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, color: "rgba(254,215,184,0.45)", mt: 0.5 }}>
            © 2026 GarmentOS · AI-Based Garment Production Optimization
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
          py: { xs: 6, md: 7 },
          px: 2,
          position: "relative",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ position: "absolute", width: 420, height: 420, borderRadius: "50%",
          background: isLight ? "radial-gradient(circle, rgba(254,215,184,0.35) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(122,35,40,0.18) 0%, transparent 70%)",
          top: -160, right: -140, pointerEvents: "none" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 440 }}
        >
          <Box mb={4}>
            <Box
              sx={{
                display: { lg: "none" },
                alignItems: "center",
                gap: 1.5,
                mb: 4,
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
                GarmentOS
              </Typography>
            </Box>

            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: "-0.02em" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: 14.5 }}>
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
          100% { transform: translate(26px, -22px) scale(1.16); }
        }
      `}</style>
    </Box>
  );
}
