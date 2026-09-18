import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Chip,
  Rating,
  Tooltip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import AirIcon from "@mui/icons-material/Air";
import VerifiedIcon from "@mui/icons-material/Verified";
import Floating3DCard from "./Floating3DCard";
import linenCollectionImg from "../../images/linen_collection.png";

// The 5 key features annotated on the garment
const LINEN_FEATURES = [
  {
    id: "breeziness",
    title: "EQUIPPED WITH BREEZINESS AND SMOOTHNESS",
    tagline: "Natural Thermal Regulation",
    desc: "Micro-porous cellulosic flax fibers allow 3.5x more airflow than conventional cotton, keeping skin 3-4°C cooler in tropical warmth.",
    icon: <AirIcon sx={{ fontSize: 18 }} />,
    pinPos: { top: "18%", right: "12%" },
    metric: "3.5x Air Permeability",
  },
  {
    id: "timeless",
    title: "TIMELESS DESIGN & RELIABLE QUALITY",
    tagline: "Artisanal Tailoring",
    desc: "Reinforced French seams, genuine mother-of-pearl buttons, and double-stitched bar tacks designed to endure decades of gentle laundering.",
    icon: <VerifiedIcon sx={{ fontSize: 18 }} />,
    pinPos: { top: "62%", right: "8%" },
    metric: "10-Year Seam Guarantee",
  },
  {
    id: "eco",
    title: "FINE-QUALITY & PRODUCED WITH CARE FOR THE ENVIRONMENT",
    tagline: "100% Zero-Waste Craft",
    desc: "Dew-retted in the fields of Flanders with zero chemical processing and rainwater irrigation. Biodegradable and GOTS certified organic.",
    icon: <SpaOutlinedIcon sx={{ fontSize: 18 }} />,
    pinPos: { bottom: "12%", right: "14%" },
    metric: "0% Artificial Chemicals",
  },
  {
    id: "origin",
    title: "MADE FROM 100% NATURALLY GROWN LINEN",
    tagline: "Authentic Belgian Flax",
    desc: "Harvested from heritage flax varieties grown in fertile Normandy & Belgian soils, delivering superior tensile strength and pure natural luster.",
    icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} />,
    pinPos: { bottom: "12%", left: "14%" },
    metric: "100% Grade-A Belgian Flax",
  },
  {
    id: "softness",
    title: "SOFT TOUCH AND WRINKLE RESISTANCE",
    tagline: "Enzyme-Tumbled Softness",
    desc: "Pre-washed using organic enzyme stone tumbling to eliminate crisp stiffness, providing cloud-like tactile drape that softens with every wear.",
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
    pinPos: { top: "64%", left: "8%" },
    metric: "Pre-Shrunk & Enzyme Softened",
  },
];

