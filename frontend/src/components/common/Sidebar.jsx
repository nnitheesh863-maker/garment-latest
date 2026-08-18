import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, Avatar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

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

export const DRAWER_WIDTH = 248;
export const DRAWER_COLLAPSED = 84;

const MotionBox = motion.create(Box);

export default function Sidebar({ open, onClose, variant }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = NAV_ITEMS[user?.role] || [];
  const width = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const displayName = `${user?.profile?.firstName || user?.firstName || ''} ${user?.profile?.lastName || user?.lastName || ''}`.trim() || 'User';

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        height: { xs: 'calc(100vh - 20px)', md: 'calc(100vh - 24px)' },
        my: { xs: 1, md: 1.5 },
        ml: { xs: 1, md: 1.5 },
        mb: { xs: 1, md: 1.5 },
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(38,24,27,0.88) 0%, rgba(26,16,18,0.94) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,248,242,0.86) 100%)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        border: (theme) =>
          `1px solid ${theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.1)' : 'rgba(241,213,192,0.7)'}`,
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 18px 60px rgba(0,0,0,0.5)'
            : '0 18px 50px rgba(89,23,27,0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #59171B, #7A2328, #A45A4A, #FED7B8)',
        }}
      />

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
        {!collapsed ? (
          <>
            <Box display="flex" alignItems="center" gap={1.25} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
              <MotionBox
                whileHover={{ rotate: -8, scale: 1.05 }}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #59171B, #7A2328, #A45A4A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(89,23,27,0.35)',
                }}
              >
                <Typography variant="body1" fontWeight={800} sx={{ color: '#FED7B8', fontSize: 17, lineHeight: 1 }}>
                  G
                </Typography>
              </MotionBox>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: 16, letterSpacing: '-0.01em', color: 'text.primary', lineHeight: 1.1 }}>
                  GarmentOS
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 10, color: '#7A6A63', fontWeight: 500 }}>
                  Smart Factory Suite
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => setCollapsed(true)}
              sx={{ color: '#7A6A63', '&:hover': { color: '#59171B', bgcolor: 'rgba(89,23,27,0.08)' } }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        ) : (
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
          px: collapsed ? 0.75 : 1.25,
          py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#E8C0A8', borderRadius: 2 },
        }}
      >
        <AnimatePresence initial={false}>
          {navItems.map((item, index) => {
            const Icon = iconMap[item.icon] || DashboardIcon;
            const active = isActive(item.path);
            return (
              <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
                <MotionBox
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  onClick={() => { navigate(item.path); if (onClose) onClose(); }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: collapsed ? 0 : 1.5,
                    py: 0.85,
                    mx: collapsed ? 0.25 : 0,
                    my: 0.35,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    color: active ? '#FED7B8' : 'text.secondary',
                    position: 'relative',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 220ms ease',
                    background: active
                      ? 'linear-gradient(135deg, #59171B 0%, #7A2328 60%, #A45A4A 100%)'
                      : 'transparent',
                    boxShadow: active ? '0 8px 22px rgba(89,23,27,0.32)' : 'none',
                    '&:hover': {
                      color: active ? '#FED7B8' : 'primary.main',
                      background: active
                        ? 'linear-gradient(135deg, #59171B 0%, #7A2328 60%, #A45A4A 100%)'
                        : (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(164,90,74,0.16)'
                              : 'rgba(254,215,184,0.35)',
                    },
                    '&::before': active && !collapsed
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: -12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3.5,
                          height: 22,
                          borderRadius: 2,
                          bgcolor: '#FED7B8',
                          boxShadow: '0 0 10px rgba(254,215,184,0.8)',
                        }
                      : {},
                  }}
                >
                  <motion.div
                    animate={active ? { rotate: [0, -6, 6, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex' }}
                  >
                    <Icon sx={{ fontSize: collapsed ? 21 : 19 }} />
                  </motion.div>
                  {!collapsed && (
                    <Typography
                      variant="body2"
                      fontWeight={active ? 700 : 500}
                      sx={{ fontSize: 13, whiteSpace: 'nowrap', letterSpacing: '0.01em' }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </MotionBox>
              </Tooltip>
            );
          })}
        </AnimatePresence>
      </Box>

      <Box
        sx={{
          px: collapsed ? 0.75 : 1.25,
          pb: 1.5,
        }}
      >
        <Box
          sx={{
            p: collapsed ? 0.75 : 1.25,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(164,90,74,0.22), rgba(89,23,27,0.35))'
                : 'linear-gradient(135deg, rgba(254,215,184,0.45), rgba(255,248,242,0.7))',
            border: (theme) =>
              `1px solid ${theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.14)' : 'rgba(241,213,192,0.7)'}`,
          }}
        >
          {!collapsed ? (
            <>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: '#59171B',
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#FED7B8',
                  }}
                >
                  {getInitials(displayName)}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    bgcolor: '#16A34A',
                    border: '2px solid #FFF8F2',
                    boxShadow: '0 0 6px rgba(22,163,74,0.5)',
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13, color: 'text.primary' }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" noWrap sx={{ fontSize: 10.5, color: '#7A6A63', textTransform: 'capitalize' }}>
                  {user?.role}
                </Typography>
              </Box>
            </>
          ) : (
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#59171B', fontSize: 13, fontWeight: 800, color: '#FED7B8' }}>
              {getInitials(displayName)}
            </Avatar>
          )}
        </Box>
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'center',
            gap: 0.75,
            opacity: 0.85,
          }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16A34A', flexShrink: 0, boxShadow: '0 0 8px rgba(22,163,74,0.5)', animation: 'pulseRing 2.4s ease-out infinite' }} />
          {!collapsed && (
            <Typography variant="caption" sx={{ color: '#7A6A63', fontSize: 10.5, fontWeight: 500 }}>
              System Online
            </Typography>
          )}
          {!collapsed && (
            <Typography variant="caption" sx={{ color: '#E8A06B', fontSize: 10.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.4, ml: 0.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 11 }} /> AI
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
