import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  AvatarGroup,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  TextField,
  Dialog,
  Rating,
  Tooltip,
  Badge,
  Alert,
} from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StraightenIcon from "@mui/icons-material/Straighten";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import PinterestIcon from "@mui/icons-material/Pinterest";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SensorsIcon from "@mui/icons-material/Sensors";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "../hooks/useAuth";

// 3D Interactive Components
import Floating3DCard from "../components/3d/Floating3DCard";
import ThreeGarmentCanvas from "../components/3d/ThreeGarmentCanvas";
import Garment3DViewer from "../components/3d/Garment3DViewer";
import FabricTextureZoomer from "../components/3d/FabricTextureZoomer";
import VirtualFit3D from "../components/3d/VirtualFit3D";
import LinenCollection3DShowcase from "../components/3d/LinenCollection3DShowcase";

// High quality unique imagery
import heroSilkImg from "../images/hero_silk.jpg";
import linenDressImg from "../images/linen_dress.jpg";
import linenBlazerImg from "../images/linen_blazer.jpg";
import linenCollectionImg from "../images/linen_collection.png";
import garmentStock1 from "../images/garment1.jpg";
import garmentStock3 from "../images/garments3.jpg";
import garmentStock4 from "../images/garment4.webp";
import garmentStock2 from "../images/garment.jpg";

// Curated Luxury Color Palette (Matching Pinterest aesthetic)
const THEME = {
  bgWarm: "#FBF8F5",
  bgCard: "#FFFFFF",
  bgSecondary: "#F4EFEA",
  bgDark: "#1E1A18",
  accentCamel: "#A88362",
  accentCamelHover: "#926F50",
  accentGold: "#D4AF37",
  textPrimary: "#231F20",
  textSecondary: "#6E6966",
  textMuted: "#9C9590",
  borderLight: "#E8E2DC",
  silkGradient: "linear-gradient(135deg, #F9F5F0 0%, #EDE4DA 100%)",
  silkDark: "linear-gradient(135deg, #2B2623 0%, #171412 100%)",
};

// Initial Products Data - 100% Unique Image per Product
const PRODUCTS = [
  {
    id: "prod-1",
    name: "Linen Wrap Dress",
    material: "100% Organic Belgian Linen",
    price: 129.0,
    originalPrice: 160.0,
    rating: 4.9,
    reviews: 128,
    image: linenDressImg,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Natural Cream", "Warm Sand", "Sage"],
    tag: "BESTSELLER",
    description:
      "Crafted from premium Belgian organic flax linen. Lightweight, breathable, and designed with an elegant wrap silhouette that flatters every frame.",
  },
  {
    id: "prod-2",
    name: "Tailored Linen Blazer",
    material: "Linen Silk Blend",
    price: 179.0,
    originalPrice: 220.0,
    rating: 5.0,
    reviews: 94,
    image: linenBlazerImg,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Oatmeal Beige", "Charcoal", "Olive"],
    tag: "NEW SEASON",
    description:
      "An impeccably structured blazer woven with 70% breathable linen and 30% Mulberry silk. Clean shoulder line with horn buttons and double-vent back.",
  },
  {
    id: "prod-3",
    name: "Belgian Linen Camp Shirt",
    material: "100% Naturally Grown Linen",
    price: 145.0,
    originalPrice: 180.0,
    rating: 5.0,
    reviews: 142,
    image: linenCollectionImg,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Natural Cream", "Desert Sand", "Olive"],
    tag: "LINEN COLLECTION",
    description:
      "Equipped with natural breeziness, enzyme-softened handfeel, wrinkle-resistant drape, and French seams tailored for timeless elegance.",
  },
  {
    id: "prod-4",
    name: "Cashmere Evening Slip & Robe",
    material: "Cashmere & Silk Weave",
    price: 210.0,
    originalPrice: 270.0,
    rating: 5.0,
    reviews: 62,
    image: garmentStock1,
    sizes: ["S", "M", "L"],
    colors: ["Warm Cream", "Rose Dust"],
    tag: "ATELIER EXCLUSIVE",
    description:
      "Pure featherweight Grade-A Mongolian cashmere blended with silk for cool summer nights and refined winter layering.",
  },
  {
    id: "prod-5",
    name: "Pleated Tencel Trouser",
    material: "Botanical Tencel Twill",
    price: 135.0,
    originalPrice: 165.0,
    rating: 4.9,
    reviews: 78,
    image: garmentStock3,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Oatmeal", "Earthy Taupe", "Slate"],
    tag: "FLUID DRAPE",
    description:
      "High-waisted tailored trousers cut from silky sustainable eucalyptus fibers with deep front pleats and fluid movement.",
  },
  {
    id: "prod-6",
    name: "Atelier Structured Trench",
    material: "Heavyweight Organic Cotton",
    price: 260.0,
    originalPrice: 320.0,
    rating: 5.0,
    reviews: 51,
    image: garmentStock4,
    sizes: ["S", "M", "L"],
    colors: ["Desert Camel", "Midnight Navy"],
    tag: "SIGNATURE PIECE",
    description:
      "Double-breasted storm flap trench with horn buckle belts, deep welt pockets, and water-repellent biological plant wax finish.",
  },
];

