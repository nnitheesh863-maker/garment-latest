import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FactoryIcon from '@mui/icons-material/Factory';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

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

export const DRAWER_WIDTH = 250;
export const DRAWER_COLLAPSED = 80;

export default function Sidebar({ open, onClose, variant }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || [];
  const width = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Box
      sx={{
        width,
        height: '100vh',
        bgcolor: '#fff',
        color: '#2C1A1A',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
        borderRight: '1px solid #F1D5C0',
        boxShadow: '2px 0 20px rgba(89,23,27,0.04)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          py: 1.5,
          height: 64,
          minHeight: 64,
          borderBottom: '1px solid #F1D5C0',
        }}
      >
        {!collapsed && (
          <>
            <Box display="flex" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #59171B, #7A2328)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(89,23,27,0.3)',
                }}
              >
                <Typography variant="body1" fontWeight={800} sx={{ color: '#FED7B8', fontSize: 16, lineHeight: 1 }}>
                  G
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2C1A1A', fontSize: 16 }}>
                GarmentOS
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setCollapsed(true)}
              sx={{ color: '#7A6A63', '&:hover': { color: '#59171B', bgcolor: 'rgba(89,23,27,0.06)' } }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}
        {collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{ color: '#7A6A63', '&:hover': { color: '#59171B' }, mx: 'auto' }}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: collapsed ? 0.5 : 1.25,
          py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#F1D5C0', borderRadius: 2 },
        }}
      >
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || DashboardIcon;
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
              <Box
                onClick={() => { navigate(item.path); if (onClose) onClose(); }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: collapsed ? 0 : 1.5,
                  py: 0.75,
                  mx: collapsed ? 0.5 : 0,
                  my: 0.3,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  color: active ? '#FED7B8' : '#7A6A63',
                  background: active ? 'linear-gradient(135deg, #59171B, #7A2328)' : 'transparent',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 200ms ease',
                  boxShadow: active ? '0 4px 12px rgba(89,23,27,0.25)' : 'none',
                  '&:hover': {
                    color: active ? '#FED7B8' : '#59171B',
                    background: active
                      ? 'linear-gradient(135deg, #59171B, #7A2328)'
                      : 'rgba(254,215,184,0.2)',
                  },
                  '&::before': active && !collapsed
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: -5,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 20,
                        borderRadius: 2,
                        bgcolor: '#FED7B8',
                      }
                    : {},
                }}
              >
                <Icon sx={{ fontSize: collapsed ? 22 : 19 }} />
                {!collapsed && (
                  <Typography
                    variant="body2"
                    fontWeight={active ? 600 : 400}
                    sx={{ fontSize: 13, whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Box
        sx={{
          px: collapsed ? 0 : 2,
          py: 1.25,
          borderTop: '1px solid #F1D5C0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1,
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16a34a', flexShrink: 0, boxShadow: '0 0 6px rgba(22,163,74,0.4)' }} />
        {!collapsed && (
          <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 11 }}>
            System Online
          </Typography>
        )}
      </Box>
    </Box>
  );
}