export default function LinenCollection3DShowcase({ onAddToBag }) {
  const [activeFeature, setActiveFeature] = useState(LINEN_FEATURES[0]);
  const [hoveredPin, setHoveredPin] = useState(null);

  const garmentProduct = {
    id: "linen-collection-shirt",
    name: "Belgian Flax Linen Camp Shirt",
    material: "100% Belgian Organic Flax",
    price: 145.0,
    originalPrice: 180.0,
    image: linenCollectionImg,
    sizes: ["S", "M", "L", "XL"],
    tag: "SIGNATURE LINEN",
    description:
      "Crafted from 100% naturally grown Belgian flax with wrinkle-resistant enzyme finish, relaxed camp collar, and breathable drape.",
  };

  return (
    <Box
      id="linen-masterpiece"
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: "#FBF8F5",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: "center", maxWidth: 750, mx: "auto", mb: { xs: 4, md: 7 } }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important", color: "#A88362" }} />}
            label="ATELIER MASTERPIECE COLLECTION"
            size="small"
            sx={{
              bgcolor: "rgba(168, 131, 98, 0.12)",
              color: "#A88362",
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: "0.15em",
              mb: 1.5,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              color: "#231F20",
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" },
              lineHeight: 1.15,
              mb: 1.5,
            }}
          >
            The Linen Collection
          </Typography>
          <Typography variant="body1" sx={{ color: "#6E6966", fontSize: { xs: 14, md: 16 } }}>
            Sculpted from 100% pure organic Belgian flax. Hover over the interactive 3D garment callouts to inspect the artisanal tailoring and environmental provenance.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
          {/* Left Column: 3D Floating Garment Showcase with Interactive Hotspot Pins */}
          <Grid item xs={12} lg={7}>
            <Floating3DCard depth={25} glare={true}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  borderRadius: "24px",
                  overflow: "hidden",
                  bgcolor: "#A57859",
                  background: "radial-gradient(circle at 50% 50%, #B88968 0%, #9C6E4E 70%, #85593B 100%)",
                  boxShadow: "0 30px 80px rgba(70, 45, 25, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 1, sm: 2 },
                }}
              >
                {/* Garment Image */}
                <Box
                  component="img"
                  src={linenCollectionImg}
                  alt="Linen Collection Shirt"
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: { xs: 460, sm: 580, md: 660 },
                    objectFit: "contain",
                    display: "block",
                    borderRadius: "16px",
                    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))",
                    transition: "transform 0.4s ease",
                  }}
                />

                {/* 5 Interactive Glowing 3D Hotspot Pins */}
                {LINEN_FEATURES.map((feat) => {
                  const isSelected = activeFeature.id === feat.id;
                  const isHovered = hoveredPin === feat.id;

                  return (
                    <Box
                      key={feat.id}
                      onClick={() => setActiveFeature(feat)}
                      onMouseEnter={() => {
                        setHoveredPin(feat.id);
                        setActiveFeature(feat);
                      }}
                      onMouseLeave={() => setHoveredPin(null)}
                      sx={{
                        position: "absolute",
                        ...feat.pinPos,
                        zIndex: 10,
                        cursor: "pointer",
                      }}
                    >
                      {/* Pulsing Radar Ring */}
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: isSelected ? [1, 1.8, 1] : [1, 1.3, 1],
                            opacity: isSelected ? [0.8, 0, 0.8] : [0.5, 0, 0.5],
                          }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          style={{
                            position: "absolute",
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: isSelected ? "#FFFFFF" : "#D4AF37",
                          }}
                        />

                        {/* Core Pin Button */}
                        <Box
                          sx={{
                            width: isSelected ? 24 : 18,
                            height: isSelected ? 24 : 18,
                            borderRadius: "50%",
                            bgcolor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.9)",
                            border: isSelected ? "3px solid #231F20" : "2px solid #A88362",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.3s ease",
                            transform: isSelected || isHovered ? "scale(1.2)" : "scale(1)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: isSelected ? "#A88362" : "#231F20",
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                {/* Live 3D Parallax Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 18,
                    left: 18,
                    bgcolor: "rgba(20, 17, 15, 0.85)",
                    backdropFilter: "blur(14px)",
                    color: "#FFFFFF",
                    px: 1.8,
                    py: 0.8,
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pointerEvents: "none",
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
                    3D KINETIC TILT ACTIVE
                  </Typography>
                </Box>
              </Box>
            </Floating3DCard>
          </Grid>

          {/* Right Column: Interactive Feature Spec Breakdown & Direct Add to Bag */}
          <Grid item xs={12} lg={5}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Active Feature Detail Card (Framer motion smooth transition) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3.5 },
                      bgcolor: "#FFFFFF",
                      borderRadius: "20px",
                      border: "1px solid #E8E2DC",
                      boxShadow: "0 16px 40px rgba(35, 31, 28, 0.08)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "rgba(168, 131, 98, 0.12)",
                          color: "#A88362",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {activeFeature.icon}
                      </Box>
                      <Typography variant="caption" sx={{ color: "#A88362", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em" }}>
                        {activeFeature.tagline.toUpperCase()}
                      </Typography>
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontWeight: 700,
                        color: "#231F20",
                        fontSize: { xs: "1.3rem", md: "1.55rem" },
                        mb: 1.2,
                      }}
                    >
                      {activeFeature.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#6E6966", lineHeight: 1.6, mb: 2 }}>
                      {activeFeature.desc}
                    </Typography>

                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        bgcolor: "#F9F6F2",
                        px: 1.8,
                        py: 0.8,
                        borderRadius: "10px",
                        border: "1px solid #E8E2DC",
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, color: "#A88362" }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#231F20", fontSize: 12 }}>
                        {activeFeature.metric}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Interactive Feature Navigation Pills */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {LINEN_FEATURES.map((feat, idx) => {
                  const isSelected = activeFeature.id === feat.id;
                  return (
                    <Box
                      key={feat.id}
                      onClick={() => setActiveFeature(feat)}
                      sx={{
                        p: 1.8,
                        borderRadius: "14px",
                        bgcolor: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)",
                        border: isSelected ? "1.5px solid #A88362" : "1px solid #E8E2DC",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.25s ease",
                        "&:hover": {
                          bgcolor: "#FFFFFF",
                          borderColor: "#A88362",
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography sx={{ fontWeight: 800, color: isSelected ? "#A88362" : "#9C9590", fontSize: 12 }}>
                          0{idx + 1}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: isSelected ? "#231F20" : "#6E6966", fontSize: 13 }}>
                          {feat.title}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#A88362" }} />
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Direct Add to Bag CTA Bar */}
              <Box
                sx={{
                  mt: 1,
                  p: 2.5,
                  bgcolor: "#231F20",
                  borderRadius: "18px",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>
                    BELGIAN LINEN CAMP SHIRT
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                      $145.00
                    </Typography>
                    <Typography variant="caption" sx={{ textDecoration: "line-through", color: "rgba(255,255,255,0.5)" }}>
                      $180.00
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  onClick={() => onAddToBag && onAddToBag(garmentProduct)}
                  startIcon={<ShoppingBagOutlinedIcon />}
                  sx={{
                    bgcolor: "#D4AF37",
                    color: "#0C0A09",
                    fontWeight: 800,
                    fontSize: 13,
                    px: 3,
                    py: 1.2,
                    borderRadius: "12px",
                    "&:hover": { bgcolor: "#E5C158" },
                  }}
                >
                  Add to Bag
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
