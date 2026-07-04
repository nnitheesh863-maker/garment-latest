import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FactoryIcon from "@mui/icons-material/Factory";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedIcon from "@mui/icons-material/Verified";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CircleIcon from "@mui/icons-material/Circle";
import { NAV_ITEMS } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";

const iconMap = {
  Dashboard: DashboardIcon,
  People: PeopleIcon,
  Factory: FactoryIcon,
  PrecisionManufacturing: PrecisionManufacturingIcon,
  Inventory: InventoryIcon,
  ShoppingCart: ShoppingCartIcon,
  Assignment: AssignmentIcon,
  BarChart: BarChartIcon,
  Settings: SettingsIcon,
  Security: SecurityIcon,
  Verified: VerifiedIcon,
  CalendarToday: CalendarTodayIcon,
  TrendingUp: TrendingUpIcon,
  ReportProblem: ReportProblemIcon,
  OndemandVideo: OndemandVideoIcon,
  CameraAlt: CameraAltIcon,
};

const DRAWER_WIDTH = 260;

export default function Sidebar({ open, onClose, variant = "permanent" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems = NAV_ITEMS[user?.role] || [];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Drawer
      variant={isMobile ? "temporary" : variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: theme.palette.mode === "dark" ? "#1a1a2e" : "#1a1a2e",
          color: "#fff",
        },
      }}
    >
      <Box display="flex" alignItems="center" px={2} py={2.5} gap={1}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h6" fontWeight={700} color="#fff">
            G
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight={700} color="#fff">
          GarmentOS
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || DashboardIcon;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) onClose();
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: "rgba(255,255,255,0.7)",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#fff",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ px: 2, py: 2, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CircleIcon sx={{ fontSize: 10, color: "#4caf50" }} />
          <Typography variant="caption" color="rgba(255,255,255,0.6)">
            System Online
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
