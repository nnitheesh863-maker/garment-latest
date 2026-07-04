import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';

export default function AdminLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
