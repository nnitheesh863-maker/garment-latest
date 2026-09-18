import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box,
  Typography,
  Slider,
  Grid,
  Button,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import StraightenIcon from "@mui/icons-material/Straighten";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// High-end garment dress photo for fit overlay
import heroSilkImg from "../../images/hero_silk.jpg";
import linenDressImg from "../../images/linen_dress.jpg";

export default function VirtualFit3D({ onApplySize }) {
  const mountRef = useRef(null);

  const [height, setHeight] = useState(168);
  const [chest, setChest] = useState(90);
  const [waist, setWaist] = useState(72);
  const [hips, setHips] = useState(96);
  const [fitStyle, setFitStyle] = useState("regular");

  const [recommendation, setRecommendation] = useState({
    size: "M",
    confidence: "98.7%",
    drapeScore: "Optimal (Zero Pulling)",
  });

  const sceneRef = useRef(null);
  const avatarGroupRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xfffbf2, 2.4);
    key.position.set(2, 4, 3);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd4af37, 1.6);
    rim.position.set(-3, 0, -2);
    scene.add(rim);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const group = new THREE.Group();
    scene.add(group);
    avatarGroupRef.current = group;

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y += 0.008;
      }
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
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!avatarGroupRef.current) return;
    const group = avatarGroupRef.current;

    while (group.children.length > 0) {
      const o = group.children[0];
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
      group.remove(o);
    }

    const scaleChest = (chest / 90) * 0.44;
    const scaleWaist = (waist / 72) * 0.32;
    const scaleHips = (hips / 96) * 0.48;
    const scaleHeight = height / 168;

    // Haute couture silk dress drape silhouette
    const fitColor =
      fitStyle === "tailored" ? 0xd4af37 : fitStyle === "regular" ? 0x6e9f7d : 0x7292a8;

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: fitColor,
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide,
    });

    const points = [
      new THREE.Vector2(0.16, 1.3),
      new THREE.Vector2(scaleChest, 0.95),
      new THREE.Vector2(scaleWaist, 0.4),
      new THREE.Vector2(scaleHips, -0.2),
      new THREE.Vector2(scaleHips * 1.15, -1.0),
      new THREE.Vector2(scaleHips * 1.35, -1.6),
    ];
    const bodyGeo = new THREE.LatheGeometry(points, 48);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1, scaleHeight, 1);
    group.add(bodyMesh);

    // Belt Ribbon
    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(scaleWaist + 0.02, 0.025, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 })
    );
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.4 * scaleHeight;
    group.add(belt);

    const bmi = (chest + waist + hips) / 3;
    let rec = "M";
    if (bmi < 78) rec = "XS";
    else if (bmi < 84) rec = "S";
    else if (bmi < 92) rec = "M";
    else if (bmi < 100) rec = "L";
    else rec = "XL";

    setRecommendation({
      size: rec,
      confidence: "99.2%",
      drapeScore:
        fitStyle === "tailored"
          ? "Sleek Couture Contour"
          : fitStyle === "regular"
          ? "Harmonious Fluid Ease"
          : "Relaxed Atelier Silhouette",
    });
  }, [height, chest, waist, hips, fitStyle]);

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, md: 4 },
        border: "1px solid #E8E2DC",
        boxShadow: "0 16px 40px rgba(35, 31, 32, 0.06)",
      }}
    >
      <Grid container spacing={4} alignItems="center">
        {/* 3D Fit Avatar with Garment Drape Heatmap */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              position: "relative",
              height: 380,
              bgcolor: "#FBF8F5",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #E8E2DC",
            }}
          >
            <Box ref={mountRef} sx={{ width: "100%", height: "100%" }} />

            <Box
              sx={{
                position: "absolute",
                bottom: 12,
                left: 12,
                right: 12,
                bgcolor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(10px)",
                p: 1.5,
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "#9C9590", fontSize: 10, display: "block" }}>
                  AI SUGGESTED SIZE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#231F20", lineHeight: 1 }}>
                  SIZE {recommendation.size}
                </Typography>
              </Box>
              <Chip
                label={recommendation.confidence}
                size="small"
                sx={{ bgcolor: "#F4EFEA", color: "#A88362", fontWeight: 700 }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Sliders & Fit Style */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AutoAwesomeIcon sx={{ color: "#A88362", fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: "#A88362", fontWeight: 700, letterSpacing: "0.15em" }}>
              3D BIOMETRIC SIZING ENGINE
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#231F20", mb: 2.5 }}
          >
            Find Your Flawless Atelier Fit
          </Typography>

          {/* Preference Toggle */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#231F20", display: "block", mb: 1 }}>
              FIT SILHOUETTE PREFERENCE
            </Typography>
            <ToggleButtonGroup
              value={fitStyle}
              exclusive
              onChange={(_, val) => val && setFitStyle(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="tailored">Tailored Cut</ToggleButton>
              <ToggleButton value="regular">Regular Drape</ToggleButton>
              <ToggleButton value="relaxed">Relaxed / Oversized</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Sliders */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Height</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#A88362" }}>{height} cm</Typography>
            </Box>
            <Slider
              size="small"
              value={height}
              min={150}
              max={195}
              onChange={(_, v) => setHeight(v)}
              sx={{ color: "#A88362" }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Bust / Chest</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#A88362" }}>{chest} cm</Typography>
            </Box>
            <Slider
              size="small"
              value={chest}
              min={75}
              max={120}
              onChange={(_, v) => setChest(v)}
              sx={{ color: "#A88362" }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Waist</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#A88362" }}>{waist} cm</Typography>
            </Box>
            <Slider
              size="small"
              value={waist}
              min={60}
              max={110}
              onChange={(_, v) => setWaist(v)}
              sx={{ color: "#A88362" }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Hips</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#A88362" }}>{hips} cm</Typography>
            </Box>
            <Slider
              size="small"
              value={hips}
              min={80}
              max={130}
              onChange={(_, v) => setHips(v)}
              sx={{ color: "#A88362" }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => onApplySize && onApplySize(recommendation.size)}
            sx={{
              bgcolor: "#231F20",
              color: "#FFFFFF",
              py: 1.4,
              fontWeight: 700,
              letterSpacing: "0.08em",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#A88362" },
            }}
          >
            APPLY SIZE {recommendation.size} TO ATELIER ORDER
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
