import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Slider,
} from "@mui/material";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import SearchIcon from "@mui/icons-material/Search";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import CheckIcon from "@mui/icons-material/Check";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Garment Silhouettes config
const SILHOUETTES = [
  {
    id: "silk_gown",
    name: "Mulberry Silk Slip Gown",
    fabricName: "Pure Mulberry Silk 6A",
    threadType: "Mulberry Silk Triangular Prism Thread",
    threadSpecs: "22-Momme Satin • 98 Warp Ends/cm • Natural Pearl Refraction",
    fiberMicron: "11.8 Micron",
    weaveType: "High-Luster Satin Weave",
    tensileStrength: "4.8 g/denier",
    baseColor: 0xeadccf,
    roughness: 0.18,
    metalness: 0.12,
    clearcoat: 0.85,
    sheen: 1.5,
    sheenColor: 0xfff0dd,
    folds: 6,
    amplitude: 0.22,
    type: "gown",
  },
  {
    id: "linen_blazer",
    name: "Belgian Flax Linen Blazer",
    fabricName: "100% Organic Belgian Flax",
    threadType: "Belgian Flax Slub Thread",
    threadSpecs: "185 GSM Plain Weave • Hollow Cellulosic Micro-Cooling Pockets",
    fiberMicron: "18.5 Micron",
    weaveType: "Cross-Hatch Slub Weave",
    tensileStrength: "6.2 g/denier",
    baseColor: 0xc9b59e,
    roughness: 0.82,
    metalness: 0.04,
    clearcoat: 0.05,
    sheen: 0.4,
    sheenColor: 0xddcbb5,
    folds: 4,
    amplitude: 0.14,
    type: "blazer",
  },
  {
    id: "cashmere_robe",
    name: "Mongolian Cashmere Robe",
    fabricName: "Grade-A Mongolian Cashmere",
    threadType: "14.5 Micron Cashmere Wool Fiber",
    threadSpecs: "220 GSM Brushed Wool Nap • Micro-Crimped Cloud Fleece",
    fiberMicron: "14.5 Micron",
    weaveType: "Brushed Twill Nap",
    tensileStrength: "3.5 g/denier",
    baseColor: 0x3d312a,
    roughness: 0.95,
    metalness: 0.02,
    clearcoat: 0.0,
    sheen: 1.8,
    sheenColor: 0xd8c2b0,
    folds: 8,
    amplitude: 0.28,
    type: "robe",
  },
];

const COLOR_SWATCHES = [
  { id: "champagne", name: "Champagne Pearl", hex: "#EADCCF", threeColor: 0xeadccf },
  { id: "camel", name: "Desert Camel", hex: "#A88362", threeColor: 0xa88362 },
  { id: "midnight", name: "Midnight Obsidian", hex: "#1A1A22", threeColor: 0x1a1a22 },
  { id: "emerald", name: "Emerald Atelier", hex: "#1C382E", threeColor: 0x1c382e },
  { id: "terracotta", name: "Terracotta Rust", hex: "#9E4F3A", threeColor: 0x9e4f3a },
];

