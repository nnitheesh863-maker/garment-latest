import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Slider,
  Chip,
  Tooltip,
  Grid,
} from "@mui/material";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import LightModeIcon from "@mui/icons-material/LightMode";
import NightlightIcon from "@mui/icons-material/Nightlight";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AirIcon from "@mui/icons-material/Air";
import CheckIcon from "@mui/icons-material/Check";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// High quality garment photography
import heroSilkImg from "../../images/hero_silk.jpg";
import linenDressImg from "../../images/linen_dress.jpg";
import linenBlazerImg from "../../images/linen_blazer.jpg";
import linenCollectionImg from "../../images/linen_collection.png";
import garmentStock1 from "../../images/garment1.jpg";
import garmentStock3 from "../../images/garments3.jpg";
import garmentStock4 from "../../images/garment4.webp";

// Color presets
export const COLORWAYS = [
  { id: "champagne", name: "Champagne Pearl", hex: "#EADCCF", tintFilter: "brightness(1.0) sepia(0.12)" },
  { id: "camel", name: "Desert Camel", hex: "#A88362", tintFilter: "brightness(0.92) sepia(0.35) saturate(1.3)" },
  { id: "midnight", name: "Midnight Obsidian", hex: "#1A1A22", tintFilter: "brightness(0.45) contrast(1.3) grayscale(0.8)" },
  { id: "emerald", name: "Emerald Atelier", hex: "#1C382E", tintFilter: "hue-rotate(90deg) brightness(0.7) saturate(1.2)" },
  { id: "terracotta", name: "Terracotta Rust", hex: "#9E4F3A", tintFilter: "hue-rotate(330deg) brightness(0.85) saturate(1.4)" },
];

// Fabrics presets
export const FABRICS = [
  {
    id: "silk",
    name: "Mulberry Silk",
    badge: "22 Momme Grade 6A",
    sheenText: "High Silk Luster",
    description: "Ultra-fluid drape with pearl-like luster and natural temperature regulation.",
  },
  {
    id: "linen",
    name: "Belgian Linen",
    badge: "100% Organic Flax",
    sheenText: "Natural Matte Texture",
    description: "Tactile crisp texture, highly breathable with relaxed organic rumple.",
  },
  {
    id: "cashmere",
    name: "Mongolian Cashmere",
    badge: "Grade-A Featherweight",
    sheenText: "Soft Brushed Nap",
    description: "Incomparable cloud-soft brushed nap with lightweight thermal insulation.",
  },
  {
    id: "velvet",
    name: "Structured Velvet",
    badge: "Micro-Ribbed Atelier",
    sheenText: "Luminous Deep Pile",
    description: "Deep dimensional light absorption with rich luminous highlights.",
  },
];

// Silhouettes with unique high-resolution fashion garment photos
export const SILHOUETTES = [
  {
    id: "dress",
    name: "Silk Wrap Slip Dress",
    price: 149.0,
    image: linenDressImg,
    angles: [linenDressImg, heroSilkImg, linenDressImg],
    details: ["Flattering bias cut", "French seams", "Adjustable satin ties"],
    specs: "Crafted in Milan • 100% Pure Mulberry Silk",
  },
  {
    id: "blazer",
    name: "Tailored Atelier Blazer",
    price: 189.0,
    image: linenBlazerImg,
    angles: [linenBlazerImg, garmentStock4, linenBlazerImg],
    details: ["Structured lapels", "Horn buttons", "Double back vents"],
    specs: "Crafted in Paris • 70% Belgian Linen / 30% Silk",
  },
  {
    id: "coat",
    name: "Cashmere Trench Robe",
    price: 240.0,
    image: garmentStock4,
    angles: [garmentStock4, garmentStock1, garmentStock4],
    details: ["Fluid raglan sleeve", "Storm flap", "Self-tie belt"],
    specs: "Crafted in Florence • Grade-A Mongolian Cashmere",
  },
  {
    id: "shirt",
    name: "Belgian Linen Camp Shirt",
    price: 145.0,
    image: linenCollectionImg,
    angles: [linenCollectionImg, garmentStock3, linenCollectionImg],
    details: ["Hidden placket", "Mother-of-pearl buttons", "Curved hem"],
    specs: "Crafted in Flanders • 100% Organic Belgian Flax",
  },
];