const COLLECTIONS = [
  {
    id: "col-1",
    title: "The Belgian Linen Series",
    description: "Effortless breathable silhouettes tailored in raw Flanders flax",
    image: linenCollectionImg,
    tag: "18 PIECES",
  },
  {
    id: "col-2",
    title: "Autumn Knit & Cashmere",
    description: "Tactile ribbed sweaters, turtlenecks & brushed robes",
    image: garmentStock3,
    tag: "14 PIECES",
  },
  {
    id: "col-3",
    title: "Evening Mulberry Silk",
    description: "Flowing organza gowns, fluid slip dresses & satin blouses",
    image: heroSilkImg,
    tag: "22 PIECES",
  },
  {
    id: "col-4",
    title: "Minimal Tailoring",
    description: "Structured blazers, poplin shirting & pleated trousers",
    image: linenBlazerImg,
    tag: "26 PIECES",
  },
];

const LOOKBOOKS = [
  {
    id: "look-1",
    title: "Effortless Linen Day",
    image: linenDressImg,
    items: ["Linen Wrap Dress", "Wide Leg Pants", "Leather Atelier Mules"],
  },
  {
    id: "look-2",
    title: "Milanese City Chic",
    image: linenBlazerImg,
    items: ["Tailored Blazer", "Silk Cami", "Pleated Linen Trousers"],
  },
  {
    id: "look-3",
    title: "Nordic Winter Opulence",
    image: garmentStock4,
    items: ["Structured Trench", "Cashmere Scarf", "Handcrafted Leather Tote"],
  },
];