export default function ThreeGarmentCanvas({ height = "100%" }) {
  const mountRef = useRef(null);

  // View state: 'garment' (3D Full Garment Studio) or 'macro' (Zoomed 3D Wool/Thread Weave)
  const [viewMode, setViewMode] = useState("garment");
  const [selectedSilhouette, setSelectedSilhouette] = useState(SILHOUETTES[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [macroZoom, setMacroZoom] = useState(500); // 100x to 1000x

  // References to communicate state changes to Three.js loop without tearing down context
  const stateRef = useRef({
    viewMode: "garment",
    silhouette: SILHOUETTES[0],
    colorHex: COLOR_SWATCHES[0].threeColor,
    autoRotate: true,
    macroZoom: 500,
    isInteracting: false,
  });

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
    stateRef.current.silhouette = selectedSilhouette;
    stateRef.current.colorHex = selectedColor.threeColor;
    stateRef.current.autoRotate = autoRotate;
    stateRef.current.macroZoom = macroZoom;
  }, [viewMode, selectedSilhouette, selectedColor, autoRotate, macroZoom]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const goldRim = new THREE.DirectionalLight(0xd4af37, 2.2);
    goldRim.position.set(-4, -2, 3);
    scene.add(goldRim);

    const backRim = new THREE.DirectionalLight(0xffffff, 1.8);
    backRim.position.set(0, 4, -4);
    scene.add(backRim);

    const ambient = new THREE.AmbientLight(0xfff6ea, 1.1);
    scene.add(ambient);

    // Luxury Pedestal Base for 3D Garment
    const pedestalGroup = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x221f20,
      metalness: 0.6,
      roughness: 0.3,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -1.65;
    pedestalMesh.receiveShadow = true;
    pedestalGroup.add(pedestalMesh);

    const goldRingGeo = new THREE.TorusGeometry(1.42, 0.02, 16, 64);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.15,
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = -1.61;
    pedestalGroup.add(goldRing);
    scene.add(pedestalGroup);

    // Floating Golden Dust Particles
    const particleCount = 70;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pSpeed = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      pSpeed[i] = 0.003 + Math.random() * 0.005;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ==========================================
    // 1. 3D GARMENT MESH (Haute Couture Drape)
    // ==========================================
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // Create high-subdivision parametric 3D draped cloth silhouette
    const radialSegs = 72;
    const heightSegs = 72;
    const garmentGeo = new THREE.CylinderGeometry(0.35, 1.15, 2.7, radialSegs, heightSegs, true);

    // Store base positions for vertex ripple displacement
    const posAttr = garmentGeo.attributes.position;
    const basePositions = posAttr.array.slice();

    const garmentMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(stateRef.current.colorHex),
      roughness: stateRef.current.silhouette.roughness,
      metalness: stateRef.current.silhouette.metalness,
      clearcoat: stateRef.current.silhouette.clearcoat,
      clearcoatRoughness: 0.2,
      sheen: stateRef.current.silhouette.sheen,
      sheenColor: new THREE.Color(stateRef.current.silhouette.sheenColor),
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    const garmentMesh = new THREE.Mesh(garmentGeo, garmentMaterial);
    garmentMesh.position.y = -0.15;
    garmentMesh.castShadow = true;
    garmentMesh.receiveShadow = true;
    garmentGroup.add(garmentMesh);

    // Hanger / Torso Collar Accent
    const collarGeo = new THREE.TorusGeometry(0.36, 0.025, 16, 48);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 1.2;
    garmentGroup.add(collarMesh);

    // ==========================================
    // 2. 3D MICRO THREAD & WOOL WEAVE LATTICE
    // ==========================================
    const weaveGroup = new THREE.Group();
    weaveGroup.position.set(0, 0, 0);
    weaveGroup.visible = false;
    scene.add(weaveGroup);

    // Generate interlaced cylindrical yarn threads
    const warpCount = 14;
    const weftCount = 14;
    const threadRadius = 0.052;
    const weaveLength = 2.4;
    const threadSpacing = weaveLength / (warpCount - 1);

    const threadMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(stateRef.current.colorHex),
      roughness: 0.35,
      metalness: 0.1,
      sheen: 1.4,
      sheenColor: new THREE.Color(0xffeedd),
      clearcoat: 0.5,
    });

    // Warp Threads (Vertical Yarns waving over/under)
    const warpMeshes = [];
    for (let i = 0; i < warpCount; i++) {
      const x = -weaveLength / 2 + i * threadSpacing;
      const points = [];
      for (let j = 0; j <= 40; j++) {
        const y = -weaveLength / 2 + (j / 40) * weaveLength;
        const phase = (i % 2 === 0 ? 1 : -1);
        const z = Math.sin((y / weaveLength) * Math.PI * weftCount) * 0.065 * phase;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, threadRadius, 10, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, threadMat);
      tubeMesh.castShadow = true;
      weaveGroup.add(tubeMesh);
      warpMeshes.push({ mesh: tubeMesh, origX: x });
    }

    // Weft Threads (Horizontal Yarns waving opposite)
    const weftMeshes = [];
    for (let j = 0; j < weftCount; j++) {
      const y = -weaveLength / 2 + j * threadSpacing;
      const points = [];
      for (let i = 0; i <= 40; i++) {
        const x = -weaveLength / 2 + (i / 40) * weaveLength;
        const phase = (j % 2 === 0 ? -1 : 1);
        const z = Math.sin((x / weaveLength) * Math.PI * warpCount) * 0.065 * phase;
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, threadRadius, 10, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, threadMat);
      tubeMesh.castShadow = true;
      weaveGroup.add(tubeMesh);
      weftMeshes.push({ mesh: tubeMesh, origY: y });
    }

    // ==========================================
    // Interaction & Animation Loop
    // ==========================================
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0;
    let currentRotY = 0;
    let targetRotX = 0;
    let currentRotX = 0;
    let animId;
    let startTime = performance.now();

    // Mouse Drag Rotation
    const onPointerDown = (e) => {
      isDragging = true;
      stateRef.current.isInteracting = true;
      prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      prevMouseY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      targetRotY += deltaX * 0.012;
      targetRotX += deltaY * 0.008;
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));

      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        stateRef.current.isInteracting = false;
      }, 1000);
    };

    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Target Camera positions for Garment vs Macro mode
    const garmentCamPos = new THREE.Vector3(0, 0.2, 5.2);
    const macroCamPos = new THREE.Vector3(0, 0, 2.2);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      const state = stateRef.current;

      // Update materials from state
      const targetColor = new THREE.Color(state.colorHex);
      garmentMaterial.color.lerp(targetColor, 0.1);
      threadMat.color.lerp(targetColor, 0.1);

      garmentMaterial.roughness = state.silhouette.roughness;
      garmentMaterial.metalness = state.silhouette.metalness;
      garmentMaterial.clearcoat = state.silhouette.clearcoat;
      garmentMaterial.sheen = state.silhouette.sheen;

      // Mode switching and camera interpolation
      const isMacro = state.viewMode === "macro";
      const targetCamPos = isMacro ? macroCamPos : garmentCamPos;
      camera.position.lerp(targetCamPos, 0.06);

      garmentGroup.visible = !isMacro || camera.position.z > 3.0;
      pedestalGroup.visible = !isMacro;
      weaveGroup.visible = isMacro || camera.position.z < 4.0;

      // Auto rotation
      if (state.autoRotate && !isDragging && !state.isInteracting) {
        targetRotY += isMacro ? 0.004 : 0.009;
      }

      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;

      if (!isMacro) {
        garmentGroup.rotation.y = currentRotY;
        garmentGroup.rotation.x = currentRotX;
        pedestalGroup.rotation.y = currentRotY;
      } else {
        weaveGroup.rotation.y = currentRotY * 0.5;
        weaveGroup.rotation.x = currentRotX * 0.5;
        // Dynamic zoom scale
        const scale = (state.macroZoom / 500);
        weaveGroup.scale.set(scale, scale, scale);
      }

      // ==========================================
      // Dynamic Vertex Wave Deformation (Realistic Silk & Wool Drape)
      // ==========================================
      const positions = garmentGeo.attributes.position.array;
      const count = positions.length / 3;
      const folds = state.silhouette.folds;
      const amp = state.silhouette.amplitude;

      for (let i = 0; i < count; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];

        const theta = Math.atan2(bz, bx);
        const radius = Math.sqrt(bx * bx + bz * bz);

        // Lower hem has wider drape ripples (clamp to prevent negative base in Math.pow producing NaN)
        const normalizedHeight = Math.max(0, (1.35 - by) / 2.7);
        const drapeFactor = Math.pow(normalizedHeight, 1.4);
        const wave = Math.sin(theta * folds + elapsed * 1.8 + by * 2.2) * (amp * drapeFactor);
        const microFlax = Math.cos(theta * 12 + elapsed * 3.0) * (0.02 * drapeFactor);

        const newRadius = radius + wave + microFlax;
        positions[i * 3] = Math.cos(theta) * newRadius;
        positions[i * 3 + 2] = Math.sin(theta) * newRadius;
      }
      garmentGeo.attributes.position.needsUpdate = true;
      garmentGeo.computeVertexNormals();

      // Golden particles floating
      const pArr = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pArr[i * 3 + 1] += pSpeed[i];
        if (pArr[i * 3 + 1] > 2.8) {
          pArr[i * 3 + 1] = -2.8;
          pArr[i * 3] = (Math.random() - 0.5) * 6;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.03;

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
      container.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      renderer.dispose();
      garmentGeo.dispose();
      garmentMaterial.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      goldRingGeo.dispose();
      goldRingMat.dispose();
      collarGeo.dispose();
      collarMat.dispose();
      threadMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: height,
        minHeight: { xs: 480, md: 580 },
        bgcolor: "#0C0A09",
        background: "radial-gradient(circle at 50% 35%, #2A231E 0%, #14110F 55%, #0A0807 100%)",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid rgba(212, 175, 55, 0.25)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* 3D WebGL Canvas Viewport */}
      <Box
        ref={mountRef}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          cursor: viewMode === "garment" ? "grab" : "crosshair",
          "&:active": { cursor: "grabbing" },
        }}
      />

      {/* TOP HEADER CONTROLS (Dribbble 3D App Style) */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {/* Active Mode Pill */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "rgba(20, 17, 15, 0.85)",
            backdropFilter: "blur(14px)",
            px: 1.8,
            py: 0.8,
            borderRadius: "30px",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: viewMode === "macro" ? "#4ADE80" : "#D4AF37",
              boxShadow: viewMode === "macro" ? "0 0 10px #4ADE80" : "0 0 10px #D4AF37",
            }}
          />
          <Typography sx={{ color: "#FFFFFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
            {viewMode === "garment" ? "3D ATELIER STUDIO • 360°" : "🔬 3D MACRO FIBER WEAVE"}
          </Typography>
        </Box>

        {/* Silhouette Switcher Tabs */}
        <Box
          sx={{
            display: "flex",
            gap: 0.6,
            bgcolor: "rgba(20, 17, 15, 0.85)",
            backdropFilter: "blur(14px)",
            p: 0.5,
            borderRadius: "30px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            pointerEvents: "auto",
          }}
        >
          {SILHOUETTES.map((s) => {
            const isSelected = selectedSilhouette.id === s.id;
            return (
              <Button
                key={s.id}
                size="small"
                onClick={() => setSelectedSilhouette(s)}
                sx={{
                  color: isSelected ? "#0C0A09" : "#D4AF37",
                  bgcolor: isSelected ? "#D4AF37" : "transparent",
                  fontWeight: 700,
                  fontSize: 11,
                  px: 1.5,
                  py: 0.4,
                  minWidth: "auto",
                  borderRadius: "20px",
                  "&:hover": {
                    bgcolor: isSelected ? "#E5C158" : "rgba(212, 175, 55, 0.15)",
                  },
                }}
              >
                {s.id === "silk_gown" ? "Silk Gown" : s.id === "linen_blazer" ? "Linen Blazer" : "Cashmere Robe"}
              </Button>
            );
          })}
        </Box>
      </Box>

      {/* VIEW 1: 3D GARMENT HOTSPOTS (Click-to-Zoom Callouts) */}
      {viewMode === "garment" && (
        <>
          {/* Top Right Floating Hotspot: Zoom into thread weave */}
          <Box
            onClick={() => setViewMode("macro")}
            sx={{
              position: "absolute",
              top: "22%",
              right: { xs: "5%", md: "8%" },
              zIndex: 6,
              bgcolor: "rgba(20, 17, 15, 0.9)",
              backdropFilter: "blur(16px)",
              color: "#FFFFFF",
              px: 2,
              py: 1.2,
              borderRadius: "14px",
              border: "1px solid rgba(212, 175, 55, 0.7)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              "&:hover": {
                transform: "translateY(-4px) scale(1.04)",
                borderColor: "#D4AF37",
                boxShadow: "0 16px 40px rgba(212, 175, 55, 0.35)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
              <SearchIcon sx={{ fontSize: 14, color: "#D4AF37" }} />
              <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 800, fontSize: 10, letterSpacing: "0.06em" }}>
                CLICK TO ZOOM THREAD WEAVE
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 700, color: "#F5EFEB" }}>
              {selectedSilhouette.threadType}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "block" }}>
              {selectedSilhouette.threadSpecs.split("•")[0]}
            </Typography>
          </Box>

          {/* Bottom Left Floating Hotspot: Real-time 3D Cloth Physics */}
          <Box
            sx={{
              position: "absolute",
              bottom: "20%",
              left: { xs: "5%", md: "8%" },
              zIndex: 6,
              bgcolor: "rgba(20, 17, 15, 0.88)",
              backdropFilter: "blur(14px)",
              color: "#FFFFFF",
              px: 1.8,
              py: 1,
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 800, fontSize: 10, display: "block" }}>
              ✦ LIVE 3D VERTEX PHYSICS
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF" }}>
              {selectedSilhouette.fabricName}
            </Typography>
          </Box>
        </>
      )}

      {/* VIEW 2: 3D MACRO WEAVE HUD OVERLAY (Dribbble Micro-App Mode) */}
      {viewMode === "macro" && (
        <Box
          sx={{
            position: "absolute",
            bottom: 80,
            left: 20,
            right: 20,
            zIndex: 6,
            bgcolor: "rgba(15, 12, 10, 0.92)",
            backdropFilter: "blur(20px)",
            p: 2.2,
            borderRadius: "18px",
            border: "1px solid rgba(212, 175, 55, 0.5)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BlurOnIcon sx={{ color: "#D4AF37", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: 13 }}>
                {selectedSilhouette.threadType}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setViewMode("garment")}
              sx={{
                borderColor: "#D4AF37",
                color: "#D4AF37",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: "20px",
                px: 1.5,
                py: 0.3,
                "&:hover": { bgcolor: "rgba(212, 175, 55, 0.15)", borderColor: "#D4AF37" },
              }}
            >
              ← Return to 3D Garment
            </Button>
          </Box>

          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", mb: 1.5, fontSize: 11 }}>
            {selectedSilhouette.threadSpecs}
          </Typography>

          {/* Microscopic fiber telemetry */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              bgcolor: "rgba(255,255,255,0.04)",
              p: 1.2,
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 9, display: "block" }}>
                FIBER DIAMETER
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#D4AF37", fontSize: 11 }}>
                {selectedSilhouette.fiberMicron}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 9, display: "block" }}>
                WEAVE STRUCTURE
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: 10 }}>
                {selectedSilhouette.weaveType}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 9, display: "block" }}>
                TENSILE STRENGTH
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: 11 }}>
                {selectedSilhouette.tensileStrength}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 9, display: "block" }}>
                MAGNIFICATION
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#4ADE80", fontSize: 11 }}>
                {macroZoom}X
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* BOTTOM CONTROL DOCK (Color Swatches, Zoom Weave Button, Auto-Rotate) */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "rgba(20, 17, 15, 0.85)",
          backdropFilter: "blur(16px)",
          px: 2,
          py: 1,
          borderRadius: "30px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Toggle Macro Zoom Button */}
        <Button
          size="small"
          onClick={() => setViewMode(viewMode === "garment" ? "macro" : "garment")}
          startIcon={<SearchIcon sx={{ color: "#D4AF37" }} />}
          sx={{
            color: "#FFFFFF",
            bgcolor: viewMode === "macro" ? "rgba(212, 175, 55, 0.25)" : "rgba(255,255,255,0.06)",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: "20px",
            px: 1.8,
            border: "1px solid rgba(212, 175, 55, 0.4)",
            "&:hover": { bgcolor: "rgba(212, 175, 55, 0.3)" },
          }}
        >
          {viewMode === "garment" ? "Zoom Thread & Wool Weave" : "View 3D Garment"}
        </Button>

        {/* Live Colorway Swatches */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = selectedColor.id === swatch.id;
            return (
              <Tooltip key={swatch.id} title={swatch.name}>
                <Box
                  onClick={() => setSelectedColor(swatch)}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: swatch.hex,
                    cursor: "pointer",
                    border: isSelected ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.3)",
                    boxShadow: isSelected ? "0 0 10px rgba(255,255,255,0.7)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s ease",
                    "&:hover": { transform: "scale(1.2)" },
                  }}
                >
                  {isSelected && <CheckIcon sx={{ fontSize: 13, color: swatch.id === "champagne" ? "#000" : "#FFF" }} />}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Auto Rotate Button */}
        <Button
          size="small"
          onClick={() => setAutoRotate(!autoRotate)}
          startIcon={<RotateRightIcon sx={{ fontSize: 15, color: autoRotate ? "#D4AF37" : "rgba(255,255,255,0.4)" }} />}
          sx={{
            color: autoRotate ? "#D4AF37" : "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontWeight: 600,
            minWidth: "auto",
            px: 1.2,
          }}
        >
          {autoRotate ? "Rotate Active" : "Paused"}
        </Button>
      </Box>
    </Box>
  );
}