export default function Garment3DViewer({ onAddToCart }) {
  const mountRef = useRef(null);

  // Active configurations
  const [selectedSilhouette, setSelectedSilhouette] = useState("dress");
  const [selectedFabric, setSelectedFabric] = useState("silk");
  const [selectedColor, setSelectedColor] = useState("champagne");
  const [lightingPreset, setLightingPreset] = useState("studio");
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [clothRipple, setClothRipple] = useState(1.2);
  const [wireframe, setWireframe] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 3D Canvas WebGL Background Light & Shimmer effect
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Floating Golden Luxury Dust Particles
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeed = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      particleSpeed[i] = 0.003 + Math.random() * 0.006;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.04,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      const pArr = particlePoints.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pArr[i * 3 + 1] += particleSpeed[i];
        if (pArr[i * 3 + 1] > 3) {
          pArr[i * 3 + 1] = -3;
          pArr[i * 3] = (Math.random() - 0.5) * 6;
        }
      }
      particlePoints.geometry.attributes.position.needsUpdate = true;
      particlePoints.rotation.y = elapsed * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Auto rotation loop for garment turntable
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Drag interaction
  const handleDragStart = (e) => {
    setIsDragging(true);
    const startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;

    const handleDragMove = (ev) => {
      const currentX = ev.clientX || (ev.touches && ev.touches[0].clientX) || 0;
      const deltaX = currentX - startX;
      setRotationAngle((prev) => (prev + deltaX * 0.4) % 360);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("touchend", handleDragEnd);
  };

  const activeSilData = SILHOUETTES.find((s) => s.id === selectedSilhouette) || SILHOUETTES[0];
  const activeFabData = FABRICS.find((f) => f.id === selectedFabric) || FABRICS[0];
  const activeColorData = COLORWAYS.find((c) => c.id === selectedColor) || COLORWAYS[0];

  // 3D perspective calculation from rotation angle
  const calcTiltX = Math.sin((rotationAngle * Math.PI) / 180) * 14;
  const calcTiltY = Math.cos((rotationAngle * Math.PI) / 180) * 6;

  // Lighting overlay styles
  const lightingOverlay =
    lightingPreset === "studio"
      ? "radial-gradient(circle at 65% 25%, rgba(255, 245, 230, 0.4) 0%, rgba(168, 131, 98, 0.08) 60%, transparent 85%)"
      : lightingPreset === "daylight"
      ? "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.55) 0%, rgba(181, 214, 255, 0.15) 70%, transparent 90%)"
      : "radial-gradient(circle at 75% 80%, rgba(204, 160, 85, 0.45) 0%, rgba(26, 26, 46, 0.4) 70%, transparent 95%)";

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "24px",
        p: { xs: 2.5, md: 4 },
        boxShadow: "0 20px 60px rgba(35, 31, 32, 0.08)",
        border: "1px solid #E8E2DC",
      }}
    >
      <Grid container spacing={4} alignItems="stretch">
        {/* LEFT COLUMN: Photorealistic 3D Garment Stage & Turntable */}
        <Grid item xs={12} lg={7}>
          <Box
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            sx={{
              position: "relative",
              height: { xs: 460, sm: 540, md: 620 },
              bgcolor: "#F9F6F2",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(232, 226, 220, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isDragging ? "grabbing" : "grab",
              perspective: 1200,
            }}
          >
            {/* Background 3D Canvas with Golden Silk Dust */}
            <Box
              ref={mountRef}
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {/* Dynamic Lighting Overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: lightingOverlay,
                pointerEvents: "none",
                zIndex: 2,
                transition: "background 0.5s ease",
              }}
            />

            {/* Real Garment Photo with 3D Rotation & Perspective Distortion */}
            <Box
              sx={{
                position: "relative",
                width: "82%",
                height: "86%",
                maxWidth: 440,
                transformStyle: "preserve-3d",
                transform: `rotateY(${calcTiltX}deg) rotateX(${calcTiltY}deg) scale(${zoomLevel})`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Garment Image Card */}
              <Box
                component="img"
                src={activeSilData.image}
                alt={activeSilData.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  borderRadius: "16px",
                  boxShadow: "0 24px 60px rgba(35, 31, 32, 0.18)",
                  filter: activeColorData.tintFilter,
                  transition: "filter 0.4s ease, transform 0.3s ease",
                }}
              />

              {/* Wireframe Weave Overlay Mode */}
              {wireframe && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "16px",
                    backgroundImage:
                      "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Hotspot 1: Seam Craftsmanship */}
              <Box
                sx={{
                  position: "absolute",
                  top: "32%",
                  right: "12%",
                  bgcolor: "rgba(35, 31, 32, 0.88)",
                  backdropFilter: "blur(10px)",
                  color: "#FFFFFF",
                  px: 1.5,
                  py: 0.8,
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 175, 55, 0.6)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  transform: `translateZ(25px)`,
                  pointerEvents: "none",
                }}
              >
                <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 700, fontSize: 10, display: "block" }}>
                  ✦ FRENCH SEAM DETAIL
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600 }}>
                  Zero raw edges • 100% Silk Thread
                </Typography>
              </Box>

              {/* Hotspot 2: Fabric Drape */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: "22%",
                  left: "10%",
                  bgcolor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(10px)",
                  color: "#231F20",
                  px: 1.5,
                  py: 0.8,
                  borderRadius: "8px",
                  border: "1px solid rgba(232, 226, 220, 0.9)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                  transform: `translateZ(20px)`,
                  pointerEvents: "none",
                }}
              >
                <Typography variant="caption" sx={{ color: "#A88362", fontWeight: 700, fontSize: 10, display: "block" }}>
                  ✦ TACTILE TEXTURE
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700 }}>
                  {activeFabData.badge}
                </Typography>
              </Box>
            </Box>

            {/* Top Toolbar Badges */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  icon={<ThreeDRotationIcon sx={{ fontSize: "15px !important", color: "#D4AF37" }} />}
                  label="360° GARMENT TURNTABLE"
                  size="small"
                  sx={{
                    bgcolor: "#1E1A18",
                    color: "#E5DDD5",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                  }}
                />
                <Chip
                  label={activeFabData.name}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(8px)",
                    color: "#A88362",
                    fontWeight: 700,
                    fontSize: 10,
                    border: "1px solid #E8E2DC",
                  }}
                />
              </Box>

              {/* Lighting Presets */}
              <ButtonGroup
                size="small"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Tooltip title="Warm Studio Light">
                  <IconButton
                    size="small"
                    onClick={() => setLightingPreset("studio")}
                    sx={{ color: lightingPreset === "studio" ? "#A88362" : "#9C9590" }}
                  >
                    <WbSunnyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Natural Daylight">
                  <IconButton
                    size="small"
                    onClick={() => setLightingPreset("daylight")}
                    sx={{ color: lightingPreset === "daylight" ? "#A88362" : "#9C9590" }}
                  >
                    <LightModeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Midnight Runway Light">
                  <IconButton
                    size="small"
                    onClick={() => setLightingPreset("midnight")}
                    sx={{ color: lightingPreset === "midnight" ? "#A88362" : "#9C9590" }}
                  >
                    <NightlightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            </Box>

            {/* Bottom Floating Control Bar */}
            <Box
              sx={{
                position: "absolute",
                bottom: 16,
                left: 16,
                right: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(14px)",
                px: 2,
                py: 1,
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                boxShadow: "0 10px 30px rgba(35, 31, 32, 0.08)",
                zIndex: 10,
              }}
            >
              {/* Auto rotate toggle */}
              <Button
                size="small"
                startIcon={<RotateRightIcon />}
                onClick={() => setAutoRotate(!autoRotate)}
                sx={{
                  color: autoRotate ? "#A88362" : "#6E6966",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                {autoRotate ? "Pause Turntable" : "Auto Spin 360°"}
              </Button>

              {/* Wireframe toggle */}
              <Tooltip title="Inspect Weave Grid">
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setWireframe(!wireframe)}
                  sx={{
                    color: wireframe ? "#A88362" : "#6E6966",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  {wireframe ? "Solid Photo" : "Weave Grid"}
                </Button>
              </Tooltip>

              {/* Zoom Controls */}
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <IconButton size="small" onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: "#6E6966", minWidth: 35, textAlign: "center" }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                <IconButton size="small" onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotationAngle(0);
                  }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* RIGHT COLUMN: Interactive Garment Configurator */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            {/* Header Details */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: "0.2em",
                  color: "#A88362",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                ✦ BESPOKE 3D ATELIER STUDIO
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  color: "#231F20",
                  mt: 0.5,
                  mb: 1,
                }}
              >
                {activeSilData.name}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 700,
                    color: "#A88362",
                  }}
                >
                  ${activeSilData.price.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#9C9590" }}>
                  {activeSilData.specs}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: "#6E6966", lineHeight: 1.6, mb: 3 }}>
                {activeFabData.description}
              </Typography>

              {/* 1. SELECT SILHOUETTE */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#231F20", letterSpacing: "0.08em", display: "block", mb: 1 }}>
                  1. CHOOSE GARMENT SILHOUETTE
                </Typography>
                <Grid container spacing={1}>
                  {SILHOUETTES.map((sil) => (
                    <Grid item xs={6} key={sil.id}>
                      <Box
                        onClick={() => setSelectedSilhouette(sil.id)}
                        sx={{
                          p: 1.2,
                          borderRadius: "10px",
                          border: `1.5px solid ${
                            selectedSilhouette === sil.id ? "#A88362" : "#E8E2DC"
                          }`,
                          bgcolor: selectedSilhouette === sil.id ? "#FBF8F5" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": { borderColor: "#A88362" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: selectedSilhouette === sil.id ? 700 : 500,
                            fontSize: 12.5,
                            color: "#231F20",
                          }}
                        >
                          {sil.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#A88362", fontWeight: 600 }}>
                          ${sil.price}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* 2. SELECT FABRIC & FINISH */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#231F20", letterSpacing: "0.08em", display: "block", mb: 1 }}>
                  2. SELECT SUSTAINABLE FABRIC
                </Typography>
                <Grid container spacing={1}>
                  {FABRICS.map((fab) => (
                    <Grid item xs={6} key={fab.id}>
                      <Box
                        onClick={() => setSelectedFabric(fab.id)}
                        sx={{
                          p: 1.2,
                          borderRadius: "10px",
                          border: `1.5px solid ${
                            selectedFabric === fab.id ? "#A88362" : "#E8E2DC"
                          }`,
                          bgcolor: selectedFabric === fab.id ? "#FBF8F5" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, color: "#231F20" }}>
                          {fab.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#9C9590", fontSize: 10 }}>
                          {fab.badge}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* 3. SELECT COLORWAY SWATCHES */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#231F20", letterSpacing: "0.08em", display: "block", mb: 1.2 }}>
                  3. SIGNATURE PALETTE ({activeColorData.name})
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  {COLORWAYS.map((col) => (
                    <Tooltip title={col.name} key={col.id}>
                      <Box
                        onClick={() => setSelectedColor(col.id)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: col.hex,
                          border: selectedColor === col.id ? "3px solid #231F20" : "1px solid #D1C7BD",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: selectedColor === col.id ? "scale(1.15)" : "scale(1)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selectedColor === col.id && (
                          <CheckIcon
                            sx={{
                              fontSize: 16,
                              color: col.id === "champagne" ? "#231F20" : "#FFFFFF",
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Add to Atelier Order CTA */}
            <Box sx={{ pt: 2, borderTop: "1px solid #E8E2DC" }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ShoppingBagOutlinedIcon />}
                onClick={() =>
                  onAddToCart &&
                  onAddToCart({
                    id: `custom-${selectedSilhouette}-${selectedFabric}-${selectedColor}`,
                    name: `${activeSilData.name} (${activeFabData.name})`,
                    price: activeSilData.price || 149.0,
                    material: activeFabData.name,
                    color: activeColorData.name,
                    image: activeSilData.image,
                  })
                }
                sx={{
                  bgcolor: "#A88362",
                  color: "#FFFFFF",
                  py: 1.8,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontSize: 13,
                  borderRadius: "10px",
                  textTransform: "uppercase",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    bgcolor: "#926F50",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(168,131,98,0.35)",
                  },
                }}
              >
                ADD TO BESPOKE BAG • ${(activeSilData.price || 149).toFixed(2)}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
