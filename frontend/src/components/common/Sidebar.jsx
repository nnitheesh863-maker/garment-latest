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
        bgcolor: '#0f172a',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
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
        }}
      >
        {!collapsed && (
          <>
            <Box display="flex" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography variant="body1" fontWeight={800} sx={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>
                  G
                </Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff', fontSize: 16 }}>
                GarmentOS
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setCollapsed(true)}
              sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' } }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}
        {collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#fff' }, mx: 'auto' }}
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
          py: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
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
                  py: 0.7,
                  mx: collapsed ? 0.5 : 0,
                  my: 0.2,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: active ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'transparent',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    color: '#fff',
                    background: active
                      ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                      : 'rgba(255,255,255,0.06)',
                  },
                  '&::before': active && !collapsed
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: -5,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        borderRadius: 2,
                        bgcolor: '#7c3aed',
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
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1,
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />
        {!collapsed && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            System Online
          </Typography>
        )}
      </Box>
    </Box>
  );
}

