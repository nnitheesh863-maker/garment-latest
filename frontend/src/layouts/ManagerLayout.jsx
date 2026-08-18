import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';
import GlassCard from '../components/common/GlassCard';

export default function ManagerLayout() {
  return (
    <MainLayout>
      <GlassCard sx={{ m: 2, p: 2 }}>
        <Outlet />
      </GlassCard>
    </MainLayout>
  );
}
