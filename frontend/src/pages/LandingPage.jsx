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
import { useAuth } from "../hooks/useAuth";

// High quality images
import heroSilkImg from "../images/hero_silk.jpg";
import linenDressImg from "../images/linen_dress.jpg";
import linenBlazerImg from "../images/linen_blazer.jpg";
import garmentStock1 from "../images/garment1.jpg";
import garmentStock3 from "../images/garments3.jpg";
import garmentStock4 from "../images/garment4.webp";

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

// Initial Products Data matching the Pinterest board
const PRODUCTS = [
  {
    id: "prod-1",
    name: "Linen Wrap Dress",
    material: "100% Organic Linen",
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
    name: "Silk Button-Down Blouse",
    material: "100% Pure Mulberry Silk",
    price: 149.0,
    originalPrice: 185.0,
    rating: 4.8,
    reviews: 86,
    image: heroSilkImg,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Champagne", "Ivory", "Midnight"],
    tag: "ORGANIC SILK",
    description:
      "Lustrous 22-momme grade 6A silk with a relaxed drape. Concealed mother-of-pearl button placket and French seams for timeless luxury.",
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
];

const COLLECTIONS = [
  {
    id: "col-1",
    title: "Summer Linen",
    description: "Effortless breathable silhouettes tailored in raw flax",
    image: linenDressImg,
    tag: "18 PIECES",
  },
  {
    id: "col-2",
    title: "Autumn Knit",
    description: "Tactile ribbed sweaters, turtlenecks & cardigans",
    image: garmentStock3,
    tag: "14 PIECES",
  },
  {
    id: "col-3",
    title: "Evening Silk",
    description: "Flowing organza gowns & fluid slip dresses",
    image: heroSilkImg,
    tag: "22 PIECES",
  },
  {
    id: "col-4",
    title: "Casual Cotton",
    description: "Crisp organic poplin shirts & relaxed trousers",
    image: linenBlazerImg,
    tag: "26 PIECES",
  },
];

const LOOKBOOKS = [
  {
    id: "look-1",
    title: "Effortless Day Out",
    image: linenDressImg,
    items: ["Linen Wrap Dress", "Wide Leg Pants", "Leather Atelier Sandals"],
  },
  {
    id: "look-2",
    title: "City Chic",
    image: linenBlazerImg,
    items: ["Tailored Blazer", "Silk Cami", "Pleated Linen Trousers"],
  },
  {
    id: "look-3",
    title: "Evening Elegance",
    image: heroSilkImg,
    items: ["Pure Silk Gown", "Heeled Mule", "Handwoven Mini Clutch"],
  },
];

const REVIEWS = [
  {
    id: "rev-1",
    name: "Emily R.",
    location: "New York, USA",
    rating: 5,
    text: "The quality and fit are absolutely divine. GarmentOS & Atelier is now my ultimate sanctuary for timeless, sustainable pieces.",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "rev-2",
    name: "Sophia L.",
    location: "Milan, Italy",
    rating: 5,
    text: "Beautiful clothing, genuine sustainable fabrics, and lightning-fast worldwide shipping. The stitch precision is masterclass level.",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "rev-3",
    name: "Olivia M.",
    location: "London, UK",
    rating: 5,
    text: "Every piece feels so lightweight, elegant, and breathable. I receive endless compliments whenever I wear the linen collection.",
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
  const [wishlist, setWishlist] = useState(["prod-1"]);

  // Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");

  // AI Fit Modal State
  const [fitModalOpen, setFitModalOpen] = useState(false);
  const [fitHeight, setFitHeight] = useState("168");
  const [fitWeight, setFitWeight] = useState("58");
  const [fitPreference, setFitPreference] = useState("Regular Fit");
  const [calculatedSize, setCalculatedSize] = useState(null);

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
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
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

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCalculateFit = (e) => {
    e.preventDefault();
    const h = parseFloat(fitHeight) || 165;
    const w = parseFloat(fitWeight) || 55;
    const bmi = w / Math.pow(h / 100, 2);

    let rec = "M";
    if (bmi < 19) rec = "XS";
    else if (bmi < 22) rec = "S";
    else if (bmi < 25) rec = "M";
    else if (bmi < 28) rec = "L";
    else rec = "XL";

    setCalculatedSize({
      size: rec,
      confidence: "98.4%",
      notes: `Optimal match for ${fitPreference.toLowerCase()} drape.`,
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
          ✦ COMPLIMENTARY GLOBAL EXPRESS DELIVERY ON ALL BESPOKE ATELIER ORDERS • USE CODE <strong>ATELIER2026</strong> FOR 15% OFF
        </Typography>
      </Box>

      {/* 2. LUXURY EDITORIAL NAVBAR */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "rgba(251, 248, 245, 0.94)",
          backdropFilter: "blur(14px)",
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
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
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
                Smart Factory & Bespoke Wear
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 4,
              }}
            >
              {["New Arrivals", "Collections", "How to Style", "Sustainability", "AI Sizing"].map(
                (item) => (
                  <Button
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    sx={{
                      color: THEME.textPrimary,
                      fontSize: 13.5,
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "none",
                      "&:hover": {
                        color: THEME.accentCamel,
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    {item}
                  </Button>
                )
              )}
            </Box>

            {/* Action Icons & Factory Portal Link */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
              <Tooltip title="AI Smart Size Calculator">
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

              <Tooltip title="Shopping Bag">
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
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    px: 2.2,
                    py: 0.9,
                    borderRadius: "8px",
                    textTransform: "none",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      bgcolor: THEME.accentCamel,
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 18px rgba(168,131,98,0.35)",
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
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      px: 2,
                      py: 0.8,
                      borderRadius: "8px",
                      textTransform: "uppercase",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        borderColor: THEME.accentCamel,
                        color: THEME.accentCamel,
                        bgcolor: "transparent",
                        transform: "translateY(-2px)",
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
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      px: 2,
                      py: 0.8,
                      borderRadius: "8px",
                      textTransform: "uppercase",
                      display: { xs: "none", sm: "inline-flex" },
                      transition: "all 0.25s ease",
                      "&:hover": {
                        bgcolor: THEME.accentCamelHover,
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 18px rgba(168,131,98,0.35)",
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

      {/* 3. HERO SECTION (Exact Pinterest Layout) */}
      <Box
        component="section"
        sx={{
          pt: { xs: 4, md: 8 },
          pb: { xs: 8, md: 12 },
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Left Content */}
            <Grid item xs={12} md={6}>
              <Box sx={{ maxWidth: 560, mx: { xs: "auto", md: 0 } }}>
                <Typography
                  variant="caption"
                  sx={{
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: THEME.accentCamel,
                    fontWeight: 700,
                    fontSize: 11.5,
                    display: "block",
                    mb: 1.5,
                  }}
                >
                  ✦ AUTUMN / SPRING 2026 ATELIER COLLECTION
                </Typography>

                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    fontWeight: 500,
                    fontSize: { xs: "2.8rem", sm: "4rem", md: "4.8rem" },
                    lineHeight: 1.05,
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
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    color: THEME.textSecondary,
                    lineHeight: 1.45,
                    mb: 4.5,
                  }}
                >
                  Timeless designs. Thoughtfully crafted.
                  <br />
                  Made for your every moment.
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
                    href="#new-arrivals"
                    variant="contained"
                    sx={{
                      bgcolor: THEME.accentCamel,
                      color: "#FFFFFF",
                      px: { xs: 3, sm: 4 },
                      py: 1.5,
                      borderRadius: 0,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      fontSize: 13,
                      textTransform: "uppercase",
                      "&:hover": {
                        bgcolor: THEME.accentCamelHover,
                      },
                    }}
                  >
                    SHOP NEW ARRIVALS
                  </Button>

                  <Button
                    href="#collections"
                    variant="outlined"
                    sx={{
                      borderColor: THEME.textPrimary,
                      color: THEME.textPrimary,
                      px: { xs: 3, sm: 4 },
                      py: 1.5,
                      borderRadius: 0,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      fontSize: 13,
                      textTransform: "uppercase",
                      "&:hover": {
                        borderColor: THEME.accentCamel,
                        color: THEME.accentCamel,
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    EXPLORE COLLECTIONS
                  </Button>
                </Box>

                {/* Social Proof (Customer Avatars & Count) */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    pt: 2,
                    borderTop: `1px solid ${THEME.borderLight}`,
                  }}
                >
                  <AvatarGroup
                    max={4}
                    sx={{
                      "& .MuiAvatar-root": {
                        width: 38,
                        height: 38,
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
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: THEME.textPrimary,
                      }}
                    >
                      Loved by 35,000+
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: THEME.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      Fashion Lovers & Atelier Patrons
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right Hero Image (Flowing Silk Dress) */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {/* Floating Silk Card */}
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 540,
                    height: { xs: 460, sm: 580, md: 660 },
                    position: "relative",
                    borderRadius: "4px",
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(35, 31, 32, 0.12)",
                    "&:hover img": {
                      transform: "scale(1.03)",
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={heroSilkImg}
                    alt="Wear the Story - Flowing Silk Dress"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top center",
                      transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}
                  />

                  {/* Subtle Badge Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 24,
                      left: 24,
                      right: 24,
                      bgcolor: "rgba(255, 255, 255, 0.92)",
                      backdropFilter: "blur(12px)",
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid rgba(255,255,255,0.8)",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: THEME.accentCamel,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                        }}
                      >
                        FEATURED ATELIER PIECE
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 18,
                          fontWeight: 700,
                          color: THEME.textPrimary,
                        }}
                      >
                        Ethereal Mulberry Silk Gown
                      </Typography>
                    </Box>
                    <Button
                      onClick={() => addToBag(PRODUCTS[2])}
                      size="small"
                      sx={{
                        bgcolor: THEME.textPrimary,
                        color: "#fff",
                        fontSize: 11,
                        letterSpacing: "0.05em",
                        borderRadius: 0,
                        px: 2,
                        "&:hover": { bgcolor: THEME.accentCamel },
                      }}
                    >
                      ADD TO BAG $149
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. TRUST BADGES STRIP (4 Pillars) */}
      <Box
        component="section"
        sx={{
          py: 4,
          bgcolor: THEME.bgSecondary,
          borderTop: `1px solid ${THEME.borderLight}`,
          borderBottom: `1px solid ${THEME.borderLight}`,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={3} justifyContent="space-between">
            {[
              {
                icon: <SpaOutlinedIcon sx={{ fontSize: 26, color: THEME.accentCamel }} />,
                title: "Sustainable Fabrics",
                desc: "100% Organic & OEKO-TEX Certified",
              },
              {
                icon: <ShieldOutlinedIcon sx={{ fontSize: 26, color: THEME.accentCamel }} />,
                title: "Ethically Made",
                desc: "Fair Wage & Zero-Exploitation",
              },
              {
                icon: <ReplayOutlinedIcon sx={{ fontSize: 26, color: THEME.accentCamel }} />,
                title: "Free Returns",
                desc: "30-Day Hassle-Free Exchange",
              },
              {
                icon: <LocalShippingOutlinedIcon sx={{ fontSize: 26, color: THEME.accentCamel }} />,
                title: "Worldwide Shipping",
                desc: "Insured Global Express Courier",
              },
            ].map((item, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.8,
                    p: { xs: 1, sm: 1.5 },
                  }}
                >
                  <Box>{item.icon}</Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: 13, sm: 14 },
                        color: THEME.textPrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: THEME.textSecondary,
                        fontSize: 11.5,
                        display: "block",
                        mt: 0.3,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. NEW THIS SEASON (Product Cards Slider) */}
      <Box
        component="section"
        id="new-arrivals"
        sx={{
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="xl">
          {/* Section Heading */}
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: THEME.accentCamel,
                fontWeight: 700,
                fontSize: 12,
                display: "block",
                mb: 1,
              }}
            >
              NEW ARRIVALS
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                fontWeight: 600,
                color: THEME.textPrimary,
              }}
            >
              New This Season
            </Typography>
          </Box>

          {/* Product Cards Grid */}
          <Grid container spacing={3.5}>
            {PRODUCTS.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <Card
                  sx={{
                    bgcolor: THEME.bgCard,
                    borderRadius: 0,
                    boxShadow: "none",
                    border: `1px solid ${THEME.borderLight}`,
                    transition: "all 0.35s ease",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    "&:hover": {
                      boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                      borderColor: THEME.accentCamel,
                      "& .product-img": {
                        transform: "scale(1.05)",
                      },
                      "& .quick-view-btn": {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    },
                  }}
                >
                  {/* Image Container with Hover Action */}
                  <Box
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: THEME.bgSecondary,
                      height: 380,
                    }}
                  >
                    <Box
                      component="img"
                      className="product-img"
                      src={product.image}
                      alt={product.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top center",
                        transition: "transform 0.6s ease",
                      }}
                    />

                    {/* Tag Badge */}
                    <Chip
                      label={product.tag}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        bgcolor: THEME.bgDark,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        borderRadius: 0,
                        height: 22,
                      }}
                    />

                    {/* Wishlist Button */}
                    <IconButton
                      onClick={() => toggleWishlist(product.id)}
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        bgcolor: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(4px)",
                        "&:hover": { bgcolor: "#fff" },
                      }}
                    >
                      {wishlist.includes(product.id) ? (
                        <FavoriteIcon sx={{ color: "#d32f2f", fontSize: 18 }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: THEME.textPrimary, fontSize: 18 }} />
                      )}
                    </IconButton>

                    {/* Quick View Button on Hover */}
                    <Button
                      className="quick-view-btn"
                      onClick={() => setQuickViewProduct(product)}
                      variant="contained"
                      sx={{
                        position: "absolute",
                        bottom: 14,
                        left: 14,
                        right: 14,
                        bgcolor: "rgba(255,255,255,0.95)",
                        color: THEME.textPrimary,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        borderRadius: 0,
                        py: 0.9,
                        opacity: 0,
                        transform: "translateY(10px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: THEME.textPrimary,
                          color: "#fff",
                        },
                      }}
                    >
                      QUICK VIEW
                    </Button>
                  </Box>

                  {/* Product Details */}
                  <CardContent
                    sx={{
                      p: 2.5,
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: THEME.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      {product.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: THEME.textSecondary,
                        fontSize: 12,
                        letterSpacing: "0.04em",
                        mb: 1.5,
                        display: "block",
                      }}
                    >
                      {product.material}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          fontSize: 17,
                          color: THEME.textPrimary,
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                      {product.originalPrice && (
                        <Typography
                          variant="caption"
                          sx={{
                            textDecoration: "line-through",
                            color: THEME.textMuted,
                            fontSize: 14,
                          }}
                        >
                          ${product.originalPrice.toFixed(2)}
                        </Typography>
                      )}
                    </Box>

                    {/* Add to Bag Button */}
                    <Button
                      onClick={() => addToBag(product)}
                      variant="contained"
                      startIcon={<ShoppingBagOutlinedIcon fontSize="small" />}
                      sx={{
                        mt: "auto",
                        bgcolor: THEME.accentCamel,
                        color: "#FFFFFF",
                        borderRadius: 0,
                        py: 1.1,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        "&:hover": {
                          bgcolor: THEME.accentCamelHover,
                        },
                      }}
                    >
                      ADD TO BAG
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 6. EXPLORE OUR COLLECTIONS (4-Grid Editorial) */}
      <Box
        component="section"
        id="collections"
        sx={{
          py: { xs: 8, md: 10 },
          bgcolor: THEME.bgSecondary,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: THEME.accentCamel,
                fontWeight: 700,
                fontSize: 12,
                display: "block",
                mb: 1,
              }}
            >
              CURATED EDITIONS
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                fontWeight: 600,
                color: THEME.textPrimary,
              }}
            >
              Explore Our Collections
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {COLLECTIONS.map((col) => (
              <Grid item xs={12} sm={6} md={3} key={col.id}>
                <Box
                  sx={{
                    position: "relative",
                    height: 420,
                    borderRadius: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover img": {
                      transform: "scale(1.08)",
                    },
                    "&:hover .collection-overlay": {
                      bgcolor: "rgba(30, 26, 24, 0.45)",
                    },
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
                      objectPosition: "center",
                      transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}
                  />

                  {/* Gradient & Darkening Overlay */}
                  <Box
                    className="collection-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "rgba(30, 26, 24, 0.32)",
                      transition: "bgcolor 0.4s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      p: 3.5,
                      color: "#fff",
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)",
                    }}
                  >
                    <Chip
                      label={col.tag}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        backdropFilter: "blur(4px)",
                        fontSize: 10,
                        fontWeight: 600,
                        alignSelf: "flex-start",
                        mb: 1.5,
                        borderRadius: 0,
                      }}
                    />

                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 26,
                        fontWeight: 600,
                        mb: 0.5,
                        color: "#FFFFFF",
                      }}
                    >
                      {col.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 12.5,
                        color: "rgba(255,255,255,0.85)",
                        mb: 2,
                      }}
                    >
                      {col.description}
                    </Typography>

                    <Button
                      href="#new-arrivals"
                      sx={{
                        color: "#FFFFFF",
                        borderBottom: "1px solid #FFFFFF",
                        p: 0,
                        alignSelf: "flex-start",
                        borderRadius: 0,
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        "&:hover": {
                          color: "#FED7B8",
                          borderColor: "#FED7B8",
                          bgcolor: "transparent",
                        },
                      }}
                    >
                      SHOP COLLECTION &rarr;
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 7. END OF SEASON SALE PROMO BANNER */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 11 },
          background: THEME.silkGradient,
          borderTop: `1px solid ${THEME.borderLight}`,
          borderBottom: `1px solid ${THEME.borderLight}`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="caption"
            sx={{
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: THEME.accentCamel,
              fontWeight: 700,
              fontSize: 12,
              display: "block",
              mb: 1.5,
            }}
          >
            END OF SEASON ARCHIVE SALE
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: { xs: "2.8rem", sm: "4rem", md: "4.8rem" },
              fontWeight: 600,
              color: THEME.textPrimary,
              mb: 2,
            }}
          >
            Up to 40% Off
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: { xs: "1.2rem", md: "1.4rem" },
              color: THEME.textSecondary,
              maxWidth: 580,
              mx: "auto",
              mb: 4,
            }}
          >
            Limited edition bespoke archive pieces crafted with zero-waste precision and pure natural textiles.
          </Typography>

          <Button
            href="#new-arrivals"
            variant="contained"
            sx={{
              bgcolor: THEME.textPrimary,
              color: "#FFFFFF",
              px: 5,
              py: 1.6,
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: "0.12em",
              fontSize: 13,
              textTransform: "uppercase",
              "&:hover": {
                bgcolor: THEME.accentCamel,
              },
            }}
          >
            SHOP THE SALE
          </Button>
        </Container>
      </Box>

      {/* 8. STYLE DELIVERED IN 4 SIMPLE STEPS */}
      <Box
        component="section"
        id="ai-sizing"
        sx={{
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: THEME.accentCamel,
                fontWeight: 700,
                fontSize: 12,
                display: "block",
                mb: 1,
              }}
            >
              SEAMLESS BESPOKE EXPERIENCE
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                fontWeight: 600,
                color: THEME.textPrimary,
              }}
            >
              Style Delivered in 4 Simple Steps
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {[
              {
                step: "01",
                title: "Browse",
                desc: "Explore our curated seasonal artisan collections & hand-woven fabrics.",
                icon: "🔍",
              },
              {
                step: "02",
                title: "Select Size & AI Fit",
                desc: "Find your exact bespoke biometric fit in 10 seconds with smart precision.",
                icon: "👗",
              },
              {
                step: "03",
                title: "Checkout",
                desc: "Secure, encrypted & effortless payment with live factory order tracking.",
                icon: "🛍️",
              },
              {
                step: "04",
                title: "Wear with Confidence",
                desc: "Feel timeless elegance, effortless comfort, and pure luxury every day.",
                icon: "🤍",
              },
            ].map((step, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: THEME.bgSecondary,
                      border: `1px solid ${THEME.borderLight}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      mb: 2.5,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
                    }}
                  >
                    {step.icon}
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: THEME.accentCamel,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    STEP {step.step}
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: THEME.textPrimary,
                      mb: 1.5,
                    }}
                  >
                    {step.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: THEME.textSecondary,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {step.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 9. SUSTAINABLE BY CHOICE (Split Editorial Feature) */}
      <Box
        component="section"
        id="sustainability"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: THEME.bgSecondary,
          borderTop: `1px solid ${THEME.borderLight}`,
          borderBottom: `1px solid ${THEME.borderLight}`,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
            {/* Left Narrative */}
            <Grid item xs={12} md={6}>
              <Box sx={{ maxWidth: 540 }}>
                <Typography
                  variant="caption"
                  sx={{
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: THEME.accentCamel,
                    fontWeight: 700,
                    fontSize: 12,
                    display: "block",
                    mb: 1.5,
                  }}
                >
                  SUSTAINABLE BY CHOICE
                </Typography>

                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.8rem" },
                    fontWeight: 600,
                    lineHeight: 1.15,
                    color: THEME.textPrimary,
                    mb: 3,
                  }}
                >
                  Fashion with Purpose.
                  <br />
                  Better for You. Better for Earth.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: THEME.textSecondary,
                    mb: 4,
                  }}
                >
                  We believe in slow fashion, crafted with meticulous care using OEKO-TEX certified natural linen, pure mulberry silk, and organic combed cotton. Our GarmentOS factory algorithms eliminate textile cut-waste by 94% and uphold fair living wages for every master artisan.
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {[
                    { number: "100%", label: "Organic & Biodegradable Fibers" },
                    { number: "0%", label: "Toxic Dyes & Microplastics" },
                    { number: "-84%", label: "Factory Water Footprint" },
                  ].map((stat, i) => (
                    <Grid item xs={4} key={i}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontWeight: 700,
                          color: THEME.accentCamel,
                          fontSize: { xs: 24, sm: 30 },
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: 11,
                          color: THEME.textSecondary,
                          lineHeight: 1.3,
                          display: "block",
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                <Button
                  onClick={() => setFitModalOpen(true)}
                  variant="outlined"
                  sx={{
                    borderColor: THEME.textPrimary,
                    color: THEME.textPrimary,
                    px: 4,
                    py: 1.4,
                    borderRadius: 0,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    fontSize: 12.5,
                    textTransform: "uppercase",
                    "&:hover": {
                      borderColor: THEME.accentCamel,
                      color: THEME.accentCamel,
                      bgcolor: "transparent",
                    },
                  }}
                >
                  LEARN OUR JOURNEY & FABRIC SPECS
                </Button>
              </Box>
            </Grid>

            {/* Right Photo (Organic Textiles / Cotton) */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "2px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
                  height: { xs: 360, md: 480 },
                }}
              >
                <Box
                  component="img"
                  src={garmentStock4}
                  alt="Sustainable Natural Fibers & Organic Fabrics"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 10. HOW TO STYLE IT (Lookbook Mood Boards) */}
      <Box
        component="section"
        id="how-to-style"
        sx={{
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: THEME.accentCamel,
                fontWeight: 700,
                fontSize: 12,
                display: "block",
                mb: 1,
              }}
            >
              EDITORIAL LOOKBOOK
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                fontWeight: 600,
                color: THEME.textPrimary,
              }}
            >
              How to Style It
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {LOOKBOOKS.map((look) => (
              <Grid item xs={12} md={4} key={look.id}>
                <Card
                  sx={{
                    bgcolor: THEME.bgCard,
                    borderRadius: 0,
                    boxShadow: "none",
                    border: `1px solid ${THEME.borderLight}`,
                    display: "flex",
                    flexDirection: "row",
                    height: "100%",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: THEME.accentCamel,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  {/* Left Column Image */}
                  <Box sx={{ width: "45%", position: "relative" }}>
                    <Box
                      component="img"
                      src={look.image}
                      alt={look.title}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>

                  {/* Right Column Details */}
                  <Box
                    sx={{
                      width: "55%",
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: THEME.textPrimary,
                        mb: 2,
                      }}
                    >
                      {look.title}
                    </Typography>

                    <List dense disablePadding sx={{ mb: 2.5 }}>
                      {look.items.map((item, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: THEME.textSecondary,
                              fontSize: 12.5,
                            }}
                          >
                            • {item}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      href="#new-arrivals"
                      sx={{
                        color: THEME.accentCamel,
                        borderBottom: `1px solid ${THEME.accentCamel}`,
                        p: 0,
                        alignSelf: "flex-start",
                        borderRadius: 0,
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        "&:hover": {
                          color: THEME.textPrimary,
                          borderColor: THEME.textPrimary,
                          bgcolor: "transparent",
                        },
                      }}
                    >
                      SHOP THE LOOK &rarr;
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 11. WORDS FROM OUR STYLE COMMUNITY (Testimonials) */}
      <Box
        component="section"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: THEME.bgSecondary,
          borderTop: `1px solid ${THEME.borderLight}`,
          borderBottom: `1px solid ${THEME.borderLight}`,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: THEME.accentCamel,
                fontWeight: 700,
                fontSize: 12,
                display: "block",
                mb: 1,
              }}
            >
              WORDS FROM OUR STYLE COMMUNITY
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: { xs: "2.2rem", sm: "3rem", md: "3.5rem" },
                fontWeight: 600,
                color: THEME.textPrimary,
              }}
            >
              Loved Worldwide
            </Typography>
          </Box>

          <Grid container spacing={3.5}>
            {REVIEWS.map((rev) => (
              <Grid item xs={12} md={4} key={rev.id}>
                <Card
                  sx={{
                    bgcolor: THEME.bgCard,
                    borderRadius: 0,
                    boxShadow: "none",
                    border: `1px solid ${THEME.borderLight}`,
                    p: 3.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar src={rev.avatar} sx={{ width: 44, height: 44 }} />
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, fontSize: 15, color: THEME.textPrimary }}
                      >
                        {rev.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: THEME.textMuted }}>
                        {rev.location}
                      </Typography>
                    </Box>
                  </Box>

                  <Rating
                    value={rev.rating}
                    readOnly
                    size="small"
                    sx={{ color: THEME.accentGold, mb: 2 }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: THEME.textSecondary,
                      mb: 2.5,
                      flexGrow: 1,
                    }}
                  >
                    "{rev.text}"
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <CheckCircleOutlineIcon sx={{ color: "#2e7d32", fontSize: 16 }} />
                    <Typography
                      variant="caption"
                      sx={{ color: "#2e7d32", fontWeight: 600, fontSize: 11.5 }}
                    >
                      Verified Atelier Patron
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 12. CALL TO ACTION BANNER (Discover Your Signature Style) */}
      <Box
        component="section"
        sx={{
          py: { xs: 9, md: 13 },
          background: THEME.silkGradient,
          textAlign: "center",
          position: "relative",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: { xs: "2.6rem", sm: "3.6rem", md: "4.4rem" },
              fontWeight: 600,
              color: THEME.textPrimary,
              mb: 3,
            }}
          >
            Discover Your Signature Style Today
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 18,
              color: THEME.textSecondary,
              mb: 4.5,
            }}
          >
            Step into the modern sanctuary of ethical elegance and smart tailored craftsmanship.
          </Typography>

          <Button
            href="#new-arrivals"
            variant="contained"
            sx={{
              bgcolor: THEME.textPrimary,
              color: "#FFFFFF",
              px: 5,
              py: 1.6,
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: "0.12em",
              fontSize: 13,
              textTransform: "uppercase",
              "&:hover": {
                bgcolor: THEME.accentCamel,
              },
            }}
          >
            SHOP NEW ARRIVALS
          </Button>
        </Container>
      </Box>

      {/* 13. FULL LUXURY EDITORIAL FOOTER */}
      <Box
        component="footer"
        sx={{
          bgcolor: THEME.bgDark,
          color: "#EDE6DF",
          pt: { xs: 8, md: 11 },
          pb: 5,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={5} sx={{ mb: 7 }}>
            {/* Col 1: Brand & Philosophy */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  fontSize: 24,
                  color: "#FFFFFF",
                  mb: 1.5,
                }}
              >
                GARMENTOS <span style={{ color: THEME.accentCamel, fontWeight: 400 }}>ATELIER</span>
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#A89F97",
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  mb: 3,
                  maxWidth: 320,
                }}
              >
                Timeless fashion for the modern connoisseur. Elegant. Ethical. Effortless. Powered by next-generation precision factory intelligence.
              </Typography>

              {/* Social Media Links */}
              <Box sx={{ display: "flex", gap: 1.5 }}>
                {[InstagramIcon, FacebookIcon, PinterestIcon, YouTubeIcon].map((Icon, i) => (
                  <IconButton
                    key={i}
                    size="small"
                    sx={{
                      color: "#EDE6DF",
                      border: "1px solid rgba(255,255,255,0.2)",
                      "&:hover": {
                        borderColor: THEME.accentCamel,
                        color: THEME.accentCamel,
                      },
                    }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                ))}
              </Box>
            </Grid>

            {/* Col 2: Shop Links */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography
                variant="subtitle2"
                sx={{
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#FFFFFF",
                  mb: 2.5,
                }}
              >
                SHOP
              </Typography>
              <List dense disablePadding>
                {[
                  "New Arrivals",
                  "Linen Dresses",
                  "Tailored Blazers",
                  "Pure Silk Tops",
                  "Bottoms & Trousers",
                  "Archive Sale",
                ].map((item) => (
                  <ListItem key={item} disableGutters sx={{ py: 0.6 }}>
                    <Typography
                      component="a"
                      href="#new-arrivals"
                      sx={{
                        color: "#A89F97",
                        fontSize: 13,
                        textDecoration: "none",
                        "&:hover": { color: "#FFFFFF" },
                      }}
                    >
                      {item}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Col 3: Collections & Smart Factory */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography
                variant="subtitle2"
                sx={{
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#FFFFFF",
                  mb: 2.5,
                }}
              >
                COLLECTIONS
              </Typography>
              <List dense disablePadding>
                {[
                  "Summer Linen",
                  "Autumn Knit",
                  "Evening Silk",
                  "Casual Cotton",
                  "Smart Factory Portal",
                  "Staff & Admin Login",
                ].map((item) => (
                  <ListItem key={item} disableGutters sx={{ py: 0.6 }}>
                    <Typography
                      component={Link}
                      to={item.includes("Login") || item.includes("Portal") ? "/login" : "/"}
                      sx={{
                        color: "#A89F97",
                        fontSize: 13,
                        textDecoration: "none",
                        "&:hover": { color: "#FFFFFF" },
                      }}
                    >
                      {item}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Col 4: Support & Policies */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography
                variant="subtitle2"
                sx={{
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#FFFFFF",
                  mb: 2.5,
                }}
              >
                SUPPORT
              </Typography>
              <List dense disablePadding>
                {[
                  "Help Center",
                  "AI Size Guide",
                  "Shipping & Delivery",
                  "Returns & Exchanges",
                  "Track Your Order",
                  "Factory Quality Control",
                ].map((item) => (
                  <ListItem key={item} disableGutters sx={{ py: 0.6 }}>
                    <Typography
                      component="a"
                      href="#ai-sizing"
                      onClick={() => setFitModalOpen(true)}
                      sx={{
                        color: "#A89F97",
                        fontSize: 13,
                        textDecoration: "none",
                        cursor: "pointer",
                        "&:hover": { color: "#FFFFFF" },
                      }}
                    >
                      {item}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Col 5: Newsletter */}
            <Grid item xs={12} sm={9} md={2}>
              <Typography
                variant="subtitle2"
                sx={{
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#FFFFFF",
                  mb: 1.5,
                }}
              >
                NEWSLETTER
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#A89F97",
                  fontSize: 12,
                  display: "block",
                  lineHeight: 1.5,
                  mb: 2,
                }}
              >
                Stay inspired with new arrivals, style tips & private atelier offers.
              </Typography>

              {subscribed ? (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(255,255,255,0.08)",
                    border: `1px solid ${THEME.accentCamel}`,
                    color: "#FED7B8",
                    fontSize: 12,
                  }}
                >
                  ✦ Thank you for subscribing to GarmentOS Atelier.
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail) setSubscribed(true);
                  }}
                  sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <TextField
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    size="small"
                    required
                    type="email"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      "& input": { color: "#fff", fontSize: 12.5, py: 1 },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.2)",
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: THEME.accentCamel,
                      color: "#fff",
                      borderRadius: 0,
                      fontSize: 11.5,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      py: 0.9,
                      "&:hover": { bgcolor: THEME.accentCamelHover },
                    }}
                  >
                    SUBSCRIBE
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 4 }} />

          {/* Bottom Copyright */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "#7A726C", fontSize: 11.5 }}>
              © 2026 GarmentOS & Atelier. All rights reserved. Precision Manufacturing & Sustainable Haute Couture.
            </Typography>
            <Box sx={{ display: "flex", gap: 3 }}>
              {["Privacy Policy", "Terms of Service", "Factory ISO Certifications"].map((item) => (
                <Typography
                  key={item}
                  variant="caption"
                  sx={{
                    color: "#7A726C",
                    fontSize: 11.5,
                    cursor: "pointer",
                    "&:hover": { color: "#FFFFFF" },
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 14. SHOPPING BAG DRAWER */}
      <Drawer
        anchor="right"
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 440 },
            p: 3,
            bgcolor: THEME.bgWarm,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 2,
            borderBottom: `1px solid ${THEME.borderLight}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 700,
              color: THEME.textPrimary,
            }}
          >
            Shopping Bag ({cartItems.reduce((s, i) => s + i.quantity, 0)})
          </Typography>
          <IconButton onClick={() => setBagOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {cartItems.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ShoppingBagOutlinedIcon
              sx={{ fontSize: 48, color: THEME.textMuted, mb: 2 }}
            />
            <Typography variant="body1" sx={{ color: THEME.textSecondary, mb: 3 }}>
              Your Atelier shopping bag is empty.
            </Typography>
            <Button
              onClick={() => setBagOpen(false)}
              variant="contained"
              sx={{
                bgcolor: THEME.accentCamel,
                color: "#fff",
                borderRadius: 0,
                fontSize: 12,
                px: 3,
              }}
            >
              CONTINUE SHOPPING
            </Button>
          </Box>
        ) : (
          <>
            <List sx={{ flexGrow: 1, overflowY: "auto", py: 2 }}>
              {cartItems.map((item) => (
                <ListItem
                  key={`${item.id}-${item.selectedSize}`}
                  disableGutters
                  sx={{
                    py: 2,
                    borderBottom: `1px solid ${THEME.borderLight}`,
                    alignItems: "flex-start",
                  }}
                >
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: 70,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 0,
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 18,
                          fontWeight: 700,
                          color: THEME.textPrimary,
                        }}
                      >
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: THEME.textSecondary, display: "block" }}>
                          Size: {item.selectedSize} • {item.material}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: THEME.textPrimary, mt: 0.5 }}
                        >
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.selectedSize, -1)}
                            sx={{ border: `1px solid ${THEME.borderLight}`, p: 0.3 }}
                          >
                            <RemoveIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 600, px: 1 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.selectedSize, 1)}
                            sx={{ border: `1px solid ${THEME.borderLight}`, p: 0.3 }}
                          >
                            <AddIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.selectedSize, -item.quantity)}
                            sx={{ ml: "auto", color: THEME.textMuted }}
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

            {/* Bag Checkout Summary */}
            <Box sx={{ pt: 2, borderTop: `1px solid ${THEME.borderLight}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                  Subtotal
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ${calculateTotal().toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2.5 }}>
                <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
                  Express Global Delivery
                </Typography>
                <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 700 }}>
                  FREE
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  alert(
                    "Order placed successfully! Order dispatch sent to GarmentOS Production Queue."
                  );
                  setCartItems([]);
                  setBagOpen(false);
                }}
                sx={{
                  bgcolor: THEME.accentCamel,
                  color: "#fff",
                  py: 1.5,
                  borderRadius: 0,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontSize: 13,
                  "&:hover": { bgcolor: THEME.accentCamelHover },
                }}
              >
                PROCEED TO CHECKOUT (${calculateTotal().toFixed(2)})
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      {/* 15. QUICK VIEW PRODUCT MODAL */}
      <Dialog
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: THEME.bgWarm,
            p: 0,
            overflow: "hidden",
          },
        }}
      >
        {quickViewProduct && (
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={() => setQuickViewProduct(null)}
              sx={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}
            >
              <CloseIcon />
            </IconButton>

            <Grid container>
              <Grid item xs={12} sm={6}>
                <Box
                  component="img"
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  sx={{
                    width: "100%",
                    height: { xs: 300, sm: 480 },
                    objectFit: "cover",
                  }}
                />
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
                sx={{
                  p: { xs: 3, sm: 4 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Chip
                  label={quickViewProduct.tag}
                  size="small"
                  sx={{
                    bgcolor: THEME.bgDark,
                    color: "#fff",
                    alignSelf: "flex-start",
                    borderRadius: 0,
                    fontSize: 10,
                    mb: 1.5,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 26,
                    fontWeight: 700,
                    color: THEME.textPrimary,
                    mb: 0.5,
                  }}
                >
                  {quickViewProduct.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: THEME.textSecondary, mb: 2, display: "block" }}
                >
                  {quickViewProduct.material}
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: THEME.textPrimary, mb: 2 }}
                >
                  ${quickViewProduct.price.toFixed(2)}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: THEME.textSecondary, lineHeight: 1.6, mb: 3 }}
                >
                  {quickViewProduct.description}
                </Typography>

                {/* Size Selector */}
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                  SELECT SIZE:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  {quickViewProduct.sizes.map((sz) => (
                    <Button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      variant={selectedSize === sz ? "contained" : "outlined"}
                      sx={{
                        minWidth: 42,
                        height: 38,
                        borderRadius: 0,
                        p: 0,
                        borderColor: THEME.borderLight,
                        bgcolor: selectedSize === sz ? THEME.textPrimary : "transparent",
                        color: selectedSize === sz ? "#fff" : THEME.textPrimary,
                        "&:hover": {
                          borderColor: THEME.textPrimary,
                          bgcolor: selectedSize === sz ? THEME.textPrimary : "transparent",
                        },
                      }}
                    >
                      {sz}
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
                  startIcon={<ShoppingBagOutlinedIcon />}
                  sx={{
                    bgcolor: THEME.accentCamel,
                    color: "#fff",
                    py: 1.4,
                    borderRadius: 0,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    mt: "auto",
                    "&:hover": { bgcolor: THEME.accentCamelHover },
                  }}
                >
                  ADD TO BAG • ${quickViewProduct.price.toFixed(2)}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Dialog>

      {/* 16. AI SIZING & FIT CALCULATOR MODAL */}
      <Dialog
        open={fitModalOpen}
        onClose={() => setFitModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            bgcolor: THEME.bgWarm,
            p: 3,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: THEME.accentCamel, fontWeight: 700, letterSpacing: "0.1em" }}
            >
              GARMENTOS AI BESPOKE SIZING
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}
            >
              Smart Biometric Fit Finder
            </Typography>
          </Box>
          <IconButton onClick={() => setFitModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ color: THEME.textSecondary, mb: 3 }}>
          Our neural tailoring engine computes the exact garment pattern matching your body proportions with 98.4% precision.
        </Typography>

        <Box component="form" onSubmit={handleCalculateFit}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Height (cm)"
                type="number"
                value={fitHeight}
                onChange={(e) => setFitHeight(e.target.value)}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                value={fitWeight}
                onChange={(e) => setFitWeight(e.target.value)}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Fit Preference"
                value={fitPreference}
                onChange={(e) => setFitPreference(e.target.value)}
                size="small"
              >
                <option value="Fitted Silhouette">Fitted / Tailored Silhouette</option>
                <option value="Regular Fit">Regular / Classic Drape</option>
                <option value="Relaxed Oversized">Relaxed / Flowing Oversized</option>
              </TextField>
            </Grid>
          </Grid>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{
              bgcolor: THEME.textPrimary,
              color: "#fff",
              py: 1.3,
              borderRadius: 0,
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: "0.08em",
              "&:hover": { bgcolor: THEME.accentCamel },
            }}
          >
            CALCULATE MY BESPOKE SIZE
          </Button>
        </Box>

        {calculatedSize && (
          <Box
            sx={{
              mt: 3,
              p: 2.5,
              bgcolor: THEME.bgSecondary,
              border: `1px solid ${THEME.accentCamel}`,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: THEME.accentCamel, fontWeight: 700 }}>
              RECOMMENDED ATELIER SIZE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                color: THEME.textPrimary,
                my: 0.5,
              }}
            >
              SIZE {calculatedSize.size}
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.textSecondary }}>
              {calculatedSize.notes} (Confidence: {calculatedSize.confidence})
            </Typography>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