const REVIEWS = [
  {
    id: "rev-1",
    name: "Emily R.",
    location: "New York, USA",
    rating: 5,
    text: "The 3D interactive viewer is magical! Being able to inspect the real-time silk drape before ordering gave me complete confidence. The piece fits like high couture.",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "rev-2",
    name: "Sophia L.",
    location: "Milan, Italy",
    rating: 5,
    text: "Impeccable stitch precision, genuine sustainable fabrics, and lightning-fast worldwide delivery. The Belgian linen feels breathable yet perfectly structured.",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "rev-3",
    name: "Olivia M.",
    location: "London, UK",
    rating: 5,
    text: "Every piece feels lightweight, elegant, and timeless. The AI sizing engine suggested Size M and the drape is flawless without a millimeter to adjust.",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Shopping Bag State
  const [bagOpen, setBagOpen] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      ...PRODUCTS[0],
      selectedSize: "M",
      quantity: 1,
    },
  ]);
  const [wishlist, setWishlist] = useState(["prod-1", "prod-3"]);
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");

  // Virtual Fit Dialog State
  const [fitModalOpen, setFitModalOpen] = useState(false);

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Bag Operations
  const addToBag = (product, size = "M") => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.selectedSize === size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          material: product.material,
          image: product.image || heroSilkImg,
          selectedSize: size,
          quantity: 1,
        },
      ];
    });
    setBagOpen(true);
  };

  const updateQuantity = (id, size, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id && item.selectedSize === size) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountApplied ? subtotal * 0.15 : 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "ATELIER2026") {
      setDiscountApplied(true);
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setOrderComplete(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#A88362", "#D4AF37", "#231F20", "#EADCCF"],
    });
  };

  const getPortalRedirect = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "manager") return "/manager/dashboard";
    return "/employee/dashboard";
  };

  return (
    <Box
      sx={{
        bgcolor: THEME.bgWarm,
        minHeight: "100vh",
        color: THEME.textPrimary,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <Box
        sx={{
          bgcolor: THEME.bgDark,
          color: "#E5DDD5",
          py: 0.9,
          px: 2,
          textAlign: "center",
          fontSize: { xs: 11, sm: 12.5 },
          letterSpacing: "0.06em",
          fontWeight: 400,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ letterSpacing: "0.08em" }}>
          ✦ COMPLIMENTARY GLOBAL EXPRESS DELIVERY ON ALL BESPOKE ATELIER ORDERS • USE CODE{" "}
          <strong style={{ color: "#D4AF37" }}>ATELIER2026</strong> FOR 15% OFF
        </Typography>
      </Box>

      {/* 2. LUXURY EDITORIAL NAVBAR */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "rgba(251, 248, 245, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${THEME.borderLight}`,
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
            }}
          >
            {/* Brand Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  fontSize: { xs: 20, md: 26 },
                  color: THEME.textPrimary,
                  lineHeight: 1,
                }}
              >
                GARMENTOS <span style={{ color: THEME.accentCamel, fontWeight: 400 }}>ATELIER</span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: "0.22em",
                  fontSize: 9,
                  color: THEME.textMuted,
                  textTransform: "uppercase",
                  mt: 0.3,
                }}
              >
                3D Smart Factory & Bespoke Luxury
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 3.5,
              }}
            >
              {[
                { label: "3D Studio", href: "#3d-studio" },
                { label: "New Arrivals", href: "#new-arrivals" },
                { label: "Collections", href: "#collections" },
                { label: "Fabric Weave", href: "#fabric-weaves" },
                { label: "3D Fit Engine", href: "#fit-engine" },
                { label: "Lookbook", href: "#lookbooks" },
              ].map((item) => (
                <Button
                  key={item.label}
                  href={item.href}
                  sx={{
                    color: THEME.textPrimary,
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "none",
                    "&:hover": {
                      color: THEME.accentCamel,
                      bgcolor: "transparent",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Action Icons & Portal Link */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
              <Tooltip title="AI 3D Size Calculator">
                <IconButton
                  onClick={() => setFitModalOpen(true)}
                  sx={{ color: THEME.textPrimary }}
                >
                  <StraightenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Wishlist">
                <IconButton
                  onClick={() => setBagOpen(true)}
                  sx={{ color: THEME.textPrimary }}
                >
                  <Badge badgeContent={wishlist.length} color="secondary">
                    <FavoriteBorderIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Bespoke Bag">
                <IconButton
                  onClick={() => setBagOpen(true)}
                  sx={{ color: THEME.textPrimary }}
                >
                  <Badge
                    badgeContent={cartItems.reduce((s, i) => s + i.quantity, 0)}
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: THEME.accentCamel,
                        color: "#fff",
                      },
                    }}
                  >
                    <ShoppingBagOutlinedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Portal Access Button */}
              {user ? (
                <Button
                  component={Link}
                  to={getPortalRedirect()}
                  variant="contained"
                  startIcon={<PrecisionManufacturingIcon />}
                  sx={{
                    bgcolor: THEME.textPrimary,
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    px: 2.2,
                    py: 0.9,
                    borderRadius: "8px",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: THEME.accentCamel,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {user.role?.toUpperCase()} PORTAL
                </Button>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    sx={{
                      borderColor: THEME.textPrimary,
                      color: THEME.textPrimary,
                      fontSize: 11.5,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      px: 2,
                      py: 0.8,
                      borderRadius: "8px",
                      textTransform: "uppercase",
                      "&:hover": {
                        borderColor: THEME.accentCamel,
                        color: THEME.accentCamel,
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    SIGN IN
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    sx={{
                      bgcolor: THEME.accentCamel,
                      color: "#FFFFFF",
                      fontSize: 11.5,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      px: 2,
                      py: 0.8,
                      borderRadius: "8px",
                      textTransform: "uppercase",
                      display: { xs: "none", sm: "inline-flex" },
                      "&:hover": {
                        bgcolor: THEME.accentCamelHover,
                      },
                    }}
                  >
                    JOIN ATELIER
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3. HERO SECTION (Pinterest Layout + 3D Realistic Cloth Simulation + Kinetic Cards) */}
      <Box
        component="section"
        sx={{
          pt: { xs: 4, md: 7 },
          pb: { xs: 8, md: 11 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <Box sx={{ maxWidth: 580, mx: { xs: "auto", md: 0 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important", color: "#D4AF37" }} />}
                      label="AUTUMN / SPRING 2026 ATELIER COLLECTION"
                      size="small"
                      sx={{
                        bgcolor: "rgba(168, 131, 98, 0.12)",
                        color: THEME.accentCamel,
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        border: "1px solid rgba(168,131,98,0.25)",
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h1"
                    sx={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 500,
                      fontSize: { xs: "2.8rem", sm: "4.2rem", md: "5.0rem" },
                      lineHeight: 1.02,
                      letterSpacing: "-0.01em",
                      color: THEME.textPrimary,
                      mb: 2.5,
                    }}
                  >
                    Wear the Story.
                    <br />
                    <span style={{ fontStyle: "italic", fontWeight: 400 }}>Live the Style.</span>
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: { xs: "1.25rem", md: "1.55rem" },
                      color: THEME.textSecondary,
                      lineHeight: 1.45,
                      mb: 4.5,
                    }}
                  >
                    Timeless silhouettes rendered in hyper-realistic 3D cloth physics.
                    <br />
                    Thoughtfully crafted for your every refined moment.
                  </Typography>

                  {/* CTA Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      mb: 5,
                    }}
                  >
                    <Button
                      href="#3d-studio"
                      variant="contained"
                      startIcon={<ThreeDRotationIcon />}
                      sx={{
                        bgcolor: THEME.accentCamel,
                        color: "#FFFFFF",
                        px: { xs: 3, sm: 4 },
                        py: 1.6,
                        borderRadius: "8px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        fontSize: 13,
                        textTransform: "uppercase",
                        transition: "all 0.25s ease",
                        "&:hover": {
                          bgcolor: THEME.accentCamelHover,
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(168,131,98,0.35)",
                        },
                      }}
                    >
                      ENTER 3D ATELIER STUDIO
                    </Button>

                    <Button
                      href="#new-arrivals"
                      variant="outlined"
                      sx={{
                        borderColor: THEME.textPrimary,
                        color: THEME.textPrimary,
                        px: { xs: 3, sm: 4 },
                        py: 1.6,
                        borderRadius: "8px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        fontSize: 13,
                        textTransform: "uppercase",
                        "&:hover": {
                          borderColor: THEME.accentCamel,
                          color: THEME.accentCamel,
                          bgcolor: "transparent",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      EXPLORE READY-TO-WEAR
                    </Button>
                  </Box>

                  {/* Social Proof & Metrics */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      pt: 2.5,
                      borderTop: `1px solid ${THEME.borderLight}`,
                    }}
                  >
                    <AvatarGroup
                      max={4}
                      sx={{
                        "& .MuiAvatar-root": {
                          width: 40,
                          height: 40,
                          border: `2px solid ${THEME.bgWarm}`,
                        },
                      }}
                    >
                      <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
                      <Avatar src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" />
                      <Avatar src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" />
                      <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" />
                    </AvatarGroup>

                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Rating value={5} readOnly size="small" sx={{ color: "#D4AF37", fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: THEME.textPrimary }}>
                          5.0 / 5.0
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: THEME.textSecondary, fontSize: 12 }}>
                        Loved by 35,000+ Patrons Worldwide
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Right Hero: Real-time 3D Silk Simulation + Kinetic Floating 3D Cards (Pin 2 Style) */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <Floating3DCard depth={20} glare={true}>
                  <Box
                    sx={{
                      position: "relative",
                      height: { xs: 460, sm: 560, md: 620 },
                      borderRadius: "20px",
                      overflow: "hidden",
                      bgcolor: "#F4EFEA",
                      border: "1px solid rgba(232, 226, 220, 0.9)",
                      boxShadow: "0 30px 80px rgba(35, 31, 32, 0.15)",
                    }}
                  >
                    {/* Real-time 3D Garment WebGL Canvas & Macro Thread Inspector */}
                    <ThreeGarmentCanvas
                      height="100%"
                    />
                  </Box>
                </Floating3DCard>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. VALUE PROPOSITION PILLARS */}
      <Box sx={{ bgcolor: THEME.bgSecondary, py: 5, borderY: `1px solid ${THEME.borderLight}` }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {[
              {
                icon: <SpaOutlinedIcon sx={{ color: THEME.accentCamel, fontSize: 28 }} />,
                title: "100% Organic & Traceable",
                desc: "GOTS certified Belgian linen, mulberry silk, and Mongolian cashmere.",
              },
              {
                icon: <ViewInArIcon sx={{ color: THEME.accentCamel, fontSize: 28 }} />,
                title: "3D Realistic Fitting",
                desc: "Inspect micro-drape, fabric sheen & biometrics prior to dispatch.",
              },
              {
                icon: <LocalShippingOutlinedIcon sx={{ color: THEME.accentCamel, fontSize: 28 }} />,
                title: "Express Global Atelier",
                desc: "Complimentary DHL Express courier with carbon-neutral shipping.",
              },
              {
                icon: <ShieldOutlinedIcon sx={{ color: THEME.accentCamel, fontSize: 28 }} />,
                title: "Smart AI Quality Check",
                desc: "Zero-defect guarantee powered by GarmentOS factory computer vision.",
              },
            ].map((p, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ p: 1.2, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${THEME.borderLight}` }}>
                    {p.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: THEME.textPrimary, mb: 0.3 }}>
                      {p.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: THEME.textSecondary, lineHeight: 1.4, display: "block" }}>
                      {p.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. 3D INTERACTIVE ATELIER STUDIO (Interactive 360° Customizer) */}
      <Box id="3d-studio" component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: 6 }}>
            <Typography
              variant="caption"
              sx={{ letterSpacing: "0.25em", color: THEME.accentCamel, fontWeight: 700, textTransform: "uppercase" }}
            >
              ✦ IMMERSIVE ATELIER EXPERIENCE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                color: THEME.textPrimary,
                mt: 1,
                mb: 1.5,
              }}
            >
              Interactive 3D Garment Studio
            </Typography>
            <Typography variant="body1" sx={{ color: THEME.textSecondary }}>
              Rotate 360°, switch luxury fabrics in real-time, toggle studio lighting, and customize your bespoke piece with photorealistic PBR rendering.
            </Typography>
          </Box>

          {/* Garment 3D Turntable Component */}
          <Garment3DViewer onAddToCart={(item) => addToBag(item, "M")} />
        </Container>
      </Box>

      {/* 5B. 3D LINEN COLLECTION MASTERPIECE SHOWCASE (with 3D Parallax & Callouts) */}
      <LinenCollection3DShowcase onAddToBag={(item) => addToBag(item, "M")} />

      {/* 6. FEATURED ATELIER PRODUCTS (with 3D Tilt Hover & Quick View) */}
      <Box id="new-arrivals" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: THEME.bgSecondary }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              mb: 5,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700, textTransform: "uppercase" }}
              >
                ✦ CURATED NEW ARRIVALS
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: THEME.textPrimary, mt: 0.5 }}
              >
                Ready-to-Wear Atelier
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: THEME.textSecondary, maxWidth: 380 }}>
              Impeccably tailored timeless silhouettes woven from pure natural fibers with lifetime seam guarantees.
            </Typography>
          </Box>

          <Grid container spacing={3.5}>
            {PRODUCTS.map((product) => {
              const isWished = wishlist.includes(product.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Floating3DCard depth={15} glare={true}>
                    <Card
                      sx={{
                        bgcolor: "#FFFFFF",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: `1px solid ${THEME.borderLight}`,
                        transition: "all 0.3s ease",
                        position: "relative",
                        "&:hover": {
                          boxShadow: "0 20px 45px rgba(35, 31, 28, 0.12)",
                        },
                      }}
                    >
                      {/* Product Image Area */}
                      <Box sx={{ position: "relative", height: 380, overflow: "hidden", bgcolor: "#EDE6DF" }}>
                        <Box
                          component="img"
                          src={product.image}
                          alt={product.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
                            "&:hover": { transform: "scale(1.05)" },
                          }}
                        />

                        {/* Tag Badge */}
                        <Chip
                          label={product.tag}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            bgcolor: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(8px)",
                            color: THEME.textPrimary,
                            fontWeight: 700,
                            fontSize: 10,
                            letterSpacing: "0.05em",
                          }}
                        />

                        {/* Wishlist Button */}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          sx={{
                            position: "absolute",
                            top: 14,
                            right: 14,
                            bgcolor: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(8px)",
                            color: isWished ? "#D32F2F" : THEME.textPrimary,
                            "&:hover": { bgcolor: "#FFFFFF" },
                          }}
                        >
                          {isWished ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>

                        {/* Quick View Button on Hover */}
                        <Button
                          variant="contained"
                          onClick={() => setQuickViewProduct(product)}
                          sx={{
                            position: "absolute",
                            bottom: 14,
                            left: 14,
                            right: 14,
                            bgcolor: "rgba(35, 31, 32, 0.9)",
                            backdropFilter: "blur(8px)",
                            color: "#FFFFFF",
                            py: 1,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            borderRadius: "8px",
                            textTransform: "uppercase",
                            "&:hover": { bgcolor: THEME.accentCamel },
                          }}
                        >
                          QUICK 3D VIEW & FIT
                        </Button>
                      </Box>

                      {/* Details Area */}
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="caption" sx={{ color: THEME.accentCamel, fontWeight: 700, fontSize: 11 }}>
                          {product.material}
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.5, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20 }}>
                            {product.name}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: THEME.textPrimary }}>
                            ${product.price.toFixed(2)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Rating value={product.rating} precision={0.1} readOnly size="small" sx={{ fontSize: 15, color: "#D4AF37" }} />
                            <Typography variant="caption" sx={{ color: THEME.textSecondary, fontSize: 11 }}>
                              ({product.reviews})
                            </Typography>
                          </Box>

                          <Button
                            size="small"
                            onClick={() => addToBag(product, "M")}
                            sx={{
                              color: THEME.accentCamel,
                              fontWeight: 700,
                              fontSize: 12,
                              textTransform: "none",
                              "&:hover": { bgcolor: "transparent", color: THEME.accentCamelHover },
                            }}
                          >
                            Add to Bag +
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Floating3DCard>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* 7. TACTILE 3D FABRIC MICROSCOPY & WEAVES */}
      <Box id="fabric-weaves" component="section" sx={{ py: { xs: 8, md: 11 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", maxWidth: 680, mx: "auto", mb: 5 }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ BIOLOGICAL LUXURY WEAVES
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5, mb: 1 }}>
              Inspect Fiber Microscopy in 3D
            </Typography>
            <Typography variant="body1" sx={{ color: THEME.textSecondary }}>
              Experience the microscopic thread count, prism reflection, and breathability of our organic raw fibers.
            </Typography>
          </Box>

          <FabricTextureZoomer />
        </Container>
      </Box>

      {/* 8. 3D BIOMETRIC VIRTUAL FIT ROOM */}
      <Box id="fit-engine" component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: THEME.bgSecondary }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", maxWidth: 680, mx: "auto", mb: 5 }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ SMART BIOMETRIC ALIGNMENT
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5, mb: 1 }}>
              Interactive 3D Virtual Fitting
            </Typography>
            <Typography variant="body1" sx={{ color: THEME.textSecondary }}>
              Dial in your exact measurements to simulate drape tension in 3D and eliminate sizing guesswork.
            </Typography>
          </Box>

          <VirtualFit3D
            onApplySize={(size) => {
              setSelectedSize(size);
              alert(`Size ${size} applied to your bespoke profile!`);
            }}
          />
        </Container>
      </Box>

      {/* 9. CURATED COLLECTIONS GRID */}
      <Box id="collections" component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 5 }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ SEASONAL CAPSULES
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5 }}>
              Explore Atelier Collections
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {COLLECTIONS.map((col) => (
              <Grid item xs={12} sm={6} md={3} key={col.id}>
                <Floating3DCard depth={16} glare={true}>
                  <Box
                    sx={{
                      position: "relative",
                      height: 380,
                      borderRadius: "16px",
                      overflow: "hidden",
                      cursor: "pointer",
                      "&:hover img": { transform: "scale(1.06)" },
                    }}
                  >
                    <Box
                      component="img"
                      src={col.image}
                      alt={col.title}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(30,26,24,0.85) 100%)",
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        color: "#FFFFFF",
                      }}
                    >
                      <Chip
                        label={col.tag}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.25)",
                          backdropFilter: "blur(6px)",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: 10,
                          alignSelf: "flex-start",
                          mb: 1,
                        }}
                      />
                      <Typography variant="h5" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                        {col.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
                        {col.description}
                      </Typography>
                    </Box>
                  </Box>
                </Floating3DCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 10. EDITORIAL LOOKBOOKS */}
      <Box id="lookbooks" component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: THEME.bgSecondary }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ HOW TO STYLE
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5 }}>
              Editorial Styling Lookbooks
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {LOOKBOOKS.map((look) => (
              <Grid item xs={12} md={4} key={look.id}>
                <Floating3DCard depth={14} glare={true}>
                  <Box
                    sx={{
                      bgcolor: "#FFFFFF",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: `1px solid ${THEME.borderLight}`,
                    }}
                  >
                    <Box sx={{ height: 360, overflow: "hidden" }}>
                      <Box
                        component="img"
                        src={look.image}
                        alt={look.title}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.6s ease",
                          "&:hover": { transform: "scale(1.04)" },
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Typography variant="h6" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                        {look.title}
                      </Typography>
                      <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                        {look.items.map((item, i) => (
                          <Chip key={i} label={item} size="small" sx={{ bgcolor: "#F4EFEA", fontSize: 11 }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Floating3DCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 11. SUSTAINABILITY & SMART FACTORY INTEGRATION */}
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: THEME.bgDark, color: "#FFFFFF" }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: "#D4AF37", fontWeight: 700 }}>
                ✦ SMART ZERO-WASTE ATELIER
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: "#FFFFFF", mt: 1, mb: 2 }}
              >
                Intelligent Craftsmanship Powered by GarmentOS
              </Typography>
              <Typography variant="body1" sx={{ color: "#C4BBB5", lineHeight: 1.7, mb: 3 }}>
                Every single garment is mapped through our real-time smart production lines. Our neural computer vision engines continuously monitor stitch tension, warp alignment, and seam integrity to eliminate manufacturing waste and deliver heirloom perfection.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#D4AF37", fontFamily: "'Cormorant Garamond', serif" }}>
                      0.02%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#E5DDD5" }}>Defect Rate via AI Vision</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: "rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#D4AF37", fontFamily: "'Cormorant Garamond', serif" }}>
                      100%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#E5DDD5" }}>Biodegradable Natural Yarns</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
              >
                <Box
                  component="img"
                  src={linenBlazerImg}
                  alt="GarmentOS Smart Factory"
                  sx={{ width: "100%", height: 420, objectFit: "cover" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                    p: 2,
                    bgcolor: "rgba(30, 26, 24, 0.88)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <SensorsIcon sx={{ color: "#D4AF37", fontSize: 24 }} />
                  <Typography variant="caption" sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                    Live Factory Telemetry: IoT Loom #4 ACTIVE • 99.8% Efficiency
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 12. CLIENT REVIEWS & TESTIMONIALS */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ PATRON TESTIMONIALS
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5 }}>
              Loved Across Continents
            </Typography>
          </Box>

          <Grid container spacing={3.5}>
            {REVIEWS.map((rev) => (
              <Grid item xs={12} md={4} key={rev.id}>
                <Box
                  sx={{
                    bgcolor: "#FFFFFF",
                    p: 3.5,
                    borderRadius: "16px",
                    border: `1px solid ${THEME.borderLight}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
                  }}
                >
                  <Box>
                    <Rating value={rev.rating} readOnly size="small" sx={{ color: "#D4AF37", mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: THEME.textSecondary, fontStyle: "italic", lineHeight: 1.6, mb: 2.5 }}>
                      "{rev.text}"
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar src={rev.avatar} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: THEME.textPrimary }}>
                        {rev.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: THEME.textMuted }}>
                        {rev.location} • Verified Atelier Buyer
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 13. NEWSLETTER & VIP ATELIER SIGNUP */}
      <Box component="section" sx={{ py: 8, bgcolor: THEME.bgSecondary, borderTop: `1px solid ${THEME.borderLight}` }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" sx={{ letterSpacing: "0.2em", color: THEME.accentCamel, fontWeight: 700 }}>
              ✦ VIP ATELIER ACCESS
            </Typography>
            <Typography variant="h4" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, mt: 0.5, mb: 1 }}>
              Join the GarmentOS Atelier Circle
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.textSecondary, mb: 3 }}>
              Receive private invitations to limited bespoke capsules, custom fabric drops, and 15% off your first order.
            </Typography>

            {subscribed ? (
              <Alert severity="success" sx={{ maxWidth: 460, mx: "auto", borderRadius: "10px" }}>
                Welcome to the Atelier Circle. Check your inbox for your 15% welcome voucher!
              </Alert>
            ) : (
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setSubscribed(true);
                }}
                sx={{ display: "flex", gap: 1, maxWidth: 500, mx: "auto" }}
              >
                <TextField
                  fullWidth
                  placeholder="Enter your email address..."
                  variant="outlined"
                  size="small"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  sx={{ bgcolor: "#FFFFFF", borderRadius: "8px" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: THEME.textPrimary,
                    color: "#FFFFFF",
                    fontWeight: 700,
                    px: 3,
                    borderRadius: "8px",
                    "&:hover": { bgcolor: THEME.accentCamel },
                  }}
                >
                  SUBSCRIBE
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* 14. FOOTER */}
      <Box component="footer" sx={{ bgcolor: THEME.bgDark, color: "#E5DDD5", py: 7 }}>
        <Container maxWidth="xl">
          <Grid container spacing={5}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.15em" }}>
                GARMENTOS <span style={{ color: THEME.accentCamel }}>ATELIER</span>
              </Typography>
              <Typography variant="caption" sx={{ color: "#9C9590", display: "block", mt: 1, mb: 2 }}>
                High fashion bespoke design studio & automated zero-waste smart factory platform.
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <IconButton size="small" sx={{ color: "#E5DDD5" }}><InstagramIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: "#E5DDD5" }}><PinterestIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: "#E5DDD5" }}><FacebookIcon fontSize="small" /></IconButton>
                <IconButton size="small" sx={{ color: "#E5DDD5" }}><YouTubeIcon fontSize="small" /></IconButton>
              </Box>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 1.5 }}>COLLECTIONS</Typography>
              <List dense disablePadding>
                {["Summer Linen", "Autumn Knit", "Mulberry Silk", "Minimal Tailoring"].map((item) => (
                  <ListItem key={item} disablePadding sx={{ py: 0.4 }}>
                    <Typography variant="caption" sx={{ color: "#9C9590", cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 1.5 }}>3D EXPERIENCES</Typography>
              <List dense disablePadding>
                {["360° Studio Viewer", "3D Cloth Physics", "Fabric Microscopy", "Virtual Sizing Room"].map((item) => (
                  <ListItem key={item} disablePadding sx={{ py: 0.4 }}>
                    <Typography variant="caption" sx={{ color: "#9C9590", cursor: "pointer", "&:hover": { color: "#FFFFFF" } }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", mb: 1.5 }}>GARMENTOS PLATFORM</Typography>
              <Typography variant="caption" sx={{ color: "#9C9590", display: "block", mb: 2 }}>
                Factory Managers, Production Admins, & QC Operators can access the smart telemetry dashboard.
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                startIcon={<PrecisionManufacturingIcon />}
                sx={{
                  borderColor: "#A88362",
                  color: "#A88362",
                  fontSize: 12,
                  fontWeight: 600,
                  "&:hover": { borderColor: "#D4AF37", color: "#D4AF37" },
                }}
              >
                ACCESS FACTORY PORTAL
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.1)" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="caption" sx={{ color: "#6E6966" }}>
              © {new Date().getFullYear()} GarmentOS Atelier. All rights reserved. Designed for supreme elegance.
            </Typography>
            <Typography variant="caption" sx={{ color: "#6E6966" }}>
              Privacy Policy • Terms of Service • Ethical Sourcing
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 15. SLIDE-OUT SHOPPING BAG DRAWER */}
      <Drawer
        anchor="right"
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 440 },
            bgcolor: "#FBF8F5",
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
      >
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2, borderBottom: `1px solid ${THEME.borderLight}` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShoppingBagOutlinedIcon sx={{ color: THEME.accentCamel }} />
              <Typography variant="h6" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                Your Bespoke Bag ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </Typography>
            </Box>
            <IconButton onClick={() => setBagOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Free Shipping Alert Bar */}
          <Box sx={{ my: 2, p: 1.5, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${THEME.borderLight}` }}>
            <Typography variant="caption" sx={{ color: THEME.accentCamel, fontWeight: 700, display: "block" }}>
              ✦ COMPLIMENTARY EXPRESS GLOBAL SHIPPING
            </Typography>
            <Typography variant="caption" sx={{ color: THEME.textSecondary, fontSize: 11 }}>
              Delivered in sustainable silk gift packaging within 3-4 business days.
            </Typography>
          </Box>

          {/* Cart Items List */}
          {cartItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="body2" sx={{ color: THEME.textSecondary }}>Your bag is currently empty.</Typography>
              <Button
                variant="outlined"
                onClick={() => setBagOpen(false)}
                sx={{ mt: 2, borderColor: THEME.accentCamel, color: THEME.accentCamel }}
              >
                Discover Pieces
              </Button>
            </Box>
          ) : (
            <List sx={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto", pr: 0.5 }}>
              {cartItems.map((item) => (
                <ListItem
                  key={`${item.id}-${item.selectedSize}`}
                  alignItems="flex-start"
                  sx={{
                    bgcolor: "#FFFFFF",
                    mb: 1.5,
                    borderRadius: "12px",
                    p: 1.5,
                    border: `1px solid ${THEME.borderLight}`,
                  }}
                >
                  <ListItemAvatar>
                    <Box
                      component="img"
                      src={item.image || heroSilkImg}
                      alt={item.name}
                      sx={{ width: 60, height: 75, objectFit: "cover", borderRadius: "8px", mr: 1 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: THEME.accentCamel }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: THEME.textMuted, display: "block" }}>
                          Size: {item.selectedSize} • {item.material}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", border: `1px solid ${THEME.borderLight}`, borderRadius: "6px" }}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, item.selectedSize, -1)}
                              sx={{ p: 0.3 }}
                            >
                              <RemoveIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <Typography variant="caption" sx={{ px: 1, fontWeight: 700 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(item.id, item.selectedSize, 1)}
                              sx={{ p: 0.3 }}
                            >
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.selectedSize, -item.quantity)}
                            sx={{ color: "#D32F2F", p: 0.3 }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Bag Footer & Checkout */}
        {cartItems.length > 0 && (
          <Box sx={{ pt: 2, borderTop: `1px solid ${THEME.borderLight}` }}>
            {/* Promo Code Box */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Promo code (try ATELIER2026)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                sx={{ bgcolor: "#FFFFFF", borderRadius: "6px" }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleApplyPromo}
                sx={{ borderColor: THEME.accentCamel, color: THEME.accentCamel }}
              >
                Apply
              </Button>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: THEME.textSecondary }}>Subtotal</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</Typography>
            </Box>

            {discountApplied && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#2E7D32" }}>VIP Discount (15%)</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#2E7D32" }}>-${discount.toFixed(2)}</Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: THEME.accentCamel }}>
                ${total.toFixed(2)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => setCheckoutOpen(true)}
              sx={{
                bgcolor: THEME.textPrimary,
                color: "#FFFFFF",
                py: 1.6,
                fontWeight: 700,
                letterSpacing: "0.1em",
                borderRadius: "8px",
                "&:hover": { bgcolor: THEME.accentCamel },
              }}
            >
              PROCEED TO BESPOKE CHECKOUT
            </Button>
          </Box>
        )}
      </Drawer>

      {/* 16. QUICK 3D VIEW MODAL */}
      <Dialog
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", p: 3, bgcolor: THEME.bgWarm } }}
      >
        {quickViewProduct && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 380, borderRadius: "12px", overflow: "hidden" }}>
                <Box
                  component="img"
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: THEME.accentCamel, fontWeight: 700 }}>
                  {quickViewProduct.material}
                </Typography>
                <IconButton onClick={() => setQuickViewProduct(null)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="h4" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, mt: 0.5 }}>
                {quickViewProduct.name}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: THEME.accentCamel, my: 1 }}>
                ${quickViewProduct.price.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: THEME.textSecondary, lineHeight: 1.6, mb: 2 }}>
                {quickViewProduct.description}
              </Typography>

              {/* Size selector */}
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                SELECT SIZE:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                {quickViewProduct.sizes.map((s) => (
                  <Button
                    key={s}
                    variant={selectedSize === s ? "contained" : "outlined"}
                    onClick={() => setSelectedSize(s)}
                    size="small"
                    sx={{
                      minWidth: 40,
                      bgcolor: selectedSize === s ? THEME.accentCamel : "transparent",
                      color: selectedSize === s ? "#fff" : THEME.textPrimary,
                      borderColor: THEME.borderLight,
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  addToBag(quickViewProduct, selectedSize);
                  setQuickViewProduct(null);
                }}
                sx={{
                  bgcolor: THEME.accentCamel,
                  color: "#FFFFFF",
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: "8px",
                  "&:hover": { bgcolor: THEME.accentCamelHover },
                }}
              >
                ADD TO BESPOKE BAG
              </Button>
            </Grid>
          </Grid>
        )}
      </Dialog>

      {/* 17. VIRTUAL FIT MODAL */}
      <Dialog
        open={fitModalOpen}
        onClose={() => setFitModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", p: 2, bgcolor: THEME.bgWarm } }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={() => setFitModalOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <VirtualFit3D
          onApplySize={(size) => {
            setSelectedSize(size);
            setFitModalOpen(false);
          }}
        />
      </Dialog>

      {/* 18. CHECKOUT DIALOG */}
      <Dialog
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setOrderComplete(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", p: 3, bgcolor: THEME.bgWarm } }}
      >
        {orderComplete ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "#2E7D32", mb: 2 }} />
            <Typography variant="h4" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
              Order Confirmed & Allocated to Atelier
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.textSecondary, mt: 1, mb: 3 }}>
              Your order #GOS-{Math.floor(100000 + Math.random() * 900000)} has been assigned to our master tailors.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setCheckoutOpen(false);
                setBagOpen(false);
                setCartItems([]);
              }}
              sx={{ bgcolor: THEME.accentCamel, color: "#fff", px: 4, py: 1.2 }}
            >
              Return to Atelier
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handlePlaceOrder}>
            <Typography variant="h5" sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, mb: 2 }}>
              Bespoke Atelier Checkout
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField fullWidth label="First Name" size="small" required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Last Name" size="small" required /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Shipping Address" size="small" required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="City" size="small" required /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Country" size="small" required defaultValue="United States" /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Card Number (Demo)" size="small" defaultValue="4242 •••• •••• 4242" required /></Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: THEME.accentCamel }}>
                Total: ${total.toFixed(2)}
              </Typography>
              <Button
                type="submit"
                variant="contained"
                sx={{ bgcolor: THEME.textPrimary, color: "#fff", px: 3, py: 1.2, fontWeight: 700 }}
              >
                AUTHORIZE & CRAFT PIECE
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
