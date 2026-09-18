import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Box, Typography, Button, Grid, Chip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const FABRIC_WEAVES = [
  {
    id: "silk",
    name: "Mulberry Silk",
    subtitle: "22-Momme Satin Jacquard",
    gsm: "110 GSM",
    warp: "98 Ends/cm",
    weft: "84 Picks/cm",
    description: "Ultra-fine triangular prism fibers that refract light at varied angles for natural opalescence.",
    color: 0xeadccf,
    sheen: 1.0,
    bumpScale: 0.08,
  },
  {
    id: "flax",
    name: "Belgian Flax Linen",
    subtitle: "Plain Slub Weave",
    gsm: "185 GSM",
    warp: "42 Ends/cm",
    weft: "38 Picks/cm",
    description: "Hollow cellulosic fibers with microscopic tactile slubs creating breathable cooling micro-pockets.",
    color: 0xc8b29b,
    sheen: 0.15,
    bumpScale: 0.35,
  },
  {
    id: "cashmere",
    name: "Mongolian Cashmere",
    subtitle: "Twill Brushed Nap",
    gsm: "220 GSM",
    warp: "60 Ends/cm",
    weft: "55 Picks/cm",
    description: "Microscopic crimped underfleece providing featherweight warmth without heavy bulk.",
    color: 0xd2c0a8,
    sheen: 0.6,
    bumpScale: 0.22,
  },
];

export default function FabricTextureZoomer() {
  const mountRef = useRef(null);
  const [selectedWeave, setSelectedWeave] = useState("silk");
  const [zoomLevel, setZoomLevel] = useState(1.0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const light1 = new THREE.DirectionalLight(0xfffbf2, 2.5);
    light1.position.set(2, 3, 2);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xd4af37, 1.2);
    light2.position.set(-2, -2, 1);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const weaveConfig = FABRIC_WEAVES.find((w) => w.id === selectedWeave) || FABRIC_WEAVES[0];
    const planeGeo = new THREE.PlaneGeometry(2.4, 2.4, 60, 60);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#888888";
    ctx.fillRect(0, 0, 512, 512);

    const threads = selectedWeave === "silk" ? 32 : selectedWeave === "flax" ? 16 : 24;
    const step = 512 / threads;

    for (let i = 0; i < threads; i++) {
      for (let j = 0; j < threads; j++) {
        const isWarp = (i + j) % 2 === 0;
        ctx.fillStyle = isWarp ? "#ffffff" : "#222222";
        ctx.fillRect(i * step, j * step, step * 0.9, step * 0.9);
      }
    }

    const bumpTexture = new THREE.CanvasTexture(canvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(4, 4);

    const fabricMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(weaveConfig.color),
      roughness: selectedWeave === "silk" ? 0.2 : 0.75,
      clearcoat: selectedWeave === "silk" ? 0.8 : 0.05,
      sheen: weaveConfig.sheen,
      sheenColor: new THREE.Color(0xfff5ea),
      bumpMap: bumpTexture,
      bumpScale: weaveConfig.bumpScale,
      side: THREE.DoubleSide,
    });

    const fabricMesh = new THREE.Mesh(planeGeo, fabricMaterial);
    scene.add(fabricMesh);

    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) / 1000;
      fabricMesh.rotation.z = Math.sin(t * 0.4) * 0.04;
      fabricMesh.rotation.y = Math.sin(t * 0.6) * 0.1;
      fabricMesh.position.z = (zoomLevel - 1.0) * 1.2;
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
      planeGeo.dispose();
      fabricMaterial.dispose();
      bumpTexture.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [selectedWeave, zoomLevel]);

  const active = FABRIC_WEAVES.find((w) => w.id === selectedWeave);

  return (
    <Box
      sx={{
        bgcolor: "#FBF8F5",
        borderRadius: "20px",
        p: 3,
        border: "1px solid #E8E2DC",
      }}
    >
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box
            ref={mountRef}
            sx={{
              height: 320,
              borderRadius: "16px",
              overflow: "hidden",
              bgcolor: "#F4EFEA",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.06)",
              position: "relative",
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="caption" sx={{ color: "#A88362", fontWeight: 700, letterSpacing: "0.15em" }}>
            TACTILE 3D FABRIC MICROSCOPY
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#231F20", mt: 0.5 }}
          >
            {active?.name}
          </Typography>

          <Typography variant="caption" sx={{ color: "#6E6966", display: "block", mb: 2 }}>
            {active?.subtitle}
          </Typography>

          <Typography variant="body2" sx={{ color: "#6E6966", lineHeight: 1.6, mb: 2.5, fontSize: 13 }}>
            {active?.description}
          </Typography>

          {/* Metric specs */}
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Box sx={{ bgcolor: "#FFFFFF", p: 1.2, borderRadius: "8px", textAlign: "center", border: "1px solid #E8E2DC" }}>
                <Typography variant="caption" sx={{ color: "#9C9590", fontSize: 10 }}>WEIGHT</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#231F20" }}>{active?.gsm}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ bgcolor: "#FFFFFF", p: 1.2, borderRadius: "8px", textAlign: "center", border: "1px solid #E8E2DC" }}>
                <Typography variant="caption" sx={{ color: "#9C9590", fontSize: 10 }}>WARP DENSITY</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#231F20" }}>{active?.warp}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ bgcolor: "#FFFFFF", p: 1.2, borderRadius: "8px", textAlign: "center", border: "1px solid #E8E2DC" }}>
                <Typography variant="caption" sx={{ color: "#9C9590", fontSize: 10 }}>WEFT PICKS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#231F20" }}>{active?.weft}</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Switch weave buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {FABRIC_WEAVES.map((w) => (
              <Button
                key={w.id}
                size="small"
                variant={selectedWeave === w.id ? "contained" : "outlined"}
                onClick={() => setSelectedWeave(w.id)}
                sx={{
                  bgcolor: selectedWeave === w.id ? "#A88362" : "transparent",
                  color: selectedWeave === w.id ? "#FFFFFF" : "#231F20",
                  borderColor: "#A88362",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: selectedWeave === w.id ? "#926F50" : "#F4EFEA",
                  },
                }}
              >
                {w.name}
              </Button>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
